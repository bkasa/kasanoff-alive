'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const EXPLORATION_ID = 'tell-your-story';

const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
  terracotta: '#C4836A',
  rose: '#D4A0A0',
  blue: '#8BA4B8',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedDocument {
  title: string;
  body: string;
}

type Phase = 'loading' | 'claim' | 'magic-link-sent' | 'chat';

function parseDocuments(content: string): ParsedDocument[] {
  const docs: ParsedDocument[] = [];
  const regex = /\[DOCUMENT:\s*([^\]]+)\]([\s\S]*?)\[\/DOCUMENT\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    docs.push({ title: match[1].trim(), body: match[2].trim() });
  }
  return docs;
}

function stripDocumentBlocks(content: string): string {
  return content
    .replace(/\[DOCUMENT:\s*([^\]]+)\][\s\S]*?\[\/DOCUMENT\]/g, (_, title) =>
      `\n\n— ${title.trim()} added to the Documents panel —\n`
    )
    .trim();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        marginTop: '12px',
        padding: '8px 18px',
        background: copied ? C.terracotta : 'transparent',
        border: `1px solid ${copied ? C.terracotta : 'rgba(212,165,116,0.4)'}`,
        borderRadius: '4px',
        fontFamily: "'Source Sans 3', sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.08em',
        color: copied ? C.warmWhite : C.charcoalLight,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.borderColor = C.gold;
          e.currentTarget.style.color = C.charcoal;
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.borderColor = 'rgba(212,165,116,0.4)';
          e.currentTarget.style.color = C.charcoalLight;
        }
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

function DocumentCard({ doc }: { doc: ParsedDocument }) {
  return (
    <div
      style={{
        background: C.warmWhite,
        border: `1px solid rgba(212,165,116,0.2)`,
        borderRadius: '8px',
        padding: '20px 22px',
        marginBottom: '16px',
      }}
    >
      <p
        style={{
          fontFamily: "'Source Sans 3', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: C.gold,
          margin: '0 0 10px',
        }}
      >
        {doc.title}
      </p>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '17px',
          lineHeight: 1.8,
          color: C.charcoal,
          whiteSpace: 'pre-wrap',
        }}
      >
        {doc.body}
      </div>
      <CopyButton text={doc.body} />
    </div>
  );
}

