import { Gauge, Clock, Wifi } from 'lucide-react';

export const MetricsSection = () => {
  return (
    <section id="metrics" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-number">07 / EMPIRICAL BENCHMARKS</div>
          <h2 className="section-title">Measured System Metrics</h2>
          <p className="section-desc">
            Empirical measurements collected during dual-instance stress testing across Render free-tier web services and Upstash Redis.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          
          {/* Card 1 */}
          <div className="industrial-card">
            <div className="industrial-card-header">
              <span className="badge badge-cyan">MAX CONCURRENCY</span>
              <Gauge size={16} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
              500+
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Peak active concurrent WebSocket client connections tested across dual backend nodes before memory throttling.
            </div>
            <div style={{ marginTop: '0.85rem', padding: '0.4rem 0.6rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              Benchmarked via Artillery WebSocket load tests
            </div>
          </div>

          {/* Card 2 */}
          <div className="industrial-card">
            <div className="industrial-card-header">
              <span className="badge badge-green">CROSS-INSTANCE LATENCY</span>
              <Clock size={16} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', marginBottom: '0.4rem' }}>
              ~35 ms
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Average duration from Instance 1 DB commit to Instance 2 socket event reception via Upstash Redis.
            </div>
            <div style={{ marginTop: '0.85rem', padding: '0.4rem 0.6rem', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
              Measured via payload timestamp deltas
            </div>
          </div>

          {/* Card 3 */}
          <div className="industrial-card">
            <div className="industrial-card-header">
              <span className="badge badge-node2">RECONNECT RESYNC TIME</span>
              <Wifi size={16} color="var(--node-2-color)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--node-2-color)', marginBottom: '0.4rem' }}>
              ~150 ms
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Time taken for a reconnected client socket to reconnect and re-fetch clean PostgreSQL listing state.
            </div>
            <div style={{ marginTop: '0.85rem', padding: '0.4rem 0.6rem', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--node-2-color)' }}>
              Measured on socket connect & listing_state fetch
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
