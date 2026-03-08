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

    // Prefer exploration_id from session metadata (set on the payment link).
    // If absent, expand line_items to read it from the product metadata.
    let explorationId: string | null = session.metadata?.exploration_id || null;

    if (!explorationId) {
      try {
        const full = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product'],
        });
        const product = full.line_items?.data?.[0]?.price?.product;
        if (product && typeof product !== 'string') {
          explorationId = (product as Stripe.Product).metadata?.exploration_id || null;
        }
      } catch (err) {
        console.error('Failed to expand line items for session', session.id, err);
      }
    }

    console.log('Webhook received. Email:', email, 'ExplorationId:', explorationId);

    if (!explorationId) {
      console.error('No exploration_id found for session', session.id, '— purchase not recorded');
      return new Response('ok', { status: 200 });
    }

    if (email) {
      await upsertCustomer(email);
      await recordPurchase(email, explorationId, session.id);
      console.log('Purchase recorded for:', email, 'exploration:', explorationId);
    } else {
      console.error('No email found in webhook payload:', JSON.stringify(session));
    }
  }

  return new Response('ok', { status: 200 });
}
