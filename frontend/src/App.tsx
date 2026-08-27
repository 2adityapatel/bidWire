import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Zap, AlertCircle, BookOpen } from "lucide-react";
import { useSocket } from "./hooks/useSocket";
import { Home } from "./pages/Home";
import { AuctionRoom } from "./pages/AuctionRoom";
import { InstanceBadge } from "./components/InstanceBadge";
import "./index.css";

const LANDING_URL = import.meta.env.VITE_LANDING_URL || "https://bidwire-landing.vercel.app";

function JoinScreen({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-card__logo">
          <Zap size={24} />
        </div>
        <h1 className="join-card__title">BidWire</h1>
        <p className="join-card__subtitle">Distributed Live Auctions</p>
        <form
          className="join-card__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onJoin(name.trim());
          }}
        >
          <input
            id="display-name-input"
            className="join-card__input"
            type="text"
            placeholder="Enter your display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <button
            id="join-btn"
            className="join-card__btn"
            type="submit"
            disabled={!name.trim()}
          >
            Enter Auction →
          </button>
        </form>
      </div>
    </div>
  );
}

function AppInner({ displayName }: { displayName: string }) {
  const { status, instanceId } = useSocket(displayName);

  return (
    <>
      {/* Top banner: Left side Case Study link, Right side Instance badge */}
      <div className="instance-banner">
        <a
          href={LANDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="instance-banner__case-study"
        >
          <BookOpen size={12} /> System Case Study & Architecture ↗
        </a>
        <InstanceBadge instanceId={instanceId} status={status} />
      </div>

      {status === "disconnected" && (
        <div className="connection-banner">
          <AlertCircle size={14} /> Disconnected — reconnecting to backend cluster...
        </div>
      )}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home displayName={displayName} />} />
          <Route
            path="/listing/:id"
            element={<AuctionRoom displayName={displayName} />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  if (!displayName) {
    return <JoinScreen onJoin={setDisplayName} />;
  }

  return <AppInner displayName={displayName} />;
}
