import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { upsertCustomer, recordPurchase } from '@/lib/queries';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook error', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = event.data.object as any;
    // customer_details.email is the modern field; fall back to older fields
    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.receipt_email ||
      null;
    // Default to 'ikigai' since that's the only active exploration
    const explorationId = session.metadata?.exploration_id || 'ikigai';

    console.log('Webhook received. Email:', email, 'ExplorationId:', explorationId);

    if (email) {
      await upsertCustomer(email);
      await recordPurchase(email, explorationId, session.id);
      console.log('Purchase recorded for:', email);
    } else {
      console.error('No email found in webhook payload:', JSON.stringify(session));
    }
  }

  return new Response('ok', { status: 200 });
}
