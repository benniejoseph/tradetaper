"use client";

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import {
  selectAvailableAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  selectSelectedAccountId
} from '@/store/features/accountSlice';
import { 
  FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaExclamationTriangle,
  FaDollarSign, FaBuilding, FaCheck, FaCrown, FaUsers,
  FaChartLine, FaShieldAlt
} from 'react-icons/fa';

interface AccountFormData {
  id?: string; // Present when editing
  name: string;
  balance: string; // Input as string, convert to number on save
}

const initialFormState: AccountFormData = {
  name: '',
  balance: ''
};

export default function ManageAccounts() {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector(selectAvailableAccounts);
  const selectedAccountId = useSelector(selectSelectedAccountId);

  const [formData, setFormData] = useState<AccountFormData>(initialFormState);
  const [isEditing, setIsEditing] = useState<string | null>(null); // Holds ID of account being edited
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null); // Holds ID of account to delete

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    });
    setShowAddForm(true); // Re-use the same form for editing
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setShowAddForm(false);
    setFormData(initialFormState);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
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

    if (isEditing && formData.id) {
      dispatch(updateAccount({ id: formData.id, name: formData.name.trim(), balance: balanceNum }));
    } else {
      dispatch(addAccount({ name: formData.name.trim(), balance: balanceNum }));
    }
    handleCancelEdit(); // Close form and reset
  };

  const handleDeleteAccount = (accountId: string) => {
    if (!accountId) return; // Guard against null/undefined id
    dispatch(deleteAccount(accountId));
    setShowConfirmDelete(null); // Close confirmation
  };

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
                Initial Balance (USD)
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
            
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-500 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105">
                <FaTimes className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button 
                type="submit"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                <FaSave className="w-4 h-4" />
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
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
              <FaPlus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>

        {accounts.length === 0 && !showAddForm ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto">
                <FaBuilding className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No accounts yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your first trading account to get started.
                </p>
              </div>
              <button 
                onClick={handleAddNewAccount}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                <FaPlus className="w-4 h-4" />
                <span>Add Your First Account</span>
              </button>
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
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <FaDollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {account.balance.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <FaShieldAlt className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Protected</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <FaChartLine className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Live Trading</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleEditAccount(account)}
                      className="p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/30 hover:bg-blue-500 dark:hover:bg-blue-500 text-blue-600 dark:text-blue-400 hover:text-white transition-all duration-200 hover:scale-110">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => setShowConfirmDelete(account.id)}
                      className="p-3 rounded-xl bg-red-100/80 dark:bg-red-900/30 hover:bg-red-500 dark:hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white transition-all duration-200 hover:scale-110">
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
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <FaExclamationTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this account? All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirmDelete(null)}
                className="flex items-center space-x-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-500 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400 hover:text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105">
                <FaTimes className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button 
                onClick={() => handleDeleteAccount(showConfirmDelete!)}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                <FaTrash className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 