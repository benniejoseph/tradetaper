/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
// src/components/trades/TradeListItem.tsx
"use client";
import { Trade, TradeDirection, TradeStatus, Tag as TradeTagType } from '@/types/trade';
import { format } from 'date-fns'; // For formatting dates
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { deleteTrade, setCurrentTrade } from '@/store/features/tradesSlice';
import { useRouter } from 'next/navigation';


interface TradeListItemProps {
  trade: Trade;
}

export default function TradeListItem({ trade }: TradeListItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the trade for ${trade.symbol}?`)) {
      try {
        await dispatch(deleteTrade(trade.id)).unwrap(); // unwrap() will throw if rejected
        // Optionally show a success message
      } catch (error: any) {
        alert(`Failed to delete trade: ${error.message || error}`);
      }
    }
  };

  // const handleEdit = () => {
  //   dispatch(setCurrentTrade(trade)); // Set current trade for editing
  //   router.push(`/trades/edit/${trade.id}`); // Navigate to edit page
  // };

  const handleViewDetails = () => {
    // We don't strictly need to set currentTrade here if view page fetches its own,
    // but it can sometimes make the transition feel faster if data is already partly there.
    // For a clean fetch on the view page, this dispatch might be omitted.
    // dispatch(setCurrentTrade(trade));
    router.push(`/trades/view/${trade.id}`);
  };

  const handleViewOrEdit = () => {
    dispatch(setCurrentTrade(trade)); // Ensure currentTrade is set for edit page
    router.push(`/trades/edit/${trade.id}`);
  };

  const directionColor = trade.direction === TradeDirection.LONG ? 'text-green-500' : 'text-red-500';
  const statusColor = trade.status === TradeStatus.CLOSED ? ( (trade.profitOrLoss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400') : 'text-yellow-400';
  const entryPriceDisplay = typeof trade.entryPrice === 'number' ? trade.entryPrice.toFixed(4) : 'N/A';
  const exitPriceDisplay = typeof trade.exitPrice === 'number' ? trade.exitPrice.toFixed(4) : 'N/A';
  const quantityDisplay = typeof trade.quantity === 'number' ? trade.quantity : 'N/A';
  const commissionDisplay = typeof trade.commission === 'number' ? trade.commission.toFixed(2) : 'N/A';
  const profitLossDisplay = typeof trade.profitOrLoss === 'number' ? trade.profitOrLoss.toFixed(2) : 'N/A';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow mb-4 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-blue-400">{trade.symbol} <span className={`text-sm ${directionColor}`}>({trade.direction})</span></h3>
          <p className="text-xs text-gray-400">Type: {trade.assetType}</p>
        </div>
        <div className="text-right">
            <p className={`text-lg font-medium ${statusColor}`}>
                {trade.status}
                {trade.status === TradeStatus.CLOSED && trade.profitOrLoss !== undefined && (
                    ` P/L: ${trade.profitOrLoss.toFixed(2)}`
                )}
            </p>
            <p className="text-xs text-gray-500">ID: {trade.id.substring(0,8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
        <div>
          <p className="text-gray-400">Entry Date:</p>
          <p>{format(new Date(trade.entryDate), 'MMM dd, yyyy HH:mm')}</p>
        </div>
        <div>
          <p className="text-gray-400">Entry Price:</p>
          <p>{entryPriceDisplay}</p>
        </div>
        {trade.exitDate && (
          <div>
            <p className="text-gray-400">Exit Date:</p>
            <p>{format(new Date(trade.exitDate), 'MMM dd, yyyy HH:mm')}</p>
          </div>
        )}
        {trade.exitPrice !== undefined && (
          <div>
            <p className="text-gray-400">Exit Price:</p>
            <p>{exitPriceDisplay}</p>
          </div>
        )}
        <div><p className="text-gray-400">Quantity:</p><p>{trade.quantity}</p></div>
        <div><p className="text-gray-400">Commission:</p><p>{typeof trade.commission === 'number' ? trade.commission.toFixed(2) : 'N/A'}</p></div>
      </div>

      {trade.tags && trade.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm font-semibold mb-1">Tags:</p>
          <div className="flex flex-wrap gap-2">
            {trade.tags.map(tag => (
              <span key={tag.id} className="text-xs bg-sky-700 hover:bg-sky-600 text-sky-100 px-2 py-1 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {trade.notes && (
        <div className="mt-3">
          <p className="text-gray-400 text-sm">Notes:</p>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {trade.strategyTag && <p className="text-xs text-gray-400 mt-2">Strategy: {trade.strategyTag}</p>}
      {/* {trade.imageUrl && (
          <div className="mt-2">
              <img src={trade.imageUrl} alt="Trade chart" className="max-w-xs rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
      )} */}
      {trade.imageUrl && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm font-semibold mb-1">Attached Image:</p>
          <a href={trade.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={trade.imageUrl}
              alt={`Trade chart for ${trade.symbol}`}
              className="max-w-full md:max-w-md h-auto rounded-md border border-gray-600 object-contain hover:opacity-80 transition-opacity"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.currentTarget;
                target.onerror = null; // Prevent infinite loop if fallback also fails
                target.style.display = 'none'; // Hide broken image icon
                // Optionally, display a placeholder or text
                const parent = target.parentElement;
                if (parent) {
                    const errorText = document.createElement('p');
                    errorText.className = 'text-xs text-red-400';
                    errorText.textContent = 'Image could not be loaded.';
                    parent.appendChild(errorText);
                }
              }}
            />
          </a>
        </div>
      )}
      
      {/* Edit Delete Buttons */}

      <div className="mt-4 flex justify-end space-x-3">
        <button onClick={handleViewDetails} className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded">
          View Details
        </button>
        {/* Keep edit button if you want direct edit from list, or remove it */}
        {/* <button onClick={handleViewOrEdit} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded">
            Edit
        </button> */}
        <button onClick={handleDelete} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded">
          Delete
        </button>
      </div>

    </div>
  );
}