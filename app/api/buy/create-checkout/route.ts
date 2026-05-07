import { NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const BASE_URL = 'https://explore.kasanoff.ai';

const PRODUCT_NAMES: Record<string, string> = {
  ikigai: 'Ikigai Explorer',
};

const PRODUCT_PRICES: Record<string, number> = {
  ikigai: 1800,
};

export async function POST(request: NextRequest) {
  try {
    const {
      productSlug,
      buyerName,
      buyerEmail,
      isGift,
      recipientName,
      recipientEmail,
      personalMessage,
    } = await request.json();

    if (!productSlug || !buyerName || !buyerEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const productName = PRODUCT_NAMES[productSlug];
    const unitAmount = PRODUCT_PRICES[productSlug];

    if (!productName || !unitAmount) {
      return Response.json({ error: 'Unknown product' }, { status: 400 });
    }

    if (isGift && (!recipientName || !recipientEmail)) {
      return Response.json({ error: 'Recipient name and email are required for gifts' }, { status: 400 });
    }

    const successUrl = isGift
      ? `${BASE_URL}/buy/success?gift=true`
      : `${BASE_URL}/buy/success?gift=false`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: productName,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: buyerEmail,
      success_url: successUrl,
      cancel_url: `${BASE_URL}/buy/${productSlug}`,
      metadata: {
        exploration_id: productSlug,
        gift: isGift ? 'true' : 'false',
        buyer_name: buyerName.slice(0, 490),
        buyer_email: buyerEmail.slice(0, 490),
        recipient_name: (recipientName || '').slice(0, 490),
        recipient_email: (recipientEmail || '').slice(0, 490),
        personal_message: (personalMessage || '').slice(0, 490),
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('create-checkout error:', error);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
