import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/exploration-access';
import { saveMessage, getSessionMessages, touchSession } from '@/lib/queries';
import { BETTER_DECISION_PROMPT } from '@/lib/prompts/better-decision';

export const maxDuration = 60;

const EXPLORATION_ID = 'better-decision';
const ANCHOR_COUNT = 6;
const RECENT_COUNT = 40;

type Message = { role: 'user' | 'assistant'; content: string };

function buildContextWindow(messages: Message[]): Message[] {
  if (messages.length <= ANCHOR_COUNT + RECENT_COUNT) return messages;
  const anchor = messages.slice(0, ANCHOR_COUNT);
  const recent = messages.slice(-RECENT_COUNT);
  const bridge: Message = {
    role: 'assistant',
    content: '[Earlier parts of our conversation have been summarized to maintain focus. The exploration continues.]',
  };
  return [...anchor, bridge, ...recent];
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
    const access = await checkAccess(EXPLORATION_ID);
    if (!access.allowed || !access.sessionId) {
      return Response.json({ messages: [] });
    }
    const messages = await getSessionMessages(access.sessionId);
    return Response.json({ messages });
  } catch (error) {
    console.error('better-decision GET error:', error);
    return Response.json({ messages: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkAccess(EXPLORATION_ID);
    if (!access.allowed || !access.sessionId) {
      return Response.json({ error: 'Access denied' }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
      return Response.json({ error: 'Empty message' }, { status: 400 });
    }

    const sessionId = access.sessionId;

    await saveMessage(sessionId, 'user', message);
    await touchSession(sessionId);

    const allMessages = await getSessionMessages(sessionId);
    const contextMessages = buildContextWindow(allMessages);

    const data = await callAnthropicWithRetry(
      JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: BETTER_DECISION_PROMPT,
        messages: contextMessages,
      })
    );

    const text = data.content[0]?.text || '';

    await saveMessage(sessionId, 'assistant', text);
    await touchSession(sessionId);

    return Response.json({ text });
  } catch (error) {
    console.error('better-decision chat error:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
