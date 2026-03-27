"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'lg',
  children,
  footer,
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-3 py-3 sm:items-center sm:px-4 sm:py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative max-h-[calc(100dvh-1.5rem)] w-full ${sizeMap[size]} overflow-hidden rounded-3xl border border-emerald-100/60 bg-white shadow-2xl dark:border-emerald-900/40 dark:bg-zinc-950 sm:max-h-[90dvh]`}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 dark:border-zinc-800 sm:px-6">
            <div>
              {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>}
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-4 py-4 sm:max-h-[75vh] sm:px-6 sm:py-5">
          {children}
        </div>
        {footer && (
          <div className="border-t border-gray-100 px-4 py-4 dark:border-zinc-800 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
