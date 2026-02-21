import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { getDailyTotals } from '@/lib/queries';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const totals = await getDailyTotals();
  return Response.json({ totals });
}
