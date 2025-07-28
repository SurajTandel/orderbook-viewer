import { OrderForm, Orderbook, SimulationResult } from "../types/orderbook";

// runSimulations simulates order execution scenarios on the order book
// Params:
//   orderForm: order details (side, type, price, quantity, delays)
//   orderbook: current order book state
// Returns: Promise of array of SimulationResult for each delay scenario
//
// For each delay, simulates order fill logic and calculates fill %, avg price, slippage, and warnings
export async function runSimulations(orderForm: OrderForm, orderbook: Orderbook): Promise<SimulationResult[]> {
  const { side, type, price, quantity, delays } = orderForm;
  const priceNum = parseFloat(price);
  const quantityNum = parseFloat(quantity);

  const simulationPromises = delays.map(
    (delay) =>
      new Promise<SimulationResult>((resolve) => {
        setTimeout(() => {
          const bookSnapshot = {
            bids: [...orderbook.bids],
            asks: [...orderbook.asks],
          };
          const bestAsk = bookSnapshot.asks[0]?.[0];
          const bestBid = bookSnapshot.bids[0]?.[0];
          const simPrice =
            type === "Market"
              ? side === "Buy"
                ? bestAsk
                : bestBid
              : priceNum;
          if (!simPrice) {
            resolve({
              delay,
              metrics: null,
              error: "Market price not available.",
            });
            return;
          }

          let filledQuantity = 0,
            totalCost = 0,
            remainingQuantity = quantityNum;
          if (side === "Buy") {
            for (const [askPrice, askQuantity] of bookSnapshot.asks) {
              if (type === "Market" || simPrice >= askPrice) {
                const fill = Math.min(remainingQuantity, askQuantity);
                filledQuantity += fill;
                totalCost += fill * askPrice;
                remainingQuantity -= fill;
                if (remainingQuantity <= 0) break;
              }
            }
          } else {
            for (const [bidPrice, bidQuantity] of bookSnapshot.bids) {
              if (type === "Market" || simPrice <= bidPrice) {
                const fill = Math.min(remainingQuantity, bidQuantity);
                filledQuantity += fill;
                totalCost += fill * bidPrice;
                remainingQuantity -= fill;
                if (remainingQuantity <= 0) break;
              }
            }
          }
          const fillPercentage =
            quantityNum > 0 ? (filledQuantity / quantityNum) * 100 : 0;
          const avgFillPrice =
            filledQuantity > 0 ? totalCost / filledQuantity : null;
          const marketPrice = side === "Buy" ? bestAsk : bestBid;
          const slippage =
            marketPrice && avgFillPrice
              ? Math.abs(((avgFillPrice - marketPrice) / marketPrice) * 100)
              : null;
          const result: SimulationResult = {
            delay,
            metrics: {
              fillPercentage,
              avgFillPrice,
              slippage,
              marketPrice,
              warning:
                slippage !== null && slippage > 1
                  ? "Warning: High market impact expected!"
                  : null,
            },
            orderDetails: {
              side,
              price: simPrice,
              quantity: quantityNum,
              type,
              delay,
            },
          };
          resolve(result);
        }, parseInt(delay, 10) * 1000);
      })
  );

  return Promise.all(simulationPromises);
}
