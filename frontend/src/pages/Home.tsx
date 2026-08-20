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

    // Real-time listener for home page feed updates across all backend instances
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

    socket.on("home_bid_update", handleHomeBidUpdate);

    return () => {
      socket.off("home_bid_update", handleHomeBidUpdate);
    };
  }, [displayName]);

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
        <div className="section-header">
          <h2 className="section-title">Active Auctions</h2>
          <span className="section-count">{listings.length} live</span>
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
            <p>Make sure the backend is running on port 3001.</p>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="empty-state">
            <p>No active auctions right now.</p>
            <p>Run <code>npm run db:seed</code> in the backend to seed listings.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="listings-grid">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
