"use client";

import React, { useEffect, useRef, useState } from 'react';
import DashboardCard from './DashboardCard';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { FaBullseye, FaCheckCircle } from 'react-icons/fa';

interface PersonalTargetCardProps {
  currentAmount: number;
  goalAmount: number;
  progress: number;
  onUpdateTarget: () => void;
}

export default function PersonalTargetCard({
  currentAmount,
  goalAmount,
  progress,
  onUpdateTarget,
}: PersonalTargetCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const wasTargetReachedRef = useRef(progress >= 100);
  const isTargetReached = progress >= 100 && goalAmount > 0;

  useEffect(() => {
    if (isTargetReached && !wasTargetReachedRef.current) {
      setShowCelebration(true);
      wasTargetReachedRef.current = true;

      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 2200);

      return () => clearTimeout(timer);
    }

    if (!isTargetReached) {
      wasTargetReachedRef.current = false;
      setShowCelebration(false);
    }
  }, [isTargetReached]);

  return (
    <DashboardCard 
      title="Personal Target" 
      icon={FaBullseye}
      showInfoIcon={true} 
      infoContent="Your P&L progress toward a target. Improve by setting realistic milestones and focusing on process metrics over outcome."
      gridSpan="sm:col-span-1 lg:col-span-2"
    >
      <div className="relative space-y-3 overflow-hidden rounded-xl">
        {showCelebration && (
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute inset-0 tt-target-glow" />
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="absolute top-2 h-2 w-1 rounded-full tt-confetti"
                style={{
                  left: `${6 + index * 7.8}%`,
                  animationDelay: `${(index % 6) * 70}ms`,
                  background:
                    index % 3 === 0
                      ? '#10b981'
                      : index % 3 === 1
                        ? '#34d399'
                        : '#6ee7b7',
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            <CurrencyAmount amount={currentAmount} />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            / <CurrencyAmount amount={goalAmount} className="inline" />
          </span>
        </div>

        <div className="text-[10px] text-gray-500 dark:text-gray-400">
          Net P&L after commission
        </div>

        {isTargetReached && (
          <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            <FaCheckCircle className="h-2.5 w-2.5" />
            Target reached
          </div>
        )}
        
        <div className="space-y-1.5">
          <div className="w-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
            <span>$0</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {progress.toFixed(1)}%
            </span>
            <span>${goalAmount.toLocaleString()}</span>
          </div>
        </div>
        
        <AnimatedButton 
          onClick={onUpdateTarget}
          variant="gradient"
          size="sm"
          fullWidth
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 py-1.5 text-xs"
          ripple
          glow
        >
          Update Target
        </AnimatedButton>

        <style jsx>{`
          .tt-confetti {
            animation: ttConfettiDrop 1100ms ease-out forwards;
          }

          .tt-target-glow {
            animation: ttGlowPulse 1200ms ease-out;
            background: radial-gradient(
              circle at 50% 15%,
              rgba(16, 185, 129, 0.25),
              rgba(16, 185, 129, 0.06) 35%,
              transparent 70%
            );
          }

          @keyframes ttConfettiDrop {
            0% {
              transform: translateY(-6px) rotate(0deg);
              opacity: 0;
            }
            15% {
              opacity: 1;
            }
            100% {
              transform: translateY(90px) rotate(200deg);
              opacity: 0;
            }
          }

          @keyframes ttGlowPulse {
            0% {
              opacity: 0;
              transform: scale(0.98);
            }
            30% {
              opacity: 1;
              transform: scale(1.02);
            }
            100% {
              opacity: 0;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </DashboardCard>
  );
}
