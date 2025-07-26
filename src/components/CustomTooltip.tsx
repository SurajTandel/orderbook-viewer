import React from "react";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const bidPayload = payload.find((p) => p.dataKey === "Bids");
    const askPayload = payload.find((p) => p.dataKey === "Asks");
    return (
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 rounded-xl border border-slate-600 text-[13px] shadow-md shadow-black/30 backdrop-blur-lg space-y-1.5">
        <p className="label font-semibold text-slate-200 tracking-tight">{`Price: ${label}`}</p>
        {bidPayload && bidPayload.value > 0 && (
          <p className="font-medium" style={{ color: bidPayload.color }}>
            {`Bid Depth: ${bidPayload.value.toFixed(2)}`}
          </p>
        )}
        {askPayload && askPayload.value > 0 && (
          <p className="font-medium" style={{ color: askPayload.color }}>
            {`Ask Depth: ${askPayload.value.toFixed(2)}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
