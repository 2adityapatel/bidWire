import { Github, ExternalLink, FileText, ArrowUp, Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ background: '#05070b', borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '4rem 0 2rem 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Zap size={20} color="#2563eb" />
              <strong style={{ fontSize: '1.2rem', color: '#fff' }}>BidWire</strong>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '320px' }}>
              Distributed real-time live auction backend built with Node.js, Express, TypeScript, PostgreSQL (SELECT FOR UPDATE), Socket.IO, and Upstash Redis.
            </p>
          </div>

          {/* Col 2: Production Links */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Production Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
              <li>
                <a href="https://bid-wire-seven.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  Live Demo Application <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a href="https://github.com/2adityapatel/bidWire" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  GitHub Source Code Repository <Github size={14} />
                </a>
              </li>
              <li>
                <a href="https://github.com/2adityapatel/bidWire/blob/main/README.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  Read the Full Technical Write-up (README) <FileText size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Technical Credentials */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-green)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Architecture Summary
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>• Row Lock: Postgres SELECT FOR UPDATE</div>
              <div>• Bus: @socket.io/redis-adapter</div>
              <div>• Presence: Redis Sets O(1)</div>
              <div>• Timer Lock: SET NX EX 30</div>
              <div>• Cron: Upstash QStash</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            © {new Date().getFullYear()} BidWire Engineering Case Study.
          </div>
          <a href="#" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Back to Top <ArrowUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
};
