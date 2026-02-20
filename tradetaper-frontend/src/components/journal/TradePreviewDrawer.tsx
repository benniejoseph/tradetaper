"use client";

import { Trade, TradeStatus, UpdateTradePayload, TradeDirection } from '@/types/trade';
import { FaTimes, FaEdit, FaTrashAlt, FaExternalLinkAlt, FaShareSquare, FaStar as FaStarSolid, FaRegStar as FaStarOutline, FaTwitter, FaLinkedin, FaCopy, FaDownload, FaChartLine, FaClock, FaDollarSign, FaBrain, FaSync, FaTerminal } from 'react-icons/fa'; // Added FaBrain, FaSync, FaTerminal
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { formatPrice } from './TradesTable';
import TradeCandleChart from '../charts/TradeCandleChart';
// Helper functions moved from TradesTable
const getWeekday = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'EEEE');
  } catch (e) {
    return '-';
  }
};

const getHoldTime = (trade: Trade): string => {
  if (!trade.entryDate || !trade.exitDate) return '-';
  try {
    const start = parseISO(trade.entryDate);
    const end = parseISO(trade.exitDate);
    const diffMins = differenceInMinutes(end, start);
    
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = differenceInHours(end, start);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    const diffDays = differenceInDays(end, start);
    return `${diffDays}d ${diffHours % 24}h`;
  } catch (e) {
    return '-';
  }
};
import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { updateTrade } from '@/store/features/tradesSlice';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
// import { analyzeNote } from '@/services/notesApi'; // Removed - service no longer exists

interface TradePreviewDrawerProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tradeId: string) => void;
  onDelete: (tradeId: string) => void;
}

interface ShareModalProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ trade, isOpen, onClose }) => {
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopyLink = () => {
    const tradeUrl = `${window.location.origin}/journal/view/${trade.id}`;
    navigator.clipboard.writeText(tradeUrl);
    // You could add a toast notification here
  };

