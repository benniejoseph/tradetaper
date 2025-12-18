/**
 * Theme Class Utilities
 * 
 * This file provides reusable Tailwind class combinations for common UI patterns.
 * All classes reference the centralized theme configuration.
 */

export const themeClasses = {
  // Layout & Container Classes
  layout: {
    page: 'min-h-screen bg-white dark:bg-black transition-colors duration-300',
    container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-8 md:py-12 lg:py-16',
  },

  // Card Classes
  card: {
    base: 'bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl shadow-sm dark:shadow-emerald-500/5 transition-all duration-300',
    interactive: 'bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1F1F1F] rounded-xl shadow-sm dark:shadow-emerald-500/5 hover:shadow-md dark:hover:shadow-emerald-500/10 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-all duration-300 cursor-pointer',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-[#0A0A0A] dark:to-[#141414] border border-gray-200 dark:border-[#1F1F1F] rounded-xl shadow-sm dark:shadow-emerald-500/5 transition-all duration-300',
    glassmorphism: 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200/50 dark:border-[#1F1F1F]/50 rounded-xl shadow-lg dark:shadow-emerald-500/10',
    emeraldGlow: 'bg-[#0A0A0A] border border-emerald-500/20 rounded-xl shadow-lg shadow-emerald-500/20',
  },

  // Button Classes
  button: {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-6 py-2.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 dark:bg-[#141414] hover:bg-gray-200 dark:hover:bg-[#1F1F1F] text-gray-900 dark:text-white font-medium rounded-lg px-6 py-2.5 transition-all duration-200 border border-gray-300 dark:border-[#2A2A2A]',
    outline: 'bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-medium rounded-lg px-6 py-2.5 transition-all duration-200 border-2 border-emerald-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-[#141414] text-gray-700 dark:text-gray-300 font-medium rounded-lg px-6 py-2.5 transition-all duration-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-6 py-2.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-6 py-2.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md',
    icon: 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#141414] text-gray-600 dark:text-gray-400 transition-all duration-200',
  },

  // Input Classes
  input: {
    base: 'w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[#2A2A2A] bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200',
    error: 'w-full px-4 py-2.5 rounded-lg border border-red-500 bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200',
    success: 'w-full px-4 py-2.5 rounded-lg border border-emerald-500 bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200',
    disabled: 'w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#1F1F1F] bg-gray-50 dark:bg-[#0A0A0A] text-gray-400 dark:text-gray-600 cursor-not-allowed',
  },

  // Text Classes
  text: {
    heading: {
      h1: 'text-4xl md:text-5xl font-bold text-gray-900 dark:text-white',
      h2: 'text-3xl md:text-4xl font-bold text-gray-900 dark:text-white',
      h3: 'text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white',
      h4: 'text-xl md:text-2xl font-semibold text-gray-900 dark:text-white',
      h5: 'text-lg md:text-xl font-medium text-gray-900 dark:text-white',
      h6: 'text-base md:text-lg font-medium text-gray-900 dark:text-white',
    },
    body: {
      large: 'text-lg text-gray-700 dark:text-gray-300',
      base: 'text-base text-gray-700 dark:text-gray-300',
      small: 'text-sm text-gray-600 dark:text-gray-400',
      tiny: 'text-xs text-gray-500 dark:text-gray-500',
    },
    muted: 'text-gray-500 dark:text-gray-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  },

  // Badge Classes
  badge: {
    primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
    secondary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#141414] text-gray-800 dark:text-gray-300',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
    error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
    info: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  },

  // Alert/Notification Classes
  alert: {
    success: 'p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    error: 'p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    warning: 'p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    info: 'p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  },

  // Table Classes
  table: {
    container: 'overflow-x-auto rounded-lg border border-gray-200 dark:border-[#1F1F1F]',
    base: 'min-w-full divide-y divide-gray-200 dark:divide-[#1F1F1F]',
    header: 'bg-gray-50 dark:bg-[#0A0A0A]',
    headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
    body: 'bg-white dark:bg-black divide-y divide-gray-200 dark:divide-[#1F1F1F]',
    row: 'hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-colors duration-150',
    cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300',
  },

  // Modal/Dialog Classes
  modal: {
    overlay: 'fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4',
    container: 'bg-white dark:bg-[#0A0A0A] rounded-xl shadow-2xl dark:shadow-emerald-500/10 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[#1F1F1F]',
    header: 'px-6 py-4 border-b border-gray-200 dark:border-[#1F1F1F]',
    body: 'px-6 py-4',
    footer: 'px-6 py-4 border-t border-gray-200 dark:border-[#1F1F1F] flex items-center justify-end gap-3',
  },

  // Navigation Classes
  nav: {
    link: 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
    linkActive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-md text-sm font-medium',
  },

  // Sidebar Classes
  sidebar: {
    container: 'bg-white dark:bg-black border-r border-gray-200 dark:border-[#1F1F1F] h-full',
    item: 'flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A] rounded-lg transition-all duration-200 cursor-pointer',
    itemActive: 'flex items-center gap-3 px-4 py-3 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg font-medium',
  },

  // Loading States
  loading: {
    spinner: 'animate-spin h-5 w-5 text-emerald-500',
    skeleton: 'animate-pulse bg-gray-200 dark:bg-[#141414] rounded',
    overlay: 'fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center',
  },

  // Gradient Backgrounds
  gradient: {
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    emeraldSubtle: 'bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20',
    page: 'bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-black dark:via-black dark:to-emerald-950/10',
    card: 'bg-gradient-to-br from-white to-gray-50 dark:from-[#0A0A0A] dark:to-[#141414]',
  },

  // Divider
  divider: {
    horizontal: 'w-full h-px bg-gray-200 dark:bg-[#1F1F1F]',
    vertical: 'h-full w-px bg-gray-200 dark:bg-[#1F1F1F]',
  },

  // Scrollbar
  scrollbar: {
    default: 'scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-[#0A0A0A] scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#2A2A2A] hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-[#3A3A3A]',
  },
} as const;

// Helper function to combine classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default themeClasses;

