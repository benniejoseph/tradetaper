"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import {
  selectAvailableAccounts,
  selectAccountsLoading,
  selectAccountsError,
  fetchAccounts,
  createAccount,
  updateAccountThunk,
  deleteAccountThunk,
  selectSelectedAccountId
} from '@/store/features/accountSlice';
import { 
  FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaExclamationTriangle,
  FaDollarSign, FaBuilding, FaCheck, FaCrown, FaUsers,
  FaChartLine, FaShieldAlt, FaSpinner
} from 'react-icons/fa';

interface AccountFormData {
  id?: string; // Present when editing
  name: string;
  balance: string; // Input as string, convert to number on save
  currency?: string;
  description?: string;
  target?: string; // Input as string, convert to number on save
}

const initialFormState: AccountFormData = {
  name: '',
  balance: '',
  currency: 'USD',
  description: '',
  target: ''
};

export default function ManageAccounts() {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector(selectAvailableAccounts);
  const isLoading = useSelector(selectAccountsLoading);
  const error = useSelector(selectAccountsError);
  const selectedAccountId = useSelector(selectSelectedAccountId);

  const [formData, setFormData] = useState<AccountFormData>(initialFormState);
  const [isEditing, setIsEditing] = useState<string | null>(null); // Holds ID of account being edited
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null); // Holds ID of account to delete

  // Fetch accounts on component mount
  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewAccount = () => {
    setIsEditing(null); // Ensure not in edit mode
    setFormData(initialFormState); // Reset form
    setShowAddForm(true);
  };

  const handleEditAccount = (account: typeof accounts[0]) => {
    setIsEditing(account.id);
    setFormData({
      id: account.id,
      name: account.name,
      balance: account.balance.toString(),
      currency: account.currency,
      description: account.description || '',
      target: account.target?.toString() || ''
    });
    setShowAddForm(true); // Re-use the same form for editing
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setShowAddForm(false);
    setFormData(initialFormState);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(formData.balance);
    if (isNaN(balanceNum) || formData.balance.trim() === '') {
      alert('Please enter a valid balance.');
      return;
    }
    if (!formData.name.trim()) {
        alert('Account name cannot be empty.');
        return;
    }

    try {
      if (isEditing && formData.id) {
        await dispatch(updateAccountThunk({ 
          id: formData.id, 
          name: formData.name.trim(), 
          balance: balanceNum,
          currency: formData.currency,
          description: formData.description?.trim() || undefined,
          target: formData.target ? parseFloat(formData.target) : undefined
        })).unwrap();
      } else {
        await dispatch(createAccount({ 
          name: formData.name.trim(), 
          balance: balanceNum,
          currency: formData.currency,
          description: formData.description?.trim() || undefined,
          target: formData.target ? parseFloat(formData.target) : undefined
        })).unwrap();
      }
      handleCancelEdit(); // Close form and reset
    } catch (error) {
      console.error('Failed to save account:', error);
      alert('Failed to save account. Please try again.');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!accountId) return; // Guard against null/undefined id
    try {
      await dispatch(deleteAccountThunk(accountId)).unwrap();
      setShowConfirmDelete(null); // Close confirmation
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-red-200/50 dark:border-red-700/50 shadow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
              <FaExclamationTriangle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Accounts Service Setup Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error.includes('404') || error.includes('Not Found') 
                  ? 'The accounts feature is being deployed. Please check back in a few minutes.' 
                  : error}
              </p>
              <button 
                onClick={() => dispatch(fetchAccounts())}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add/Edit Form Card */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-blue-50/50 to-green-50/50 dark:from-blue-900/20 dark:to-green-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50 p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              {isEditing ? <FaEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <FaPlus className="w-5 h-5 text-green-600 dark:text-green-400" />}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Account' : 'Add New Account'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? 'Update your account information' : 'Create a new trading account'}
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Name
              </label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter account name"
                  required 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Balance
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  inputMode="decimal" 
                  pattern="[0-9]*[.,]?[0-9]*" 
                  name="balance" 
                  value={formData.balance} 
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="0.00"
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <input 
                type="text" 
                name="currency" 
                value={formData.currency || 'USD'} 
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="USD"
                maxLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  inputMode="decimal" 
                  pattern="[0-9]*[.,]?[0-9]*" 
                  name="target" 
                  value={formData.target || ''} 
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Target amount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea 
                name="description" 
                value={formData.description || ''} 
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Account description..."
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-500 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                <FaTimes className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes' : 'Add Account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl">
              <FaUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Accounts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{accounts.length} account{accounts.length !== 1 ? 's' : ''} configured</p>
            </div>
          </div>
          
          {!showAddForm && (
            <button 
              onClick={handleAddNewAccount}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              <FaPlus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>

        {isLoading && accounts.length === 0 ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                <FaSpinner className="w-10 h-10 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Loading Accounts...</h3>
                <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your accounts.</p>
              </div>
            </div>
          </div>
        ) : accounts.length === 0 && !showAddForm ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                <FaBuilding className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Accounts Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by adding your first trading account to track your performance.
                </p>
                <button 
                  onClick={handleAddNewAccount}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                  <FaPlus className="w-4 h-4" />
                  <span>Add Your First Account</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {accounts.map(account => (
              <div 
                key={account.id} 
                className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border ${
                  account.id === selectedAccountId 
                    ? 'border-green-300 dark:border-green-600 shadow-lg shadow-green-500/20' 
                    : 'border-gray-200/50 dark:border-gray-700/50'
                } p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
                
                {/* Selected Badge */}
                {account.id === selectedAccountId && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white p-2 rounded-full shadow-lg">
                    <FaCrown className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${
                      account.id === selectedAccountId 
                        ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20' 
                        : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20'
                    }`}>
                      <FaBuilding className={`w-6 h-6 ${
                        account.id === selectedAccountId 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-xl font-semibold ${
                          account.id === selectedAccountId 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {account.name}
                        </h4>
                        {account.id === selectedAccountId && (
                          <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                            <FaCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {account.currency} {Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {account.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{account.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEditAccount(account)}
                      disabled={isLoading}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setShowConfirmDelete(account.id)}
                      disabled={isLoading}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 space-y-6 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Account</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this account? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowConfirmDelete(null)}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-500 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400 hover:text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteAccount(showConfirmDelete)}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 