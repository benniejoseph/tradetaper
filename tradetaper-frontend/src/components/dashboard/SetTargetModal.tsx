"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface SetTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  // currentActual: number; // If we want to display the current actual value from P&L
  onSave: (newGoal: number) => void;
  title?: string;
}

export default function SetTargetModal({
  isOpen,
  onClose,
  currentGoal,
  // currentActual,
  onSave,
  title = "Set Your Personal Target"
}: SetTargetModalProps) {
  const [goalAmount, setGoalAmount] = useState<string>(currentGoal.toString());

  useEffect(() => {
    // Update local state if the prop changes (e.g., if loaded async or changed elsewhere)
    setGoalAmount(currentGoal.toString());
  }, [currentGoal, isOpen]); // Re-run if isOpen changes to reset on open

  if (!isOpen) return null;

  const handleSave = () => {
    const newGoal = parseFloat(goalAmount);
    if (!isNaN(newGoal) && newGoal > 0) {
      onSave(newGoal);
      onClose(); // Close modal on successful save
    } else {
      // Basic validation feedback, could be enhanced with a state variable and displayed message
      alert("Please enter a valid positive number for the goal.");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Click on overlay closes modal
    >
      <div 
        className="bg-white dark:bg-black rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 opacity-100 border border-gray-200 dark:border-emerald-600/30"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Optional: Display current P&L if needed */}
        {/* {typeof currentActual === 'number' && (
          <div className="mb-4 p-3 bg-[var(--color-light-secondary)] dark:bg-dark-primary rounded-md">
            <p className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
              Current Progress: 
              <span className={`font-semibold ${currentActual >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                ${currentActual.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </p>
          </div>
        )} */}

        <div className="space-y-4">
          <div>
            <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Target Goal Amount ($)
            </label>
            <input 
              type="number"
              id="goalAmount"
              name="goalAmount"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="e.g., 1000"
              className="w-full px-4 py-3 border border-gray-300 dark:border-emerald-600/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 shadow-sm text-base"
              autoFocus
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-lg border border-gray-300 dark:border-emerald-600/30 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-black shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-black shadow-md hover:shadow-lg"
          >
            Save Target
          </button>
        </div>
      </div>
    </div>
  );
} 