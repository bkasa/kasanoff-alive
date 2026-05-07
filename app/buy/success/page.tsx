'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const isGift = searchParams.get('gift') === 'true';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.cream,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '90%',
          padding: '56px 48px',
          background: C.warmWhite,
          borderRadius: '12px',
          boxShadow: '0 4px 40px rgba(61,50,41,0.08)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.gold,
            margin: '0 0 20px',
          }}
        >
          Kasanoff.ai
        </p>

        <h1
          style={{
            fontSize: 'clamp(26px, 4vw, 34px)',
            fontWeight: 300,
            color: C.charcoal,
            margin: '0 0 20px',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          Congratulations, that worked.
        </h1>

        <p
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '15px',
            color: C.charcoalLight,
            lineHeight: 1.65,
            margin: '0 0 32px',
            fontWeight: 300,
          }}
        >
          {isGift
            ? 'An email has been sent to your gift recipient. You may wish to tell them to watch for it.'
            : 'An email has been sent to you with your magic link.'}
        </p>

        <a
          href="https://kasanoff.ai"
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '13px',
            color: C.gold,
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          ← Return to Kasanoff.ai
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FDF8F0' }} />}>
      <SuccessContent />
    </Suspense>
  );
}
