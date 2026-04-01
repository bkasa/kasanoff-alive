import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/exploration-access';
import { saveMessage, getSessionMessages, touchSession } from '@/lib/queries';
import { TEMPLATE_PROMPT } from '@/lib/prompts/_template';

export const maxDuration = 60;

const EXPLORATION_ID = 'TEMPLATE_SLUG';
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: TEMPLATE_PROMPT,
        messages: contextMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', JSON.stringify(data));
      throw new Error(`Anthropic error: ${response.status}`);
    }

    const text = data.content[0]?.text || '';

    await saveMessage(sessionId, 'assistant', text);
    await touchSession(sessionId);

    return Response.json({ text });
  } catch (error) {
    console.error('TEMPLATE_SLUG chat error:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
