import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { getDailyTotals, getDailyTotalsByExploration } from '@/lib/queries';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totals, byExploration] = await Promise.all([
    getDailyTotals(),
    getDailyTotalsByExploration(),
  ]);
  return Response.json({ totals, byExploration });
}
