import { Home, Wifi, ShieldAlert } from 'lucide-react';

export const ProblemSection = () => {
  return (
    <section id="problem" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-number">01 / CONCEPTUAL FOUNDATION</div>
          <h2 className="section-title">The Multi-Instance State Problem</h2>
          <p className="section-desc">
            Scaling a real-time web app across multiple server processes introduces a fundamental communication barrier: isolated memory spaces.
          </p>
        </div>

        {/* 3 Step Analogy Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Card 1 */}
          <div className="industrial-card">
            <div style={{ background: 'rgba(96, 165, 250, 0.12)', width: '42px', height: '42px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: '1.25rem' }}>
              <Home size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>1. The Apartment Analogy</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Think of a running server process as a sealed apartment unit. Anything that occurs inside that apartment — like a bid received over an active socket — is immediately visible only to people inside that exact apartment.
            </p>
          </div>

          {/* Card 2 */}
          <div className="industrial-card">
            <div style={{ background: 'rgba(251, 191, 36, 0.12)', width: '42px', height: '42px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--node-2-color)', marginBottom: '1.25rem' }}>
              <Wifi size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>2. Sticky Sockets</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              When a visitor connects to your web app, their browser creates an active WebSocket connection. That persistent connection gets pinned to <strong>one specific apartment instance</strong> and cannot jump between processes.
            </p>
          </div>

          {/* Card 3 */}
          <div className="industrial-card">
            <div style={{ background: 'rgba(251, 113, 133, 0.12)', width: '42px', height: '42px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)', marginBottom: '1.25rem' }}>
              <ShieldAlert size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>3. The Communication Gap</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              When User A in Apartment 1 places a higher bid, Apartment 1 updates its own state. But without an inter-apartment radio (Redis Pub/Sub), Apartment 2 stays unaware — leaving User B watching an outdated price.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
