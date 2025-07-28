"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ChangeEvent,
} from "react";
import {
  ChevronsUpDown,
  Info,
  BarChart2,
  TrendingUp,
  Activity,
  X,
} from "lucide-react";

import OrderBookRow from "../components/OrderBookRow";
import MarketStat from "../components/MarketStat";
import MetricRow from "../components/MetricRow";
import OrderSimulationForm from "../components/OrderSimulationForm";
import OrderBookChart from "../components/OrderBookChart";

import {
  Orderbook,
  MarketStats,
  OrderForm,
  SimulationResult,
  ActiveSimulation,
} from "../types/orderbook";

import {
  VENUES,
  VenueKey,
  MAX_LEVELS,
  TIMING_OPTIONS,
} from "../utils/constants";
import { runSimulations } from "../utils/simulation";

// Main page for the Orderbook Viewer app
// Handles real-time order book data, market stats, and order simulation logic
//
// Uses WebSocket to connect to selected exchange venue and updates state accordingly
// Provides UI for order simulation and visualization
//
// State variables:
//   activeVenue: currently selected exchange
//   symbol: trading pair symbol
//   orderbook: current order book data
//   marketStats: latest market statistics
//   connectionStatus: WebSocket connection status
//   lastMessage: timestamp of last received message
//   orderForm: state for the order simulation form
//   comparisonResults: results of order simulations
//   activeSimulation: currently active simulation details
//   isSimulating: whether a simulation is running
//
// Refs:
//   orderbookRef: keeps latest orderbook for async updates
//   okxUpdateTimeout, okxLatestOrderbook: throttle updates for OKX

