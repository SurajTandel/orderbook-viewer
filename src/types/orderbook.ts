// Orderbook: represents the current state of the order book (bids and asks)
// MarketStats: optional market statistics (last price, 24h volume)
// OrderForm: structure for order simulation form state
// SimulationResult: result of a simulation for a given delay
// ActiveSimulation: details of an active simulation order
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