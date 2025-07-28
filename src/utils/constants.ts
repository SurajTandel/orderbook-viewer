// VenueKey: supported exchange keys
// Venue: interface for exchange info (name, websocket URL)
// VENUES: mapping of supported venues and their websocket endpoints
// MAX_LEVELS: max order book levels to display
// TIMING_OPTIONS: available timing scenarios for simulation
// TIMING_COLORS: color classes for timing scenarios
export type VenueKey = "okx" | "bybit" | "deribit";
export interface Venue {
  name: string;
  ws: string;
}

export const VENUES: Record<VenueKey, Venue> = {
  okx: { name: "OKX", ws: "wss://ws.okx.com:8443/ws/v5/public" },
  bybit: { name: "Bybit", ws: "wss://stream.bybit.com/v5/public/spot" },
  deribit: { name: "Deribit", ws: "wss://www.deribit.com/ws/api/v2" },
};

export const MAX_LEVELS = 15;

export const TIMING_OPTIONS: Record<string, string> = {
  "0": "Immediate",
  "5": "5s Delay",
  "10": "10s Delay",
  "30": "30s Delay",
};

export const TIMING_COLORS: Record<string, string> = {
  "0": "ring-sky-400",
  "5": "ring-amber-400",
  "10": "ring-fuchsia-400",
  "30": "ring-teal-400",
}; 