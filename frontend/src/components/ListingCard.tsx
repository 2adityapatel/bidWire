import { Link } from "react-router-dom";
import type { Listing } from "../hooks/useListing";
import { Countdown } from "./Countdown";

interface ListingCardProps {
  listing: Listing;
}

function formatINR(paise: number | null) {
  if (paise === null) return "No bids yet";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function ListingCard({ listing }: ListingCardProps) {
  const isClosed = listing.status === "closed";

  return (
    <Link to={`/listing/${listing.id}`} className="listing-card" id={`listing-card-${listing.id}`}>
      <div className="listing-card__header">
        <h2 className="listing-card__title">{listing.title}</h2>
        <Countdown endsAt={listing.endsAt} isClosed={isClosed} />
      </div>

      <p className="listing-card__description">{listing.description}</p>

      <div className="listing-card__footer">
        <div className="listing-card__bid-info">
          <span className="listing-card__label">
            {listing.currentHighestBid !== null ? "Highest Bid" : "Starting at"}
          </span>
          <span className="listing-card__amount">
            {listing.currentHighestBid !== null
              ? formatINR(listing.currentHighestBid)
              : formatINR(listing.startingPrice)}
          </span>
          {listing.currentHighestBidderName && (
            <span className="listing-card__bidder">
              by {listing.currentHighestBidderName}
            </span>
          )}
        </div>

        <span className={`listing-card__status listing-card__status--${listing.status}`}>
          {isClosed ? "Closed" : "Live"}
        </span>
      </div>
    </Link>
  );
}
