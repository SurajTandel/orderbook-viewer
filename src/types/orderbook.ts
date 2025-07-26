export interface Orderbook {
  bids: [number, number][];
  asks: [number, number][];
}

export interface MarketStats {
  last?: string;
  vol24h?: string;
}

export interface OrderForm {
  side: "Buy" | "Sell";
  type: "Limit" | "Market";
  price: string;
  quantity: string;
  delays: string[];
}

export interface SimulationResult {
  delay: string;
  metrics: {
    fillPercentage: number | null;
    avgFillPrice: number | null;
    slippage: number | null;
    marketPrice: number | null;
    warning: string | null;
  } | null;
  orderDetails?: ActiveSimulation | null;
  error?: string;
}

export interface ActiveSimulation {
  side: "Buy" | "Sell";
  price: number;
  quantity: number;
  type: "Limit" | "Market";
  delay: string;
} 