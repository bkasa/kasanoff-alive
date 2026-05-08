import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions, SESSION_VERSION } from '@/lib/session';
import { findMostRecentPurchase, getPurchaseAccessStatus } from '@/lib/access';
import {
  saveMessage,
  getSessionMessages,
  touchSession,
  findOrCreatePrepSession,
  getCurrentSessionId,
  getCurrentSessionKind,
  markPrepComplete,
  saveArchivedDocument,
} from '@/lib/queries';
import { getHardConversationPrompt } from '@/lib/prompts/hard-conversation';

export const maxDuration = 60;

const EXPLORATION_ID = 'hard-conversation';
const ANCHOR_COUNT = 6;
const RECENT_COUNT = 40;

const LOCKED_MESSAGE = `Your $18 package covered one Hard Conversation, with unlimited follow-ups for 90 days. That window has closed.

Your document is still here — you can read it any time.

If you'd like to start a new Hard Conversation — same situation now changed, or someone different entirely — a fresh $18 package gives you a new 90-day window and a brand-new conversation that starts from scratch.`;

type Message = { role: 'user' | 'assistant'; content: string };

function buildContextWindow(messages: Message[]): Message[] {
  if (messages.length <= ANCHOR_COUNT + RECENT_COUNT) return messages;
  const anchor = messages.slice(0, ANCHOR_COUNT);
  const recent = messages.slice(-RECENT_COUNT);
  const bridge: Message = {
    role: 'assistant',
    content:
      '[Earlier parts of our conversation have been summarized to maintain focus. The exploration continues.]',
  };
  return [...anchor, bridge, ...recent];
}

function extractDocumentText(content: string): string | null {
  const match = /\[DOCUMENT:[^\]]+\]([\s\S]*?)\[\/DOCUMENT\]/g.exec(content);
  return match ? match[0] : null;
}

function stripPrepCompleteMarker(content: string): string {
  return content.replace(/\[PREP_COMPLETE\]/g, '').trim();
}

async function callAnthropicWithRetry(
  body: string,
  maxAttempts = 3
): Promise<{ content: { text: string }[] }> {
  let lastError: Error = new Error('Anthropic API failed after retries');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body,
    });
    const data = await response.json();
    if (response.ok) return data;
    console.error(`Anthropic API error (attempt ${attempt + 1}):`, JSON.stringify(data));
    if (response.status === 529 || response.status >= 500) {
      lastError = new Error(`Anthropic error: ${response.status}`);
      continue;
    }
    throw new Error(`Anthropic error: ${response.status}`);
  }
  throw lastError;
}

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.customerEmail || session.version !== SESSION_VERSION) {
      return Response.json({ messages: [] });
    }

    const purchase = await findMostRecentPurchase(session.customerEmail, EXPLORATION_ID);
    if (!purchase) return Response.json({ messages: [] });

    if (getPurchaseAccessStatus(purchase) === 'expired') {
      return Response.json({
        locked: true,
        lockedMessage: LOCKED_MESSAGE,
        archivedDocument: purchase.archived_document ?? '',
        expiresAt: purchase.expires_at ?? null,
      });
    }

    const sessionId = await getCurrentSessionId(session.customerEmail, EXPLORATION_ID);
    if (!sessionId) return Response.json({ messages: [] });

    const messages = await getSessionMessages(sessionId);
    return Response.json({ messages });
  } catch (error) {
    console.error('hard-conversation GET error:', error);
    return Response.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    if (!session.customerEmail || session.version !== SESSION_VERSION) {
      return Response.json({ error: 'Access denied' }, { status: 401 });
    }

    const purchase = await findMostRecentPurchase(session.customerEmail, EXPLORATION_ID);
    if (!purchase) {
      return Response.json({ error: 'Access denied' }, { status: 401 });
    }

    if (getPurchaseAccessStatus(purchase) === 'expired') {
      return Response.json({
        locked: true,
        lockedMessage: LOCKED_MESSAGE,
        archivedDocument: purchase.archived_document ?? '',
        expiresAt: purchase.expires_at ?? null,
      });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
      return Response.json({ error: 'Empty message' }, { status: 400 });
    }

    const email = session.customerEmail;

    // Determine current session kind
    let kind = await getCurrentSessionKind(email, EXPLORATION_ID);

    // If no session exists yet, start a prep session
    let sessionId: number;
    if (!kind) {
      sessionId = await findOrCreatePrepSession(email, EXPLORATION_ID);
      kind = 'prep';
    } else {
      sessionId = (await getCurrentSessionId(email, EXPLORATION_ID))!;
    }

    // Save user message
    await saveMessage(sessionId, 'user', message);
    await touchSession(sessionId);

    // Build context
    const allMessages = await getSessionMessages(sessionId);
    const contextMessages = buildContextWindow(allMessages);

    const systemPrompt = getHardConversationPrompt(kind);

    const data = await callAnthropicWithRetry(
      JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: contextMessages,
      })
    );

    const rawText = data.content[0]?.text || '';

    // Check for [PREP_COMPLETE] marker
    const isPrepComplete = rawText.includes('[PREP_COMPLETE]');
    const cleanText = stripPrepCompleteMarker(rawText);

    // Save assistant response (cleaned)
    await saveMessage(sessionId, 'assistant', cleanText);
    await touchSession(sessionId);

    // If prep just completed, persist that + save document
    if (isPrepComplete) {
      await markPrepComplete(email, EXPLORATION_ID);
      const doc = extractDocumentText(cleanText);
      if (doc) {
        await saveArchivedDocument(email, EXPLORATION_ID, doc);
      }
      console.log('Prep marked complete for:', email);
    } else {
      // Persist document update on every response that contains one
      const doc = extractDocumentText(cleanText);
      if (doc) {
        await saveArchivedDocument(email, EXPLORATION_ID, doc);
      }
    }

    return Response.json({ text: cleanText, prepComplete: isPrepComplete });
  } catch (error) {
    console.error('hard-conversation POST error:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
