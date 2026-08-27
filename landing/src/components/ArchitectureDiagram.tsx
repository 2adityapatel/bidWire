import { useState } from 'react';
import { Database, Server, Radio, ArrowRight, ArrowDown, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ArchitectureDiagram = () => {
  const [mode, setMode] = useState<'with-redis' | 'without-redis'>('with-redis');

  return (
    <section id="architecture" className="section">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-number">02 / SYSTEM ARCHITECTURE</div>
            <h2 className="section-title">Distributed Event Flow Diagram</h2>
            <p className="section-desc">
              Visualizing how bid events propagate across dual backend processes, Supabase PostgreSQL, and Upstash Redis Pub/Sub.
            </p>
          </div>

          {/* Clean Toggle Pill */}
          <div style={{ background: '#0e1422', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.3rem', borderRadius: '8px', display: 'flex', gap: '0.3rem' }}>
            <button
              onClick={() => setMode('with-redis')}
              style={{
                background: mode === 'with-redis' ? 'rgba(52, 211, 153, 0.18)' : 'transparent',
                border: mode === 'with-redis' ? '1px solid var(--accent-green)' : '1px solid transparent',
                color: mode === 'with-redis' ? 'var(--accent-green)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <CheckCircle2 size={14} /> WITH REDIS (Synced)
            </button>
            <button
              onClick={() => setMode('without-redis')}
              style={{
                background: mode === 'without-redis' ? 'rgba(251, 113, 133, 0.18)' : 'transparent',
                border: mode === 'without-redis' ? '1px solid var(--accent-red)' : '1px solid transparent',
                color: mode === 'without-redis' ? 'var(--accent-red)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AlertTriangle size={14} /> WITHOUT REDIS (Broken)
            </button>
          </div>
        </div>

        {/* Dynamic Diagram Canvas */}
        <div style={{ background: '#0e1320', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '2rem' }}>
          
          {/* Tier 1: Clients */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span className="badge badge-gray" style={{ marginBottom: '1rem' }}>CLIENT LAYER</span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#141c2e', border: '1px solid var(--node-1-color)', padding: '0.85rem 1.5rem', borderRadius: '8px', minWidth: '200px' }}>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TAB 1</div>
                <strong style={{ color: '#fff' }}>Client A (Bids ₹5,000)</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--node-1-color)', marginTop: '0.25rem' }}>Node 1 Connected</div>
              </div>

              <div style={{ background: '#141c2e', border: `1px solid ${mode === 'with-redis' ? 'var(--node-2-color)' : 'var(--accent-red)'}`, padding: '0.85rem 1.5rem', borderRadius: '8px', minWidth: '200px' }}>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TAB 2</div>
                <strong style={{ color: '#fff' }}>Client B</strong>
                <div style={{ fontSize: '0.75rem', color: mode === 'with-redis' ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '0.25rem' }}>
                  {mode === 'with-redis' ? '✓ Receives ₹5,000 Sync' : '❌ Stale View (₹4,500)'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
            <ArrowDown size={20} />
          </div>

          {/* Tier 2: Backend Cluster */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span className="badge badge-gray" style={{ marginBottom: '1rem' }}>BACKEND CLUSTER (RENDER SERVICES)</span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Node 1 */}
              <div style={{ background: '#141c2e', border: '1px solid rgba(192, 132, 252, 0.4)', borderRadius: '8px', padding: '1.25rem', width: '260px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Server size={18} color="var(--node-1-color)" />
                  <strong style={{ color: 'var(--node-1-color)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>bidwire-backend-1</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Executes Postgres Row Lock & writes bid</div>
              </div>

              {/* PubSub Bus Arrow */}
              <div style={{ padding: '0.6rem 1rem', background: mode === 'with-redis' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(251, 113, 133, 0.12)', border: `1px solid ${mode === 'with-redis' ? 'var(--accent-cyan)' : 'var(--accent-red)'}`, borderRadius: '8px', color: mode === 'with-redis' ? 'var(--accent-cyan)' : 'var(--accent-red)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {mode === 'with-redis' ? (
                  <><span>Redis Pub/Sub Bus</span> <ArrowRight size={16} /></>
                ) : (
                  <><span>❌ No Bus Connection</span></>
                )}
              </div>

              {/* Node 2 */}
              <div style={{ background: '#141c2e', border: `1px solid ${mode === 'with-redis' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 113, 133, 0.4)'}`, borderRadius: '8px', padding: '1.25rem', width: '260px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Server size={18} color={mode === 'with-redis' ? 'var(--node-2-color)' : 'var(--accent-red)'} />
                  <strong style={{ color: mode === 'with-redis' ? 'var(--node-2-color)' : 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>bidwire-backend-2</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {mode === 'with-redis' ? 'Receives payload & emits to Client B' : '❌ Unaware of Node 1 bid'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
            <ArrowDown size={20} />
          </div>

          {/* Tier 3: Shared Infrastructure */}
          <div style={{ textAlign: 'center' }}>
            <span className="badge badge-gray" style={{ marginBottom: '1rem' }}>SHARED PERSISTENCE & MESSAGING</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
              <div style={{ background: '#141c2e', border: `1px solid ${mode === 'with-redis' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`, borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
                  <Radio size={18} />
                  <strong style={{ color: '#fff' }}>Upstash Redis</strong>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@socket.io/redis-adapter + Presence Sets</span>
              </div>

              <div style={{ background: '#141c2e', border: '1px solid var(--accent-green)', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--accent-green)', marginBottom: '0.25rem' }}>
                  <Database size={18} />
                  <strong style={{ color: '#fff' }}>Supabase PostgreSQL</strong>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prisma ORM + SELECT FOR UPDATE Locks</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
