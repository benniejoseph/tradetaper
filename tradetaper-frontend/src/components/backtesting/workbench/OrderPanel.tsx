// src/components/backtesting/workbench/OrderPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaCalculator } from 'react-icons/fa';

interface OrderPanelProps {
  currentPrice: number;
  balance: number;
  onPlaceOrder: (type: 'LONG' | 'SHORT', lotSize: number, sl: number, tp: number) => void;
  disabled: boolean;
}

export default function OrderPanel({ currentPrice, balance, onPlaceOrder, disabled }: OrderPanelProps) {
  const [lotSize, setLotSize] = useState(1.0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  
  // Risk calculation helpers
  const [riskAmount, setRiskAmount] = useState(0);
  const [riskPercent, setRiskPercent] = useState(0);

  // Auto-update SL/TP defaults when price changes drastically (optional, mostly for UX)
  useEffect(() => {
    if (stopLoss === 0 && currentPrice > 0) {
      setStopLoss(Number((currentPrice * 0.99).toFixed(2))); // Default 1% SL
      setTakeProfit(Number((currentPrice * 1.02).toFixed(2))); // Default 2% TP
    }
  }, [currentPrice]);

  // Recalculate risk whenever inputs change
  useEffect(() => {
    // Simplified risk calc: (Entry - SL) * LotSize * ContractSize
    // Assuming 1 Lot = 1000 units for this mock stock/crypto scenario
    if (currentPrice && stopLoss) {
        const dist = Math.abs(currentPrice - stopLoss);
        const risk = dist * lotSize * 100; // Mock multiplier
        setRiskAmount(risk);
        setRiskPercent((risk / balance) * 100);
    }
  }, [currentPrice, stopLoss, lotSize, balance]);

  return (
    <div className="glass-card p-4 rounded-xl border border-white/5 bg-slate-900/80 backdrop-blur-md w-80 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
            <FaCalculator className="text-emerald-500" /> Order Entry
        </h3>
        <span className="text-xs font-mono text-slate-400">
            Price: <span className="text-white">{currentPrice.toFixed(2)}</span>
        </span>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
         <div>
            <label className="text-xs text-slate-500 block mb-1">Lot Size</label>
            <input 
                type="number" 
                step="0.1"
                value={lotSize}
                onChange={(e) => setLotSize(Number(e.target.value))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
            />
         </div>

         <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="text-xs text-slate-500 block mb-1">Stop Loss</label>
                <input 
                    type="number" 
                    step="0.01"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-red-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none"
                />
             </div>
             <div>
                <label className="text-xs text-slate-500 block mb-1">Take Profit</label>
                <input 
                    type="number" 
                    step="0.01"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none"
                />
             </div>
         </div>
      </div>

      {/* Risk Info */}
      <div className="text-xs bg-slate-800/50 p-2 rounded-lg flex justify-between items-center">
          <span className="text-slate-400">Risk:</span>
          <span className={`${riskPercent > 2 ? 'text-red-400' : 'text-slate-200'}`}>
              -${riskAmount.toFixed(2)} ({riskPercent.toFixed(1)}%)
          </span>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
            onClick={() => onPlaceOrder('LONG', lotSize, stopLoss, takeProfit)}
            disabled={disabled}
            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
            <FaArrowUp /> Long
        </button>
        <button
            onClick={() => onPlaceOrder('SHORT', lotSize, stopLoss, takeProfit)}
            disabled={disabled}
            className="flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)]"
        >
            <FaArrowDown /> Short
        </button>
      </div>
    </div>
  );
}
