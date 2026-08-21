import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSocket } from "./hooks/useSocket";
import { Home } from "./pages/Home";
import { AuctionRoom } from "./pages/AuctionRoom";
import { InstanceBadge } from "./components/InstanceBadge";
import "./index.css";

function JoinScreen({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="join-screen">
      <div className="join-card">
        <div className="join-card__logo">⚡</div>
        <h1 className="join-card__title">BidWire</h1>
        <p className="join-card__subtitle">Real-time live auctions</p>
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
      {/* Instance badge always visible — shows which backend node this client hit */}
      <div className="instance-banner">
        <InstanceBadge instanceId={instanceId} status={status} />
      </div>
      {status === "disconnected" && (
        <div className="connection-banner">
          ⚠️ Disconnected — reconnecting...
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
