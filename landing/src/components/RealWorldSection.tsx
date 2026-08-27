import { Table, Ticket } from 'lucide-react';

export const RealWorldSection = () => {
  return (
    <section id="real-world" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-number">06 / REAL-WORLD COMPARISON & ANALYSIS</div>
          <h2 className="section-title">Production Comparison & Industry Context</h2>
          <p className="section-desc">
            How BidWire's architectural choices compare to enterprise auction systems like eBay, and why time-boxed high-concurrency systems demand rigour.
          </p>
        </div>

        {/* Part (a): Comparison Table */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="var(--accent-cyan)" /> Comparative Architecture Breakdown
          </h3>

          <div className="industrial-table-wrapper">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Concern</th>
                  <th>BidWire Architecture</th>
                  <th>Production Enterprise (e.g. eBay-style)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Concurrency Safety</strong></td>
                  <td>Postgres row lock (<code style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>FOR UPDATE</code>) inside transaction</td>
                  <td>Similar idea, often a Redis-based optimistic lock</td>
                </tr>
                <tr>
                  <td><strong>Event Delivery</strong></td>
                  <td>Redis pub/sub (fire-and-forget)</td>
                  <td>Kafka / SQS FIFO — durable, ordered, replayable</td>
                </tr>
                <tr>
                  <td><strong>Fan-out to Clients</strong></td>
                  <td>Self-managed Socket.IO + Redis adapter</td>
                  <td>Often outsourced to Pusher/PubNub/Ably at scale</td>
                </tr>
                <tr>
                  <td><strong>Why the gap is fine here</strong></td>
                  <td>Portfolio scope, no real money at stake</td>
                  <td>Real money, audit and regulatory requirements</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Part (b): Ticketmaster Eras Tour Presale Analysis */}
        <div className="industrial-card" style={{ background: '#0e1320', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.12)', padding: '0.5rem', borderRadius: '6px', color: 'var(--node-2-color)', display: 'flex' }}>
              <Ticket size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Case Study: Ticketmaster 2022 Eras Tour Presale Outage</h3>
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                HISTORICAL SYSTEM FAILURE REFERENCE [1]
              </span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.85rem' }}>
            In November 2022, during the Taylor Swift Eras Tour presale, Ticketmaster registered over <strong>3.5 billion requests</strong> in a single day (~4x prior peak), overwhelming waiting queues and inventory allocation services, forcing Ticketmaster to pause sales.
          </p>

          <div style={{ background: '#070a12', borderLeft: '3px solid var(--node-2-color)', padding: '0.85rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: '#fff' }}>Technical Note:</strong> The Ticketmaster incident was primarily a traffic-volume and bot-mitigation failure, not the same bug class BidWire addresses. However, it establishes why this category of system (real-time, high-demand, time-boxed) is worth taking seriously.
            </p>
          </div>

          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            [1] Source: Congressional testimony & public Ticketmaster engineering post-mortem (Nov 2022).
          </div>
        </div>
      </div>
    </section>
  );
};
