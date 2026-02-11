'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AnimatedCard } from '../ui/AnimatedCard';
import disciplineService, { 
  TradeApproval, 
  CreateApprovalDto, 
  ApproveTradeDto,
  ChecklistResponse 
} from '@/services/disciplineService';
import { strategiesService } from '@/services/strategiesService';
import { tradesService } from '@/services/tradesService';
import { Strategy } from '@/types/strategy';
import { MT5Account } from '@/store/features/mt5AccountsSlice';

interface TradeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: MT5Account[];
  onApproved?: (approval: TradeApproval) => void;
}

type Step = 'select-strategy' | 'setup' | 'calculate';

export const TradeApprovalModal: React.FC<TradeApprovalModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onApproved,
}) => {
  const [step, setStep] = useState<Step>('select-strategy');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  
  // Form State
  const [checklistItems, setChecklistItems] = useState<ChecklistResponse[]>([]);
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [useInitialBalance, setUseInitialBalance] = useState(false);
  
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  
  const [approval, setApproval] = useState<TradeApproval | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load strategies
  useEffect(() => {
    if (isOpen) {
      strategiesService.getStrategies().then(setStrategies).catch(console.error);
    }
  }, [isOpen]);

  // Sync selected account when accounts change
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount = useMemo(() => 
    accounts.find(a => a.id === selectedAccountId), 
    [accounts, selectedAccountId]
  );

  const currentBalance = selectedAccount?.balance || 10000;
  const initialBalance = selectedAccount?.target && selectedAccount.target > 0 ? selectedAccount.target : currentBalance;
  const targetBalance = useInitialBalance ? initialBalance : currentBalance;

  // Initialize checklist when strategy changes
  const handleSelectStrategy = (strat: Strategy) => {
    setSelectedStrategy(strat);
    setChecklistItems(
      strat.checklist.map((item: ChecklistItem) => ({
        itemId: item.id,
        text: item.text,
        checked: false,
      }))
    );
    // setRiskPercent(strat.maxRiskPercent || 1); // Strategy model might need maxRiskPercent update
    setStep('setup');
  };

  // Calculate lot size based on risk
  const calculateLotSize = () => {
    if (!stopLoss || !entryPrice) return 0.01;
    const maxRiskAmount = targetBalance * (riskPercent / 100);
    const pipValue = 10; // Simplified
    const pipDiff = Math.abs(entryPrice - stopLoss);
    
    // Attempting to be more accurate with pip calculation
    // This is still a simplification but better than before
    const isForex = symbol.length === 6 || symbol.includes('/');
    const multiplier = (symbol.includes('JPY') || symbol.includes('XAU') || symbol.includes('XAG')) ? 0.01 : 0.0001;
    const pips = pipDiff / multiplier;

    if (pips === 0) return 0.01;
    const calculatedLot = maxRiskAmount / (pips * pipValue);
    return Math.max(0.01, Math.min(Math.floor(calculatedLot * 100) / 100, 50));
  };

  const allChecked = checklistItems.every((item) => item.checked);

  const handleToggleItem = (itemId: string) => {
    setChecklistItems((items) =>
      items.map((item) =>
        item.itemId === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleCreateApproval = async () => {
    if (!allChecked || !selectedStrategy || !symbol) return;
    setLoading(true);
    setError(null);

    try {
      const dto: CreateApprovalDto = {
        accountId: selectedAccountId,
        strategyId: selectedStrategy.id,
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

  const handleExecuteTrade = async () => {
    if (!approval || !selectedAccountId || !selectedStrategy) return;
    setLoading(true);
    setError(null);

    const calculatedLot = calculateLotSize();

    try {
      // Map discipline data to backend API format
      const apiPayload = {
        accountId: selectedAccountId,
        assetType: 'Forex', // Backend expects string 'Forex'
        symbol,
        side: direction, // Backend uses 'side' not 'direction'
        status: 'Open',
        openTime: new Date().toISOString(), // Backend uses 'openTime' not 'entryDate'
        openPrice: entryPrice, // Backend uses 'openPrice' not 'entryPrice'
        quantity: calculatedLot,
        stopLoss,
        takeProfit: takeProfit || undefined,
        notes: `Strategy: ${selectedStrategy.name}\nRisk: ${riskPercent}%\nChecklist completed: ${checklistItems.filter(i => i.checked).length}/${checklistItems.length}`,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1'}/trades`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute trade');
      }

      const newTrade = await response.json();
      
      // Navigate to trade view
      router.push(`/trades/${newTrade.id}`);
      
      // Close modal
      resetAndClose();
      
      // Notify parent of success
      onApproved?.(approval);
    } catch (err: any) {
      setError(err.message || 'Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('select-strategy');
    setSelectedStrategy(null);
    setSymbol('');
    setChecklistItems([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { id: 'select-strategy', label: 'Strategy' },
    { id: 'setup', label: 'Setup' },
    { id: 'calculate', label: 'Execute' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300"
      onClick={resetAndClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl"
      >
        <div className="bg-white dark:bg-black rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Execute Trade</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {step === 'select-strategy' ? 'Choose your trading strategy' : selectedStrategy?.name}
                </p>
              </div>
              <button
                onClick={resetAndClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              >
                ✕
              </button>
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center gap-4">
              {steps.map((s, i) => {
                const isActive = step === s.id;
                const isPast = steps.findIndex(x => x.id === step) > i;
                return (
                  <div key={s.id} className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive || isPast ? 'text-emerald-500' : 'text-gray-400'}`}>
                        Step {i + 1}
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                      isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                      isPast ? 'bg-emerald-500' : 
                      'bg-gray-200 dark:bg-white/10'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Space */}
          <div className="p-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-[10px]">!</span>
                {error}
              </div>
            )}

            {/* STEP 1: SELECT STRATEGY */}
            {step === 'select-strategy' && (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {strategies.length > 0 ? (
                  strategies.filter(s => s.isActive).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStrategy(s)}
                      className="w-full group relative flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-wide">{s.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.checklist?.length || 0} Rule Process</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                        →
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400 italic">No active strategies found...</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: SETUP & CHECKLIST */}
            {step === 'setup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Symbol</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="XAUUSD"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Direction</label>
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
                      <button
                        onClick={() => setDirection('Long')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                          direction === 'Long' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >Long</button>
                      <button
                        onClick={() => setDirection('Short')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                          direction === 'Short' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >Short</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Rule Confirmation
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px]">
                      {checklistItems.filter(i => i.checked).length}/{checklistItems.length}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {checklistItems.map((item) => (
                      <button
                        key={item.itemId}
                        onClick={() => handleToggleItem(item.itemId)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left border transition-all duration-300 ${
                          item.checked 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          item.checked ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-transparent'
                        }`}>
                          <span className="text-sm font-bold">✓</span>
                        </div>
                        <span className={`text-sm font-medium ${item.checked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => setStep('select-strategy')}
                    className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  >Back</button>
                  <button
                    disabled={!allChecked || !symbol || loading}
                    onClick={handleCreateApproval}
                    className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all"
                  >
                    {loading ? 'Processing...' : 'Ready to Risk'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RISK CALCULATOR */}
            {step === 'calculate' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="dark:bg-black">
                        {acc.accountName} - {acc.currency} {acc.balance?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 flex gap-1">
                  <button
                    onClick={() => setUseInitialBalance(false)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      !useInitialBalance ? 'bg-white dark:bg-white/10 text-emerald-500 shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500'
                    }`}
                  >Current: ${currentBalance.toLocaleString()}</button>
                  <button
                    onClick={() => setUseInitialBalance(true)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      useInitialBalance ? 'bg-white dark:bg-white/10 text-emerald-500 shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500'
                    }`}
                  >Initial: ${initialBalance.toLocaleString()}</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Entry Price</label>
                    <input
                      type="number" step="any"
                      value={entryPrice || ''}
                      onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Stop Loss</label>
                    <input
                      type="number" step="any"
                      value={stopLoss || ''}
                      onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Take Profit</label>
                    <input
                      type="number" step="any"
                      value={takeProfit || ''}
                      onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Risk %</label>
                    <input
                      type="number" step="0.1"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl font-bold text-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-emerald-500 dark:bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500/60">Calculated Lot Size</p>
                  <h3 className="text-5xl font-black text-emerald-700 dark:text-emerald-500">{calculateLotSize().toFixed(2)}</h3>
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 dark:text-emerald-500/50">
                    <span>RISK: ${(targetBalance * (riskPercent / 100)).toLocaleString()}</span>
                    <span>•</span>
                    <span>PIPS: {Math.abs((entryPrice - stopLoss) / ((symbol.includes('JPY') || symbol.includes('XAU')) ? 0.01 : 0.0001)).toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => setStep('setup')}
                    className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 font-bold uppercase tracking-widest text-xs"
                  >Back</button>
                  <button
                    disabled={!entryPrice || !stopLoss || loading}
                    onClick={handleExecuteTrade}
                    className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20"
                  >
                    {loading ? 'Executing...' : 'Execute Trade'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
};

export default TradeApprovalModal;
