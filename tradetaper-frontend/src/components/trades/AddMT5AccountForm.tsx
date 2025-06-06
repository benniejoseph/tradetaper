import React, { useState } from 'react';

interface MT5AccountFormData {
  accountName: string;
  server: string;
  login: string;
  password: string;
  isRealAccount: boolean;
}

interface AddMT5AccountFormProps {
  onAccountAdded: () => void;
}

const COMMON_SERVERS = [
  // Demo Servers
  { name: 'ICMarkets-Demo', label: 'IC Markets Demo', type: 'demo' },
  { name: 'Pepperstone-Demo', label: 'Pepperstone Demo', type: 'demo' },
  { name: 'XMGlobal-Demo', label: 'XM Global Demo', type: 'demo' },
  { name: 'FTMO-Demo', label: 'FTMO Demo', type: 'demo' },
  { name: 'MetaQuotes-Demo', label: 'MetaQuotes Demo', type: 'demo' },
  
  // Live Servers
  { name: 'ICMarkets-Live01', label: 'IC Markets Live', type: 'live' },
  { name: 'Pepperstone-Live', label: 'Pepperstone Live', type: 'live' },
  { name: 'XMGlobal-Real', label: 'XM Global Live', type: 'live' },
  { name: 'FTMO-Server', label: 'FTMO Live', type: 'live' },
];

export default function AddMT5AccountForm({ onAccountAdded }: AddMT5AccountFormProps) {
  const [formData, setFormData] = useState<MT5AccountFormData>({
    accountName: '',
    server: '',
    login: '',
    password: '',
    isRealAccount: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/mt5-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add MT5 account');
      }

      const result = await response.json();
      setSuccess('MT5 account added successfully! Connecting...');
      
      // Reset form
      setFormData({
        accountName: '',
        server: '',
        login: '',
        password: '',
        isRealAccount: false,
      });

      // Notify parent component
      setTimeout(() => {
        onAccountAdded();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof MT5AccountFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedServerType = COMMON_SERVERS.find(s => s.name === formData.server)?.type;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          📊 Add MT5 Account
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Name */}
        <div>
          <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
            Account Name
          </label>
          <input
            id="accountName"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Trading Account"
            value={formData.accountName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('accountName', e.target.value)}
            required
          />
        </div>

        {/* Server Selection */}
        <div>
          <label htmlFor="server" className="block text-sm font-medium text-gray-700 mb-1">
            MT5 Server
          </label>
          <select
            id="server"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.server}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value;
              handleInputChange('server', value);
              const server = COMMON_SERVERS.find(s => s.name === value);
              handleInputChange('isRealAccount', server?.type === 'live');
            }}
            required
          >
            <option value="">Select your broker's server</option>
            <optgroup label="Demo Accounts">
              {COMMON_SERVERS.filter(s => s.type === 'demo').map((server) => (
                <option key={server.name} value={server.name}>
                  {server.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Live Accounts">
              {COMMON_SERVERS.filter(s => s.type === 'live').map((server) => (
                <option key={server.name} value={server.name}>
                  🛡️ {server.label}
                </option>
              ))}
            </optgroup>
          </select>
          {selectedServerType === 'live' && (
            <p className="text-sm text-amber-600 mt-1">
              🛡️ Live account - Real money trading
            </p>
          )}
        </div>

        {/* Login */}
        <div>
          <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
            MT5 Login (Account Number)
          </label>
          <input
            id="login"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="12345678"
            value={formData.login}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('login', e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            MT5 Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your MT5 password"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
            required
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting Account...
            </>
          ) : (
            'Add MT5 Account'
          )}
        </button>

        {/* Help Text */}
        <div className="text-sm text-gray-600 space-y-1 mt-4">
          <p><strong>Note:</strong> We securely connect to your MT5 account through MetaApi.</p>
          <p>• Your credentials are encrypted and never stored in plain text</p>
          <p>• We only read your trade data, cannot place trades</p>
          <p>• You can disconnect anytime</p>
        </div>
      </form>
    </div>
  );
} 