function BackgroundWash() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {[
        { top: '-20%', left: '-10%', color: 'rgba(212,165,116,0.14)', anim: 'float1 9s ease-in-out infinite' },
        { bottom: '-20%', right: '-10%', color: 'rgba(212,160,160,0.12)', anim: 'float2 12s ease-in-out infinite' },
        { top: '30%', right: '-5%', color: 'rgba(139,164,184,0.10)', anim: 'float3 14s ease-in-out infinite' },
        { bottom: '-10%', left: '-5%', color: 'rgba(196,131,106,0.09)', anim: 'float4 11s ease-in-out infinite' },
      ].map((wash, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${wash.color} 0%, transparent 70%)`,
            top: wash.top,
            left: wash.left,
            bottom: (wash as { bottom?: string }).bottom,
            right: (wash as { right?: string }).right,
            animation: wash.anim,
          }}
        />
      ))}
    </div>
  );
}

function TellYourStoryInner() {
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>('loading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<ParsedDocument[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSending, setClaimSending] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDocuments, setShowDocuments] = useState(false);
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Parse documents from all assistant messages whenever messages change
  useEffect(() => {
    const docMap = new Map<string, string>();
    messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        parseDocuments(msg.content).forEach((doc) => {
          docMap.set(doc.title, doc.body);
        });
      }
    });
    const parsed = Array.from(docMap.entries()).map(([title, body]) => ({ title, body }));
    setDocuments((prev) => {
      // When a new document is added, jump to it
      if (parsed.length > prev.length) {
        setActiveDocIndex(parsed.length - 1);
      }
      return parsed;
    });
    if (parsed.length > 0) setShowDocuments(true);
  }, [messages]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const magicToken = searchParams.get('token');
    const fromStripe =
      document.referrer.includes('stripe.com') || searchParams.get('payment') !== null;

    async function initAccess() {
      try {
        if (magicToken) {
          const res = await fetch('/api/auth/verify-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: magicToken }),
          });
          const data = await res.json();
          if (data.ok) {
            window.location.href = '/tell-your-story';
            return;
          }
        }

        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (sessionData.authenticated) {
          await loadOrStartConversation();
          return;
        }

        if (fromStripe) setJustPurchased(true);
        setPhase('claim');
      } catch {
        setPhase('claim');
      }
    }

    initAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrStartConversation() {
    setPhase('chat');
    setIsLoading(true);
    try {
      // Try to load existing history first
      const historyRes = await fetch('/api/tell-your-story/chat');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const existing: Message[] = historyData.messages || [];
        // Filter out the internal opener trigger
        const displayMessages = existing.filter(
          (m) => !(m.role === 'user' && m.content === 'Hello, I am ready to begin.')
        );
        if (displayMessages.length > 0) {
          setMessages(displayMessages);
          setIsLoading(false);
          setTimeout(() => textareaRef.current?.focus(), 100);
          return;
        }
      }

      // No history — send opener to get the first response
      const res = await fetch('/api/tell-your-story/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello, I am ready to begin.' }),
      });
      if (res.status === 401) {
        // Session cookie invalid or expired — redirect to re-claim
        setPhase('claim');
        return;
      }
      if (!res.ok) {
        throw new Error(`Chat API returned ${res.status}`);
      }
      const data = await res.json();
      if (data.text) {
        setMessages([{ role: 'assistant', content: data.text }]);
      }
    } catch {
      setErrorMessage('Something went wrong starting the conversation. Please refresh to try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  async function claimAccess(e: React.FormEvent) {
    e.preventDefault();
    setClaimError('');
    setClaimSending(true);
    try {
      const res = await fetch('/api/auth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: claimEmail, explorationId: EXPLORATION_ID }),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = '/tell-your-story';
        return;
      } else {
        setClaimError(
          res.status === 404
            ? 'No purchase found for that email. Please check the address you used at checkout.'
            : 'Something went wrong. Please try again.'
        );
      }
    } catch {
      setClaimError('Something went wrong. Please try again.');
    } finally {
      setClaimSending(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/tell-your-story/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }

  function renderMessageContent(content: string): React.ReactNode {
    const stripped = stripDocumentBlocks(content);
    return stripped
      .split('\n\n')
      .filter((p) => p.trim())
      .map((para, i) => (
        <p key={i} style={{ margin: i === 0 ? '0' : '0.75em 0 0', lineHeight: 1.85 }}>
          {para.split('\n').map((line, j, arr) => {
            const isDocNote = line.startsWith('—') && line.endsWith('—');
            return (
              <span
                key={j}
                style={
                  isDocNote
                    ? {
                        fontFamily: "'Source Sans 3', sans-serif",
                        fontSize: '13px',
                        color: C.gold,
                        fontStyle: 'normal',
                      }
                    : {}
                }
              >
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            );
          })}
        </p>
      ));
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.cream,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  };

  const returnLink = (
    <a
      href="https://kasanoff.ai"
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        fontFamily: "'Source Sans 3', sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: C.charcoalLight,
        opacity: 0.6,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'opacity 0.2s',
        zIndex: 100,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
    >
      ← Kasanoff.ai
    </a>
  );

  // ─── Loading ──────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        {returnLink}
        <BackgroundWash />
        <div
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            color: C.charcoalLight,
            fontSize: '14px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Loading…
        </div>
      </div>
    );
  }

  // ─── Claim Access ─────────────────────────────────────────

  if (phase === 'claim') {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        {returnLink}
        <BackgroundWash />
        <div
          style={{
            maxWidth: '440px',
            width: '90%',
            padding: '48px 40px',
            background: C.warmWhite,
            borderRadius: '12px',
            boxShadow: '0 4px 40px rgba(61,50,41,0.08)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(22px, 4vw, 28px)',
              fontWeight: 400,
              color: C.charcoal,
              margin: '0 0 12px',
            }}
          >
            {justPurchased ? 'Thank you for your purchase' : 'Access your Kasanoff.ai Guide'}
          </h2>
          {justPurchased && (
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '14px',
                color: C.gold,
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              Your purchase was successful and you already have access. Please enter your email to go back to your session.
            </p>
          )}
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '14px',
              color: C.charcoalLight,
              margin: '0 0 28px',
              lineHeight: 1.6,
            }}
          >
            {justPurchased
              ? 'Enter the email you used at checkout.'
              : 'Enter the email you used to purchase this Exploration.'}
          </p>

          <form onSubmit={claimAccess}>
            <input
              type="email"
              required
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '18px',
                color: C.charcoal,
                background: C.cream,
                border: `1px solid rgba(212,165,116,0.3)`,
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
              }}
              onFocus={(e) => (e.target.style.borderColor = C.gold)}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(212,165,116,0.3)')}
            />
            {claimError && (
              <p
                style={{
                  color: C.terracotta,
                  fontSize: '13px',
                  fontFamily: "'Source Sans 3', sans-serif",
                  marginBottom: '12px',
                }}
              >
                {claimError}
              </p>
            )}
            <button
              type="submit"
              disabled={claimSending}
              style={{
                width: '100%',
                padding: '14px',
                background: claimSending ? C.charcoalLight : C.gold,
                color: C.warmWhite,
                border: 'none',
                borderRadius: '6px',
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                cursor: claimSending ? 'default' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!claimSending) (e.currentTarget.style.background = C.terracotta);
              }}
              onMouseLeave={(e) => {
                if (!claimSending) (e.currentTarget.style.background = C.gold);
              }}
            >
              {claimSending ? 'Checking…' : 'Begin'}
            </button>
          </form>

          <p
            style={{
              marginTop: '28px',
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '12px',
              color: C.charcoalLight,
            }}
          >
            Haven&apos;t purchased yet?{' '}
            <a href="https://kasanoff.ai" style={{ color: C.gold, textDecoration: 'none' }}>
              See all Guides →
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ─── Magic Link Sent ──────────────────────────────────────

  if (phase === 'magic-link-sent') {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        {returnLink}
        <BackgroundWash />
        <div
          style={{
            maxWidth: '440px',
            width: '90%',
            padding: '48px 40px',
            background: C.warmWhite,
            borderRadius: '12px',
            boxShadow: '0 4px 40px rgba(61,50,41,0.08)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '20px' }}>✉</div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '26px',
              fontWeight: 400,
              color: C.charcoal,
              margin: '0 0 12px',
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '14px',
              color: C.charcoalLight,
              lineHeight: 1.6,
            }}
          >
            We&apos;ve sent a one-click access link. It expires in 1 hour.
          </p>
        </div>
      </div>
    );
  }

  // ─── Chat + Documents ─────────────────────────────────────

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: C.cream,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Source+Sans+3:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes dotPulse {
          0%,80%,100%{transform:scale(0.6);opacity:0.4}
          40%{transform:scale(1);opacity:1}
        }
        @keyframes msgAppear {
          from{opacity:0;transform:translateY(8px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes float1 { 0%,100%{opacity:0.14} 50%{opacity:0.22} }
        @keyframes float2 { 0%,100%{opacity:0.12} 50%{opacity:0.20} }
        @keyframes float3 { 0%,100%{opacity:0.10} 50%{opacity:0.17} }
        @keyframes float4 { 0%,100%{opacity:0.09} 50%{opacity:0.15} }
        textarea:focus { outline: none; }
        textarea::placeholder { color: #9A8878; opacity: 1; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,165,116,0.3); border-radius: 2px; }
        @media (max-width: 700px) {
          .panel-container { flex-direction: column !important; }
          .doc-panel { border-left: none !important; border-top: 1px solid rgba(212,165,116,0.18) !important; max-height: 40vh !important; }
          .chat-panel { flex: 1 1 auto !important; }
        }
      `}</style>

      <BackgroundWash />
      {returnLink}

      {/* Header */}
      <div
        style={{
          padding: 'clamp(52px,7vw,68px) clamp(20px,4vw,40px) 0',
          textAlign: 'center',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: C.gold,
            margin: '0 0 8px',
          }}
        >
          Kasanoff.ai Guide
        </p>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 300,
            color: C.charcoal,
            margin: '0 0 4px',
            letterSpacing: '-0.01em',
          }}
        >
          Tell Your Story Better
        </h1>
        <p
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '13px',
            color: C.charcoalLight,
            margin: 0,
          }}
        >
          An AI ghostwriter that interviews you and produces genuine copy for your LinkedIn, website, and more
        </p>
      </div>

      {/* Two-panel area */}
      <div
        className="panel-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          marginTop: '20px',
        }}
      >
        {/* ── Left: Chat ── */}
        <div
          className="chat-panel"
          style={{
            flex: '1 1 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'clamp(16px,3vw,24px) clamp(16px,4vw,36px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  animation: 'msgAppear 0.3s ease forwards',
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: msg.role === 'assistant' ? '18px 22px' : '12px 18px',
                    background: msg.role === 'assistant' ? C.warmWhite : C.blue,
                    color: msg.role === 'assistant' ? C.charcoal : '#fff',
                    borderRadius:
                      msg.role === 'assistant' ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                    boxShadow:
                      msg.role === 'assistant'
                        ? '0 2px 12px rgba(61,50,41,0.07)'
                        : '0 2px 8px rgba(139,164,184,0.25)',
                    fontFamily:
                      msg.role === 'assistant'
                        ? "'Cormorant Garamond', Georgia, serif"
                        : "'Source Sans 3', sans-serif",
                    fontSize: msg.role === 'assistant' ? '18px' : '15px',
                    lineHeight: msg.role === 'assistant' ? 1.85 : 1.6,
                  }}
                >
                  {msg.role === 'assistant'
                    ? renderMessageContent(msg.content)
                    : msg.content.split('\n').map((line, j, arr) => (
                        <span key={j}>
                          {line}
                          {j < arr.length - 1 && <br />}
                        </span>
                      ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '16px 22px',
                    background: C.warmWhite,
                    borderRadius: '4px 18px 18px 18px',
                    boxShadow: '0 2px 12px rgba(61,50,41,0.07)',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: C.gold,
                        animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <p
                style={{
                  color: C.terracotta,
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 'clamp(12px,2vw,18px) clamp(16px,4vw,36px) clamp(20px,3vw,28px)',
              borderTop: `1px solid rgba(212,165,116,0.15)`,
              background: 'rgba(253,248,240,0.9)',
              backdropFilter: 'blur(8px)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Share what comes to mind…"
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: `1px solid rgba(212,165,116,0.3)`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '18px',
                  color: C.charcoal,
                  background: C.warmWhite,
                  lineHeight: 1.5,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = C.gold;
                  e.target.style.boxShadow = `0 0 0 3px rgba(212,165,116,0.12)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(212,165,116,0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isLoading || !input.trim() ? 'rgba(212,165,116,0.35)' : C.gold,
                  color: '#fff',
                  fontSize: '20px',
                  cursor: isLoading || !input.trim() ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && input.trim()) e.currentTarget.style.background = C.terracotta;
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && input.trim()) e.currentTarget.style.background = C.gold;
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Documents Panel ── */}
        <div
          className="doc-panel"
          style={{
            flex: '0 0 clamp(280px, 36%, 420px)',
            borderLeft: `1px solid rgba(212,165,116,0.18)`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(253,248,240,0.6)',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '20px 24px 0',
              borderBottom: `1px solid rgba(212,165,116,0.15)`,
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.gold,
                margin: '0 0 14px',
              }}
            >
              Documents
              {documents.length > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    background: C.gold,
                    color: C.warmWhite,
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {documents.length}
                </span>
              )}
            </p>

            {/* Tabs */}
            {documents.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  overflowX: 'auto',
                  paddingBottom: '0',
                }}
              >
                {documents.map((doc, i) => (
                  <button
                    key={doc.title}
                    onClick={() => { setActiveDocIndex(i); setShowDocuments(true); }}
                    style={{
                      flexShrink: 0,
                      padding: '7px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: i === activeDocIndex && showDocuments
                        ? `2px solid ${C.gold}`
                        : '2px solid transparent',
                      fontFamily: "'Source Sans 3', sans-serif",
                      fontSize: '12px',
                      fontWeight: i === activeDocIndex && showDocuments ? 500 : 400,
                      color: i === activeDocIndex && showDocuments ? C.charcoal : C.charcoalLight,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={doc.title}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panel body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
            }}
          >
            {documents.length === 0 ? (
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '16px',
                  color: C.charcoalLight,
                  lineHeight: 1.75,
                  fontStyle: 'italic',
                  fontWeight: 300,
                  opacity: 0.7,
                }}
              >
                Your documents will appear here as they are created. You can return to this page
                anytime to access them.
              </p>
            ) : showDocuments && documents[activeDocIndex] ? (
              <DocumentCard key={documents[activeDocIndex].title} doc={documents[activeDocIndex]} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TellYourStoryPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FDF8F0' }} />}>
      <TellYourStoryInner />
    </Suspense>
  );
}
