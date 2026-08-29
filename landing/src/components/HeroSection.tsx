import { Github, ArrowUpRight } from 'lucide-react';
import { VideoPreview } from './VideoPreview';

export const HeroSection = () => {
  return (
    <section
      style={{
        paddingTop: '5rem',
        paddingBottom: '0',
      }}
    >
      <div className="container">

        {/* ── Centred Header Block ─────────────────────────────────────── */}
        <div
          style={{
            maxWidth: '780px',
            margin: '0 auto',
            textAlign: 'center',
            paddingBottom: '3.5rem',
          }}
        >
          {/* Status badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span className="badge badge-cyan" style={{ gap: '0.4rem' }}>
              <span className="pulse-dot"></span>
              DISTRIBUTED ENGINE
            </span>
            <span className="badge badge-gray">NODE 1 + NODE 2 DEPLOYED</span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              lineHeight: 1.18,
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}
          >
            What happens to a live bid when your backend runs on{' '}
            <span style={{ color: 'var(--accent-cyan)' }}>two servers</span>{' '}
            that don't know about each other?
          </h1>

          {/* Sub-description */}
          <p
            className="section-desc"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.65,
              marginBottom: '2rem',
              color: 'var(--text-secondary)',
            }}
          >
            BidWire is a multi-instance live-auction backend built with Node.js, Express,
            TypeScript, PostgreSQL (Prisma), Socket.IO, and Upstash Redis. It resolves
            WebSocket isolation using a Redis pub/sub fan-out bus and PostgreSQL row
            locking (
            <code
              style={{
                color: 'var(--accent-green)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9em',
              }}
            >
              SELECT ... FOR UPDATE
            </code>
            ).
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
            }}
          >
            <a
              href="https://bid-wire-seven.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Live Demo <ArrowUpRight size={16} />
            </a>
            <a
              href="https://github.com/2adityapatel/bidWire"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Github size={16} /> View Source
            </a>
          </div>
        </div>

        {/* ── Full-width Video / Simulator Preview ─────────────────────── */}
        <div
          style={{
            /* Bleed slightly past the container on both sides for drama */
            margin: '0 -1rem',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            borderBottom: 'none',
            background: 'var(--bg-card)',
            /* Subtle top glow */
            boxShadow: '0 -4px 60px rgba(56, 189, 248, 0.07)',
          }}
        >
          {/* Window chrome bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: '#0b0e19',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b3b3b' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b3b3b' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b3b3b' }} />
            <span
              style={{
                marginLeft: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              BidWire — Live Simulator
            </span>
          </div>

          {/* The actual preview */}
          <div style={{ padding: '1.5rem' }}>
            <VideoPreview />
          </div>
        </div>

      </div>
    </section>
  );
};
