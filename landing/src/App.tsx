import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { TechStackSection } from './components/TechStackSection';
import { WalkthroughSection } from './components/WalkthroughSection';
import { LimitationsSection } from './components/LimitationsSection';
import { RealWorldSection } from './components/RealWorldSection';
import { MetricsSection } from './components/MetricsSection';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <HeroSection />
        <ProblemSection />
        <ArchitectureDiagram />
        <TechStackSection />
        <WalkthroughSection />
        <LimitationsSection />
        <RealWorldSection />
        <MetricsSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
