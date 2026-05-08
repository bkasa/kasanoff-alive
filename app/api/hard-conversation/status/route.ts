import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions, SESSION_VERSION } from '@/lib/session';
import { findMostRecentPurchase, getPurchaseAccessStatus } from '@/lib/access';

const EXPLORATION_ID = 'hard-conversation';

// Stripe payment link URL — update after creating the product
const STRIPE_URL = 'https://buy.stripe.com/00w9AS7r5f4cgdteJ52ZO06';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.customerEmail || session.version !== SESSION_VERSION) {
      return Response.json({ status: 'unauthenticated' }, { status: 401 });
    }

    const purchase = await findMostRecentPurchase(session.customerEmail, EXPLORATION_ID);

    if (!purchase) {
      return Response.json({ status: 'no-purchase' });
    }

    const accessStatus = getPurchaseAccessStatus(purchase);

    if (accessStatus === 'expired') {
      return Response.json({
        status: 'locked',
        expiresAt: purchase.expires_at ?? null,
        archivedDocument: purchase.archived_document ?? '',
        stripeUrl: STRIPE_URL,
      });
    }

    // Active purchase
    if (purchase.prep_complete) {
      return Response.json({
        status: 'choose',
        archivedDocument: purchase.archived_document ?? '',
      });
    }

    return Response.json({ status: 'prep' });
  } catch (err) {
    console.error('hard-conversation status error:', err);
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
