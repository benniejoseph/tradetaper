'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'neon' | 'gradient' | 'floating';
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'rotate' | 'pulse';
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const cardVariants = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg',
  glass: 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20',
  neon: 'bg-gray-900 border-2 border-cyan-400 shadow-lg shadow-cyan-400/25',
  gradient: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white',
  floating: 'bg-white dark:bg-gray-800 border-0 shadow-2xl shadow-black/10 dark:shadow-black/30',
};

const hoverEffects = {
  lift: {
    y: -8,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  glow: {
    boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
    transition: { duration: 0.3 }
  },
  scale: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  rotate: {
    rotateY: 5,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  pulse: {
    scale: [1, 1.02, 1],
    transition: { duration: 0.6, repeat: Infinity }
  }
};

const directionVariants = {
  up: { y: 50, opacity: 0 },
  down: { y: -50, opacity: 0 },
  left: { x: 50, opacity: 0 },
  right: { x: -50, opacity: 0 },
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = 'lift',
  delay = 0,
  direction = 'up',
  duration = 0.6,
  onClick,
  disabled = false,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start({
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
          duration,
          delay,
          type: 'spring',
          stiffness: 100,
          damping: 20,
        },
      });
    }
  }, [isInView, controls, delay, duration]);

  const baseClasses = `
    rounded-xl p-6 transition-all duration-300 cursor-pointer
    ${cardVariants[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={controls}
      whileHover={!disabled ? hoverEffects[hoverEffect] : {}}
      onHoverStart={() => !disabled && setIsHovered(true)}
      onHoverEnd={() => !disabled && setIsHovered(false)}
      onClick={!disabled ? onClick : undefined}
      className={baseClasses}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <AnimatePresence>
        {variant === 'neon' && isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl bg-cyan-400/5 pointer-events-none"
          />
        )}
      </AnimatePresence>
      
      {variant === 'glass' && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Specialized card components
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}> = ({ title, value, change, icon, trend = 'neutral', loading = false }) => {
  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <AnimatedCard variant="glass" hoverEffect="lift" className="relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <motion.p 
            className="text-2xl font-bold text-gray-900 dark:text-white"
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {loading ? '...' : value}
          </motion.p>
          {change !== undefined && (
            <motion.div 
              className={`flex items-center text-sm mt-1 ${trendColors[trend]}`}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="mr-1">{trendIcons[trend]}</span>
              {Math.abs(change).toFixed(2)}%
            </motion.div>
          )}
        </div>
        {icon && (
          <motion.div 
            className="text-2xl opacity-70"
            whileHover={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </AnimatedCard>
  );
};

export const ProgressCard: React.FC<{
  title: string;
  progress: number;
  target?: number;
  color?: string;
  showPercentage?: boolean;
}> = ({ title, progress, target, color = 'bg-emerald-500', showPercentage = true }) => {
  const percentage = target ? (progress / target) * 100 : progress;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <AnimatedCard variant="default" hoverEffect="glow">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          {showPercentage && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {clampedPercentage.toFixed(1)}%
            </span>
          )}
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedPercentage}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        
        {target && (
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{progress.toLocaleString()}</span>
            <span>{target.toLocaleString()}</span>
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

export const InteractiveCard: React.FC<{
  children: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
}> = ({ children, onAction, actionLabel = 'Action', variant = 'info' }) => {
  const variantStyles = {
    success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    info: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
  };

  return (
    <AnimatedCard 
      variant="default" 
      hoverEffect="scale"
      className={`border-2 ${variantStyles[variant]}`}
    >
      <div className="space-y-4">
        {children}
        {onAction && (
          <motion.button
            onClick={onAction}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {actionLabel}
          </motion.button>
        )}
      </div>
    </AnimatedCard>
  );
};