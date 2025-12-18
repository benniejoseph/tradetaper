/**
 * TradeTaper Theme Configuration
 * 
 * This is the central configuration file for all theme-related settings.
 * All UI components should reference these values instead of hardcoded colors.
 * 
 * Theme Modes:
 * - Light: Clean white background with subtle gray accents
 * - Dark: Deep black (#000000) with gradient emerald green accents
 */

export const themeConfig = {
  // Theme modes
  modes: {
    light: 'light',
    dark: 'dark',
  } as const,

  // Color Palette
  colors: {
    // Light Theme Colors
    light: {
      // Backgrounds
      primary: '#FFFFFF',           // Main background
      secondary: '#F8FAFB',         // Secondary background (cards, panels)
      tertiary: '#F0F2F5',          // Tertiary background (hover states)
      
      // Text
      textPrimary: '#0F172A',       // Main text
      textSecondary: '#475569',     // Secondary text
      textTertiary: '#94A3B8',      // Tertiary text (muted)
      
      // Borders
      border: '#E2E8F0',            // Default border
      borderHover: '#CBD5E1',       // Hover border
      borderFocus: '#10B981',       // Focus border (emerald)
      
      // Accents
      accent: '#10B981',            // Emerald green
      accentHover: '#059669',       // Darker emerald
      accentLight: '#D1FAE5',       // Light emerald background
      
      // Status Colors
      success: '#10B981',           // Green
      successLight: '#D1FAE5',
      error: '#EF4444',             // Red
      errorLight: '#FEE2E2',
      warning: '#F59E0B',           // Amber
      warningLight: '#FEF3C7',
      info: '#3B82F6',              // Blue
      infoLight: '#DBEAFE',
      
      // Shadows
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowMd: 'rgba(0, 0, 0, 0.15)',
      shadowLg: 'rgba(0, 0, 0, 0.2)',
    },

    // Dark Theme Colors (Black with Emerald Green)
    dark: {
      // Backgrounds
      primary: '#000000',           // Pure black
      secondary: '#0A0A0A',         // Slightly lighter black (cards, panels)
      tertiary: '#141414',          // Tertiary background (hover states)
      
      // Text
      textPrimary: '#FFFFFF',       // Pure white
      textSecondary: '#E5E5E5',     // Light gray
      textTertiary: '#A3A3A3',      // Medium gray (muted)
      
      // Borders
      border: '#1F1F1F',            // Subtle border
      borderHover: '#2A2A2A',       // Hover border
      borderFocus: '#10B981',       // Focus border (emerald)
      
      // Accents - Emerald Green
      accent: '#10B981',            // Emerald green
      accentHover: '#34D399',       // Lighter emerald
      accentLight: '#064E3B',       // Dark emerald background
      
      // Status Colors
      success: '#10B981',           // Emerald
      successLight: '#064E3B',
      error: '#EF4444',             // Red
      errorLight: '#7F1D1D',
      warning: '#F59E0B',           // Amber
      warningLight: '#78350F',
      info: '#3B82F6',              // Blue
      infoLight: '#1E3A8A',
      
      // Shadows
      shadow: 'rgba(16, 185, 129, 0.1)',      // Emerald glow
      shadowMd: 'rgba(16, 185, 129, 0.15)',
      shadowLg: 'rgba(16, 185, 129, 0.2)',
    },
  },

  // Gradient Presets
  gradients: {
    light: {
      primary: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFB 100%)',
      accent: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      card: 'linear-gradient(135deg, #FFFFFF 0%, #F0F2F5 100%)',
      success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    },
    dark: {
      primary: 'linear-gradient(135deg, #000000 0%, #0A0A0A 100%)',
      accent: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      card: 'linear-gradient(135deg, #0A0A0A 0%, #141414 100%)',
      success: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      emeraldGlow: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
    },
  },

  // Spacing System (rem units)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Typography
  typography: {
    fontFamily: {
      primary: "'Poppins', sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Shadows (Box Shadow Presets)
  shadows: {
    light: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      card: '0 2px 8px rgba(0, 0, 0, 0.08)',
      focus: '0 0 0 3px rgba(16, 185, 129, 0.2)',
    },
    dark: {
      sm: '0 1px 2px 0 rgba(16, 185, 129, 0.05)',
      md: '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)',
      lg: '0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)',
      xl: '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)',
      card: '0 2px 8px rgba(16, 185, 129, 0.12)',
      focus: '0 0 0 3px rgba(16, 185, 129, 0.3)',
      glow: '0 0 20px rgba(16, 185, 129, 0.3)',
    },
  },

  // Transitions
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Component-specific Configurations
  components: {
    button: {
      height: {
        sm: '2rem',      // 32px
        md: '2.5rem',    // 40px
        lg: '3rem',      // 48px
      },
      padding: {
        sm: '0.5rem 1rem',
        md: '0.75rem 1.5rem',
        lg: '1rem 2rem',
      },
    },
    input: {
      height: {
        sm: '2rem',      // 32px
        md: '2.5rem',    // 40px
        lg: '3rem',      // 48px
      },
    },
    card: {
      padding: {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
      },
    },
  },
} as const;

// Type exports for TypeScript
export type ThemeMode = keyof typeof themeConfig.modes;
export type ColorPalette = typeof themeConfig.colors.light | typeof themeConfig.colors.dark;

// Helper function to get theme colors
export const getThemeColors = (mode: ThemeMode) => {
  return themeConfig.colors[mode];
};

// Helper function to get theme gradients
export const getThemeGradients = (mode: ThemeMode) => {
  return themeConfig.gradients[mode];
};

// Helper function to get theme shadows
export const getThemeShadows = (mode: ThemeMode) => {
  return themeConfig.shadows[mode];
};

export default themeConfig;

