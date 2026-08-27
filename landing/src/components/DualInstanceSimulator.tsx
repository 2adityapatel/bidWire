import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface BidEvent {
  id: string;
  amount: number;
  bidder: string;
  sourceInstance: 'backend-1' | 'backend-2';
  timestamp: string;
}

export const DualInstanceSimulator = () => {
  const [bids, setBids] = useState<BidEvent[]>([
    {
      id: 'b-1',
      amount: 4500,
      bidder: 'Dev_Alpha',
      sourceInstance: 'backend-1',
      timestamp: '12:04:02',
    },
  ]);
  const [activePubSub, setActivePubSub] = useState(true);

  const currentHighest = bids[0]?.amount || 4500;

  const handlePlaceBid = (instance: 'backend-1' | 'backend-2', bidder: string) => {
    const newAmount = currentHighest + 500;
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });

    const newBid: BidEvent = {
      id: `b-${Date.now()}`,
      amount: newAmount,
      bidder,
      sourceInstance: instance,
      timestamp: now,
    };
    setBids((prev) => [newBid, ...prev]);
  };

  return (
    <div style={{ background: '#0e131f', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
      {/* Bar Header */}
      <div style={{ background: '#080b12', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            LIVE MULTI-NODE DEMO SIMULATOR
          </span>
        </div>
        <button
          onClick={() => setActivePubSub(!activePubSub)}
          style={{
            background: activePubSub ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 113, 133, 0.15)',
            border: `1px solid ${activePubSub ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            color: activePubSub ? 'var(--accent-green)' : 'var(--accent-red)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {activePubSub ? '● Redis Pub/Sub: ENABLED' : '○ Redis Pub/Sub: DISABLED'}
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Highest Bid Summary */}
        <div style={{ background: '#070a12', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Postgres Lock Status</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              ₹{currentHighest.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Highest Bidder</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {bids[0]?.bidder} <span className={`badge badge-${bids[0]?.sourceInstance === 'backend-1' ? 'node1' : 'node2'}`} style={{ marginLeft: '0.25rem' }}>{bids[0]?.sourceInstance}</span>
            </div>
          </div>
        </div>

        {/* Dual Node Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Node 1 */}
          <div style={{ background: '#121826', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '8px', padding: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--node-1-color)', fontSize: '0.85rem' }}>
                INSTANCE 1 (Port 3001)
              </span>
              <span className="badge badge-node1">Client A</span>
            </div>

            <button
              onClick={() => handlePlaceBid('backend-1', 'User_ClientA')}
              className="btn btn-secondary"
              style={{
                width: '100%',
                borderColor: 'var(--node-1-color)',
                color: '#fff',
                background: 'rgba(192, 132, 252, 0.12)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
              }}
            >
              + Bid ₹{(currentHighest + 500).toLocaleString()} via Instance 1
            </button>

            <div style={{ background: '#090d15', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>LOCAL CLIENT VIEW</span>
              <strong style={{ color: '#fff', fontSize: '1.1rem' }}>₹{currentHighest.toLocaleString()}</strong>
            </div>
          </div>

          {/* Node 2 */}
          <div style={{ background: '#121826', border: `1px solid ${activePubSub ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 113, 133, 0.3)'}`, borderRadius: '8px', padding: '1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--node-2-color)', fontSize: '0.85rem' }}>
                INSTANCE 2 (?server=2)
              </span>
              <span className="badge badge-node2">Client B</span>
            </div>

            <button
              onClick={() => handlePlaceBid('backend-2', 'User_ClientB')}
              className="btn btn-secondary"
              style={{
                width: '100%',
                borderColor: 'var(--node-2-color)',
                color: '#fff',
                background: 'rgba(251, 191, 36, 0.12)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
              }}
            >
              + Bid ₹{(currentHighest + 500).toLocaleString()} via Instance 2
            </button>

            <div style={{ background: '#090d15', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>LOCAL CLIENT VIEW</span>
              <strong style={{ color: activePubSub ? '#fff' : 'var(--text-muted)', fontSize: '1.1rem' }}>
                {activePubSub ? `₹${currentHighest.toLocaleString()}` : `₹${bids.find(b => b.sourceInstance === 'backend-2')?.amount || 4500} (Stale)`}
              </strong>
            </div>
          </div>
        </div>

        {/* Live Redis Log Stream */}
        <div style={{ background: '#080b12', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            REDIS EVENT BUS BROADCAST STREAM
          </div>
          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={14} />
            <span>Latest: [{bids[0]?.timestamp}] {bids[0]?.bidder} placed ₹{bids[0]?.amount.toLocaleString()} via {bids[0]?.sourceInstance}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
