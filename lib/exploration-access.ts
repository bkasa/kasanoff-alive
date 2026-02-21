import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from './session';
import { hasPurchased, findOrCreateSession } from './queries';

export interface AccessResult {
  allowed: boolean;
  customerEmail?: string;
  sessionId?: number;
}

export async function checkAccess(explorationId: string): Promise<AccessResult> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.customerEmail) {
    return { allowed: false };
  }

  const purchased = await hasPurchased(session.customerEmail, explorationId);
  if (!purchased) {
    return { allowed: false };
  }

  const sessionId = await findOrCreateSession(session.customerEmail, explorationId);

  return {
    allowed: true,
    customerEmail: session.customerEmail,
    sessionId,
  };
}
