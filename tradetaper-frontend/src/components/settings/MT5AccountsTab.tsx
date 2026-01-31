'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { 
  fetchMT5Accounts, 
  createMT5Account, 
  updateMT5Account, 
  deleteMT5Account, 
  syncMT5Account,
  selectMT5Accounts,
  selectMT5AccountsLoading,
  selectMT5AccountsError,
} from '@/store/features/mt5AccountsSlice';
import { FaPlus, FaEdit, FaTrash, FaSync, FaInfoCircle } from 'react-icons/fa';
import MT5AccountForm, { MT5Server } from './MT5AccountForm';
import toast from 'react-hot-toast';

// Helper function to format dates
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

const MT5AccountsTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector(selectMT5Accounts);
  const loading = useSelector(selectMT5AccountsLoading);
  const error = useSelector(selectMT5AccountsError);

  // Helper function to safely format balance
  const formatBalance = (balance: any): string => {
    if (balance == null) return 'N/A';
    const numBalance = Number(balance);
    if (isNaN(numBalance)) return 'N/A';
    return `$${numBalance.toFixed(2)}`;
  };
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering portals
  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    dispatch(fetchMT5Accounts());
  }, [dispatch]);

  const handleAddAccount = () => {
    setIsAddOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setIsEditOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditOpen(false);
    setSelectedAccount(null);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirmDelete === id) {
      try {
        await dispatch(deleteMT5Account(id)).unwrap();
        setConfirmDelete(null);
        showToast('The MT5 account has been successfully deleted.', 'success');
      } catch (error) {
        showToast('Failed to delete the MT5 account. Please try again.', 'error');
      }
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleSyncAccount = async (id: string) => {
    setSyncingAccount(id);
    try {
      await dispatch(syncMT5Account(id)).unwrap();
      showToast('The MT5 account has been successfully synced.', 'success');
    } catch (error) {
      showToast('Failed to sync the MT5 account. Please check configuration and try again.', 'error');
    } finally {
      setSyncingAccount(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedAccount) {
        // Update existing account
        const updateData = {
          accountName: formData.name,
          server: formData.server,
          login: formData.login,
          ...(formData.password ? { password: formData.password } : {}),
          isActive: formData.isActive,
        };
        
        await dispatch(updateMT5Account({
          id: selectedAccount.id,
          data: updateData
        })).unwrap();
        
        handleCloseEditModal();
        showToast('The MT5 account has been successfully updated.', 'success');
      } else {
        // Add new account
        const createData = {
          accountName: formData.name,
          server: formData.server,
          login: formData.login,
          password: formData.password,
          isActive: formData.isActive,
          initialBalance: formData.initialBalance,
          currency: formData.currency,
        };
        
        await dispatch(createMT5Account(createData)).unwrap();
        
        handleCloseAddModal();
        showToast('The MT5 account has been successfully added.', 'success');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showToast(
        `Failed to ${selectedAccount ? 'update' : 'add'} the MT5 account. Please try again.`,
        'error'
      );
    }
  };

  // Modal component that renders using portal
  const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen || !mounted) return null;
    
    const modalContent = (
      <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-[#0A0A0A] w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl">
          {/* Modal Header */}
          <div className="bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Modal Body - Scrollable */}
          <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
            <div className="px-6 py-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MetaTrader 5 Accounts</h2>
        <button 
          onClick={handleAddAccount}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 flex items-center transition-colors"
        >
          <FaPlus className="mr-2" />
          Add MT5 Account
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
          Error: {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-white/5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Server</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center">
                  Active
                  <div className="relative ml-1 group">
                    <FaInfoCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      When active, this account will be automatically synced with MetaTrader 5. 
                      Inactive accounts will not sync data but will remain in your account list.
                    </div>
                  </div>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Synced</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#0A0A0A] divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading accounts...
                  </div>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No MetaTrader 5 accounts found. Add an account to get started.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{account.accountName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{account.server}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{account.login}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatBalance(account.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.isActive ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                      {account.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                    {account.lastSyncAt ? formatDate(account.lastSyncAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditAccount(account)}
                        className="text-indigo-600 hover:text-indigo-900" title="Edit"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          showToast('Syncing... This may take a minute if the account needs to wake up.', 'success');
                          handleSyncAccount(account.id);
                        }}
                        className={`text-emerald-600 hover:text-emerald-900 ${syncingAccount === account.id ? 'animate-spin' : ''}`}
                        disabled={syncingAccount === account.id}
                        title="Sync Now"
                      >
                        <FaSync className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAccount(account.id)}
                        className={`${confirmDelete === account.id ? 'text-red-600' : 'text-gray-600'} hover:text-red-900`}
                        title="Delete"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Account Modal */}
      <Modal 
        isOpen={isAddOpen} 
        onClose={handleCloseAddModal} 
        title="Add MetaTrader 5 Account"
      >
        <MT5AccountForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseAddModal}
          isSubmitting={loading}
        />
      </Modal>
      
      {/* Edit Account Modal */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={handleCloseEditModal} 
        title="Edit MetaTrader 5 Account"
      >
        {selectedAccount && (
          <MT5AccountForm
            account={selectedAccount}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseEditModal}
            isSubmitting={loading}
          />
        )}
      </Modal>
    </div>
  );
};

export default MT5AccountsTab;