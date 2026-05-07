import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions, SESSION_VERSION } from '@/lib/session';
import { getGiftToken, markGiftTokenFirstAccessed, upsertCustomer, recordPurchase } from '@/lib/queries';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const gift = await getGiftToken(token);

    if (!gift) {
      return Response.json({ error: 'Invalid gift link' }, { status: 404 });
    }

    const recipientEmail = gift.recipient_email as string;
    const productSlug = gift.product_slug as string;

    // Record purchase for recipient so checkAccess passes on all future visits
    await upsertCustomer(recipientEmail);
    await recordPurchase(recipientEmail, productSlug, `gift_${token}`, 0);

    // Set Iron Session cookie — identical to magic link flow
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.customerEmail = recipientEmail;
    session.version = SESSION_VERSION;
    await session.save();

    // Mark first access (idempotent — only sets if null)
    await markGiftTokenFirstAccessed(token);

    return Response.json({ ok: true, productSlug });
  } catch (error) {
    console.error('Gift redeem error:', error);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
