# Orderbook Viewer & Simulator

A modern web application for visualizing and simulating cryptocurrency order books in real time. Instantly see live market depth from OKX, Bybit, and Deribit, and experiment with simulated trades to understand your potential market impact before you place an order.

---

## 🚀 What Does This App Do?

- **Live Orderbook Display:** Instantly view the top 15 bid and ask levels from three major crypto exchanges. Switch between venues with a single click.
- **Order Simulation:** Fill out a simple form to simulate market or limit orders. See exactly where your order would appear in the book, or which levels it would consume.
- **Visual Feedback:** The app highlights simulated orders and affected order book levels, and provides a market depth chart and imbalance indicator for deeper insight.
- **Impact Analysis:** Get instant feedback on estimated fill percentage, average fill price, slippage, and warnings for large orders.
- **Compare Scenarios:** Try different timing delays (immediate, 5s, 10s, 30s) and compare the results side by side.
- **Responsive Design:** Works great on both desktop and mobile devices.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v16 or newer): [Download here](https://nodejs.org/)
- **Git**: [Download here](https://git-scm.com/)
- (Optional) **VS Code**: [Download here](https://code.visualstudio.com/)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SurajTandel/orderbook-viewer.git
   cd orderbook-viewer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Open your browser:**
   Go to [http://localhost:3000](http://localhost:3000)

You should now see the Orderbook Viewer running locally!

---

## ✨ Key Features

- **Multi-Exchange Support:** Toggle between OKX, Bybit, and Deribit order books in real time.
- **Order Simulation:** Test both market and limit orders, including timing delays, and see their impact visually.
- **Market Depth Visualization:** Interactive chart shows cumulative buy/sell interest.
- **Order Book Imbalance:** Visual bar shows the ratio of buy vs. sell liquidity.
- **Slippage & Impact Alerts:** Get notified if your simulated order would cause significant price movement.
- **Mobile Friendly:** Fully responsive layout for all devices.

---

## 🧰 Tech Stack

- **Next.js** (React framework)
- **React** (UI library)
- **Tailwind CSS** (utility-first styling)
- **Recharts** (charts and graphs)
- **Lucide React** (icon set)

---

## ⚡ How It Works & Assumptions

- **No API Keys Needed:** The app connects to public WebSocket APIs for all three exchanges. No registration or authentication required.
- **Symbol Handling:** Enter symbols in `BASE-QUOTE` format (e.g., `BTC-USDT`). The app automatically reformats them for each exchange's requirements.
- **Data Consistency:** The app expects the exchanges' WebSocket data formats to match their documentation. If the APIs change, updates may be needed.
- **Deribit Quantity:** For Deribit, the app converts the reported `amount` (in USD) to base currency by dividing by price, so quantities are always accurate.

---

## 📚 API & Rate Limit Info

- **Official API Docs:**
  - [OKX](https://www.okx.com/docs-v5/)
  - [Bybit](https://bybit-exchange.github.io/docs/v5/intro)
  - [Deribit](https://docs.deribit.com/)

- **WebSocket Connections:**
  - The app maintains a single WebSocket connection per venue, subscribing to both order book and ticker channels.
  - When you switch venues, the previous connection is closed and a new one is opened.
  - Heartbeat (ping) messages are sent at the required intervals to keep connections alive.

- **Rate Limiting:**
  - Each exchange has its own connection and message rate limits. This app is designed to stay well within those limits for normal use.
  - Avoid opening many browser tabs/windows to the same venue to prevent hitting connection caps.
  - If you see connection errors, wait a moment before reconnecting.
