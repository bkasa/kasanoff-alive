import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';
import { upsertCustomer, recordPurchase, createGiftToken, createMagicLink } from '@/lib/queries';

const resend = new Resend(process.env.RESEND_API_KEY);

const EXPLORATION_TITLES: Record<string, string> = {
  'ikigai': 'Ikigai Explorer',
  'tell-your-story': 'Tell Your Story Better',
  'better-decision': 'Better Decision',
  'career-checkup': 'Career Checkup',
  'hard-conversation': 'The Hard Conversation',
  'treasure-resistance': 'Treasure Resistance',
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const MAGIC_LINK_EXPIRY_DAYS = 7;

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

    const isGift = session.metadata?.gift === 'true';

    if (email) {
      await upsertCustomer(email);

      // hard-conversation and treasure-resistance get a 90-day expiry window
      let expiresAt: string | null = null;
      if (explorationId === 'hard-conversation' || explorationId === 'treasure-resistance') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 90);
        expiresAt = expiry.toISOString();
      }

      await recordPurchase(email, explorationId, session.id, 1800, expiresAt);
      console.log('Purchase recorded for:', email, 'exploration:', explorationId, 'gift:', isGift, 'expiresAt:', expiresAt);

      if (!isGift) {
        const fullName: string = session.customer_details?.name || '';
        const firstName = fullName.trim().split(/\s+/)[0] || 'there';
        const explorationTitle = EXPLORATION_TITLES[explorationId] || explorationId;
        const baseUrl = 'https://explore.kasanoff.ai';

        // Generate a 7-day magic link for immediate post-purchase access
        const token = nanoid(32);
        const linkExpiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await createMagicLink(email, token, explorationId, linkExpiresAt);
        const magicLink = `${baseUrl}/${explorationId}?token=${token}`;

        try {
          await resend.emails.send({
            from: 'Bruce Kasanoff <bruce@kasanoff.ai>',
            replyTo: 'bruce@kasanoff.com',
            to: email,
            subject: `Your ${explorationTitle} is ready.`,
            text: `Hi, ${firstName} -\n\nThank you for ordering ${explorationTitle}. I promise this is going to be a remarkable experience.\n\nClick the link below to begin your exploration:\n\n${magicLink}\n\nTo protect your privacy and security, this link is unique to you and will work for the next ${MAGIC_LINK_EXPIRY_DAYS} days. If you'd rather start later or from a different device, you can always go to ${baseUrl}/${explorationId} and enter the email you used at checkout — I'll send you a fresh link.\n\nIf you ever have any questions, please reply to me at this email.\n\nOnce you have finished your exploration, I'd love to hear about your experience.\n\nWith gratitude,\nBruce\nKasanoff.ai | bruce@kasanoff.com`,
          });
          console.log('Confirmation email with magic link sent to:', email);
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
      } else {
        // ── Gift: create token, email the recipient ──
        const gifterName: string = session.metadata?.buyer_name || session.customer_details?.name || '';
        const gifterEmail: string = email;
        const recipientName: string = session.metadata?.recipient_name || '';
        const recipientEmail: string = session.metadata?.recipient_email || '';
        const personalMessage: string = session.metadata?.personal_message || '';

        if (!recipientEmail) {
          console.error('Gift purchase missing recipient_email in metadata, session:', session.id);
        } else {
          const token = randomUUID();
          const baseUrl = 'https://explore.kasanoff.ai';

          await createGiftToken(token, explorationId, recipientName, recipientEmail, gifterName, gifterEmail, personalMessage || null);
          console.log('Gift token created:', token, 'for recipient:', recipientEmail);

          const giftLink = `${baseUrl}/gift/access/${token}`;
          const recipientFirstName = recipientName.trim().split(/\s+/)[0] || 'there';
          const gifterFirstName = gifterName.trim().split(/\s+/)[0] || 'Someone';

          const messageSection = personalMessage
            ? `\n\nA personal note from ${gifterFirstName}:\n\n"${personalMessage}"`
            : '';

          try {
            await resend.emails.send({
              from: 'Bruce Kasanoff <bruce@kasanoff.ai>',
              replyTo: 'bruce@kasanoff.com',
              to: recipientEmail,
              subject: `${gifterName} has given you a gift`,
              text: `Hi, ${recipientFirstName} -\n\n${gifterName} has given you free access to Ikigai Explorer. To begin using it, visit this link:\n\n${giftLink}${messageSection}\n\nIf you have any questions, reply to this email.\n\nWith gratitude,\nBruce\nKasanoff.ai | bruce@kasanoff.com`,
            });
            console.log('Gift email sent to:', recipientEmail);
          } catch (emailErr) {
            console.error('Failed to send gift email:', emailErr);
          }
        }
      }
    } else {
      console.error('No email found in webhook payload:', JSON.stringify(session));
    }
  }

  return new Response('ok', { status: 200 });
}
