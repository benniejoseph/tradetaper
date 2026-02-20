"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaBookOpen } from 'react-icons/fa';
import Modal from '@/components/ui/Modal';

interface TradeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  logHref?: string;
}

export default function TradeActionModal({
  isOpen,
  onClose,
  logHref = '/journal/new',
}: TradeActionModalProps) {
  const router = useRouter();

  const handleLog = () => {
    onClose();
    router.push(logHref);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Take a Trade"
      description="Choose your flow: execute live or log manually"
      size="md"
    >
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={handleLog}
          className="group p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FaBookOpen className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-wider">Log Trade</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Go to journal entry</div>
            </div>
          </div>
        </button>
      </div>
    </Modal>
  );
}
