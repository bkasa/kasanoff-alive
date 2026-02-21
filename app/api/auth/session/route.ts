import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.customerEmail) {
    return Response.json({ authenticated: false });
  }

  return Response.json({
    authenticated: true,
    customerEmail: session.customerEmail,
  });
}
