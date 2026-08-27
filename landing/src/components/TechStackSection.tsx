import { Server, Database, Radio, Cpu, Layers, Terminal, Cloud, Shield, Clock, Zap, Globe } from 'lucide-react';

interface TechItem {
  name: string;
  category: string;
  caption: string;
  icon: React.ReactNode;
  color: string;
}

export const TechStackSection = () => {
  const techStack: TechItem[] = [
    {
      name: 'Node.js',
      category: 'Runtime',
      caption: 'Asynchronous event-driven I/O engine powering backend processes.',
      icon: <Cpu size={20} />,
      color: '#34d399',
    },
    {
      name: 'Express',
      category: 'HTTP Framework',
      caption: 'Minimalist REST API routing & middleware handler.',
      icon: <Server size={20} />,
      color: '#94a3b8',
    },
    {
      name: 'TypeScript',
      category: 'Language',
      caption: 'Strict compile-time type safety across database schemas & socket payloads.',
      icon: <Terminal size={20} />,
      color: '#60a5fa',
    },
    {
      name: 'Socket.IO',
      category: 'Real-Time Bus',
      caption: 'Bi-directional WebSocket transport layer with automatic reconnect fallback.',
      icon: <Radio size={20} />,
      color: '#38bdf8',
    },
    {
      name: 'Upstash Redis',
      category: 'Message Broker & Cache',
      caption: '@socket.io/redis-adapter pub/sub fan-out + O(1) presence sets + timer locks.',
      icon: <Zap size={20} />,
      color: '#fb7185',
    },
    {
      name: 'PostgreSQL (Supabase)',
      category: 'Database',
      caption: 'ACID storage engine with SELECT FOR UPDATE row-level locking.',
      icon: <Database size={20} />,
      color: '#38bdf8',
    },
    {
      name: 'Prisma ORM',
      category: 'Data Mapper',
      caption: 'Type-safe SQL query generation & transaction wrapping ($transaction).',
      icon: <Layers size={20} />,
      color: '#c084fc',
    },
    {
      name: 'PgBouncer',
      category: 'Connection Pooling',
      caption: 'Transaction-level pooling (?pgbouncer=true) managing serverless connection bounds.',
      icon: <Shield size={20} />,
      color: '#fbbf24',
    },
    {
      name: 'Render',
      category: 'Backend Hosting',
      caption: 'Dual standalone web service deployments (backend-1 & backend-2).',
      icon: <Cloud size={20} />,
      color: '#cbd5e1',
    },
    {
      name: 'Vercel',
      category: 'Edge CDN / Frontend',
      caption: 'High-speed SPA deployment for React 19 / Vite client.',
      icon: <Globe size={20} />,
      color: '#ffffff',
    },
    {
      name: 'Upstash QStash',
      category: 'Serverless Cron',
      caption: 'Hourly HTTP runner triggering listing rotation & Render anti-sleep pings.',
      icon: <Clock size={20} />,
      color: '#34d399',
    },
  ];

  return (
    <section id="tech-stack" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-number">03 / STACK & INFRASTRUCTURE</div>
          <h2 className="section-title">Core Technology Stack</h2>
          <p className="section-desc">
            Every component in the BidWire architecture serves a specific role in guaranteeing real-time synchronization and concurrency control.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
          {techStack.map((tech, idx) => (
            <div key={idx} className="industrial-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                <div style={{ color: tech.color, background: 'rgba(255, 255, 255, 0.05)', padding: '0.45rem', borderRadius: '6px', display: 'flex' }}>
                  {tech.icon}
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block', lineHeight: 1.2 }}>{tech.name}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tech.category}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                {tech.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
