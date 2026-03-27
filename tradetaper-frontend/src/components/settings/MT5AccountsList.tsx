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
  CreateMT5AccountPayload,
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
import { authApiClient } from '@/services/api';
import { useCurrency } from '@/hooks/useCurrency';
import { MT5_SLOT_PRICE } from '@/config/pricing';

interface MT5AccountsListProps {
  hideAddButton?: boolean;
}

const MT5AccountsList: React.FC<MT5AccountsListProps> = ({ hideAddButton = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector(selectMT5Accounts);
  const isLoading = useSelector(selectMT5AccountsLoading);
  const { currency } = useCurrency();
  
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MT5Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [limits, setLimits] = useState<{ used: number; max: number; extraSlots: number } | null>(null);
  const [buyingSlot, setBuyingSlot] = useState(false);

  useEffect(() => {
    dispatch(fetchMT5Accounts());
    fetchLimits();
  }, [dispatch]);

  const fetchLimits = async () => {
    try {
      const res = await authApiClient.get('/mt5-accounts/limits');
      setLimits(res.data);
    } catch (err) {
      console.error('Failed to fetch MT5 limits', err);
    }
  };

  const handleBuySlot = async () => {
    setBuyingSlot(true);
    try {
      const res = await authApiClient.post('/subscriptions/addon/mt5-slot');
      const order = res.data;
      
      const razorpayWindow = window as Window & {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void };
      };
      const rzp = new razorpayWindow.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId || order.id,
        name: 'TradeTaper',
        description: 'Extra MT5 Account Slot',
        handler: function () {
          // Success! Wait 2s for webhook to process, then refresh
          setTimeout(() => {
            fetchLimits();
          }, 2000);
        }
      });
      rzp.open();
    } catch (err) {
      console.error('Payment intent failed:', err);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setBuyingSlot(false);
    }
  };


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

  const handleSaveAccount = async (formData: CreateMT5AccountPayload) => {
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
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
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
        
          {/* Account Limits & Add button */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            {limits && (
              <div className="text-sm px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-center sm:text-left">
                <span className="font-semibold text-gray-900 dark:text-white">{limits.used}</span> / {limits.max} Slots Used
              </div>
            )}
            {!hideAddButton && !showForm && limits && limits.used < limits.max && (
              <button
                onClick={handleAddAccount}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <FaPlus className="h-3 w-3" />
                <span>Add Account</span>
              </button>
            )}
            {!showForm && limits && limits.used >= limits.max && (
              <button
                onClick={handleBuySlot}
                disabled={buyingSlot}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {buyingSlot ? <FaSpinner className="h-3 w-3 animate-spin" /> : <FaPlus className="h-3 w-3" />}
                <span>Buy Extra Slot ({MT5_SLOT_PRICE[currency.code].label})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 shadow-sm">
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
          {!hideAddButton ? (
            <button 
              onClick={handleAddAccount}
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              Connect Account
            </button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use the global <strong>Add Account</strong> button to connect an account.
            </p>
          )}
        </div>
      )}

      {/* Accounts */}
      {accounts.length > 0 && !showForm && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50 md:hidden">
            {accounts.map((account) => (
              <div key={account.id} className="space-y-3 p-4">
                <div
                  className="flex cursor-pointer items-start justify-between gap-3"
                  onClick={() => toggleExpand(account.id)}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate font-semibold text-gray-900 dark:text-white">
                        {account.accountName}
                      </h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          account.accountCategory === 'prop_firm'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {account.accountCategory === 'prop_firm' ? 'Prop Firm' : 'Personal'}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <FaUser className="mr-1 h-3 w-3 opacity-70" /> {account.login}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{account.server}</p>
                  </div>
                  <button
                    onClick={(e) => handleSetDefaultAccount(account.id, e)}
                    className={`rounded p-1.5 transition-colors ${
                      account.isDefault
                        ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        : 'text-gray-300 hover:bg-gray-50 hover:text-yellow-500 dark:text-gray-600 dark:hover:bg-gray-800'
                    }`}
                    title={account.isDefault ? 'Default Account' : 'Make Default'}
                  >
                    {account.isDefault ? <FaStar className="h-5 w-5" /> : <FaRegStar className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {account.currency} {(account.balance ?? 0).toLocaleString()}
                  </div>
                  <button
                    onClick={() => toggleExpand(account.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        account.connectionStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                    {(account.connectionStatus || 'disconnected').toLowerCase()}
                    {expandedAccountId === account.id ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {confirmDelete === account.id ? (
                    <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/40 dark:bg-red-900/10">
                      <span className="text-xs font-medium text-red-600 dark:text-red-300">Delete this account?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleSyncAccount(account.id, e)}
                        disabled={syncingAccount === account.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        title="Sync Account Now"
                      >
                        <FaSync className={`h-3 w-3 ${syncingAccount === account.id ? 'animate-spin' : ''}`} />
                        Sync
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAccount(account);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        title="Edit Account"
                      >
                        <FaEdit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(account.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                        title="Delete Account"
                      >
                        <FaTrash className="h-3 w-3" />
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {expandedAccountId === account.id && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                    <MetaApiStatusCard account={account} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Account</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Server</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Balance</th>
                  <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Default</th>
                  <th className="px-5 py-3 text-center font-medium text-gray-500 dark:text-gray-400">MetaApi Status</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {accounts.map((account) => (
                  <React.Fragment key={account.id}>
                    <tr
                      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                        expandedAccountId === account.id ? 'bg-gray-50 dark:bg-gray-800/30' : ''
                      }`}
                      onClick={() => toggleExpand(account.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                          {account.accountName}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                              account.accountCategory === 'prop_firm'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {account.accountCategory === 'prop_firm' ? 'Prop Firm' : 'Personal'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <FaUser className="mr-1 h-3 w-3 opacity-70" /> {account.login}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{account.server}</td>
                      <td className="px-5 py-3 font-mono font-medium text-gray-900 dark:text-white">
                        {account.currency} {(account.balance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleSetDefaultAccount(account.id, e)}
                          className={`rounded p-1.5 transition-colors ${
                            account.isDefault
                              ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-gray-300 hover:bg-gray-50 hover:text-yellow-500 dark:text-gray-600 dark:hover:bg-gray-800'
                          }`}
                          title={account.isDefault ? 'Default Account' : 'Make Default'}
                        >
                          {account.isDefault ? <FaStar className="h-5 w-5 drop-shadow-sm" /> : <FaRegStar className="h-5 w-5" />}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleExpand(account.id)}
                          className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                account.connectionStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-gray-400'
                              }`}
                            />
                            {(account.connectionStatus || 'disconnected').toLowerCase()}
                          </span>
                          {expandedAccountId === account.id ? <FaChevronUp className="ml-2 h-3 w-3" /> : <FaChevronDown className="ml-2 h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {confirmDelete === account.id ? (
                          <div className="animate-fadeIn flex items-center justify-end gap-2">
                            <span className="mr-1 text-xs font-medium text-red-500">Sure?</span>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={(e) => handleSyncAccount(account.id, e)}
                              disabled={syncingAccount === account.id}
                              className="rounded p-1.5 text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              title="Sync Account Now"
                            >
                              <FaSync className={`h-4 w-4 ${syncingAccount === account.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAccount(account);
                              }}
                              className="rounded p-1.5 text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              title="Edit Account"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(account.id);
                              }}
                              className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete Account"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {expandedAccountId === account.id && (
                      <tr>
                        <td colSpan={6} className="animate-slideDown border-b border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/20">
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
