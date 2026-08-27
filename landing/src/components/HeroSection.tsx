import { Github, ArrowUpRight } from 'lucide-react';
import { VideoPreview } from './VideoPreview';

export const HeroSection = () => {
  return (
    <section className="section" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          
          {/* Left Column: Problem Statement & Intro */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="badge badge-cyan" style={{ gap: '0.4rem' }}>
                <span className="pulse-dot"></span>
                DISTRIBUTED ENGINE
              </span>
              <span className="badge badge-gray">NODE 1 + NODE 2 DEPLOYED</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
                lineHeight: 1.18,
                marginBottom: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              What happens to a live bid when your backend runs on two servers that don't know about each other?
            </h1>

            <p
              className="section-desc"
              style={{
                fontSize: '1.05rem',
                marginBottom: '2rem',
                lineHeight: 1.6,
              }}
            >
              BidWire is a multi-instance live-auction backend built with Node.js, Express, TypeScript, PostgreSQL (Prisma), Socket.IO, and Upstash Redis. It resolves WebSocket isolation using a Redis pub/sub fan-out bus and PostgreSQL row locking (<code style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>SELECT ... FOR UPDATE</code>).
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem' }}>
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

          {/* Right Column: Demo Preview & Simulator */}
          <div>
            <VideoPreview />
          </div>

        </div>
      </div>
    </section>
  );
};
