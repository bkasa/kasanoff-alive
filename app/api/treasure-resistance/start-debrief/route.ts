import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions, SESSION_VERSION } from '@/lib/session';
import { findMostRecentPurchase, getPurchaseAccessStatus } from '@/lib/access';
import { createDebriefSession } from '@/lib/queries';

const EXPLORATION_ID = 'treasure-resistance';

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.customerEmail || session.version !== SESSION_VERSION) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchase = await findMostRecentPurchase(session.customerEmail, EXPLORATION_ID);
    if (!purchase || getPurchaseAccessStatus(purchase) === 'expired') {
      return Response.json({ error: 'No active purchase' }, { status: 403 });
    }

    if (!purchase.prep_complete) {
      return Response.json({ error: 'Prep not complete' }, { status: 400 });
    }

    await createDebriefSession(session.customerEmail, EXPLORATION_ID);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('treasure-resistance start-debrief error:', err);
    return Response.json({ error: 'Failed to start debrief' }, { status: 500 });
  }
}
