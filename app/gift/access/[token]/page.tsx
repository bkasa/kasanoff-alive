'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
  terracotta: '#C4836A',
};

type Status = 'loading' | 'error';

export default function GiftAccessPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg("This link doesn't appear to be valid. Please check your email and try again.");
      setStatus('error');
      return;
    }

    async function redeem() {
      try {
        const res = await fetch('/api/gift/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          setErrorMsg("This link doesn't appear to be valid. Please check your email and try again.");
          setStatus('error');
          return;
        }

        // Redirect to the tool — session cookie is now set
        window.location.href = `/${data.productSlug}`;
      } catch {
        setErrorMsg("This link doesn't appear to be valid. Please check your email and try again.");
        setStatus('error');
      }
    }

    redeem();
  }, [token]);

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.cream,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  if (status === 'loading') {
    return (
      <div style={pageStyle}>
        <p style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '14px', color: C.charcoalLight }}>
          Opening your gift…
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div
        style={{
          maxWidth: '440px',
          width: '90%',
          padding: '48px 40px',
          background: C.warmWhite,
          borderRadius: '12px',
          boxShadow: '0 4px 40px rgba(61,50,41,0.08)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 400,
            color: C.charcoal,
            margin: '0 0 16px',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '14px',
            color: C.charcoalLight,
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          {errorMsg}
        </p>
        <a
          href="https://kasanoff.ai"
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '13px',
            color: C.gold,
            textDecoration: 'none',
          }}
        >
          ← Return to Kasanoff.ai
        </a>
      </div>
    </div>
  );
}
