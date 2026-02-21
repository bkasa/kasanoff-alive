import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { validateMagicLink, consumeMagicLink, findOrCreateSession } from '@/lib/queries';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const link = await validateMagicLink(token);
    if (!link) {
      return Response.json({ error: 'Invalid or expired link' }, { status: 401 });
    }

    // Consume the token so it can't be reused
    await consumeMagicLink(token);

    const email = link.email as string;
    const explorationId = link.exploration_id as string;

    const sessionId = await findOrCreateSession(email, explorationId);

    // Set session cookie
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.customerEmail = email;
    await session.save();

    return Response.json({ ok: true, sessionId, email });
  } catch (error) {
    console.error('Verify link error:', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}
