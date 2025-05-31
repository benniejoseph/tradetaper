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
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

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

  // Styling classes to match the image (dark theme focused)
  const pageTitleClasses = "text-3xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary mb-8";
  const cardContainerClasses = "bg-[var(--color-light-primary)] dark:bg-[var(--color-dark-secondary)] shadow-xl rounded-lg p-6 md:p-8 mb-8";
  const cardTitleClasses = "text-xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary mb-6";
  const labelClasses = "block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-1.5";
  const inputClasses = "w-full p-3 border rounded-md transition-colors ease-in-out outline-none " +
                     "bg-white border-gray-300 text-gray-900 placeholder-gray-400 " +
                     "dark:bg-[var(--color-dark-tertiary)] dark:border-gray-600 dark:text-text-light-primary dark:placeholder-gray-500 " +
                     "focus:ring-2 focus:ring-accent-green focus:border-accent-green";
  const buttonBaseClasses = "px-5 py-2.5 rounded-md font-semibold text-sm flex items-center justify-center transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[var(--color-dark-secondary)] shadow-md hover:shadow-lg";
  const primaryButtonClasses = `${buttonBaseClasses} bg-accent-green text-dark-primary hover:bg-accent-green-darker focus:ring-accent-green`;
  const secondaryButtonClasses = `${buttonBaseClasses} bg-gray-500 text-gray-100 hover:bg-gray-600 dark:bg-gray-600 dark:text-text-light-primary dark:hover:bg-gray-500 focus:ring-gray-400`;
  const dangerButtonClasses = `${buttonBaseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const listItemClasses = "flex justify-between items-center p-4 rounded-lg transition-shadow duration-150 ease-in-out bg-[var(--color-light-secondary)] dark:bg-[var(--color-dark-tertiary)] mb-3 hover:shadow-xl";
  const accountNameInListClasses = "font-semibold text-lg text-[var(--color-text-dark-primary)] dark:text-text-light-primary";
  const selectedAccountNameInListClasses = "text-accent-green dark:text-accent-green";
  const accountBalanceInListClasses = "text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary";
  const modalOverlayClasses = "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out";
  const modalContentClasses = "bg-[var(--color-light-primary)] dark:bg-[var(--color-dark-secondary)] p-6 md:p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100";
  const modalTitleClasses = "text-xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary";
  const modalTextClasses = "text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-6";

  return (
    <div>
      <h1 className={pageTitleClasses}>Manage Accounts</h1>

      {/* Add/Edit Form Card (conditionally rendered) */}
      {showAddForm && (
        <div className={cardContainerClasses}>
          <h2 className={cardTitleClasses}>{isEditing ? 'Edit Account' : 'Add New Account'}</h2>
          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div>
              <label htmlFor="name" className={labelClasses}>Account Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="balance" className={labelClasses}>Initial Balance (USD)</label>
              <input type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" name="balance" id="balance" value={formData.balance} onChange={handleInputChange} className={inputClasses} required />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={handleCancelEdit} className={secondaryButtonClasses}><FaTimes className="mr-2" />Cancel</button>
              <button type="submit" className={primaryButtonClasses}><FaSave className="mr-2" />{isEditing ? 'Save Changes' : 'Add Account'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List Card */}
      <div className={cardContainerClasses}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={cardTitleClasses}>Your Accounts</h2>
          {!showAddForm && (
             <button onClick={handleAddNewAccount} className={`${primaryButtonClasses} flex items-center`}>
                <FaPlus className="mr-2" /> Add Account
            </button>
          )}
        </div>

        {accounts.length === 0 && !showAddForm ? (
          <p className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">No accounts found. Add your first account!</p>
        ) : (
          <ul className="space-y-0">
            {accounts.map(account => (
              <li key={account.id} className={listItemClasses}>
                <div>
                  <p className={`${accountNameInListClasses} ${account.id === selectedAccountId ? selectedAccountNameInListClasses : ''}`}>{account.name}</p>
                  <p className={accountBalanceInListClasses}>Balance: ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="space-x-2 flex items-center">
                  <button onClick={() => handleEditAccount(account)} className={`${secondaryButtonClasses} py-2 px-3 text-xs`} aria-label="Edit account">
                    <FaEdit className="mr-1.5" /> Edit
                  </button>
                  <button onClick={() => setShowConfirmDelete(account.id)} className={`${dangerButtonClasses} py-2 px-3 text-xs`} aria-label="Delete account">
                    <FaTrash className="mr-1.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Delete Confirmation Modal (Simplified) */}
      {showConfirmDelete && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className="flex items-center mb-4">
                <FaExclamationTriangle className="text-red-500 text-3xl mr-4"/>
                <h3 className={modalTitleClasses}>Confirm Deletion</h3>
            </div>            
            <p className={modalTextClasses}>Are you sure you want to delete the account "{accounts.find(acc => acc.id === showConfirmDelete)?.name}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirmDelete(null)} className={secondaryButtonClasses}>Cancel</button>
              <button onClick={() => handleDeleteAccount(showConfirmDelete!)} className={dangerButtonClasses}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 