"use client";
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { authApiClient } from '@/services/api';
import { FaTrash, FaDownload, FaTimes } from 'react-icons/fa';

interface BulkOperationsProps {
  selectedTradeIds: string[];
  onClearSelection: () => void;
  accountId?: string;
}

export default function BulkOperations({ selectedTradeIds, onClearSelection, accountId }: BulkOperationsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTradeIds.length} trades? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await authApiClient.post('/trades/bulk/delete', {
        tradeIds: selectedTradeIds,
      });
      
      // Refresh trades list
      dispatch(fetchTrades(accountId));
      onClearSelection();
      
      alert(`Successfully deleted ${selectedTradeIds.length} trades`);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete trades. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        format: exportFormat,
      });
      
      if (accountId) {
        params.append('accountId', accountId);
      }

      const response = await authApiClient.get(`/trades/export?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trades_export.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export trades. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedTradeIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700 z-50">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedTradeIds.length} trade{selectedTradeIds.length !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex space-x-2">
            <button
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTrash className="w-4 h-4" />
              <span>Delete</span>
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={onClearSelection}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <FaTimes className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Export Trades
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'xlsx')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-dark-primary text-gray-900 dark:text-gray-100"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 