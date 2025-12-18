'use client';
import { useState, useEffect } from 'react';
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
// import MT5AccountForm from './MT5AccountForm'; // Removed - component no longer exists
// import { MT5AccountsService, MT5Server } from '@/services/mt5AccountsService'; // Removed - service no longer exists
// import { formatDate } from '@/utils/dateUtils'; // Removed - utility no longer exists
import toast from 'react-hot-toast';

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
  const [importingTrades, setImportingTrades] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<string | null>(null);
  const [mt5Servers, setMT5Servers] = useState<MT5Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
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

  useEffect(() => {
    const fetchServers = async () => {
      console.log('Starting to fetch MT5 servers...');
      setLoadingServers(true);
      try {
        const servers = await MT5AccountsService.getServers();
        setMT5Servers(servers);
      } catch (error) {
        console.error('Failed to fetch MT5 servers:', error);
        showToast('Failed to load MetaTrader 5 servers. Using default servers instead.', 'error');
      } finally {
        setLoadingServers(false);
      }
    };

    fetchServers();
  }, []);

  // Debug log whenever mt5Servers changes
  useEffect(() => {
    console.log('MT5 Servers state updated:', {
      servers: mt5Servers,
      count: mt5Servers.length,
      loadingServers
    });
  }, [mt5Servers, loadingServers]);

  const handleAddAccount = () => {
    console.log('Opening add account modal');
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
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleSyncAccount = async (id: string) => {
    setSyncingAccount(id);
    try {
      await dispatch(syncMT5Account(id)).unwrap();
      showToast('The MT5 account has been successfully synced.', 'success');
    } catch (error) {
      showToast('Failed to sync the MT5 account. Please check credentials and try again.', 'error');
    } finally {
      setSyncingAccount(null);
    }
  };

  const handleImportTrades = async (accountId: string, fromDate: Date, toDate: Date) => {
    setImportingTrades(accountId);
    try {
      const trades = await MT5AccountsService.importTrades(accountId, fromDate, toDate);
      showToast(`Successfully imported ${trades.length} trades!`, 'success');
      setShowImportModal(null);
    } catch (error) {
      console.error('Error importing trades:', error);
      showToast('Failed to import trades. Please try again.', 'error');
    } finally {
      setImportingTrades(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    console.log('Form submitted with data:', formData);
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
        console.log('Update payload:', updateData);
        
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
        };
        console.log('Create payload:', createData);
        console.log('Payload types:', {
          accountName: typeof createData.accountName,
          server: typeof createData.server,
          login: typeof createData.login,
          password: typeof createData.password,
          isActive: typeof createData.isActive,
        });
        
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
        <div className="relative bg-[var(--color-light-primary)] dark:bg-dark-secondary w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl">
          {/* Modal Header */}
          <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary border-b border-[var(--color-light-border)] dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary hover:text-[var(--color-text-dark-primary)] dark:hover:text-text-light-primary transition-colors p-2 rounded-full hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary"
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

    // Render modal using portal to document.body
    return createPortal(modalContent, document.body);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">MetaTrader 5 Accounts</h2>
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
        <table className="min-w-full divide-y divide-[var(--color-light-border)] dark:divide-gray-700">
          <thead className="bg-[var(--color-light-secondary)] dark:bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">Server</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">Login</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">Balance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">
                <div className="flex items-center">
                  Active
                  <div className="relative ml-1 group">
                    <FaInfoCircle className="h-4 w-4 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      When active, this account will be automatically synced with MetaTrader 5. 
                      Inactive accounts will not sync data but will remain in your account list.
                    </div>
                  </div>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">Last Synced</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-light-primary)] dark:bg-dark-secondary divide-y divide-[var(--color-light-border)] dark:divide-gray-700">
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
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                  No MetaTrader 5 accounts found. Add an account to get started.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary">{account.accountName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">{account.server}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">{account.login}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                    {formatBalance(account.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.isActive ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                      {account.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
                    {account.lastSynced ? formatDate(account.lastSynced) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditAccount(account)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleSyncAccount(account.id)}
                        className={`text-emerald-600 hover:text-emerald-900 ${syncingAccount === account.id ? 'animate-spin' : ''}`}
                        disabled={syncingAccount === account.id}
                      >
                        <FaSync className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAccount(account.id)}
                        className={`${confirmDelete === account.id ? 'text-red-600' : 'text-gray-600'} hover:text-red-900`}
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
          servers={mt5Servers}
          loadingServers={loadingServers}
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
            servers={mt5Servers}
            loadingServers={loadingServers}
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