  const handleShareToTwitter = () => {
    const profitOrLoss = trade.profitOrLoss || 0;
    const pnlText = profitOrLoss >= 0 ? `+$${Math.abs(profitOrLoss).toFixed(2)}` : `-$${Math.abs(profitOrLoss).toFixed(2)}`;
    const text = `Just ${profitOrLoss >= 0 ? 'closed a winning' : 'completed a'} ${trade.direction} trade on ${trade.symbol} ${pnlText} 📈 #TradeTaper #Trading`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareToLinkedIn = () => {
    const tradeUrl = `${window.location.origin}/journal/view/${trade.id}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tradeUrl)}`;
    window.open(url, '_blank');
  };

  const handleDownloadCard = async () => {
    if (!shareCardRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 400,
        height: 600,
      });
      
      const link = document.createElement('a');
      link.download = `${trade.symbol}-trade-${trade.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to generate trade card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const profitOrLoss = trade.profitOrLoss || 0;
  const isWin = profitOrLoss > 0;
  const pnlPercentage = trade.entryPrice && trade.quantity 
    ? (profitOrLoss / Math.abs(trade.entryPrice * trade.quantity)) * 100 
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share Trade
            </h3>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-red-500 dark:hover:bg-red-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Shareable Trade Card */}
        <div className="p-6">
          <div 
            ref={shareCardRef}
            className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-xl p-6 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 shadow-lg"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                  trade.direction === TradeDirection.LONG ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}>
                  {trade.direction === TradeDirection.LONG ? '↗' : '↘'}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {trade.symbol}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trade.direction} • {trade.assetType}
                  </p>
                </div>
              </div>
              
              <div className={`px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm ${
                isWin 
                  ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {isWin ? 'WIN' : 'LOSS'}
              </div>
            </div>

            {/* P&L Display */}
            <div className="text-center mb-6">
              <div className={`text-3xl font-bold mb-1 ${
                isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {profitOrLoss >= 0 ? '+' : ''}${Math.abs(profitOrLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <div className={`text-sm font-medium ${
                isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
              </div>
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">Entry</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${trade.entryPrice?.toFixed(4) || 'N/A'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">Exit</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${trade.exitPrice?.toFixed(4) || 'N/A'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">Quantity</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {trade.quantity?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">R-Multiple</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {trade.rMultiple?.toFixed(2) || 'N/A'}R
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="mt-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {trade.entryDate ? format(parseISO(trade.entryDate), 'MMM dd, yyyy') : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Powered by TradeTaper
              </div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100/80 dark:bg-[#141414] hover:bg-emerald-500 dark:hover:bg-emerald-600 text-gray-700 dark:text-gray-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaCopy className="h-4 w-4" />
              <span className="text-sm font-medium">Copy Link</span>
            </button>
            
            <button
              onClick={handleDownloadCard}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-100/80 dark:bg-emerald-950/30 hover:bg-emerald-500 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm disabled:opacity-50"
            >
              <FaDownload className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isGenerating ? 'Generating...' : 'Download'}
              </span>
            </button>
            
            <button
              onClick={handleShareToTwitter}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-100/80 dark:bg-emerald-950/30 hover:bg-emerald-500 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaTwitter className="h-4 w-4" />
              <span className="text-sm font-medium">Twitter</span>
            </button>
            
            <button
              onClick={handleShareToLinkedIn}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-100/80 dark:bg-emerald-950/30 hover:bg-emerald-500 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaLinkedin className="h-4 w-4" />
              <span className="text-sm font-medium">LinkedIn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const calculatePnlPercentage = (trade: Trade): number | null => {
  if (trade.profitOrLoss === undefined || trade.profitOrLoss === null || !trade.entryPrice || !trade.quantity) {
    return null;
  }
  if (trade.entryPrice === 0 || trade.quantity === 0) return null;
  const entryCost = trade.entryPrice * trade.quantity;
  if (entryCost === 0) return null;
  return (trade.profitOrLoss / Math.abs(entryCost)) * 100;
};

export default function TradePreviewDrawer({
  trade,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: TradePreviewDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'manage'>('details');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnalyzingNote, setIsAnalyzingNote] = useState(false); // New state for analysis loading

  // Debug logging
  console.log('TradePreviewDrawer render:', { isOpen, trade: trade?.symbol || 'null', tradeId: trade?.id });

  if (!isOpen || !trade) {
    console.log('TradePreviewDrawer returning null - isOpen:', isOpen, 'trade:', !!trade);
    return null;
  }

  const handleToggleStar = async () => {
    if (!trade) return;
    
    const payload: UpdateTradePayload = {
      // Populate with existing trade data, then override isStarred
      // This ensures all necessary fields for UpdateTradePayload (Partial<CreateTradePayload>) are present
      assetType: trade.assetType,
      symbol: trade.symbol,
      direction: trade.direction,
      status: trade.status,
      entryDate: trade.entryDate, 
      entryPrice: trade.entryPrice,
      quantity: trade.quantity,
      // Optional fields from CreateTradePayload that might be in UpdateTradePayload
      ...(trade.exitDate && { exitDate: trade.exitDate }),
      ...(trade.exitPrice && { exitPrice: trade.exitPrice }),
      ...(trade.commission !== undefined && { commission: trade.commission }),
      ...(trade.notes && { notes: trade.notes }),
      ...(trade.stopLoss && { stopLoss: trade.stopLoss }),
      ...(trade.takeProfit && { takeProfit: trade.takeProfit }),
      ...(trade.session && { session: trade.session }),
      ...(trade.setupDetails && { setupDetails: trade.setupDetails }),
      ...(trade.mistakesMade && { mistakesMade: trade.mistakesMade }),
      ...(trade.lessonsLearned && { lessonsLearned: trade.lessonsLearned }),
      ...(trade.imageUrl && { imageUrl: trade.imageUrl }),
      ...(trade.accountId && { accountId: trade.accountId }),
      tagNames: trade.tags?.map(t => t.name) || [],
      
      // The actual field we want to update:
      isStarred: !trade.isStarred, 
    };

    dispatch(updateTrade({ id: trade.id, payload }))
      .unwrap()
      .catch((error) => {
        console.error("Failed to update star status:", error);
      });
  };

  // const handleAnalyzeNote = async () => { ... } // Removed as analyzeNote service is missing

  const isWin = trade.profitOrLoss !== undefined && trade.profitOrLoss !== null && trade.profitOrLoss > 0;
  const isLoss = trade.profitOrLoss !== undefined && trade.profitOrLoss !== null && trade.profitOrLoss < 0;
  const statusText = isWin ? 'Win' : isLoss ? 'Loss' : trade.status === TradeStatus.OPEN ? 'Open' : 'N/A';
  const statusColor = isWin 
    ? 'bg-gradient-to-r from-green-500 to-green-600' 
    : isLoss 
    ? 'bg-gradient-to-r from-red-500 to-red-600' 
    : 'bg-gradient-to-r from-gray-500 to-gray-600';
  const pnlPercentage = calculatePnlPercentage(trade);
  const entryValue = trade.entryPrice && trade.quantity ? trade.entryPrice * trade.quantity : null;

  const MetricCard: React.FC<{ 
    label: string; 
    value: React.ReactNode; 
    icon?: React.ReactNode; 
    trend?: 'up' | 'down' | 'neutral';
    subValue?: string;
  }> = ({ label, value, icon, trend, subValue }) => (
    <div className="bg-white/50 dark:bg-emerald-950/5 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="p-2 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">{icon}</div>}
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        {trend && (
          <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
            trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
            'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
      {subValue && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{subValue}</div>}
    </div>
  );

  const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-2">
      <div className="h-6 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">{title}</h4>
    </div>
  );

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleExternalLink = () => {
    router.push(`/journal/view/${trade.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[95vh] bg-white dark:bg-[#0A0A0A] border border-gray-200/50 dark:border-white/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] flex flex-col rounded-[2.5rem] overflow-hidden transform transition-all duration-300 ease-in-out scale-100 opacity-100" 
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-500/5 dark:to-transparent">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl shadow-lg border ${
                  trade.direction === TradeDirection.LONG 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400'
                }`}>
                  {trade.direction === TradeDirection.LONG ? '↗' : '↘'}
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tighter text-gray-900 dark:text-white leading-none">{trade.symbol}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter text-white shadow-sm ${statusColor}`}>
                      {statusText}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {trade.assetType} • {trade.direction}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-2xl backdrop-blur-xl border border-gray-200/50 dark:border-white/5">
                {[
                  { icon: trade.isStarred ? <FaStarSolid className="h-4 w-4 text-yellow-400" /> : <FaStarOutline className="h-4 w-4" />, onClick: handleToggleStar, title: "Favorite" },
                  { icon: <FaShareSquare className="h-4 w-4" />, onClick: handleShare, title: "Share" },
                  { icon: <FaExternalLinkAlt className="h-4 w-4" />, onClick: handleExternalLink, title: "Full View" },
                  { icon: <FaTimes className="h-4 w-4" />, onClick: onClose, title: "Close", className: "hover:bg-red-500 hover:text-white" }
                ].map((btn, idx) => (
                  <button 
                    key={idx}
                    onClick={btn.onClick} 
                    title={btn.title}
                    className={`p-3 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-all duration-200 active:scale-95 ${btn.className || ''}`}
                  >
                    {btn.icon}
                  </button>
                ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-8 p-1.5 bg-gray-100/50 dark:bg-white/5 rounded-2xl w-fit border border-gray-200/50 dark:border-white/5">
            {[
              { id: 'details', label: 'Trade Details', icon: <FaChartLine className="w-3.5 h-3.5" /> },
              { id: 'manage', label: 'Journaling', icon: <FaEdit className="w-3.5 h-3.5" /> }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'manage')}
                className={`flex items-center gap-2 py-2 px-6 text-xs font-bold rounded-xl transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#111111] shadow-xl shadow-emerald-500/10' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow px-8 pb-8 overflow-y-auto space-y-6 custom-scrollbar">
          {activeTab === 'details' && (
            <div className="grid grid-cols-12 gap-8">
              {/* Left Column - Metrics */}
              <div className="col-span-12 lg:col-span-5 space-y-8">
                {/* Hero P&L */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-[2rem] shadow-2xl shadow-emerald-500/20 group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <FaDollarSign className="w-32 h-32 -mr-12 -mt-12 rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Total Net Return</p>
                    <div className="flex flex-wrap items-baseline gap-4 max-w-full">
                      <span 
                        className="font-black text-white tracking-tighter"
                        style={{ fontSize: 'clamp(1.5rem, 8vw, 3rem)', lineHeight: '1' }}
                      >
                        {trade.profitOrLoss !== undefined && trade.profitOrLoss !== null ? 
                          `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
                          '-'
                        }
                      </span>
                      {pnlPercentage !== null && (
                        <span className="text-base md:text-lg font-bold text-emerald-200 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md whitespace-nowrap">
                          {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <MetricCard 
                    label="Volume" 
                    icon={<FaDollarSign />} 
                    value={entryValue !== null ? `$${entryValue.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}` : '-'} 
                    subValue={`${trade.quantity?.toLocaleString()} Units`}
                  />
                  <MetricCard 
                    label="R-Multiple" 
                    icon={<FaChartLine />} 
                    value={trade.rMultiple !== undefined && trade.rMultiple !== null ? `${trade.rMultiple.toFixed(2)}R` : '-'} 
                    trend={trade.rMultiple && trade.rMultiple > 2 ? 'up' : 'neutral'}
                  />
                  <MetricCard 
                    label="Take Profit" 
                    icon={<FaDollarSign className="text-emerald-500" />} 
                    value={trade.takeProfit ? formatPrice(trade.takeProfit) : '-'} 
                    subValue="Target Objective"
                  />
                  {trade.commission !== undefined && (
                    <MetricCard 
                      label="Commission" 
                      icon={<FaDollarSign className="text-red-500" />} 
                      value={`-$${Math.abs(trade.commission).toFixed(2)}`} 
                    />
                  )}
                  {trade.swap !== undefined && (
                    <MetricCard 
                      label="Swap" 
                      icon={<FaSync className="text-blue-500" />} 
                      value={`${trade.swap >= 0 ? '+' : '-'}$${Math.abs(trade.swap).toFixed(2)}`} 
                    />
                  )}
                </div>

                <div className="space-y-3">
                  {trade.externalId && (
                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <FaTerminal className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Position ID</span>
                      </div>
                      <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                        {trade.externalId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Entry Price</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                      {formatPrice(trade.entryPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Exit Price</span>
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                      {formatPrice(trade.exitPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Chart & Notes */}
              <div className="col-span-12 lg:col-span-7 space-y-8">
                <div className="p-1 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] border border-gray-200/50 dark:border-white/5 shadow-inner">
                  <TradeCandleChart 
                    tradeId={trade.id} 
                    symbol={trade.symbol} 
                    entryPrice={trade.entryPrice}
                    exitPrice={trade.exitPrice}
                    entryDate={trade.entryDate}
                    exitDate={trade.exitDate}
                    direction={trade.direction}
                    stopLoss={trade.stopLoss}
                    takeProfit={trade.takeProfit}
                  />
                </div>

                <div className="dark:bg-[#111111] bg-gray-50 p-8 rounded-[2rem] border border-gray-200/50 dark:border-white/5 transition-colors duration-300">
                  <SectionTitle title="Execution Timeline" icon={<FaClock className="w-4 h-4" />} />
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mt-6">
                    <div className="space-y-1">
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{trade.entryDate ? format(parseISO(trade.entryDate), 'HH:mm:ss') : '-'}</p>
                      <p className="text-gray-500 dark:text-gray-400">{trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM yyyy') : '-'}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-tighter mt-1">Market Open</p>
                    </div>
                    <div className="flex-grow mx-8 h-px bg-gradient-to-r from-emerald-500/50 via-gray-300 dark:via-white/10 to-red-500/50 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-full text-[10px] text-emerald-600 dark:text-emerald-400 shadow-sm">
                         {getHoldTime(trade)}
                       </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-red-500 dark:text-red-400 text-sm font-black">{trade.status === TradeStatus.CLOSED && trade.exitDate ? format(parseISO(trade.exitDate), 'HH:mm:ss') : '-'}</p>
                      <p className="text-gray-500 dark:text-gray-400">{trade.status === TradeStatus.CLOSED && trade.exitDate ? format(parseISO(trade.exitDate), 'dd MMM yyyy') : '-'}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-tighter mt-1">Market Exit</p>
                    </div>
                  </div>
                </div>

                {/* Additional Data: Concepts & Tags */}
                <div className="flex flex-wrap gap-4">
                  {trade.session && (
                    <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                      <p className="text-[10px] font-black text-blue-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Session</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{trade.session}</p>
                    </div>
                  )}
                  {trade.tags && trade.tags.length > 0 && (
                    <div className="flex-grow bg-gray-500/10 border border-gray-500/20 px-4 py-2 rounded-xl">
                      <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {trade.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs font-bold text-gray-600 dark:text-gray-300">#{tag.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-6">
                <div className="p-8 dark:bg-[#111111] bg-gray-50 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-sm transition-colors duration-300">
                  <SectionTitle title="Core Context" icon={<FaBrain />} />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Trade Thesis & Notes</label>
                      <textarea
                        defaultValue={trade.notes || ''}
                        onBlur={(e) => dispatch(updateTrade({ id: trade.id, payload: { notes: e.target.value } }))}
                        className="w-full p-6 bg-white dark:bg-black/40 border border-gray-200/50 dark:border-white/5 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm min-h-[180px] leading-relaxed shadow-inner dark:text-white"
                        placeholder="What was the reason for this entry? Describe the price action..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 dark:bg-[#111111] bg-gray-50 rounded-[2rem] border border-gray-200/50 dark:border-white/5 shadow-sm transition-colors duration-300">
                  <SectionTitle title="Retrospective" icon={<FaBrain />} />
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Mistakes & Behavioral Data</label>
                      <textarea
                        defaultValue={trade.mistakesMade || ''}
                        onBlur={(e) => dispatch(updateTrade({ id: trade.id, payload: { mistakesMade: e.target.value } }))}
                        className="w-full p-4 bg-white dark:bg-black/40 border border-gray-200/50 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-red-500 transition-all text-sm min-h-[100px] dark:text-white"
                        placeholder="Identify any psychological pitfalls or rule breaks..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Key Lessons</label>
                      <textarea
                        defaultValue={trade.lessonsLearned || ''}
                        onBlur={(e) => dispatch(updateTrade({ id: trade.id, payload: { lessonsLearned: e.target.value } }))}
                        className="w-full p-4 bg-white dark:bg-black/40 border border-gray-200/50 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm min-h-[100px] dark:text-white"
                        placeholder="What will you do differently next time?"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-white/5 border-t border-gray-200/30 dark:border-white/5">
          <div className="flex gap-4">
            <button 
              onClick={() => onEdit(trade.id)} 
              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black tracking-widest uppercase text-xs flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <FaEdit /> Update Entry
            </button>
            <button 
              onClick={() => onDelete(trade.id)} 
              className="px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/5 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-400 font-bold text-xs transition-all duration-300 active:scale-95"
            >
              <FaTrashAlt />
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        trade={trade}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
