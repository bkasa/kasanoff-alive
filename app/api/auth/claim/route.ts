import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { hasPurchased, findOrCreateSession } from '@/lib/queries';

// Called when a returning customer enters their email to claim access
// after being redirected back from Stripe (no session_id available)
export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, explorationId } = await request.json();
    const email = rawEmail?.toLowerCase();

    if (!email || !explorationId) {
      return Response.json({ error: 'Missing email or explorationId' }, { status: 400 });
    }

    const purchased = await hasPurchased(email, explorationId);
    if (!purchased) {
      return Response.json({ error: 'No purchase found for this email' }, { status: 404 });
    }

    const sessionId = await findOrCreateSession(email, explorationId);

    // Set session cookie
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.customerEmail = email;
    await session.save();

    return Response.json({ ok: true, sessionId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Claim access error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
