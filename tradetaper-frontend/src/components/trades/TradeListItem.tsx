/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
// src/components/trades/TradeListItem.tsx
"use client";
import { Trade, TradeDirection, TradeStatus, Tag as TradeTagType } from '@/types/trade';
import { format } from 'date-fns'; // For formatting dates
import { useDispatch } from 'react-redux';
import { ICTConcept, TradingSession } from '@/types/enums';
import { AppDispatch } from '@/store/store';
import { deleteTrade, setCurrentTrade } from '@/store/features/tradesSlice';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa'; // Added FaEye for view
import { useTheme } from '@/context/ThemeContext'; // Import useTheme

interface TradeListItemProps {
  trade: Trade;
}

export default function TradeListItem({ trade }: TradeListItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { theme } = useTheme(); // Get current theme

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the trade for ${trade.symbol}?`)) {
      try {
        await dispatch(deleteTrade(trade.id)).unwrap();
      } catch (error: any) {
        alert(`Failed to delete trade: ${error.message || error}`);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setCurrentTrade(trade));
    router.push(`/trades/edit/${trade.id}`);
  };

  const handleViewDetails = () => {
    router.push(`/trades/view/${trade.id}`);
  };

  const directionText = trade.direction === TradeDirection.LONG ? '▲ LONG' : '▼ SHORT';
  const directionColor = trade.direction === TradeDirection.LONG ? 'text-accent-green' : 'text-accent-red';
  
  const statusBaseStyle = "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1.5";
  let statusClasses = "";
  const statusText = trade.status.charAt(0).toUpperCase() + trade.status.slice(1).toLowerCase();

  switch (trade.status) {
    case TradeStatus.OPEN:
      statusClasses = theme === 'dark' 
        ? "bg-yellow-500 bg-opacity-20 text-yellow-300" 
        : "bg-yellow-100 text-yellow-700"; 
      break;
    case TradeStatus.PENDING:
      statusClasses = theme === 'dark'
        ? "bg-blue-500 bg-opacity-20 text-blue-300"
        : "bg-blue-100 text-blue-700";
      break;
    case TradeStatus.CANCELLED:
      statusClasses = theme === 'dark'
        ? "bg-gray-600 bg-opacity-30 text-text-light-secondary"
        : "bg-gray-200 text-gray-600";
      break;
    default: // CLOSED (P/L based, same for both themes)
      statusClasses = (trade.profitOrLoss ?? 0) >= 0 
        ? "bg-accent-green bg-opacity-15 text-accent-green"
        : "bg-accent-red bg-opacity-15 text-accent-red";
      break;
  }

  const entryPriceDisplay = typeof trade.entryPrice === 'number' ? trade.entryPrice.toFixed(4) : 'N/A';
  const exitPriceDisplay = typeof trade.exitPrice === 'number' ? trade.exitPrice.toFixed(4) : 'N/A';
  const quantityDisplay = typeof trade.quantity === 'number' ? trade.quantity : 'N/A';
  const commissionDisplay = typeof trade.commission === 'number' ? trade.commission.toFixed(2) : 'N/A';
  const profitLossDisplay = typeof trade.profitOrLoss === 'number' ? trade.profitOrLoss.toFixed(2) : 'N/A';
  const rMultipleDisplay = typeof trade.rMultiple === 'number' ? `${trade.rMultiple.toFixed(2)}R` : 'N/A';

  let rMultipleColor = "text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary";
  if (typeof trade.rMultiple === 'number') {
    if (trade.rMultiple >= 2) rMultipleColor = "text-accent-green";
    else if (trade.rMultiple >= 1) rMultipleColor = "text-yellow-400";
    else if (trade.rMultiple < 1 && trade.rMultiple > 0) rMultipleColor = "text-orange-400";
    else if (trade.rMultiple <= 0) rMultipleColor = "text-accent-red";
  }

  // Helper to get enum value's display string or return key if not found (for ICTConcept/Session)
  const getDisplayValue = (enumObj: any, key: string | undefined) => {
    if (!key) return 'N/A';
    return enumObj[key as keyof typeof enumObj] || key;
  };
  
  const buttonBaseClasses = `py-2 px-3 rounded-md text-xs font-semibold transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-1.5 focus:ring-offset-[var(--color-light-primary)] dark:focus:ring-offset-dark-secondary`;
  
  const editButtonClasses = `border hover:bg-accent-green focus:ring-accent-green 
                           bg-transparent text-accent-green border-accent-green hover:text-[var(--color-light-primary)] 
                           dark:bg-dark-primary dark:text-accent-green dark:border-accent-green dark:hover:bg-accent-green dark:hover:text-dark-primary`;
                           
  const deleteButtonClasses = `border hover:bg-accent-red focus:ring-accent-red 
                             bg-transparent text-accent-red border-accent-red hover:text-[var(--color-light-primary)] 
                             dark:bg-dark-primary dark:text-accent-red dark:border-accent-red dark:hover:bg-accent-red dark:hover:text-dark-primary`;

  return (
    <div 
        className="bg-[var(--color-light-primary)] dark:bg-dark-secondary 
                   p-5 rounded-xl shadow-lg dark:shadow-card-modern 
                   hover:shadow-glow-green-sm dark:hover:shadow-glow-green-sm 
                   transition-all duration-200 ease-in-out group cursor-pointer"
        onClick={handleViewDetails}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-y-2">
        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-accent-green flex items-center">
            {trade.symbol} 
            <span className={`ml-3 text-sm font-medium ${directionColor}`}>{directionText}</span>
          </h3>
          <p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mt-0.5">Type: {trade.assetType}</p>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
            <span className={`${statusBaseStyle} ${statusClasses}`}>{statusText}</span>
            {trade.status === TradeStatus.CLOSED && (
                <p className={`text-lg font-semibold mt-1 ${(trade.profitOrLoss ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                   { (trade.profitOrLoss ?? 0) >= 0 ? '+' : ''}{profitLossDisplay}
                </p>
            )}
            {(trade.status === TradeStatus.CLOSED || trade.rMultiple !== undefined) && (
               <p className={`text-sm font-medium ${rMultipleColor}`}>
                 R:R: {rMultipleDisplay}
               </p>
            )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mt-4 text-sm text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
        <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Entry:</p><p>{format(new Date(trade.entryDate), 'dd MMM yy, HH:mm')}</p></div>
        <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Price:</p><p>{entryPriceDisplay}</p></div>
        
        {trade.exitDate && 
          <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Exit:</p><p>{format(new Date(trade.exitDate), 'dd MMM yy, HH:mm')}</p></div>
        }
        {trade.exitPrice !== undefined && 
          <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Price:</p><p>{exitPriceDisplay}</p></div>
        }
        <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Qty:</p><p>{quantityDisplay}</p></div>
        <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Comm:</p><p>{commissionDisplay}</p></div>
        
        {trade.ictConcept && (
          <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Concept:</p><p className="truncate" title={getDisplayValue(ICTConcept, trade.ictConcept)}>{getDisplayValue(ICTConcept, trade.ictConcept)}</p></div>
        )}
        {trade.session && (
          <div><p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Session:</p><p className="truncate" title={getDisplayValue(TradingSession, trade.session)}>{getDisplayValue(TradingSession, trade.session)}</p></div>
        )}
      </div>

      {(trade.tags && trade.tags.length > 0) || trade.notes || trade.imageUrl ? (
        <div className="mt-4 pt-4 border-t border-[var(--color-light-border)] dark:border-dark-primary space-y-3">
          {trade.tags && trade.tags.length > 0 && (
            <div>
              <p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary font-semibold mb-1.5">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {trade.tags.map(tag => (
                  <span key={tag.id} 
                        className="text-xs border border-accent-green border-opacity-30 px-2.5 py-1 rounded-full transition-all hover:border-transparent cursor-default 
                                   bg-[var(--color-light-secondary)] text-accent-green hover:bg-accent-green hover:text-[var(--color-text-dark-primary)] 
                                   dark:bg-dark-primary dark:text-accent-green dark:hover:bg-accent-green dark:hover:text-dark-primary">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {trade.notes && trade.notes.trim() !== '' && (
            <div>
              <p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary font-semibold mb-1">Notes:</p>
              <p className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary whitespace-pre-wrap break-words leading-relaxed">{trade.notes}</p>
            </div>
          )}

          {trade.imageUrl && (
            <div>
              <p className="text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary font-semibold mb-1.5">Chart:</p>
              <a href={trade.imageUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} 
                 className="block max-w-xs mx-auto sm:mx-0 rounded-lg overflow-hidden border border-[var(--color-light-border)] dark:border-dark-primary hover:opacity-90 transition-opacity">
                <img
                  src={trade.imageUrl}
                  alt={`Trade chart for ${trade.symbol}`}
                  className="w-full h-auto object-contain"
                />
              </a>
            </div>
          )}
        </div>
      ) : null }
      
      <div className="mt-5 flex justify-end space-x-2.5 items-center">
        <button onClick={handleEdit} className={`${buttonBaseClasses} ${editButtonClasses}`}> 
            <FaEdit /> <span>Edit</span>
        </button>
        <button onClick={handleDelete} className={`${buttonBaseClasses} ${deleteButtonClasses}`}>
          <FaTrashAlt /> <span>Delete</span>
        </button>
      </div>
    </div>
  );
}