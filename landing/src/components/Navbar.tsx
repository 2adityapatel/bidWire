import { Zap, Github } from 'lucide-react';

export const Navbar = () => {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10, 13, 20, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: '#fff' }}>
          <div style={{ background: '#2563eb', padding: '0.4rem', borderRadius: '6px', color: '#fff', display: 'flex' }}>
            <Zap size={18} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>BidWire</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>[CASE STUDY]</span>
          </div>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="#problem" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>01. Problem</a>
          <a href="#architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>02. Architecture</a>
          <a href="#tech-stack" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>03. Stack</a>
          <a href="#limitations" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>05. Limitations</a>
          
          <a
            href="https://github.com/2adityapatel/bidWire"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            <Github size={14} /> GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};
