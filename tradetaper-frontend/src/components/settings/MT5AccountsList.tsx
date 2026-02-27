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
  updateMT5Account,
  setDefaultMT5Account,
  MT5Account
} from '@/store/features/mt5AccountsSlice';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSync,
  FaServer,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaStar,
  FaRegStar,
} from 'react-icons/fa';
import MT5AccountForm from './MT5AccountForm';
import MetaApiStatusCard from './MetaApiStatusCard';

const MT5AccountsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector(selectMT5Accounts);
  const isLoading = useSelector(selectMT5AccountsLoading);
  
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MT5Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

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

  const handleSetDefaultAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dispatch(setDefaultMT5Account(id)).unwrap();
    } catch (err) {
      console.error('Failed to set default account:', err);
    }
  };

  const handleSyncAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const toggleExpand = (id: string) => {
    setExpandedAccountId(expandedAccountId === id ? null : id);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <FaServer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">MetaApi Accounts</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
               Connect MT4/MT5 accounts with full-history sync via MetaApi
            </p>
          </div>
        </div>
        
        {!showForm && (
          <button 
            onClick={handleAddAccount}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FaPlus className="w-3 h-3" />
            <span>Add Account</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingAccount ? 'Edit Account' : 'Connect New Account'}
          </h4>
          <MT5AccountForm 
            account={editingAccount}
            onSubmit={handleSaveAccount}
            onCancel={handleCancelForm}
            isSubmitting={isLoading}
          />
        </div>
      )}

      {/* Initial Loading */}
      {isLoading && accounts.length === 0 && (
         <div className="flex justify-center py-10">
           <FaSpinner className="animate-spin h-8 w-8 text-emerald-500" />
         </div>
      )}

      {/* Empty State */}
      {!isLoading && accounts.length === 0 && !showForm && (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <FaServer className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-gray-900 dark:text-white font-medium">No accounts connected</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add an MT5 account to start syncing trades.</p>
          <button 
            onClick={handleAddAccount}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Connect Account
          </button>
        </div>
      )}

      {/* Compact Table */}
      {accounts.length > 0 && !showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                   <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Account</th>
                   <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Server</th>
                   <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Balance</th>
                   <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-center">Default</th>
                   <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-center">MetaApi Status</th>
                   <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {accounts.map((account) => (
                  <React.Fragment key={account.id}>
                    <tr 
                      className={`
                        hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer
                        ${expandedAccountId === account.id ? 'bg-gray-50 dark:bg-gray-800/30' : ''}
                      `}
                      onClick={() => toggleExpand(account.id)}
                    >
                      <td className="px-5 py-3">
                         <div className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                           {account.accountName}
                         </div>
                         <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                            <FaUser className="w-3 h-3 mr-1 opacity-70" /> {account.login}
                         </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {account.server}
                      </td>
                      <td className="px-5 py-3 font-mono font-medium text-gray-900 dark:text-white">
                        {account.currency} {(account.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleSetDefaultAccount(account.id, e)}
                          className={`p-1.5 rounded transition-colors ${account.isDefault ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                          title={account.isDefault ? "Default Account" : "Make Default"}
                        >
                          {account.isDefault ? (
                            <FaStar className="w-5 h-5 drop-shadow-sm" />
                          ) : (
                            <FaRegStar className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleExpand(account.id)}
                          className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                account.connectionStatus === 'CONNECTED'
                                  ? 'bg-emerald-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            {(account.connectionStatus || 'disconnected').toLowerCase()}
                          </span>
                          {expandedAccountId === account.id ? (
                            <FaChevronUp className="ml-2 w-3 h-3" />
                          ) : (
                            <FaChevronDown className="ml-2 w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {confirmDelete === account.id ? (
                           <div className="flex items-center justify-end space-x-2 animate-fadeIn">
                             <span className="text-xs text-red-500 font-medium mr-1">Sure?</span>
                             <button 
                               onClick={() => handleDeleteAccount(account.id)}
                               className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                             >
                               Yes
                             </button>
                             <button 
                               onClick={() => setConfirmDelete(null)}
                               className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors hover:bg-gray-300"
                             >
                               No
                             </button>
                           </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => handleSyncAccount(account.id, e)}
                              disabled={syncingAccount === account.id}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                              title="Sync Account Now"
                            >
                              <FaSync className={`w-4 h-4 ${syncingAccount === account.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditAccount(account); }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                              title="Edit Account"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(account.id); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete Account"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Row — MetaApi Status only */}
                    {expandedAccountId === account.id && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50/50 dark:bg-gray-800/20 p-4 border-b border-gray-100 dark:border-gray-800 animate-slideDown">
                          <MetaApiStatusCard account={account} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MT5AccountsList;