export default function App() {
  const [activeVenue, setActiveVenue] = useState<VenueKey>("bybit");
  const [symbol, setSymbol] = useState<string>("BTC-USDT");
  const [orderbook, setOrderbook] = useState<Orderbook>({ bids: [], asks: [] });
  const [marketStats, setMarketStats] = useState<MarketStats>({});
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");
  const [lastMessage, setLastMessage] = useState<Date | null>(null);

  const [orderForm, setOrderForm] = useState<OrderForm>({
    side: "Buy",
    type: "Limit",
    price: "",
    quantity: "",
    delays: ["0"],
  });
  const [comparisonResults, setComparisonResults] = useState<
    SimulationResult[]
  >([]);
  const [activeSimulation, setActiveSimulation] =
    useState<ActiveSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const orderbookRef = useRef<Orderbook>(orderbook);
  // Throttle for OKX
  const okxUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const okxLatestOrderbook = useRef<Orderbook>({ bids: [], asks: [] });

  useEffect(() => {
    orderbookRef.current = orderbook;
  }, [orderbook]);

  useEffect(() => {
    // Reset state and set connection status when venue or symbol changes
    setOrderbook({ bids: [], asks: [] });
    setMarketStats({});
    setActiveSimulation(null);
    setComparisonResults([]);
    setConnectionStatus("Connecting...");

    // Create WebSocket connection to selected venue
    const wsUrl = VENUES[activeVenue].ws;
    const ws = new WebSocket(wsUrl);
    let heartbeatInterval: ReturnType<typeof setInterval>;

    // Normalize symbol format for each venue
    const getNormalizedSymbol = (venue: VenueKey, sym: string): string => {
      if (venue === "deribit") {
        return `${sym.split("-")[0]}-PERPETUAL`;
      }
      if (venue === "bybit") {
        return sym.replace("-", "");
      }
      if ((venue === "okx" || venue === "bybit") && sym.endsWith("-USD")) {
        return sym.replace("-USD", "USDT");
      }
      return sym;
    };

    ws.onopen = () => {
      setConnectionStatus("Connected");
      const normalizedSymbol = getNormalizedSymbol(activeVenue, symbol);
      let bookSubMsg: object, tickerSubMsg: object;

      try {
        switch (activeVenue) {
          case "okx":
            // Subscribe to order book and ticker channels for OKX
            bookSubMsg = {
              op: "subscribe",
              args: [{ channel: "books", instId: normalizedSymbol }],
            };
            tickerSubMsg = {
              op: "subscribe",
              args: [{ channel: "tickers", instId: normalizedSymbol }],
            };
            ws.send(JSON.stringify(bookSubMsg));
            ws.send(JSON.stringify(tickerSubMsg));
            // Send heartbeat ping every 25s
            heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) ws.send("ping");
            }, 25000);
            break;
          case "bybit":
            // Subscribe to order book and ticker channels for Bybit
            bookSubMsg = {
              op: "subscribe",
              args: [`orderbook.50.${normalizedSymbol}`],
            };
            tickerSubMsg = {
              op: "subscribe",
              args: [`tickers.${normalizedSymbol}`],
            };
            ws.send(JSON.stringify(bookSubMsg));
            ws.send(JSON.stringify(tickerSubMsg));
            // Send heartbeat ping every 18s
            heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ op: "ping" }));
            }, 18000);
            break;
          case "deribit":
            // Subscribe to order book and ticker channels for Deribit
            bookSubMsg = {
              jsonrpc: "2.0",
              method: "public/subscribe",
              params: { channels: [`book.${normalizedSymbol}.100ms`] },
            };
            tickerSubMsg = {
              jsonrpc: "2.0",
              method: "public/subscribe",
              params: { channels: [`ticker.${normalizedSymbol}.100ms`] },
            };
            ws.send(JSON.stringify(bookSubMsg));
            ws.send(JSON.stringify(tickerSubMsg));
            // Send heartbeat ping every 5s
            heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN)
                ws.send(
                  JSON.stringify({
                    jsonrpc: "2.0",
                    method: "public/test",
                    params: {},
                  })
                );
            }, 5000);
            break;
        }
      } catch (e) {
        console.error("Failed to send subscription message:", e);
        setConnectionStatus("Error");
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data === "pong") return; // Ignore pong replies
      setLastMessage(new Date());
      const data = JSON.parse(event.data);
      if (data.event === "error") {
        console.error("API Error:", data.msg);
        setConnectionStatus("Error");
        return;
      }
      try {
        switch (activeVenue) {
          case "okx":
            // Handle OKX order book and ticker updates
            if (data.arg?.channel === "books" && data.data) {
              const ob = data.data[0];
              // Convert bids/asks from string to number
              const newBids: [number, number][] = ob.bids.map(
                ([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]
              );
              const newAsks: [number, number][] = ob.asks.map(
                ([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]
              );
              okxLatestOrderbook.current = { bids: newBids, asks: newAsks };
              // Throttle OKX updates to every 250ms
              if (!okxUpdateTimeout.current) {
                okxUpdateTimeout.current = setTimeout(() => {
                  setOrderbook(okxLatestOrderbook.current);
                  okxUpdateTimeout.current = null;
                }, 250);
              }
            } else if (data.arg?.channel === "tickers" && data.data) {
              // Update market stats for OKX
              const stats = data.data[0];
              setMarketStats({ last: stats.last, vol24h: stats.volCcy24h });
            }
            break;
          case "bybit":
            // Handle Bybit order book and ticker updates
            if (data.topic?.startsWith("orderbook")) {
              if (data.type === "snapshot") {
                // Initial snapshot of order book
                const ob = data.data;
                const newBids: [number, number][] = ob.b.map(
                  ([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]
                );
                const newAsks: [number, number][] = ob.a.map(
                  ([p, q]: [string, string]) => [parseFloat(p), parseFloat(q)]
                );
                setOrderbook({ bids: newBids, asks: newAsks });
              } else if (data.type === "delta") {
                // Apply incremental updates (deltas) to order book
                setOrderbook((currentBook) => {
                  if (
                    currentBook.bids.length === 0 &&
                    currentBook.asks.length === 0
                  )
                    return currentBook;
                  // Update bids or asks with new/changed/removed levels
                  const updateSide = (
                    currentSide: [number, number][],
                    deltaSide: [string, string][] | undefined
                  ) => {
                    const sideMap = new Map<number, number>(currentSide);
                    if (deltaSide) {
                      for (const [priceStr, quantityStr] of deltaSide) {
                        const price = parseFloat(priceStr);
                        if (parseFloat(quantityStr) === 0)
                          sideMap.delete(price); // Remove level if quantity is 0
                        else sideMap.set(price, parseFloat(quantityStr)); // Update/add level
                      }
                    }
                    return Array.from(sideMap.entries());
                  };
                  const updatedBids = updateSide(currentBook.bids, data.data.b);
                  const updatedAsks = updateSide(currentBook.asks, data.data.a);
                  updatedBids.sort((a, b) => b[0] - a[0]);
                  updatedAsks.sort((a, b) => a[0] - b[0]);
                  return { bids: updatedBids, asks: updatedAsks };
                });
              }
            } else if (data.topic?.startsWith("tickers")) {
              // Update market stats for Bybit
              const stats = data.data;
              setMarketStats({
                last: stats.lastPrice,
                vol24h: stats.volume24h,
              });
            }
            break;
          case "deribit":
            // Handle Deribit order book and ticker updates
            if (data.params?.channel.startsWith("book")) {
              const ob = data.params.data;
              if (ob.type === "snapshot") {
                // Initial snapshot of order book
                const newBids: [number, number][] = ob.bids.map(
                  (d: { price: number; amount: number }) => [
                    d.price,
                    d.amount / d.price,
                  ]
                );
                const newAsks: [number, number][] = ob.asks.map(
                  (d: { price: number; amount: number }) => [
                    d.price,
                    d.amount / d.price,
                  ]
                );
                setOrderbook({ bids: newBids, asks: newAsks });
              } else if (ob.type === "change") {
                // Apply incremental updates (deltas) to order book
                setOrderbook((currentBook) => {
                  if (
                    currentBook.bids.length === 0 &&
                    currentBook.asks.length === 0
                  )
                    return currentBook;
                  // Update bids or asks with new/changed/removed levels
                  const updateSide = (
                    currentSide: [number, number][],
                    deltaSide: [string, number, number][] | undefined
                  ) => {
                    const sideMap = new Map<number, number>(currentSide);
                    if (deltaSide) {
                      for (const [type, price, amount] of deltaSide) {
                        if (type === "new" || type === "change")
                          sideMap.set(price, amount / price); // Add/update level
                        else if (type === "delete") sideMap.delete(price); // Remove level
                      }
                    }
                    return Array.from(sideMap.entries());
                  };
                  const updatedBids = updateSide(currentBook.bids, ob.bids);
                  const updatedAsks = updateSide(currentBook.asks, ob.asks);
                  updatedBids.sort((a, b) => b[0] - a[0]);
                  updatedAsks.sort((a, b) => a[0] - b[0]);
                  return { bids: updatedBids, asks: updatedAsks };
                });
              }
            } else if (data.params?.channel.startsWith("ticker")) {
              // Update market stats for Deribit
              const stats = data.params.data;
              setMarketStats({
                last: stats.last_price,
                vol24h: stats.volume_usd,
              });
            }
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error, data);
      }
    };
    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setConnectionStatus("Error");
    };
    ws.onclose = () => {
      setConnectionStatus("Disconnected");
      clearInterval(heartbeatInterval);
      // Clean up OKX throttling
      if (okxUpdateTimeout.current) clearTimeout(okxUpdateTimeout.current);
    };
    return () => {
      if (ws) ws.close();
      clearInterval(heartbeatInterval);
      // Clean up OKX throttling
      if (okxUpdateTimeout.current) clearTimeout(okxUpdateTimeout.current);
    };
  }, [activeVenue, symbol]);

  // Memoize processed bids/asks and max quantity for rendering
  const { bids, asks, maxTotal } = useMemo(() => {
    let processedBids = orderbook.bids.map(([p, q]) => ({
      price: p || 0,
      quantity: q || 0,
      total: (p || 0) * (q || 0),
      isSimulated: false,
      isAffected: false,
      delay: "",
    }));
    let processedAsks = orderbook.asks.map(([p, q]) => ({
      price: p || 0,
      quantity: q || 0,
      total: (p || 0) * (q || 0),
      isSimulated: false,
      isAffected: false,
      delay: "",
    }));
    if (activeSimulation) {
      // If a simulation is active, inject simulated order or highlight affected rows
      const { side, price, quantity, type, delay } = activeSimulation;
      if (type === "Limit") {
        // Insert simulated limit order into bids or asks
        const newOrder = {
          price,
          quantity,
          total: price * quantity,
          isSimulated: true,
          isAffected: false,
          delay,
        };
        if (side === "Buy") {
          let inserted = false;
          const tempBids: typeof processedBids = [];
          for (const bid of processedBids) {
            if (price >= bid.price && !inserted) {
              tempBids.push(newOrder);
              inserted = true;
            }
            tempBids.push(bid);
          }
          if (!inserted) tempBids.push(newOrder);
          processedBids = tempBids;
        } else {
          let inserted = false;
          const tempAsks: typeof processedAsks = [];
          for (const ask of processedAsks) {
            if (price <= ask.price && !inserted) {
              tempAsks.push(newOrder);
              inserted = true;
            }
            tempAsks.push(ask);
          }
          if (!inserted) tempAsks.push(newOrder);
          processedAsks = tempAsks;
        }
      } else {
        // For market orders, highlight affected rows
        let remainingQuantity = quantity;
        if (side === "Buy") {
          processedAsks = processedAsks.map((ask) => {
            if (remainingQuantity > 0) {
              const consumed = Math.min(remainingQuantity, ask.quantity);
              remainingQuantity -= consumed;
              return { ...ask, isAffected: true, delay };
            }
            return ask;
          });
        } else {
          processedBids = processedBids.map((bid) => {
            if (remainingQuantity > 0) {
              const consumed = Math.min(remainingQuantity, bid.quantity);
              remainingQuantity -= consumed;
              return { ...bid, isAffected: true, delay };
            }
            return bid;
          });
        }
      }
    }
    // Find max quantity for bar width scaling
    const maxQty = Math.max(
      ...processedBids.slice(0, MAX_LEVELS).map((b) => b.quantity),
      ...processedAsks.slice(0, MAX_LEVELS).map((a) => a.quantity),
      0
    );
    return {
      bids: processedBids.slice(0, MAX_LEVELS),
      asks: processedAsks.slice(0, MAX_LEVELS),
      maxTotal: maxQty,
    };
  }, [orderbook, activeSimulation]);

  // Prepare data for the depth chart (cumulative quantities)
  const depthChartData = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return [];
    const bidData = bids
      .slice()
      .reverse()
      .map(
        (() => {
          let c = 0;
          return (b: (typeof bids)[0]) => {
            c += b.quantity;
            return { price: b.price, Bids: c };
          };
        })()
      );
    const askData = asks.map(
      (() => {
        let c = 0;
        return (a: (typeof asks)[0]) => {
          c += a.quantity;
          return { price: a.price, Asks: c };
        };
      })()
    );
    // Ensure chart lines connect at the spread
    if (bidData.length > 0 && askData.length > 0) {
      const highestBidPoint = bidData[bidData.length - 1];
      const lowestAskPoint = askData[0];
      bidData.push({ ...highestBidPoint, price: lowestAskPoint.price });
    }
    return [...bidData, ...askData];
  }, [bids, asks]);

  // Calculate order book imbalance (bids vs asks)
  const orderBookImbalance = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return 50;
    const totalBids = bids.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAsks = asks.reduce((acc, curr) => acc + curr.quantity, 0);
    if (totalBids + totalAsks === 0) return 50;
    return (totalBids / (totalBids + totalAsks)) * 100;
  }, [bids, asks]);

  // Handle simulation button click
  const handleSimulate = useCallback(async () => {
    const { type, price, quantity, delays } = orderForm;
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    if (
      !quantityNum ||
      quantityNum <= 0 ||
      (type === "Limit" && (!priceNum || priceNum <= 0))
    ) {
      alert("Please enter a valid quantity, and a price for limit orders.");
      return;
    }
    if (delays.length === 0) {
      alert("Please select at least one timing scenario.");
      return;
    }

    setIsSimulating(true);
    setComparisonResults([]);
    setActiveSimulation(null);

    // Run simulation and update results
    const results = await runSimulations(orderForm, orderbookRef.current);
    setComparisonResults(results);
    if (results.length > 0 && results[0].orderDetails) {
      setActiveSimulation(results[0].orderDetails!);
    }
    setIsSimulating(false);
  }, [orderForm]);

  // Handle form input changes
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
  // Handle timing scenario checkbox changes
  const handleDelayChange = (delay: string) => {
    setOrderForm((prev) => {
      const newDelays = prev.delays.includes(delay)
        ? prev.delays.filter((d) => d !== delay)
        : [...prev.delays, delay];
      return { ...prev, delays: newDelays };
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#1e1e28] to-[#0f172a] text-[#cbd5e1] min-h-screen font-mono tracking-tight">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <style>
          {`
        .animate-custom-pulse {
          animation: custom-pulse 1.6s infinite;
        }
        @keyframes custom-pulse {
          0%, 100% { background-color: rgba(94, 234, 212, 0.3); }
          50% { background-color: rgba(94, 234, 212, 0.5); }
        }
      `}
        </style>
        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#f1f5f9] mb-2">
            Orderbook Viewer
          </h1>
          <div className="flex items-center gap-6 text-[#94a3b8] text-sm">
            <MarketStat
              icon={TrendingUp}
              label="Last Price"
              value={
                marketStats.last
                  ? parseFloat(marketStats.last).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "-"
              }
            />
            <MarketStat
              icon={Activity}
              label="24h Volume"
              value={
                marketStats.vol24h
                  ? `${parseFloat(marketStats.vol24h).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`
                  : "-"
              }
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl px-5 py-6 shadow-inner">
              <h2 className="text-2xl font-bold text-white mb-5">Controls</h2>

              <label className="block text-xs font-semibold text-[#94a3b8] mb-2">
                Venue
              </label>
              <div className="flex rounded-xl bg-[#0f172a] p-1 space-x-1">
                {Object.keys(VENUES).map((key) => (
                  <button
                    key={key}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      activeVenue === key
                        ? "bg-teal-500 text-white shadow-lg"
                        : "hover:bg-[#1e293b] text-[#cbd5e1]"
                    }`}
                    onClick={() => setActiveVenue(key as VenueKey)}
                  >
                    {VENUES[key as VenueKey].name}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label
                  htmlFor="symbol"
                  className="block text-xs font-semibold text-[#94a3b8] mb-1"
                >
                  Symbol
                </label>
                <input
                  id="symbol"
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg focus:ring-2 focus:ring-teal-400 outline-none"
                />
              </div>

              <div className="flex justify-between text-xs font-semibold mt-4">
                <span className="text-[#94a3b8]">Status:</span>
                <span
                  className={`flex items-center ${
                    connectionStatus === "Connected"
                      ? "text-emerald-400"
                      : connectionStatus === "Connecting..."
                      ? "text-yellow-400"
                      : "text-rose-400"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      connectionStatus === "Connected"
                        ? "bg-emerald-500"
                        : connectionStatus === "Connecting..."
                        ? "bg-yellow-500 animate-custom-pulse"
                        : "bg-rose-500"
                    }`}
                  />
                  {connectionStatus}
                </span>
              </div>

              {lastMessage && (
                <p className="text-[11px] text-[#64748b] mt-2">
                  Last update: {lastMessage.toLocaleTimeString()}
                </p>
              )}
            </div>

            <OrderSimulationForm
              orderForm={orderForm}
              onChange={handleFormChange}
              onDelayChange={handleDelayChange}
              onSimulate={handleSimulate}
              isSimulating={isSimulating}
            />
          </div>

          {/* Middle Panel */}
          <div className="lg:col-span-4">
            <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 shadow-lg h-full">
              <div className="flex justify-between items-center border-b border-[#334155] pb-4 mb-4">
                <h2 className="text-xl font-bold text-white">Order Book</h2>
                <ChevronsUpDown className="text-[#64748b]" />
              </div>

              <div className="grid grid-cols-3 text-[11px] text-[#94a3b8] mb-2 px-2 font-semibold uppercase">
                <span>Price ({symbol.split("-")[1]})</span>
                <span className="text-right">
                  Quantity ({symbol.split("-")[0]})
                </span>
                <span className="text-right">Total</span>
              </div>

              <div className="h-[calc(100%-50px)] overflow-y-auto pr-1">
                <div className="asks space-y-1">
                  {asks
                    .slice()
                    .reverse()
                    .map((ask, i) => (
                      <OrderBookRow
                        key={`ask-${ask.price}-${i}`}
                        {...ask}
                        type="ask"
                        maxTotal={maxTotal}
                      />
                    ))}
                </div>

                <div className="py-3 my-2 text-center border-y border-[#334155]">
                  <span className="text-lg font-mono text-white">
                    {asks[0] && bids[0]
                      ? (asks[0].price - bids[0].price).toPrecision(2)
                      : "-"}
                  </span>
                </div>

                <div className="bids space-y-1">
                  {bids.map((bid, i) => (
                    <OrderBookRow
                      key={`bid-${bid.price}-${i}`}
                      {...bid}
                      type="bid"
                      maxTotal={maxTotal}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 shadow-lg h-[400px]">
              <div className="flex justify-between items-center border-b border-[#334155] pb-4 mb-4">
                <h2 className="text-xl font-bold text-white">Market Depth</h2>
                <BarChart2 className="text-[#64748b]" />
              </div>
              {/* Depth chart visualization */}
              <OrderBookChart depthChartData={depthChartData} />
            </div>

            <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-3 border-b border-[#334155] pb-3">
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Info size={18} className="text-teal-400 mr-2" />
                  Simulation Impact
                </h3>
                {comparisonResults.length > 0 && (
                  <button
                    onClick={() => {
                      setComparisonResults([]);
                      setActiveSimulation(null);
                    }}
                    className="text-xs text-[#94a3b8] hover:text-white flex items-center"
                  >
                    <X size={14} className="mr-1" />
                    Clear
                  </button>
                )}
              </div>

              {isSimulating ? (
                <p className="text-sm text-[#64748b]">Running simulations...</p>
              ) : comparisonResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonResults.map((result) => (
                    <div
                      key={result.delay}
                      onClick={() =>
                        setActiveSimulation(result.orderDetails || null)
                      }
                      className={`bg-[#0f172a] p-4 rounded-xl cursor-pointer transition-all border ${
                        activeSimulation?.delay === result.delay
                          ? "border-teal-400"
                          : "border-transparent hover:border-[#334155]"
                      }`}
                    >
                      <h4 className="font-bold text-teal-300 mb-2">
                        {TIMING_OPTIONS[result.delay]}
                      </h4>
                      {result.error ? (
                        <p className="text-sm text-rose-400">{result.error}</p>
                      ) : result.metrics ? (
                        <div className="space-y-2 text-sm">
                          <MetricRow
                            label="Est. Fill %"
                            value={`${result.metrics.fillPercentage?.toFixed(2) || "N/A"}%`}
                          />
                          <MetricRow
                            label="Avg. Fill Price"
                            value={
                              result.metrics.avgFillPrice?.toFixed(2) || "N/A"
                            }
                          />
                          <MetricRow
                            label="Market Price"
                            value={
                              result.metrics.marketPrice?.toFixed(2) || "N/A"
                            }
                          />
                          <MetricRow
                            label="Slippage"
                            value={`${result.metrics.slippage?.toFixed(4) || "N/A"}%`}
                          />
                          {result.metrics.warning && (
                            <p className="text-yellow-400 text-xs pt-2 font-semibold">
                              {result.metrics.warning}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[#64748b]">
                          No metrics available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">
                  Run a simulation to see impact metrics.
                </p>
              )}
            </div>

            <div className="bg-[#1e293b]/70 border border-[#334155] rounded-2xl p-5 shadow-lg">
              <h3 className="text-lg font-bold mb-4 border-b border-[#334155] pb-2 text-white">
                Book Imbalance
              </h3>
              <div className="w-full bg-[#334155] rounded-full h-2.5 mt-4 flex overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5"
                  style={{ width: `${orderBookImbalance}%` }}
                ></div>
                <div
                  className="bg-rose-500 h-2.5"
                  style={{ width: `${100 - orderBookImbalance}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2 font-mono">
                <span className="text-emerald-400 font-bold">
                  Bids {orderBookImbalance.toFixed(1)}%
                </span>
                <span className="text-rose-400 font-bold">
                  {(100 - orderBookImbalance).toFixed(1)}% Asks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
