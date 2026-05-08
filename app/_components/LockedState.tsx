'use client';

const C = {
  cream: '#FDF8F0',
  warmWhite: '#FFFDF9',
  charcoal: '#3D3229',
  charcoalLight: '#6B5D50',
  gold: '#D4A574',
  terracotta: '#C4836A',
};

interface LockedStateProps {
  lockedMessage: string;
  archivedDocument: string;
  stripeUrl: string;
  expiresAt: Date;
}

export default function LockedState({
  lockedMessage,
  archivedDocument,
  stripeUrl,
  expiresAt,
}: LockedStateProps) {
  const formattedDate = expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const message = lockedMessage.replace('{expires_at}', formattedDate);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.cream,
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <p
          style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.gold,
            margin: '0 0 40px',
          }}
        >
          Kasanoff.ai
        </p>

        {/* Locked message */}
        <div
          style={{
            background: C.warmWhite,
            borderRadius: '12px',
            padding: '40px 44px',
            boxShadow: '0 4px 40px rgba(61,50,41,0.08)',
            marginBottom: '32px',
          }}
        >
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '15px',
              color: C.charcoalLight,
              lineHeight: 1.7,
              margin: '0 0 32px',
              whiteSpace: 'pre-line',
            }}
          >
            {message}
          </p>

          <a
            href={stripeUrl}
            style={{
              display: 'inline-block',
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: C.warmWhite,
              background: C.terracotta,
              padding: '12px 28px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Start a new conversation — $18
          </a>
        </div>

        {/* Archived document — read-only */}
        {archivedDocument && (
          <div
            style={{
              background: C.warmWhite,
              borderRadius: '12px',
              padding: '40px 44px',
              boxShadow: '0 4px 40px rgba(61,50,41,0.08)',
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
                margin: '0 0 24px',
              }}
            >
              Your Document
            </p>
            <div
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '14px',
                color: C.charcoal,
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
              }}
            >
              {archivedDocument}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
