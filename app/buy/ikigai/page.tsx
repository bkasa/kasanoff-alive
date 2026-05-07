'use client';

import { useState } from 'react';

const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
  terracotta: '#C4836A',
};

export default function BuyIkigaiPage() {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/buy/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'ikigai',
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim().toLowerCase(),
          isGift,
          recipientName: isGift ? recipientName.trim() : undefined,
          recipientEmail: isGift ? recipientEmail.trim().toLowerCase() : undefined,
          personalMessage: isGift ? personalMessage.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    fontFamily: "'Source Sans 3', sans-serif",
    fontSize: '15px',
    color: C.charcoal,
    background: C.cream,
    border: `1px solid rgba(212,165,116,0.35)`,
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Source Sans 3', sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.charcoalLight,
    display: 'block',
    marginBottom: '6px',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = C.gold;
    e.target.style.boxShadow = '0 0 0 3px rgba(212,165,116,0.12)';
  }

  function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'rgba(212,165,116,0.35)';
    e.target.style.boxShadow = 'none';
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.cream,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes float1 { 0%,100%{opacity:0.14} 50%{opacity:0.22} }
        @keyframes float2 { 0%,100%{opacity:0.10} 50%{opacity:0.17} }
      `}</style>

      {/* Background wash */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,165,116,0.14) 0%, transparent 70%)', animation: 'float1 9s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,160,0.10) 0%, transparent 70%)', animation: 'float2 12s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

      {/* Back link */}
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
          zIndex: 100,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
      >
        ← Kasanoff.ai
      </a>

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '480px',
          margin: '0 auto',
          padding: 'clamp(80px,12vw,120px) clamp(24px,5vw,40px) 80px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, margin: '0 0 14px' }}>
            Kasanoff.ai Guide
          </p>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 300, color: C.charcoal, margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Ikigai Explorer
          </h1>
          <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '15px', color: C.charcoalLight, margin: '0 0 6px', lineHeight: 1.6, fontWeight: 300 }}>
            A deep, guided conversation that maps what you love, what you&apos;re good at, and what the world needs.
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', color: C.charcoal, margin: 0 }}>
            $18
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Your name</label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Jane Smith"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Your email</label>
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="jane@example.com"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {/* Gift checkbox */}
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setIsGift(!isGift)}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `1.5px solid ${isGift ? C.gold : 'rgba(212,165,116,0.5)'}`,
                background: isGift ? C.gold : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {isGift && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '14px', color: C.charcoal, userSelect: 'none' }}>
              This is a gift
            </span>
          </div>

          {/* Gift fields */}
          {isGift && (
            <div
              style={{
                background: C.warmWhite,
                border: `1px solid rgba(212,165,116,0.2)`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gold, margin: '0 0 18px' }}>
                Gift recipient
              </p>

              <div style={fieldStyle}>
                <label style={labelStyle}>Recipient&apos;s name</label>
                <input
                  type="text"
                  required={isGift}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Alex Johnson"
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Recipient&apos;s email</label>
                <input
                  type="email"
                  required={isGift}
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="alex@example.com"
                  style={inputStyle}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              <div style={{ marginBottom: 0 }}>
                <label style={labelStyle}>Personal message <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="I thought of you when I found this…"
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    lineHeight: 1.6,
                    minHeight: '80px',
                  }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>
            </div>
          )}

          {error && (
            <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '13px', color: C.terracotta, marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: submitting ? C.charcoalLight : C.gold,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              cursor: submitting ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = C.terracotta; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = C.gold; }}
          >
            {submitting ? 'Redirecting to checkout…' : 'Continue to payment →'}
          </button>
        </form>
      </div>
    </div>
  );
}
