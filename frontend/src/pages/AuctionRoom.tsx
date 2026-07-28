import { useParams, Link } from "react-router-dom";
import { useListing } from "../hooks/useListing";
import { BidForm } from "../components/BidForm";
import { PresenceBadge } from "../components/PresenceBadge";
import { Countdown } from "../components/Countdown";

interface AuctionRoomProps {
  displayName: string;
}

function formatINR(paise: number | null) {
  if (paise === null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function AuctionRoom({ displayName }: AuctionRoomProps) {
  const { id } = useParams<{ id: string }>();
  const {
    listing,
    presenceCount,
    bidError,
    isClosed,
    winner,
    loading,
    placeBid,
  } = useListing(id!, displayName);

  if (loading) {
    return (
      <div className="page auction-page">
        <div className="auction-loading">
          <div className="spinner" />
          <p>Joining auction room...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="page auction-page">
        <div className="error-box">
          <p>Listing not found.</p>
          <Link to="/" className="back-link">← Back to auctions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page auction-page">
      <header className="auction-header">
        <Link to="/" className="back-link" id="back-to-home">
          ← All Auctions
        </Link>
        <div className="auction-header__presence">
          <PresenceBadge count={presenceCount} />
        </div>
      </header>

      <main className="auction-main">
        <div className="auction-info">
          <div className="auction-info__top">
            <h1 className="auction-title" id="auction-title">{listing.title}</h1>
            <span className={`status-badge status-badge--${listing.status}`}>
              {isClosed ? "Closed" : "Live"}
            </span>
          </div>

          <p className="auction-description">{listing.description}</p>

          <div className="auction-stats">
            <div className="stat-card">
              <span className="stat-card__label">Current Highest Bid</span>
              <span className="stat-card__value" id="current-highest-bid">
                {listing.currentHighestBid !== null
                  ? formatINR(listing.currentHighestBid)
                  : formatINR(listing.startingPrice)}
              </span>
              {listing.currentHighestBidderName && (
                <span className="stat-card__sub">
                  by {listing.currentHighestBidderName}
                </span>
              )}
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Time Remaining</span>
              <span className="stat-card__value">
                <Countdown endsAt={listing.endsAt} isClosed={isClosed} />
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-card__label">Starting Price</span>
              <span className="stat-card__value">
                {formatINR(listing.startingPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Winner banner */}
        {isClosed && winner && (
          <div className="winner-banner" id="winner-banner">
            <span className="winner-banner__trophy">🏆</span>
            <div>
              <p className="winner-banner__title">Auction Ended!</p>
              <p className="winner-banner__detail">
                Won by <strong>{winner.name ?? "Anonymous"}</strong> with a bid of{" "}
                <strong>{formatINR(winner.amount)}</strong>
              </p>
            </div>
          </div>
        )}

        {isClosed && !winner && (
          <div className="winner-banner winner-banner--no-bids">
            <p>This auction ended with no bids.</p>
          </div>
        )}

        {/* Bid form */}
        {!isClosed && (
          <section className="bid-section">
            <h2 className="bid-section__title">Place Your Bid</h2>
            <BidForm
              listingId={listing.id}
              currentHighestBid={listing.currentHighestBid}
              startingPrice={listing.startingPrice}
              onBid={placeBid}
              error={bidError}
            />
          </section>
        )}

        {/* Recent bids */}
        <section className="bids-section">
          <h2 className="bids-section__title">Recent Bids</h2>
          {listing.bids.length === 0 ? (
            <p className="bids-empty">No bids yet. Be the first!</p>
          ) : (
            <ul className="bids-list" id="bids-list">
              {listing.bids.map((bid, idx) => (
                <li
                  key={bid.id}
                  className={`bid-item ${idx === 0 ? "bid-item--latest" : ""}`}
                >
                  <span className="bid-item__name">{bid.bidderName}</span>
                  <span className="bid-item__amount">{formatINR(bid.amount)}</span>
                  <span className="bid-item__time">
                    {new Date(bid.createdAt).toLocaleTimeString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
