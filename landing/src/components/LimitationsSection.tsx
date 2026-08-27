import { ShieldAlert } from 'lucide-react';

export const LimitationsSection = () => {
  return (
    <section id="limitations" className="section">
      <div className="container">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <ShieldAlert size={18} color="var(--accent-red)" />
            <span className="section-number" style={{ color: 'var(--accent-red)' }}>05 / CREDIBILITY & TRANSPARENCY</span>
          </div>
          <h2 className="section-title">Known System Limitations & Scope Tradeoffs</h2>
          <p className="section-desc">
            Production engineering requires honest analysis of architectural boundaries. Below are the explicit constraints and trade-offs intentionally made for BidWire's portfolio scope.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          
          {/* Limitation 1 */}
          <div className="industrial-card" style={{ borderColor: 'rgba(251, 113, 133, 0.25)' }}>
            <span className="badge badge-red" style={{ marginBottom: '0.75rem' }}>EVENT DELIVERY</span>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Redis Pub/Sub is Fire-and-Forget</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Redis Pub/Sub does not buffer or replay messages. If a client socket drops temporarily during a bid event, that specific message is missed.
            </p>
            <div style={{ background: '#070a12', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>Mitigation:</strong> On socket reconnect, the client automatically re-fetches fresh PostgreSQL state.
            </div>
          </div>

          {/* Limitation 2 */}
          <div className="industrial-card" style={{ borderColor: 'rgba(251, 113, 133, 0.25)' }}>
            <span className="badge badge-red" style={{ marginBottom: '0.75rem' }}>DISTRIBUTED LOCK GAP</span>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Simple SET NX EX Lock Pattern</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              The auto-close lock uses <code style={{ color: 'var(--node-2-color)', fontFamily: 'var(--font-mono)' }}>SET key val NX EX 30</code> without a unique token Lua-script release (Redlock style).
            </p>
            <div style={{ background: '#070a12', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--accent-red)' }}>Known Gap:</strong> A slow process lagging past 30 seconds could release a lock it no longer holds. Acceptable for portfolio scope; Redlock required for financial production.
            </div>
          </div>

          {/* Limitation 3 */}
          <div className="industrial-card" style={{ borderColor: 'rgba(251, 113, 133, 0.25)' }}>
            <span className="badge badge-red" style={{ marginBottom: '0.75rem' }}>DEMO ROUTING</span>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>?server=2 Routing is a Demo Device</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              The <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>?server=2</code> parameter and <code style={{ color: 'var(--node-1-color)', fontFamily: 'var(--font-mono)' }}>&lt;InstanceBadge&gt;</code> allow reviewers to manually force their browser to connect to Instance 2.
            </p>
            <div style={{ background: '#070a12', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '6px', padding: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>Clarification:</strong> Explicitly a visual demo tool. Real production load balancing uses layer-7 balancers (AWS ALB / NGINX).
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
