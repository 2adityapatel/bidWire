import { useState } from "react";
import type { FormEvent } from "react";

interface BidFormProps {
  listingId: string;
  currentHighestBid: number | null;
  startingPrice: number;
  onBid: (amountInPaise: number) => void;
  error: string | null;
  disabled?: boolean;
}

const MIN_INCREMENT_PAISE = 100; // ₹1

export function BidForm({
  currentHighestBid,
  startingPrice,
  onBid,
  error,
  disabled = false,
}: BidFormProps) {
  const [inputRupees, setInputRupees] = useState("");

  const minimumBidRupees =
    currentHighestBid !== null
      ? (currentHighestBid + MIN_INCREMENT_PAISE) / 100
      : startingPrice / 100;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const rupees = parseFloat(inputRupees);
    if (isNaN(rupees) || rupees <= 0) return;
    const paise = Math.round(rupees * 100);
    onBid(paise);
    setInputRupees("");
  };

  return (
    <form className="bid-form" onSubmit={handleSubmit} id="bid-form">
      <label className="bid-form__label" htmlFor="bid-amount">
        Your Bid (₹)
      </label>
      <div className="bid-form__row">
        <div className="bid-form__input-wrap">
          <span className="bid-form__prefix">₹</span>
          <input
            id="bid-amount"
            className="bid-form__input"
            type="number"
            min={minimumBidRupees}
            step="1"
            placeholder={`Min. ₹${minimumBidRupees.toLocaleString("en-IN")}`}
            value={inputRupees}
            onChange={(e) => setInputRupees(e.target.value)}
            disabled={disabled}
          />
        </div>
        <button
          id="bid-submit"
          className="bid-form__submit"
          type="submit"
          disabled={disabled || !inputRupees}
        >
          Place Bid
        </button>
      </div>
      {error && (
        <p className="bid-form__error" role="alert">
          {error}
        </p>
      )}
      <p className="bid-form__hint">
        Minimum bid: ₹{minimumBidRupees.toLocaleString("en-IN")}
        {currentHighestBid !== null && " (₹1 above current highest)"}
      </p>
    </form>
  );
}
