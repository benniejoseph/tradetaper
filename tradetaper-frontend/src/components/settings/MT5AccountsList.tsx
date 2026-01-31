"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { 
  fetchMT5Accounts,
  selectMT5Accounts,
  selectMT5AccountsLoading,
  deleteMT5Account,
  syncMT5Account,
  createMT5Account,
  updateMT5Account
} from '@/store/features/mt5AccountsSlice';
import { MT5Account } from '@/types/mt5Account';
import { 
  FaPlus, FaEdit, FaTrash, FaSync, FaExclamationTriangle,
  FaServer, FaUser, FaMoneyBill, FaCheck, FaTimes, FaCalendarAlt,
  FaSpinner
} from 'react-icons/fa';
import MT5AccountForm from './MT5AccountForm';
import TerminalStatusCard from './TerminalStatusCard';

const MT5AccountsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector(selectMT5Accounts);
  const isLoading = useSelector(selectMT5AccountsLoading);
  
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MT5Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMT5Accounts());
  }, [dispatch]);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEditAccount = (account: MT5Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await dispatch(deleteMT5Account(id)).unwrap();
      setConfirmDelete(null);
      await dispatch(fetchMT5Accounts());
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const handleSyncAccount = async (id: string) => {
    try {
      setSyncingAccount(id);
      await dispatch(syncMT5Account(id)).unwrap();
      await dispatch(fetchMT5Accounts());
    } catch (err) {
      console.error('Error syncing account:', err);
    } finally {
      setSyncingAccount(null);
    }
  };

  const handleSaveAccount = async (formData: any) => {
    try {
      if (editingAccount) {
        await dispatch(updateMT5Account({
          id: editingAccount.id,
          data: formData
        })).unwrap();
      } else {
        await dispatch(createMT5Account(formData)).unwrap();
      }
      setShowForm(false);
      setEditingAccount(null);
      dispatch(fetchMT5Accounts());
    } catch (err) {
      console.error('Failed to save account:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-8">
      {/* Add/Edit Account Form */}
      {showForm && (
        <MT5AccountForm 
          account={editingAccount}
          onSubmit={handleSaveAccount}
          onCancel={handleCancelForm}
          isSubmitting={isLoading}
        />
      )}

      {/* MT5 Accounts List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <FaServer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">MT5 Accounts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
          
          {!showForm && (
            <button 
              onClick={handleAddAccount}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>

        {isLoading && accounts.length === 0 ? (
          <div className="flex justify-center py-10">
            <FaSpinner className="animate-spin h-10 w-10 text-emerald-500" />
          </div>
        ) : accounts.length === 0 && !showForm ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                <FaServer className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No MT5 accounts connected</h3>
                <p className="text-gray-600 dark:text-gray-400">Connect your MT5 accounts to sync your trading data.</p>
              </div>
              <button 
                onClick={handleAddAccount}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Your First Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-2xl"
              >
                {/* Delete Confirmation */}
                {confirmDelete === account.id && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 p-6">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <FaExclamationTriangle className="w-8 h-8 text-red-500" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account?</h4>
                      <p className="text-gray-600 dark:text-gray-400">This will remove "{account.accountName}".</p>
                      <div className="flex space-x-3 justify-center">
                        <button onClick={() => setConfirmDelete(null)} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium">Cancel</button>
                        <button onClick={() => handleDeleteAccount(account.id)} className="px-5 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium">Delete</button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-green-500/20">
                        <FaServer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{account.accountName}</h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center"><FaUser className="mr-1 w-3 h-3" /> {account.login}</span>
                          <span>|</span>
                          <span>{account.server}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <FaMoneyBill className="w-4 h-4 text-emerald-500" />
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {(account.balance ?? 0).toLocaleString(undefined, { 
                            style: 'currency', 
                            currency: account.currency || 'USD'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaCalendarAlt className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Last sync: {formatDate(account.lastSyncAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSyncAccount(account.id)}
                      disabled={syncingAccount === account.id}
                      className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                      title="Sync Account"
                    >
                      <FaSync className={`w-5 h-5 ${syncingAccount === account.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleEditAccount(account)}
                      className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      title="Edit Account"
                    >
                      <FaEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(account.id)}
                      className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors"
                      title="Delete Account"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <TerminalStatusCard 
                    accountId={account.id} 
                    accountName={account.accountName} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MT5AccountsList;