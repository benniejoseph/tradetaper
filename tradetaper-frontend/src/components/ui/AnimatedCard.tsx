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
  animate?: boolean;
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
  animate = true,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (animate && isInView) {
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
    } else if (!animate) {
      controls.set({ x: 0, y: 0, opacity: 1 });
    }
  }, [isInView, controls, delay, duration, animate]);

  const baseClasses = `
    rounded-xl p-5 transition-all duration-300
    ${cardVariants[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  const content = (
    <>
      <AnimatePresence>
        {variant === 'neon' && isHovered && (
          <motion.div
            initial={animate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={animate ? { opacity: 0 } : { opacity: 1 }}
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
    </>
  );

  if (!animate) {
    return (
      <div 
        ref={ref}
        onClick={!disabled ? onClick : undefined}
        className={baseClasses}
      >
        {content}
      </div>
    );
  }

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
      {content}
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
  animate?: boolean;
}> = ({ title, value, change, icon, trend = 'neutral', loading = false, animate = true }) => {
  const trendColors: Record<string, string> = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const trendIcons: Record<string, string> = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <AnimatedCard 
      variant="glass" 
      hoverEffect="lift" 
      animate={animate}
      className={`relative overflow-hidden border-0 bg-white/5 dark:bg-black/20 backdrop-blur-md ${animate ? '' : 'transition-none hover:translate-y-[-4px]'}`}
    >
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 
              className="text-3xl font-black text-gray-900 dark:text-white"
            >
              {loading ? '...' : value}
            </h4>
            {change !== undefined && (
              <span 
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${trendColors[trend]} bg-${trend === 'up' ? 'emerald' : trend === 'down' ? 'red' : 'gray'}-500/10`}
              >
                {trendIcons[trend]} {Math.abs(change).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div 
            className={`p-2 rounded-lg bg-gray-100 dark:bg-white/5 ${trendColors[trend]}`}
          >
            {icon}
          </div>
        )}
      </div>
      
      {/* Decorative gradient blur */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 blur-2xl opacity-20 rounded-full bg-${trend === 'up' ? 'emerald' : trend === 'down' ? 'red' : 'blue'}-500`} />
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
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${clampedPercentage}%` }}
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
          <button
            onClick={onAction}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </AnimatedCard>
  );
};
