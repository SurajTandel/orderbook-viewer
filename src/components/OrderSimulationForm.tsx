import React, { ChangeEvent } from "react";
import { OrderForm } from "../types/orderbook";
import { TIMING_OPTIONS } from "../utils/constants";

// OrderSimulationForm component provides a form to simulate order placement scenarios
// Props:
//   orderForm: current form state (side, type, price, quantity, delays)
//   onChange: handler for input/select changes
//   onDelayChange: handler for timing scenario checkbox changes
//   onSimulate: handler to trigger simulation
//   isSimulating: whether a simulation is in progress
//
// Renders form fields for side, type, price, quantity, and timing scenarios
interface OrderSimulationFormProps {
  orderForm: OrderForm;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDelayChange: (delay: string) => void;
  onSimulate: () => void;
  isSimulating: boolean;
}

const OrderSimulationForm = ({
  orderForm,
  onChange,
  onDelayChange,
  onSimulate,
  isSimulating,
}: OrderSimulationFormProps) => (
  <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-700/40 backdrop-blur-sm">
    <h2 className="text-lg font-bold mb-5 text-white flex items-center tracking-tight uppercase">
      Order Simulation
    </h2>

    <div className="grid grid-cols-2 gap-5 mb-5">
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
          Side
        </label>
        <select
          name="side"
          value={orderForm.side}
          onChange={onChange}
          className="w-full bg-slate-950/80 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        >
          <option>Buy</option>
          <option>Sell</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
          Type
        </label>
        <select
          name="type"
          value={orderForm.type}
          onChange={onChange}
          className="w-full bg-slate-950/80 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        >
          <option>Limit</option>
          <option>Market</option>
        </select>
      </div>
    </div>

    <div className="mb-5">
      <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
        Price
      </label>
      <input
        type="number"
        name="price"
        value={orderForm.price}
        onChange={onChange}
        disabled={orderForm.type === "Market"}
        className="w-full bg-slate-950/80 border border-slate-700 rounded-md px-3 py-2 text-sm text-white disabled:bg-slate-800 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        placeholder={
          orderForm.type === "Market" ? "Market Price" : "Enter price"
        }
      />
    </div>

    <div className="mb-5">
      <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wide">
        Quantity
      </label>
      <input
        type="number"
        name="quantity"
        value={orderForm.quantity}
        onChange={onChange}
        className="w-full bg-slate-950/80 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        placeholder="Enter quantity"
      />
    </div>

    <div className="mb-5">
      <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">
        Timing Scenarios
      </label>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(TIMING_OPTIONS).map(([value, label]) => (
          <label
            key={value}
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer text-sm transition-all border ${
              orderForm.delays.includes(value)
                ? "bg-sky-600/20 text-sky-300 border-sky-500"
                : "bg-slate-900/70 border-slate-700 hover:bg-slate-800/70"
            }`}
          >
            <input
              type="checkbox"
              checked={orderForm.delays.includes(value)}
              onChange={() => onDelayChange(value)}
              className="form-checkbox h-4 w-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>

    <button
      onClick={onSimulate}
      disabled={isSimulating}
      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 disabled:bg-sky-800 disabled:cursor-not-allowed shadow-md shadow-sky-900/40"
    >
      {isSimulating ? "Simulating..." : "Run Simulation"}
    </button>
  </div>
);

export default OrderSimulationForm;
