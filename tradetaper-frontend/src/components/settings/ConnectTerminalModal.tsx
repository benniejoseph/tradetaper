import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FormInput } from '@/components/ui/FormInput';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Loader2, Server, User, Key, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ConnectTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: { server: string; login: string; password: string }) => Promise<void>;
  accountName: string;
}

export const ConnectTerminalModal: React.FC<ConnectTerminalModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  accountName,
}) => {
  const [server, setServer] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server || !login || !password) return;

    setIsLoading(true);
    try {
      await onConnect({ server, login, password });
      // Modal closing is handled by parent or success logic, 
      // but usually we want to keep it open if error, or close if success.
      // Parent handleConnect sets status, let's auto-close here on success if no error thrown.
      onClose();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-500" />
                    Connect Terminal
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Enable auto-sync for <strong className="text-emerald-600">{accountName}</strong>
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <FormInput
                  label="Server Name"
                  placeholder="e.g. ICMarkets-Demo02"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500 -mt-2 ml-1">
                  * Must match the server name in MT5 exact
                </p>

                <FormInput
                  label="Login ID"
                  type="number"
                  placeholder="e.g. 12345678"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <FormInput
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <div className="flex gap-3 pt-2 justify-end">
                  <AnimatedButton
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    disabled={!server || !login || !password}
                    icon={<Server className="w-4 h-4" />}
                  >
                    Connect Terminal
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
