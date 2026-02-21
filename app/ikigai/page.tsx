'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const EXPLORATION_ID = 'ikigai';

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

type Phase = 'loading' | 'claim' | 'magic-link-sent' | 'chat';

export default function IkigaiPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('loading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSending, setClaimSending] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // On mount: check for magic token, then existing cookie
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const magicToken = searchParams.get('token');
    const fromStripe = document.referrer.includes('stripe.com') ||
                       searchParams.get('payment') !== null;

    async function initAccess() {
      try {
        // Handle magic link token
        if (magicToken) {
          const res = await fetch('/api/auth/verify-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: magicToken }),
          });
          const data = await res.json();
          if (data.ok) {
            window.location.href = '/ikigai';
            return;
          }
        }

        // Check existing session cookie
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (sessionData.authenticated) {
          await startConversation();
          return;
        }

        // No valid session — show claim form
        if (fromStripe) setJustPurchased(true);
        setPhase('claim');
      } catch {
        setPhase('claim');
      }
    }

    initAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startConversation() {
    setPhase('chat');
    setIsLoading(true);
    try {
      const res = await fetch('/api/ikigai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello, I am ready to begin.' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setMessages([{ role: 'assistant', content: data.text }]);
        }
      }
    } catch {
      setErrorMessage('Something went wrong loading the conversation.');
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
        // Reload so the session cookie is fully available before chat starts
        window.location.href = '/ikigai';
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
      const res = await fetch('/api/ikigai/chat', {
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

  function downloadTranscript() {
    const lines = messages.map((m) => `${m.role === 'user' ? 'You' : 'Guide'}: ${m.content}`);
    const text = `Ikigai Discovery — Conversation Transcript\n${'─'.repeat(44)}\n\n${lines.join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ikigai-transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderContent(content: string) {
    return content.split('\n\n').map((para, i) => (
      <p key={i} style={{ margin: '0 0 0.75em 0', lineHeight: 1.85 }}>
        {para.split('\n').map((line, j) => (
          <span key={j}>
            {line}
            {j < para.split('\n').length - 1 && <br />}
          </span>
        ))}
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
        <div style={{ fontFamily: "'Source Sans 3', sans-serif", color: C.charcoalLight, fontSize: '14px', position: 'relative', zIndex: 1 }}>
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
            {justPurchased ? 'Thank you for your purchase' : 'Access your Ikigai'}
          </h2>
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
              ? 'Enter the email you used at checkout to begin your Ikigai exploration.'
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
              <p style={{ color: C.terracotta, fontSize: '13px', fontFamily: "'Source Sans 3', sans-serif", marginBottom: '12px' }}>
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
              onMouseEnter={(e) => { if (!claimSending) (e.currentTarget.style.background = C.terracotta); }}
              onMouseLeave={(e) => { if (!claimSending) (e.currentTarget.style.background = C.gold); }}
            >
              {claimSending ? 'Checking…' : 'Begin Exploration'}
            </button>
          </form>

          <p style={{ marginTop: '28px', fontFamily: "'Source Sans 3', sans-serif", fontSize: '12px', color: C.charcoalLight }}>
            Haven&apos;t purchased yet?{' '}
            <a href="/" style={{ color: C.gold, textDecoration: 'none' }}>
              See all Explorations →
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
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '26px', fontWeight: 400, color: C.charcoal, margin: '0 0 12px' }}>
            Check your email
          </h2>
          <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '14px', color: C.charcoalLight, lineHeight: 1.6 }}>
            We&apos;ve sent a one-click access link. It expires in 1 hour.
          </p>
        </div>
      </div>
    );
  }

  // ─── Chat Interface ───────────────────────────────────────

  return (
    <div style={pageStyle}>
      <style>{`
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
      `}</style>

      <BackgroundWash />
      {returnLink}

      {/* Header */}
      <div style={{ padding: 'clamp(60px,8vw,80px) clamp(20px,5vw,40px) 0', textAlign: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, margin: '0 0 10px' }}>
          Explorations
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 300, color: C.charcoal, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Ikigai Discovery
        </h1>
        <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '13px', color: C.charcoalLight, margin: 0 }}>
          What were you meant to do?
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(16px,3vw,24px) clamp(16px,5vw,40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ animation: 'msgAppear 0.3s ease forwards', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '82%',
                padding: msg.role === 'assistant' ? '18px 22px' : '12px 18px',
                background: msg.role === 'assistant' ? C.warmWhite : C.blue,
                color: msg.role === 'assistant' ? C.charcoal : '#fff',
                borderRadius: msg.role === 'assistant' ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                boxShadow: msg.role === 'assistant' ? '0 2px 12px rgba(61,50,41,0.07)' : '0 2px 8px rgba(139,164,184,0.25)',
                fontFamily: msg.role === 'assistant' ? "'Cormorant Garamond', Georgia, serif" : "'Source Sans 3', sans-serif",
                fontSize: msg.role === 'assistant' ? '18px' : '15px',
                lineHeight: msg.role === 'assistant' ? 1.85 : 1.6,
              }}
            >
              {renderContent(msg.content)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '16px 22px', background: C.warmWhite, borderRadius: '4px 18px 18px 18px', boxShadow: '0 2px 12px rgba(61,50,41,0.07)', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.gold, animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <p style={{ color: C.terracotta, fontFamily: "'Source Sans 3', sans-serif", fontSize: '13px', textAlign: 'center' }}>
            {errorMessage}
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 'clamp(12px,2vw,20px) clamp(16px,5vw,40px) clamp(20px,4vw,36px)', borderTop: `1px solid rgba(212,165,116,0.15)`, background: 'rgba(253,248,240,0.85)', backdropFilter: 'blur(8px)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
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
              outline: 'none',
              lineHeight: 1.5,
              maxHeight: '150px',
              overflowY: 'auto',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px rgba(212,165,116,0.12)`; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(212,165,116,0.3)'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              width: '50px', height: '50px', borderRadius: '50%', border: 'none',
              background: isLoading || !input.trim() ? 'rgba(212,165,116,0.35)' : C.gold,
              color: '#fff', fontSize: '20px',
              cursor: isLoading || !input.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { if (!isLoading && input.trim()) e.currentTarget.style.background = C.terracotta; }}
            onMouseLeave={(e) => { if (!isLoading && input.trim()) e.currentTarget.style.background = C.gold; }}
          >
            ↑
          </button>
        </div>

        {messages.length > 2 && (
          <div style={{ maxWidth: '720px', margin: '10px auto 0', textAlign: 'right' }}>
            <button
              onClick={downloadTranscript}
              style={{ background: 'none', border: 'none', fontFamily: "'Source Sans 3', sans-serif", fontSize: '12px', color: C.charcoalLight, cursor: 'pointer', opacity: 0.7, padding: '4px 0' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              Download transcript ↓
            </button>
          </div>
        )}
      </div>
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
