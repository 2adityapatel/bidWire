import { useEffect, useState } from "react";
import { Zap, Trophy, AlertCircle, Clock, BookOpen } from "lucide-react";
import { ListingCard } from "../components/ListingCard";
import type { Listing } from "../hooks/useListing";
import { getSocket } from "../lib/socket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const LANDING_URL = import.meta.env.VITE_LANDING_URL || "https://bidwire-landing.vercel.app";

interface HomeProps {
  displayName: string;
}

export function Home({ displayName }: HomeProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = () => {
      fetch(`${BACKEND_URL}/api/listings`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch listings");
          return res.json();
        })
        .then((data) => {
          setListings(data.listings);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchListings();

    const socket = getSocket(displayName);

    const handleHomeBidUpdate = (data: {
      listingId: string;
      newHighestBid: number;
      bidderName: string | null;
    }) => {
      setListings((prevListings) =>
        prevListings.map((listing) =>
          listing.id === data.listingId
            ? {
                ...listing,
                currentHighestBid: data.newHighestBid,
                currentHighestBidderName: data.bidderName,
              }
            : listing
        )
      );
    };

    // Re-fetch when a new auction cycle starts (new_listings broadcast from cron)
    const handleNewListings = () => {
      fetchListings();
    };

    socket.on("connect", fetchListings);
    socket.on("home_bid_update", handleHomeBidUpdate);
    socket.on("new_listings", handleNewListings);

    return () => {
      socket.off("connect", fetchListings);
      socket.off("home_bid_update", handleHomeBidUpdate);
      socket.off("new_listings", handleNewListings);
    };
  }, [displayName]);

  const activeListings = listings.filter((l) => l.status === "active");
  const closedListings = listings.filter((l) => l.status === "closed");

  return (
    <div className="page home-page">
      <header className="home-header">
        <div className="home-header__inner">
          <div>
            <h1 className="home-header__title">
              <Zap size={20} color="var(--accent-blue)" /> BidWire
            </h1>
            <p className="home-header__subtitle">Live real-time auctions</p>
          </div>
          <div className="home-header__right">
            <a
              href={LANDING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="instance-banner__case-study"
              style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem" }}
            >
              <BookOpen size={14} /> Architecture ↗
            </a>
            <div className="home-header__user">
              <span className="home-header__avatar">{displayName.charAt(0).toUpperCase()}</span>
              <span className="home-header__username">{displayName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        {/* Active Auctions Section */}
        <div className="section-header">
          <h2 className="section-title">Active Auctions</h2>
          <span className="section-count">{activeListings.length} live</span>
        </div>

        {loading && (
          <div className="loading-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="listing-card listing-card--skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="error-box" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={18} />
            <div>
              <p>{error}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Make sure backend instances are running.</p>
            </div>
          </div>
        )}

        {!loading && !error && activeListings.length === 0 && (
          <div className="empty-state">
            <Clock size={24} color="var(--accent-cyan)" style={{ marginBottom: "0.5rem" }} />
            <p style={{ fontWeight: 600, color: "#fff" }}>No active auctions right now.</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Next auction cycle starts at the top of the hour!</p>
          </div>
        )}

        {!loading && !error && activeListings.length > 0 && (
          <div className="listings-grid">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Recent Winners & Ended Results Section */}
        {!loading && !error && closedListings.length > 0 && (
          <section className="results-section" style={{ marginTop: "3rem" }}>
            <div className="section-header">
              <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trophy size={18} color="var(--node-2-color)" /> Recent Winners & Results
              </h2>
              <span className="section-count section-count--closed">
                {closedListings.length} ended
              </span>
            </div>
            <div className="listings-grid">
              {closedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
