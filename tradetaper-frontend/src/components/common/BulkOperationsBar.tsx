"use client";
import React, { useState } from 'react';
import { Trade, TradeStatus } from '@/types/trade';
import { FaTrash, FaEdit, FaStar, FaRegStar, FaTimes, FaCheck } from 'react-icons/fa';

interface BulkOperationsBarProps {
  selectedTrades: Trade[];
  onClearSelection: () => void;
  onBulkDelete: (tradeIds: string[]) => void;
  onBulkUpdateStatus: (tradeIds: string[], status: TradeStatus) => void;
  onBulkToggleStar: (tradeIds: string[], starred: boolean) => void;
  isLoading?: boolean;
}

export default function BulkOperationsBar({
  selectedTrades,
  onClearSelection,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkToggleStar,
  isLoading = false
}: BulkOperationsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedTrades.length === 0) return null;

  const selectedIds = selectedTrades.map(trade => trade.id);
  const allStarred = selectedTrades.every(trade => trade.isStarred);

  const handleDelete = () => {
    if (confirmDelete) {
      onBulkDelete(selectedIds);
      setConfirmDelete(false);
      onClearSelection();
    } else {
      setConfirmDelete(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleStatusUpdate = (status: TradeStatus) => {
    onBulkUpdateStatus(selectedIds, status);
    setShowStatusMenu(false);
    onClearSelection();
  };

  const handleToggleStar = () => {
    onBulkToggleStar(selectedIds, !allStarred);
    onClearSelection();
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary shadow-lg rounded-lg border border-[var(--color-light-border)] dark:border-dark-border p-4 min-w-[400px]">
        <div className="flex items-center justify-between">
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
              {selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearSelection}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Clear selection"
            >
              <FaTimes className="h-3 w-3 text-gray-500" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Star Toggle */}
            <button
              onClick={handleToggleStar}
              disabled={isLoading}
              className="px-3 py-2 text-sm rounded-md bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 transition-colors disabled:opacity-50 flex items-center space-x-1"
              title={allStarred ? "Remove stars" : "Add stars"}
            >
              {allStarred ? <FaRegStar className="h-4 w-4" /> : <FaStar className="h-4 w-4" />}
              <span>{allStarred ? 'Unstar' : 'Star'}</span>
            </button>

            {/* Status Update */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isLoading}
                className="px-3 py-2 text-sm rounded-md bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                <FaEdit className="h-4 w-4" />
                <span>Status</span>
              </button>

              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-[var(--color-light-primary)] dark:bg-dark-secondary border border-[var(--color-light-border)] dark:border-dark-border rounded-md shadow-lg min-w-[120px]">
                  {Object.values(TradeStatus).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover transition-colors first:rounded-t-md last:rounded-b-md"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className={`px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 flex items-center space-x-1 ${
                confirmDelete
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
              title={confirmDelete ? "Click again to confirm deletion" : "Delete selected trades"}
            >
              {confirmDelete ? (
                <>
                  <FaCheck className="h-4 w-4" />
                  <span>Confirm</span>
                </>
              ) : (
                <>
                  <FaTrash className="h-4 w-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>

        {confirmDelete && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-xs text-red-700 dark:text-red-300">
              Click &quot;Confirm&quot; to permanently delete {selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 