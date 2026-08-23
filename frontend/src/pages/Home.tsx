import { useEffect, useState } from "react";
import { ListingCard } from "../components/ListingCard";
import type { Listing } from "../hooks/useListing";
import { getSocket } from "../lib/socket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

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
              <span className="home-header__logo">⚡</span> BidWire
            </h1>
            <p className="home-header__subtitle">Live real-time auctions</p>
          </div>
          <div className="home-header__user">
            <span className="home-header__avatar">{displayName.charAt(0).toUpperCase()}</span>
            <span className="home-header__username">{displayName}</span>
          </div>
        </div>
      </header>

      <main className="home-main">
        {/* ── Active Auctions Section ────────────────────────────────────────────── */}
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
          <div className="error-box">
            <p>⚠️ {error}</p>
            <p>Make sure the backend is running.</p>
          </div>
        )}

        {!loading && !error && activeListings.length === 0 && (
          <div className="empty-state">
            <p>No active auctions right now.</p>
            <p>⏰ Next auction cycle starts at the top of the hour!</p>
          </div>
        )}

        {!loading && !error && activeListings.length > 0 && (
          <div className="listings-grid">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* ── Recent Winners & Ended Results Section ───────────────────────────── */}
        {!loading && !error && closedListings.length > 0 && (
          <section className="results-section" style={{ marginTop: "3rem" }}>
            <div className="section-header">
              <h2 className="section-title">🏆 Recent Winners & Results</h2>
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
