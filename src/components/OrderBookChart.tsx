import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import CustomTooltip from "./CustomTooltip";

interface DepthChartDatum {
  price: number;
  Bids?: number;
  Asks?: number;
}

interface OrderBookChartProps {
  depthChartData: DepthChartDatum[];
}

const OrderBookChart = ({ depthChartData }: OrderBookChartProps) => (
  <ResponsiveContainer width="100%" height="85%">
    <AreaChart
      data={depthChartData}
      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
    >
      <defs>
        <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorAsks" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis
        dataKey="price"
        stroke="#9CA3AF"
        tick={{ fontSize: 10 }}
        domain={["dataMin", "dataMax"]}
        type="number"
      />
      <YAxis
        stroke="#9CA3AF"
        tick={{ fontSize: 10 }}
        orientation="right"
        allowDataOverflow
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Area
        type="step"
        dataKey="Bids"
        stroke="#10B981"
        fillOpacity={1}
        fill="url(#colorBids)"
        connectNulls
      />
      <Area
        type="step"
        dataKey="Asks"
        stroke="#EF4444"
        fillOpacity={1}
        fill="url(#colorAsks)"
        connectNulls
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default OrderBookChart;
