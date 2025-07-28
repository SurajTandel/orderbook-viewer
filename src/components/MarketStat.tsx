import React from "react";

// MarketStat component displays a market statistic with an icon, value, and label
// Props:
//   icon: React component for the icon
//   label: string label for the statistic
//   value: value to display (string or number)
interface MarketStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

const MarketStat = ({ icon: Icon, label, value }: MarketStatProps) => (
  <div className="flex items-center gap-3 px-2 py-1 rounded-lg bg-slate-950/60 shadow-inner shadow-slate-800">
    <Icon className="text-cyan-400 drop-shadow-sm" size={18} />
    <div className="flex items-center">
      <span className="text-[18px] font-semibold text-emerald-300 font-mono leading-none">
        {value}
      </span>
      <span className="text-[10px] text-slate-500 ml-2 tracking-wider uppercase">
        {label}
      </span>
    </div>
  </div>
);

export default MarketStat;
