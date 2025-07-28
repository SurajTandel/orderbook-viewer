import React from "react";
// TODO: Import TIMING_COLORS from utils/constants once created

// OrderBookRow component displays a single row in the order book (bid or ask)
// Props:
//   price: price level
//   quantity: quantity at this price
//   total: cumulative total at this price
//   type: 'bid' or 'ask'
//   isSimulated: whether this row is part of a simulation
//   isAffected: whether this row is affected by a simulation
//   maxTotal: maximum total for bar width calculation
//   delay: delay category for simulation highlighting
//
// TIMING_COLORS: maps delay values to ring color classes for simulated rows
interface OrderBookRowProps {
  price: number;
  quantity: number;
  total: number;
  type: "bid" | "ask";
  isSimulated: boolean;
  isAffected: boolean;
  maxTotal: number;
  delay: string;
}

const TIMING_COLORS: Record<string, string> = {
  "0": "ring-sky-400",
  "5": "ring-amber-400",
  "10": "ring-fuchsia-400",
  "30": "ring-teal-400",
};

const OrderBookRow = ({
  price,
  quantity,
  total,
  type,
  isSimulated,
  isAffected,
  maxTotal,
  delay,
}: OrderBookRowProps) => {
  const colorClass = type === "bid" ? "text-green-400" : "text-red-400";
  const barColorClass = type === "bid" ? "bg-green-500/10" : "bg-red-500/10";
  const barWidth = maxTotal > 0 ? (quantity / maxTotal) * 100 : 0;
  let rowClasses =
    "relative flex justify-between items-center text-sm p-1.5 rounded-md my-0.5";
  if (isSimulated)
    rowClasses += ` ring-2 ${
      TIMING_COLORS[delay] || "ring-sky-400"
    } ring-inset`;
  if (isAffected) rowClasses += " animate-pulse-bg";
  return (
    <div
      className={`relative flex justify-between items-center px-3 py-1.5 overflow-hidden ${rowClasses}`}
    >
      <div
        className={`absolute top-0 bottom-0 ${barColorClass} opacity-75`}
        style={{
          width: `${barWidth}%`,
          right: type === "bid" ? "auto" : 0,
          left: type === "bid" ? 0 : "auto",
        }}
      ></div>

      <span
        className={`relative z-10 font-mono font-semibold text-[13px] tracking-tight ${colorClass} min-w-[70px] text-start`}
      >
        {price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>

      <span className="relative z-10 font-mono text-teal-100 text-[13px] tracking-tight min-w-[70px] text-center">
        {(quantity || 0).toFixed(4)}
      </span>

      <span className="relative z-10 font-mono text-slate-400 text-[13px] tracking-tight min-w-[70px] text-end">
        {(total || 0).toFixed(2)}
      </span>
    </div>
  );
};

export default OrderBookRow;
