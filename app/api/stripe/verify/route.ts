import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { upsertCustomer, recordPurchase, findOrCreateSession } from '@/lib/queries';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, explorationId } = await request.json();

    if (!sessionId || !explorationId) {
      return Response.json({ error: 'Missing sessionId or explorationId' }, { status: 400 });
    }

    // Verify payment with Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const email = checkoutSession.customer_details?.email;
    if (!email) {
      return Response.json({ error: 'No customer email found' }, { status: 400 });
    }

    // Upsert customer + record purchase (idempotent)
    await upsertCustomer(email);
    await recordPurchase(email, explorationId, sessionId);

    // Find or create a conversation session
    const conversationSessionId = await findOrCreateSession(email, explorationId);

    // Set session cookie
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.customerEmail = email;
    await session.save();

    return Response.json({ ok: true, sessionId: conversationSessionId, email });
  } catch (error) {
    console.error('Stripe verify error:', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}
