import { useState } from 'react';
import { Film, Radio } from 'lucide-react';
import { DualInstanceSimulator } from './DualInstanceSimulator';

export const VideoPreview = () => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'video'>('simulator');

  return (
    <div style={{ background: '#0e131f', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
      {/* Top Tab Bar Toggle */}
      <div style={{ background: '#080b12', padding: '0.65rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setActiveTab('simulator')}
            style={{
              background: activeTab === 'simulator' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              border: activeTab === 'simulator' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              color: activeTab === 'simulator' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Radio size={14} /> Interactive Live Simulator
          </button>
          <button
            onClick={() => setActiveTab('video')}
            style={{
              background: activeTab === 'video' ? 'rgba(52, 211, 153, 0.18)' : 'transparent',
              border: activeTab === 'video' ? '1px solid var(--accent-green)' : '1px solid transparent',
              color: activeTab === 'video' ? 'var(--accent-green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Film size={14} /> Actual Demo Video / GIF
          </button>
        </div>

        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          DUAL-TAB INSTANCE SYNC PREVIEW
        </span>
      </div>

      {/* Tab Content */}
      {activeTab === 'simulator' ? (
        <DualInstanceSimulator />
      ) : (
        <div style={{ padding: '1.25rem' }}>
          {/* Actual Video / GIF Player Container */}
          <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', background: '#070a12', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <video
              id="demo-video-player"
              src="/demo.mp4"
              poster="/demo-poster.png"
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'cover' }}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = document.getElementById('video-fallback-card');
                if (fallback) fallback.style.display = 'flex';
              }}
            />

            {/* Video Fallback Container */}
            <div
              id="video-fallback-card"
              style={{
                display: 'none',
                minHeight: '280px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                background: '#070a12',
              }}
            >
              <Film size={32} color="var(--accent-green)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '0.35rem' }}>Screen Recording Video Player</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', lineHeight: 1.5, marginBottom: '1rem' }}>
                Place your recorded video file as <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>landing/public/demo.mp4</code> or <code style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>demo.gif</code> to render the actual dual-tab screen recording here.
              </p>
              <button
                onClick={() => setActiveTab('simulator')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                Switch to Interactive Simulator
              </button>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>FILE: /public/demo.mp4</span>
            <span style={{ color: 'var(--accent-green)' }}>● Real-time dual tab capture</span>
          </div>
        </div>
      )}
    </div>
  );
};
