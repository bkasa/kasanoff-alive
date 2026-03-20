import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import db from '@/lib/db';

export async function GET(request: Request) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month'); // expected: 'YYYY-MM'

  // Default to current month
  const now = new Date();
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getUTCFullYear();
  const month = monthParam ? parseInt(monthParam.split('-')[1]) : now.getUTCMonth() + 1;

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  const result = await db.execute({
    sql: `SELECT exploration_id, DATE(created_at) as date, COUNT(*) as units
          FROM purchases
          WHERE created_at >= ? AND created_at < ?
          GROUP BY exploration_id, DATE(created_at)
          ORDER BY exploration_id, date`,
    args: [`${monthStr}-01`, `${nextMonth}-01`],
  });

  // Collect unique explorations
  const explorationSet = new Set<string>();
  for (const row of result.rows) {
    explorationSet.add(row.exploration_id as string);
  }
  const explorations = Array.from(explorationSet).sort();

  // Build lookup: exploration_id -> day -> units
  const lookup: Record<string, Record<number, number>> = {};
  for (const exp of explorations) {
    lookup[exp] = {};
  }
  for (const row of result.rows) {
    const exp = row.exploration_id as string;
    const day = parseInt((row.date as string).split('-')[2]);
    lookup[exp][day] = Number(row.units);
  }

  // Fill zeros for missing days
  const data: Record<string, Record<number, number>> = {};
  for (const exp of explorations) {
    data[exp] = {};
    for (let d = 1; d <= daysInMonth; d++) {
      data[exp][d] = lookup[exp][d] ?? 0;
    }
  }

  return Response.json({ month: monthStr, daysInMonth, explorations, data });
}
