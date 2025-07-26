import React from "react";

interface MetricRowProps {
  label: string;
  value: string | number | null;
}

const MetricRow = ({ label, value }: MetricRowProps) => (
  <div className="flex justify-between items-center py-1 px-2 bg-slate-900/60 rounded-md shadow-sm">
    <span className="text-xs text-slate-500 tracking-wide uppercase">
      {label}:
    </span>
    <span className="font-mono text-emerald-400 text-sm font-semibold">
      {value}
    </span>
  </div>
);

export default MetricRow;
