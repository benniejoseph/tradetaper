'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'gradient' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  ripple?: boolean;
  glow?: boolean;
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
  gradient: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
  neon: 'bg-black text-cyan-400 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-lg hover:shadow-cyan-400/50',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  ripple = true,
  glow = false,
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { id: Date.now(), x, y };
      
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    // Button click animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);

    // Execute onClick
    if (onClick) {
      await onClick();
    }
  };

  const baseClasses = `
    relative overflow-hidden rounded-lg font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${glow ? 'shadow-lg hover:shadow-xl' : ''}
    ${className}
  `;

  return (
    <motion.button
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      animate={isClicked ? { scale: 0.95 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            initial={{
              x: ripple.x,
              y: ripple.y,
              width: 0,
              height: 0,
              opacity: 0.8,
            }}
            animate={{
              width: 300,
              height: 300,
              opacity: 0,
              x: ripple.x - 150,
              y: ripple.y - 150,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Glow effect for neon variant */}
      {variant === 'neon' && (
        <div className="absolute inset-0 bg-cyan-400/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Button content */}
      <div className="relative flex items-center justify-center space-x-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <Loader2 className={`${iconSizes[size]} animate-spin`} />
              <span>Loading...</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              {icon && iconPosition === 'left' && (
                <motion.div
                  className={iconSizes[size]}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {icon}
                </motion.div>
              )}
              <span>{children}</span>
              {icon && iconPosition === 'right' && (
                <motion.div
                  className={iconSizes[size]}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {icon}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

// Specialized button components
export const FloatingActionButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  tooltip?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}> = ({ onClick, icon, tooltip, position = 'bottom-right' }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <div className={positionClasses[position]}>
      <motion.button
        onClick={onClick}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => setIsTooltipVisible(true)}
        onHoverEnd={() => setIsTooltipVisible(false)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {tooltip && isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap"
          >
            {tooltip}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ToggleButton: React.FC<{
  active: boolean;
  onToggle: (active: boolean) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  active, 
  onToggle, 
  activeLabel = 'ON', 
  inactiveLabel = 'OFF',
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-10 h-6',
    md: 'w-12 h-7',
    lg: 'w-14 h-8',
  };

  const knobSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center space-x-3">
      <span className={`text-sm ${!active ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
        {inactiveLabel}
      </span>
      
      <motion.button
        className={`${sizeClasses[size]} rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
          active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        onClick={() => onToggle(!active)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className={`${knobSizes[size]} bg-white rounded-full shadow-sm`}
          animate={{
            x: active ? '100%' : '0%',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
      
      <span className={`text-sm ${active ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
        {activeLabel}
      </span>
    </div>
  );
};

export const PulseButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  pulseColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}> = ({ children, onClick, pulseColor = 'bg-blue-400', intensity = 'medium' }) => {
  const intensityConfig = {
    low: { scale: [1, 1.05, 1], opacity: [0.7, 0.4, 0.7] },
    medium: { scale: [1, 1.1, 1], opacity: [0.7, 0.3, 0.7] },
    high: { scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] },
  };

  return (
    <div className="relative">
      {/* Pulse rings */}
      <motion.div
        className={`absolute inset-0 rounded-full ${pulseColor}`}
        animate={intensityConfig[intensity]}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={`absolute inset-0 rounded-full ${pulseColor}`}
        animate={intensityConfig[intensity]}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      
      {/* Button */}
      <AnimatedButton
        onClick={onClick}
        variant="primary"
        className="relative z-10"
      >
        {children}
      </AnimatedButton>
    </div>
  );
};