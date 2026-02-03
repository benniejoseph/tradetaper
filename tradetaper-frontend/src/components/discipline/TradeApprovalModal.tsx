'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '../ui/AnimatedCard';
import disciplineService, { 
  TradeApproval, 
  CreateApprovalDto, 
  ApproveTradeDto,
  ChecklistResponse 
} from '@/services/disciplineService';

interface Strategy {
  id: string;
  name: string;
  checklist: { id: string; text: string; order: number }[];
  maxRiskPercent?: number;
}

interface TradeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: Strategy | null;
  accountId?: string;
  accountBalance?: number;
  onApproved?: (approval: TradeApproval) => void;
}

// Level thresholds for XP bar
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000];

export const TradeApprovalModal: React.FC<TradeApprovalModalProps> = ({
  isOpen,
  onClose,
  strategy,
  accountId,
  accountBalance = 10000,
  onApproved,
}) => {
  const [step, setStep] = useState<'checklist' | 'calculate' | 'confirm' | 'unlocked'>('checklist');
  const [checklistItems, setChecklistItems] = useState<ChecklistResponse[]>([]);
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [approval, setApproval] = useState<TradeApproval | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize checklist when strategy changes
  useEffect(() => {
    if (strategy?.checklist) {
      setChecklistItems(
        strategy.checklist.map((item) => ({
          itemId: item.id,
          text: item.text,
          checked: false,
        }))
      );
      setRiskPercent(strategy.maxRiskPercent || 1);
    }
  }, [strategy]);

  // Countdown timer when unlocked
  useEffect(() => {
    if (step === 'unlocked' && countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      onClose();
    }
  }, [step, countdown, onClose]);

  // Calculate lot size based on risk
  const calculateLotSize = () => {
    if (!stopLoss || !entryPrice) return 0.01;
    const maxRiskAmount = accountBalance * (riskPercent / 100);
    const pipValue = 10; // Simplified, should be dynamic per symbol
    const pipDiff = Math.abs(entryPrice - stopLoss) / 0.0001; // Assuming 4-digit pairs
    if (pipDiff === 0) return 0.01;
    const calculatedLot = maxRiskAmount / (pipDiff * pipValue);
    return Math.max(0.01, Math.min(Math.floor(calculatedLot * 100) / 100, 10));
  };

  const allChecked = checklistItems.every((item) => item.checked);

  const handleToggleItem = (itemId: string) => {
    setChecklistItems((items) =>
      items.map((item) =>
        item.itemId === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleProceedToCalculate = async () => {
    if (!allChecked || !strategy) return;
    setLoading(true);
    setError(null);

    try {
      const dto: CreateApprovalDto = {
        accountId,
        strategyId: strategy.id,
        symbol,
        direction,
        riskPercent,
        checklistResponses: checklistItems,
      };
      const newApproval = await disciplineService.createApproval(dto);
      setApproval(newApproval);
      setStep('calculate');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create approval');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndUnlock = async () => {
    if (!approval) return;
    setLoading(true);
    setError(null);

    const calculatedLot = calculateLotSize();
    setLotSize(calculatedLot);

    try {
      const dto: ApproveTradeDto = {
        calculatedLotSize: calculatedLot,
        stopLoss,
        takeProfit: takeProfit || undefined,
      };
      const updatedApproval = await disciplineService.approveAndUnlock(approval.id, dto);
      setApproval(updatedApproval);
      setCountdown(60);
      setStep('unlocked');
      onApproved?.(updatedApproval);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unlock trading');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg"
        >
          <AnimatedCard variant="glass" className="p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">🎯 Trade Approval</h2>
                  <p className="text-emerald-100 text-sm">{strategy?.name || 'Select Strategy'}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Step indicators */}
              <div className="flex gap-2 mt-3">
                {['checklist', 'calculate', 'confirm', 'unlocked'].map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ['checklist', 'calculate', 'confirm', 'unlocked'].indexOf(step) >= i
                        ? 'bg-white'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4"
                >
                  {error}
                </motion.div>
              )}

              {/* Step: Checklist */}
              {step === 'checklist' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Symbol
                      </label>
                      <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        placeholder="XAUUSD"
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Direction
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDirection('Long')}
                          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                            direction === 'Long'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          📈 Long
                        </button>
                        <button
                          onClick={() => setDirection('Short')}
                          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                            direction === 'Short'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          📉 Short
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Pre-Trade Checklist
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {checklistItems.map((item, index) => (
                        <motion.div
                          key={item.itemId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleToggleItem(item.itemId)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            item.checked
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-gray-50 dark:bg-gray-800/50'
                          } border`}
                        >
                          <motion.div
                            animate={{ scale: item.checked ? [1, 1.2, 1] : 1 }}
                            className={`w-5 h-5 rounded flex items-center justify-center ${
                              item.checked
                                ? 'bg-emerald-500 text-white'
                                : 'border-2 border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {item.checked && '✓'}
                          </motion.div>
                          <span className={`text-sm ${item.checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {item.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToCalculate}
                    disabled={!allChecked || !symbol || loading}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      allChecked && symbol
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? '⏳ Creating...' : `Complete Checklist (${checklistItems.filter(i => i.checked).length}/${checklistItems.length})`}
                  </button>
                </motion.div>
              )}

              {/* Step: Calculate */}
              {step === 'calculate' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">🧮</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Risk Calculator</h3>
                    <p className="text-sm text-gray-500">Balance: ${accountBalance.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Entry Price
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={entryPrice || ''}
                        onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Stop Loss
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={stopLoss || ''}
                        onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Take Profit (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.00001"
                        value={takeProfit || ''}
                        onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Risk %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        max={strategy?.maxRiskPercent || 1}
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(Math.min(parseFloat(e.target.value) || 1, strategy?.maxRiskPercent || 1))}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Calculated Values */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Max Risk Amount:</span>
                      <span className="font-bold text-red-500">
                        ${(accountBalance * (riskPercent / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600 dark:text-gray-400">Calculated Lot Size:</span>
                      <span className="font-bold text-emerald-500 text-xl">
                        {calculateLotSize().toFixed(2)} lots
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('checklist')}
                      className="flex-1 py-3 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleApproveAndUnlock}
                      disabled={!entryPrice || !stopLoss || loading}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                        entryPrice && stopLoss
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loading ? '⏳ Unlocking...' : '🔓 Approve & Unlock'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step: Unlocked */}
              {step === 'unlocked' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="text-6xl"
                  >
                    🔓
                  </motion.div>
                  <h3 className="text-2xl font-bold text-emerald-500">Trading Unlocked!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Open your trade in MT5 within {countdown} seconds
                  </p>

                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Symbol:</div>
                      <div className="font-bold text-gray-900 dark:text-white">{symbol}</div>
                      <div className="text-gray-500">Direction:</div>
                      <div className={`font-bold ${direction === 'Long' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {direction}
                      </div>
                      <div className="text-gray-500">Lot Size:</div>
                      <div className="font-bold text-gray-900 dark:text-white">{calculateLotSize().toFixed(2)}</div>
                      <div className="text-gray-500">Stop Loss:</div>
                      <div className="font-bold text-red-500">{stopLoss}</div>
                    </div>
                  </div>

                  {/* Countdown Bar */}
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-500"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 60, ease: 'linear' }}
                    />
                  </div>
                  <p className="text-2xl font-mono font-bold text-orange-500">
                    {countdown}s
                  </p>
                </motion.div>
              )}
            </div>
          </AnimatedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradeApprovalModal;
