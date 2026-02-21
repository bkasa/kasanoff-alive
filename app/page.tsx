'use client';

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

interface Exploration {
  id: string;
  title: string;
  description: string;
  stripeUrl: string | null;
  path: string;
}

const EXPLORATIONS: Exploration[] = [
  {
    id: 'ikigai',
    title: 'What Is My Ikigai?',
    description:
      'A deep, guided interview — approximately 60–70 questions — that maps the intersection of what you love, what the world needs, what you\'re good at, and what you can be paid for. Produces your Ikigai statement, values compass, and questions to sit with.',
    stripeUrl: 'https://buy.stripe.com/test_28E3cu7r59JS0evfN92ZO00',
    path: '/ikigai',
  },
  {
    id: 'climbing',
    title: 'Am I Climbing the Right Mountain?',
    description:
      'Helps you evaluate whether your current direction is truly aligned with who you are — before you reach the summit.',
    stripeUrl: null,
    path: '/climbing',
  },
  {
    id: 'best-life',
    title: 'What\'s My Best Possible Life?',
    description:
      'A vision-oriented exploration that helps you articulate and move toward your fullest, most alive life.',
    stripeUrl: null,
    path: '/best-life',
  },
  {
    id: 'zone',
    title: 'How Do I Spend More Time in the Zone?',
    description:
      'Explores flow state, peak performance, and the specific conditions that produce it in your life.',
    stripeUrl: null,
    path: '/zone',
  },
];

export default function HubPage() {
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
        @keyframes float2 { 0%,100%{opacity:0.12} 50%{opacity:0.20} }
        @keyframes float3 { 0%,100%{opacity:0.10} 50%{opacity:0.17} }
        @keyframes float4 { 0%,100%{opacity:0.09} 50%{opacity:0.15} }
      `}</style>

      {/* Background washes */}
      {[
        { top: '-20%', left: '-10%', color: 'rgba(212,165,116,0.14)', anim: 'float1 9s ease-in-out infinite' },
        { bottom: '-20%', right: '-10%', color: 'rgba(212,160,160,0.12)', anim: 'float2 12s ease-in-out infinite' },
        { top: '30%', right: '-5%', color: 'rgba(139,164,184,0.10)', anim: 'float3 14s ease-in-out infinite' },
        { bottom: '-10%', left: '-5%', color: 'rgba(196,131,106,0.09)', anim: 'float4 11s ease-in-out infinite' },
      ].map((wash, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${wash.color} 0%, transparent 70%)`,
            top: wash.top,
            left: wash.left,
            bottom: (wash as { bottom?: string }).bottom,
            right: (wash as { right?: string }).right,
            animation: wash.anim,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      {/* Return link */}
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

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '760px',
          margin: '0 auto',
          padding: 'clamp(80px,12vw,120px) clamp(24px,5vw,48px) clamp(60px,8vw,80px)',
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px,8vw,72px)' }}>
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.gold,
              margin: '0 0 18px',
            }}
          >
            Kasanoff.ai
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 300,
              color: C.charcoal,
              margin: '0 0 18px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            Explorations
          </h1>
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: C.charcoalLight,
              fontWeight: 300,
              maxWidth: '480px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            AI-guided journeys into self-knowledge. Each Exploration is a thoughtful, unhurried conversation designed to help you see yourself more clearly.
          </p>
        </div>

        {/* Exploration cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {EXPLORATIONS.map((exp) => (
            <ExplorationCard key={exp.id} exploration={exp} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'clamp(48px,8vw,72px)',
            textAlign: 'center',
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '12px',
            color: C.charcoalLight,
            opacity: 0.6,
          }}
        >
          Created by Bruce Kasanoff
        </div>
      </div>
    </div>
  );
}

function ExplorationCard({ exploration }: { exploration: Exploration }) {
  const isAvailable = exploration.stripeUrl !== null;

  return (
    <div
      style={{
        background: C.warmWhite,
        borderRadius: '12px',
        padding: 'clamp(24px,4vw,36px)',
        boxShadow: '0 2px 20px rgba(61,50,41,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: '1px solid rgba(212,165,116,0.12)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 32px rgba(61,50,41,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 20px rgba(61,50,41,0.06)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(20px, 3vw, 24px)',
              fontWeight: 400,
              color: C.charcoal,
              margin: '0 0 10px',
              lineHeight: 1.3,
            }}
          >
            {exploration.title}
          </h2>
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '14px',
              color: C.charcoalLight,
              margin: 0,
              lineHeight: 1.65,
              fontWeight: 300,
            }}
          >
            {exploration.description}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '22px',
              fontWeight: 400,
              color: C.charcoal,
            }}
          >
            $18
          </span>

          {isAvailable ? (
            <a
              href={exploration.stripeUrl!}
              style={{
                padding: '10px 22px',
                background: C.gold,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'inline-block',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.terracotta)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
            >
              Begin
            </a>
          ) : (
            <span
              style={{
                padding: '10px 22px',
                background: 'rgba(212,165,116,0.15)',
                color: C.charcoalLight,
                borderRadius: '6px',
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
