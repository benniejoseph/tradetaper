"use client";

import { Trade, TradeStatus, UpdateTradePayload, TradeDirection } from '@/types/trade';
import { FaTimes, FaEdit, FaTrashAlt, FaExternalLinkAlt, FaShareSquare, FaStar as FaStarSolid, FaRegStar as FaStarOutline, FaTwitter, FaLinkedin, FaCopy, FaDownload, FaChartLine, FaClock, FaDollarSign } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { getWeekday, getHoldTime, formatPrice } from './TradesTable';
import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { updateTrade } from '@/store/features/tradesSlice';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';

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
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
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
            className="bg-gradient-to-br from-blue-50/80 to-green-50/80 dark:from-blue-900/20 dark:to-green-900/20 backdrop-blur-xl p-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-lg"
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
                  ? 'bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {isWin ? 'WIN' : 'LOSS'}
              </div>
            </div>

            {/* P&L Display */}
            <div className="text-center mb-6">
              <div className={`text-3xl font-bold mb-1 ${
                isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {profitOrLoss >= 0 ? '+' : ''}${Math.abs(profitOrLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-sm font-medium ${
                isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
              </div>
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">Entry</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${trade.entryPrice?.toFixed(4) || 'N/A'}
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">Exit</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${trade.exitPrice?.toFixed(4) || 'N/A'}
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
                <div className="text-gray-500 dark:text-gray-400 text-xs">Quantity</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {trade.quantity?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-3">
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
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-700 dark:text-gray-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaCopy className="h-4 w-4" />
              <span className="text-sm font-medium">Copy Link</span>
            </button>
            
            <button
              onClick={handleDownloadCard}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100/80 dark:bg-blue-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-blue-700 dark:text-blue-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm disabled:opacity-50"
            >
              <FaDownload className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isGenerating ? 'Generating...' : 'Download'}
              </span>
            </button>
            
            <button
              onClick={handleShareToTwitter}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100/80 dark:bg-blue-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-blue-700 dark:text-blue-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaTwitter className="h-4 w-4" />
              <span className="text-sm font-medium">Twitter</span>
            </button>
            
            <button
              onClick={handleShareToLinkedIn}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100/80 dark:bg-blue-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-blue-700 dark:text-blue-300 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
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

  if (!isOpen || !trade) {
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
      ...(trade.ictConcept && { ictConcept: trade.ictConcept }),
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

  const DetailItem: React.FC<{ label: string; value: string | number | React.ReactNode | null | undefined; valueClass?: string; containerClass?: string }> = 
    ({ label, value, valueClass, containerClass }) => (
    <div className={`flex justify-between items-center py-3 px-4 bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200 ${containerClass || ''}`}>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm text-right font-semibold ${valueClass || 'text-gray-900 dark:text-white'}`}>{value ?? '-'}</span>
    </div>
  );

  const SectionTitle: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-4 mt-6">
      {icon && (
        <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
          {icon}
        </div>
      )}
      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
    </div>
  );

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleExternalLink = () => {
    router.push(`/journal/view/${trade.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-end z-40 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className="w-full max-w-lg h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0" 
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">{trade.symbol}</h2>
                <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-3 py-1.5 rounded-xl text-white text-sm font-semibold shadow-lg ${statusColor}`}>{statusText}</span>
                    <span className="px-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 text-sm font-semibold backdrop-blur-sm">{trade.direction}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={handleToggleStar} className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-yellow-500 dark:hover:bg-yellow-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 backdrop-blur-sm">
                    {trade.isStarred ? 
                        <FaStarSolid className="h-5 w-5 text-yellow-400" /> : 
                        <FaStarOutline className="h-5 w-5" />
                    }
                </button>
                <button onClick={handleShare} className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 backdrop-blur-sm">
                    <FaShareSquare className="h-5 w-5" />
                </button>
                <button onClick={handleExternalLink} className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 backdrop-blur-sm">
                    <FaExternalLinkAlt className="h-5 w-5" />
                </button>
                <button onClick={onClose} className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-red-500 dark:hover:bg-red-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 backdrop-blur-sm">
                  <FaTimes className="h-5 w-5" />
                </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-4">
              <span>Opened: {trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM yy, HH:mm') : '-'}</span>
              {trade.status === TradeStatus.CLOSED && trade.exitDate && (
                  <span>Closed: {format(parseISO(trade.exitDate), 'dd MMM yy, HH:mm')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <div className="flex space-x-1">
              <button 
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-4 text-sm font-semibold rounded-t-xl transition-all duration-200 ${
                    activeTab === 'details' 
                      ? 'text-blue-600 dark:text-blue-400 bg-gradient-to-t from-blue-50/80 to-transparent dark:from-blue-900/20 border-b-2 border-blue-500' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                  }`}
              >
                  Details
              </button>
              <button 
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 px-4 text-sm font-semibold rounded-t-xl transition-all duration-200 ${
                    activeTab === 'manage' 
                      ? 'text-blue-600 dark:text-blue-400 bg-gradient-to-t from-blue-50/80 to-transparent dark:from-blue-900/20 border-b-2 border-blue-500' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                  }`}
              >
                  Manage
              </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 text-sm">
          {activeTab === 'details' && (
            <>
              {/* P&L Highlight Card */}
              <div className="bg-gradient-to-br from-blue-50/80 to-green-50/80 dark:from-blue-900/20 dark:to-green-900/20 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net P&L</p>
                    {pnlPercentage !== null && (
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                          pnlPercentage > 0 
                            ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                            : pnlPercentage < 0 
                            ? 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-gray-100/80 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300'
                        }`}>
                            {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                        </span>
                    )}
                </div>
                <span className={`text-3xl font-bold ${
                  isWin ? 'text-green-600 dark:text-green-400' : 
                  isLoss ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-900 dark:text-white'
                }`}>
                    {trade.profitOrLoss !== undefined && trade.profitOrLoss !== null ? 
                      `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
                      '-'
                    }
                </span>
              </div>

              <SectionTitle title="Performance" icon={<FaChartLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />} />
              <div className="space-y-3">
                <DetailItem label="P&L (Gross)" value={trade.profitOrLoss !== undefined && trade.profitOrLoss !== null && trade.commission !== undefined && trade.commission !== null ? `$${(trade.profitOrLoss + trade.commission).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'} />
                <DetailItem label="Fees" value={trade.commission !== undefined && trade.commission !== null ? `-$${Math.abs(trade.commission).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'} valueClass="text-red-600 dark:text-red-400" />
                <DetailItem label="Funding" value="$0.00" />
                <DetailItem label="Max Favorable Excursion (MFE)" value={<span className="text-gray-400 dark:text-gray-500">- (Future Feature)</span>} />
                <DetailItem label="Max Adverse Excursion (MAE)" value={<span className="text-gray-400 dark:text-gray-500">- (Future Feature)</span>} />
                <DetailItem label="Leverage Used" value={<span className="text-gray-400 dark:text-gray-500">- (Future Feature)</span>} />
              </div>

              <SectionTitle title="Entry / Exit" icon={<FaDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />} />
              <div className="space-y-3">
                <DetailItem label="Entry Price" value={formatPrice(trade.entryPrice)} valueClass="font-mono" />
                <DetailItem label="Exit Price" value={formatPrice(trade.exitPrice)} valueClass="font-mono" />
              </div>

              <SectionTitle title="Time" icon={<FaClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />} />
              <div className="space-y-3">
                <DetailItem label="Weekday" value={getWeekday(trade.entryDate)} />
                <DetailItem label="Session" value={trade.session || '-'} />
                <DetailItem label="Hold Time" value={getHoldTime(trade)} />
              </div>
            
              <SectionTitle title="Size" icon={<FaDollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />} />
              <div className="space-y-3">
                <DetailItem label="Volume (Entry Value)" value={entryValue !== null ? `$${entryValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : '-'} />
                <DetailItem label="Quantity" value={trade.quantity?.toLocaleString()} />
                <DetailItem label="R-Multiple" value={trade.rMultiple !== undefined && trade.rMultiple !== null ? `${trade.rMultiple.toFixed(2)}R` : '-'} />
              </div>
            </>
          )}

          {activeTab === 'manage' && (
            <>
              <SectionTitle title="Notes & Analysis" icon={<FaEdit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />} />
              <div className="space-y-3">
                {trade.notes && <DetailItem label="Notes" value={<div className="text-right max-w-xs whitespace-pre-wrap">{trade.notes}</div>} />}
                {trade.setupDetails && <DetailItem label="Setup Details" value={<div className="text-right max-w-xs whitespace-pre-wrap">{trade.setupDetails}</div>} />}
                {trade.mistakesMade && <DetailItem label="Mistakes Made" value={<div className="text-right max-w-xs whitespace-pre-wrap">{trade.mistakesMade}</div>} />}
                {trade.lessonsLearned && <DetailItem label="Lessons Learned" value={<div className="text-right max-w-xs whitespace-pre-wrap">{trade.lessonsLearned}</div>} />}
              </div>
              
              {trade.imageUrl && (
                <div className="mt-6">
                    <SectionTitle title="Chart Attachment" icon={<FaChartLine className="w-5 h-5 text-teal-600 dark:text-teal-400" />} />
                    <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-gray-700/30 p-4 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200">
                        <div className="relative w-full rounded-xl overflow-hidden cursor-pointer" onClick={() => window.open(trade.imageUrl, '_blank')}>
                            <img 
                                src={trade.imageUrl} 
                                alt={`${trade.symbol} trade chart`} 
                                className="w-full h-auto max-h-64 object-contain hover:scale-105 transition-transform duration-300 rounded-xl" 
                            />
                        </div>
                    </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200/30 dark:border-gray-700/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <div className="flex space-x-4">
            <button 
              onClick={() => onEdit(trade.id)} 
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all duration-200 text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FaEdit className="w-4 h-4" />
              <span>Edit Trade</span>
            </button>
            <button 
              onClick={() => onDelete(trade.id)} 
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all duration-200 text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FaTrashAlt className="w-4 h-4" />
              <span>Delete Trade</span>
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