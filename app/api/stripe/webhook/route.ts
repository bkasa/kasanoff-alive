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
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;
    // explorationId is stored in metadata set on the Payment Link
    const explorationId = session.metadata?.exploration_id;

    if (email && explorationId) {
      await upsertCustomer(email);
      await recordPurchase(email, explorationId, session.id);
    }
  }

  return new Response('ok', { status: 200 });
}
