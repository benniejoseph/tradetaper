"use client";

import { Trade, TradeStatus, UpdateTradePayload } from '@/types/trade';
import { FaTimes, FaEdit, FaTrashAlt, FaExternalLinkAlt, FaShareSquare, FaStar as FaStarSolid, FaRegStar as FaStarOutline } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { getWeekday, getHoldTime, formatPrice } from './TradesTable';
import Image from 'next/image';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { updateTrade } from '@/store/features/tradesSlice';

interface TradePreviewDrawerProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tradeId: string) => void;
  onDelete: (tradeId: string) => void;
}

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
  const [activeTab, setActiveTab] = useState<'details' | 'manage'>('details');

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
  const statusColor = isWin ? 'bg-green-500/80' : isLoss ? 'bg-red-500/80' : 'bg-gray-500/80';
  const pnlPercentage = calculatePnlPercentage(trade);
  const entryValue = trade.entryPrice && trade.quantity ? trade.entryPrice * trade.quantity : null;

  const DetailItem: React.FC<{ label: string; value: string | number | React.ReactNode | null | undefined; valueClass?: string; containerClass?: string }> = 
    ({ label, value, valueClass, containerClass }) => (
    <div className={`flex justify-between py-2.5 ${containerClass || 'border-b border-[var(--color-light-border)] dark:border-dark-border'}`}>
      <span className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">{label}</span>
      <span className={`text-sm text-right ${valueClass || 'text-[var(--color-text-dark-primary)] dark:text-text-light-primary'}`}>{value ?? '-'}</span>
    </div>
  );

  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h4 className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 mt-4 mb-1 tracking-wider">{title}</h4>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex justify-end z-40 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className="w-full max-w-lg h-full bg-white/80 dark:bg-dark-primary/80 backdrop-blur-lg shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0" 
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-light-border)] dark:border-dark-border">
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
                <h2 className="text-2xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">{trade.symbol}</h2>
                <div className="flex items-center space-x-2 text-xs mt-1">
                    <span className={`px-2.5 py-1 rounded-md text-white text-[11px] font-medium ${statusColor}`}>{statusText}</span>
                    <span className="px-2.5 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary text-[11px] font-medium">{trade.direction}</span>
                </div>
            </div>
            <div className="flex items-center space-x-1.5">
                <button onClick={handleToggleStar} className="p-2 rounded-full hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover focus:outline-none">
                    {trade.isStarred ? 
                        <FaStarSolid className="h-5 w-5 text-yellow-400 hover:text-yellow-500" /> : 
                        <FaStarOutline className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
                    }
                </button>
                {/* Placeholder for Share Icon */}
                <button className="p-2 rounded-full hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover focus:outline-none">
                    <FaShareSquare className="h-5 w-5 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary" />
                </button>
                <button className="p-2 rounded-full hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover focus:outline-none">
                    <FaExternalLinkAlt className="h-5 w-5 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary" />
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover focus:outline-none">
                  <FaTimes className="h-5 w-5 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary" />
                </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-x-4">
            <span>Opened: {trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM yy, HH:mm') : '-'}</span>
            {trade.status === TradeStatus.CLOSED && trade.exitDate && (
                <span>Closed: {format(parseISO(trade.exitDate), 'dd MMM yy, HH:mm')}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-[var(--color-light-border)] dark:border-dark-border flex space-x-1">
            <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 px-3 text-sm font-medium 
                ${activeTab === 'details' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                Details
            </button>
            <button 
                onClick={() => setActiveTab('manage')}
                className={`py-3 px-3 text-sm font-medium 
                ${activeTab === 'manage' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
                Manage
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow p-5 overflow-y-auto space-y-3 text-sm">
          {activeTab === 'details' && (
            <>
              <div className="bg-[var(--color-light-secondary)] dark:bg-dark-tertiary p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-0.5">Net P&L</p>
                    {pnlPercentage !== null && (
                        <span className={`text-xs font-medium ${pnlPercentage > 0 ? 'text-green-500' : pnlPercentage < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                            {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                        </span>
                    )}
                </div>
                <span className={`text-2xl font-bold ${isWin ? 'text-green-600 dark:text-green-400' : isLoss ? 'text-red-600 dark:text-red-400' : 'text-[var(--color-text-dark-primary)] dark:text-text-light-primary'}`}>
                    {trade.profitOrLoss !== undefined && trade.profitOrLoss !== null ? `${trade.profitOrLoss > 0 ? '+' : ''}${trade.profitOrLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                </span>
              </div>

              <SectionTitle title="Performance" />
              <DetailItem label="P&L (Gross)" value={trade.profitOrLoss !== undefined && trade.profitOrLoss !== null && trade.commission !== undefined && trade.commission !== null ? (trade.profitOrLoss + trade.commission).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'} />
              <DetailItem label="Fees" value={trade.commission !== undefined && trade.commission !== null ? (-trade.commission).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'} />
              <DetailItem label="Funding" value="$0.00" /> {/* Design shows $0 */}
              <DetailItem label="Max Favorable Excursion (MFE)" value={<span className="text-gray-400 dark:text-gray-500">- (Future Feature)</span>} />
              <DetailItem label="Max Adverse Excursion (MAE)" value={<span className="text-gray-400 dark:text-gray-500">- (Future Feature)</span>} />
              <DetailItem label="Leverage Used" value={<span className="text-gray-400 dark:text-gray-500">- (Future Feature)</span>} />

              <SectionTitle title="Entry / Exit" />
              <DetailItem label="Entry Price" value={formatPrice(trade.entryPrice)} valueClass="font-mono" />
              <DetailItem label="Exit Price" value={formatPrice(trade.exitPrice)} valueClass="font-mono" />

              <SectionTitle title="Time" />
              <DetailItem label="Weekday" value={getWeekday(trade.entryDate)} />
              <DetailItem label="Session" value={trade.session || '-'} />
              <DetailItem label="Hold Time" value={getHoldTime(trade)} />
            
              <SectionTitle title="Size" />
              <DetailItem label="Volume (Entry Value)" value={entryValue !== null ? `$${entryValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : '-'} />
              <DetailItem label="Quantity" value={trade.quantity?.toLocaleString()} />
              <DetailItem label="R-Multiple" value={trade.rMultiple !== undefined && trade.rMultiple !== null ? trade.rMultiple.toFixed(2) : '-'} />
            </>
          )}

          {activeTab === 'manage' && (
            <>
              <SectionTitle title="Notes & Analysis" />
              {trade.notes && <DetailItem label="Notes" value={trade.notes} containerClass="py-2"/>}
              {trade.setupDetails && <DetailItem label="Setup Details" value={trade.setupDetails} containerClass="py-2"/>}
              {trade.mistakesMade && <DetailItem label="Mistakes Made" value={trade.mistakesMade} containerClass="py-2"/>}
              {trade.lessonsLearned && <DetailItem label="Lessons Learned" value={trade.lessonsLearned} containerClass="py-2"/>}
              
              {trade.imageUrl && (
                <div className="mt-3">
                    <SectionTitle title="Image Attachment" />
                    <div className="mt-2 relative w-full aspect-[16/9] rounded-md overflow-hidden">
                        <Image src={trade.imageUrl} alt={`${trade.symbol} trade chart`} layout="fill" objectFit="cover" />
                    </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-[var(--color-light-border)] dark:border-dark-border flex space-x-3 bg-[var(--color-light-primary)] dark:bg-dark-primary">
          <button 
            onClick={() => onEdit(trade.id)} 
            className="flex-1 py-2.5 px-4 rounded-lg bg-accent-blue hover:bg-accent-blue-darker text-gray-900 dark:text-white font-semibold transition-colors text-sm flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
          >
            <FaEdit />
            <span>Edit</span>
          </button>
          <button 
            onClick={() => onDelete(trade.id)} 
            className="flex-1 py-2.5 px-4 rounded-lg bg-accent-red hover:bg-accent-red-darker text-gray-900 dark:text-white font-semibold transition-colors text-sm flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
          >
            <FaTrashAlt />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
} 