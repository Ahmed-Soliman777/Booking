import React, { useState } from "react";
import { differenceInDays, format, isBefore, isSameDay, subDays } from "date-fns";
import DateSelector from "./DateSelector";
import GuestSelector from "./GuestSelector";
import axios from "axios";

/*
 BookingHome
 - Purpose: Small booking widget that lets users pick dates and guests,
   shows price/night summary, and starts a Stripe checkout flow.
 - This file contains local UI state only (no props are accepted).
 - Key responsibilities:
   1. Manage date range selection and guest counts.
   2. Compute derived values (nights, free cancellation date).
   3. Trigger a backend checkout endpoint to start Stripe Checkout.
*/

function BookingHome() {
  // Controls whether the Guests dropdown is visible
  const [openGuests, setOpenGuests] = useState(false);
  // Controls whether the DateSelector popover is visible
  const [open, setOpen] = useState(false);

  // Selected date range. Shape: { from: Date | undefined, to: Date | undefined }
  const [date, setDate] = useState({ from: undefined, to: undefined });
  // Guest counts shown/managed in the GuestSelector component
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });
  // Loading state while calling the checkout endpoint
  const [loading, setLoading] = useState(false);

  // Derived: number of nights between check-in and check-out
  const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
  // Derived: last date for free cancellation (example: 5 days before check-in)
  const freeCancelDate = date?.from ? subDays(date.from, 5) : undefined;

  // Handle date range selection logic coming from <DateSelector />
  // - Normalizes selections so `to` is undefined when a single day is selected
  // - Prevents inverted ranges (where `to` < `from`)
  const handleSelect = (range) => {
    if (!range?.from) setDate({ from: undefined, to: undefined });
    else if (range?.from && !range?.to) setDate({ from: range.from, to: undefined });
    else if (range?.from && range?.to) {
      if (isSameDay(range.from, range.to)) setDate({ from: range.from, to: undefined });
      else if (isBefore(range.to, range.from)) setDate({ from: range.from, to: undefined });
      else setDate(range);
    }
  };

  // Starts the checkout flow by calling the backend endpoint.
  // The backend is expected to create a Stripe Checkout session and
  // return a `checkoutUrl` to redirect the browser to.
  const handlePayment = async () => {
    // Guard: ensure a complete date range is selected
    if (!date.from || !date.to) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/checkout",
        {
          listing: "68dee46e86c3135c3b9fbd80",
          checkInDate: date.from,
          checkOutDate: date.to,
          guestsCount: guests.adults + guests.children,
          totalPrice: 1500, // calculate dynamically if needed
        },
        { withCredentials: true } // include cookies if backend uses them for auth
      );

      const { checkoutUrl } = response.data;

      // Redirect the user to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      // Surface a friendly error and log for debugging
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 shadow-lg rounded-lg w-100">
      {!date?.from || !date?.to ? (
        <h3 className="font-semibold text-lg">Add dates for prices</h3>
      ) : (
        <h3 className="font-semibold text-lg">
          1,500 ج.م for {nights} night{nights > 1 ? "s" : ""}
        </h3>
      )}

      <div className="border rounded-lg mt-2">
        <div className="border-b">
          {/* Date selector: handles picking check-in and check-out */}
          <DateSelector
            open={open}
            onOpenChange={setOpen}
            date={date}
            handleSelect={handleSelect}
            setDate={setDate}
          />
        </div>

        {/* Guest selector: choose adults, children, infants, and pets */}
        <GuestSelector
          openGuests={openGuests}
          setOpenGuests={setOpenGuests}
          guests={guests}
          setGuests={setGuests}
        />
      </div>

      {date?.from && (
        <p className="text-sm text-gray-700 mt-4 text-center">
          Free cancellation before{" "}
          <span className="font-semibold">{format(freeCancelDate, "MMM dd, yyyy")}</span>
        </p>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !date?.from || !date?.to}
        className="w-80 rounded-full shadow text-center cursor-pointer text-lg flex justify-center mx-auto my-4 py-3 bg-linear-to-r from-rose-600 to-pink-600 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Processing..." : date?.from && date?.to ? "Reserve" : "Check availability"}
      </button>

      {date?.from && date?.to && (
        <p className="text-sm text-gray-600 text-center">You won't be charged yet</p>
      )}
    </div>
  );
}

export default BookingHome;
