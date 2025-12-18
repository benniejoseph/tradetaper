# TradeTaper Theme System Documentation

## Overview

The TradeTaper frontend now uses a **centralized theme system** that ensures consistency across all UI components. All theme-related configurations are managed from a single source of truth.

## Theme Modes

### Light Theme
- **Background**: Clean white (#FFFFFF) with subtle gray accents
- **Text**: Dark slate for primary text (#0F172A)
- **Accent**: Emerald green (#10B981)
- **Philosophy**: Clean, professional, and easy on the eyes

### Dark Theme
- **Background**: Pure black (#000000) for deep contrast
- **Text**: Pure white (#FFFFFF) for maximum readability
- **Accent**: Gradient emerald green (#10B981 → #34D399)
- **Philosophy**: Modern, sleek, with emerald green highlights creating a premium feel

## File Structure

```
src/
├── config/
│   └── theme.config.ts          # Central theme configuration (colors, typography, spacing, etc.)
├── styles/
│   └── theme-classes.ts         # Reusable Tailwind class combinations
├── app/
│   └── globals.css              # CSS custom properties and base styles
└── tailwind.config.js           # Tailwind configuration (uses theme.config.ts)
```

## Core Files

### 1. `src/config/theme.config.ts`
**Purpose**: Single source of truth for all theme values

**Contents**:
- Color palettes (light & dark)
- Typography system
- Spacing scale
- Border radius values
- Shadow presets
- Gradient definitions
- Component-specific configurations
- Z-index scale

**Usage**:
```typescript
import themeConfig, { getThemeColors, getThemeGradients } from '@/config/theme.config';

// Get colors for current theme
const colors = getThemeColors('dark');
const primaryBg = colors.primary; // #000000

// Get gradients
const gradients = getThemeGradients('dark');
const accentGradient = gradients.accent;
```

### 2. `src/styles/theme-classes.ts`
**Purpose**: Pre-built Tailwind class combinations for common UI patterns

**Contents**:
- Layout classes
- Card variants
- Button variants
- Input states
- Text styles
- Badge styles
- Alert/notification styles
- Table components
- Modal/dialog components
- Navigation components
- Loading states
- Gradient backgrounds

**Usage**:
```typescript
import { themeClasses, cn } from '@/styles/theme-classes';

// Use pre-built classes
<div className={themeClasses.card.base}>Card content</div>
<button className={themeClasses.button.primary}>Click me</button>

// Combine classes conditionally
<div className={cn(
  themeClasses.card.base,
  isActive && themeClasses.card.emeraldGlow
)}>
  Conditional card
</div>
```

### 3. `src/app/globals.css`
**Purpose**: CSS custom properties and global styles

**Contents**:
- CSS custom properties (--bg-primary, --text-primary, etc.)
- Base HTML/body styles
- Typography defaults
- React library overrides (react-select, react-datepicker, etc.)
- Utility classes

**CSS Variables**:
```css
/* Light mode */
--bg-primary: #FFFFFF;
--text-primary: #0F172A;
--accent: #10B981;

/* Dark mode */
html.dark {
  --bg-primary: #000000;
  --text-primary: #FFFFFF;
  --accent: #10B981;
}
```

### 4. `tailwind.config.js`
**Purpose**: Tailwind CSS configuration

**Contents**:
- Emerald color scale
- Custom font families
- Background images
- Box shadows (emerald-themed)
- Animation utilities
- Custom plugins

## Color System

### Emerald Green Scale
```
emerald-50:  #ECFDF5 (Lightest)
emerald-100: #D1FAE5
emerald-200: #A7F3D0
emerald-300: #6EE7B7
emerald-400: #34D399
emerald-500: #10B981 ← Primary accent
emerald-600: #059669
emerald-700: #047857
emerald-800: #065F46
emerald-900: #064E3B
emerald-950: #022C22 (Darkest)
```

### Light Theme Palette
```
Background:  #FFFFFF, #F8FAFB, #F0F2F5
Text:        #0F172A, #475569, #94A3B8
Border:      #E2E8F0, #CBD5E1
Accent:      #10B981, #059669
```

### Dark Theme Palette
```
Background:  #000000, #0A0A0A, #141414
Text:        #FFFFFF, #E5E5E5, #A3A3A3
Border:      #1F1F1F, #2A2A2A
Accent:      #10B981, #34D399
```

## Component Usage Examples

### Button Component
```typescript
import { themeClasses } from '@/styles/theme-classes';

// Primary button
<button className={themeClasses.button.primary}>
  Save Changes
</button>

// Secondary button
<button className={themeClasses.button.secondary}>
  Cancel
</button>

// Custom button with theme-aware colors
<button className="bg-emerald-500 dark:bg-emerald-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform">
  Custom Button
</button>
```

### Card Component
```typescript
import { themeClasses } from '@/styles/theme-classes';

// Base card
<div className={themeClasses.card.base}>
  <h3 className={themeClasses.text.heading.h3}>Card Title</h3>
  <p className={themeClasses.text.body.base}>Card content goes here</p>
</div>

// Interactive card
<div className={themeClasses.card.interactive}>
  Clickable card with hover effects
</div>

// Card with emerald glow (dark theme only)
<div className={themeClasses.card.emeraldGlow}>
  Premium feature card
</div>
```

### Input Component
```typescript
import { themeClasses } from '@/styles/theme-classes';

// Base input
<input 
  type="text"
  className={themeClasses.input.base}
  placeholder="Enter text..."
/>

// Error state
<input 
  type="text"
  className={themeClasses.input.error}
  placeholder="Invalid input"
/>
```

### Text Styles
```typescript
import { themeClasses } from '@/styles/theme-classes';

<h1 className={themeClasses.text.heading.h1}>Main Heading</h1>
<h2 className={themeClasses.text.heading.h2}>Subheading</h2>
<p className={themeClasses.text.body.base}>Regular paragraph text</p>
<span className={themeClasses.text.muted}>Muted text</span>
<span className={themeClasses.text.accent}>Accent text (emerald)</span>
```

## Best Practices

### 1. Always Use Theme Classes
❌ **Don't do this:**
```typescript
<div className="bg-green-500 text-white">...</div>
```

✅ **Do this:**
```typescript
import { themeClasses } from '@/styles/theme-classes';
<div className={themeClasses.button.primary}>...</div>
```

### 2. Use CSS Custom Properties for Dynamic Styles
❌ **Don't do this:**
```css
.custom-element {
  background: #FFFFFF;
  color: #000000;
}
```

✅ **Do this:**
```css
.custom-element {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### 3. Reference themeConfig for Programmatic Values
✅ **Do this:**
```typescript
import themeConfig from '@/config/theme.config';

const buttonHeight = themeConfig.components.button.height.md;
const primaryColor = themeConfig.colors.dark.accent;
```

### 4. Use Conditional Classes for Theme-Aware Components
✅ **Do this:**
```typescript
<div className="bg-white dark:bg-black border border-gray-200 dark:border-[#1F1F1F]">
  Theme-aware content
</div>
```

### 5. Leverage the `cn()` Helper for Conditional Styling
✅ **Do this:**
```typescript
import { themeClasses, cn } from '@/styles/theme-classes';

<div className={cn(
  themeClasses.card.base,
  isActive && 'ring-2 ring-emerald-500',
  hasError && 'border-red-500'
)}>
  Conditional card
</div>
```

## Gradients

### Available Gradients

**Light Theme**:
- `bg-gradient-to-r from-emerald-500 to-emerald-600` - Primary gradient
- `bg-gradient-to-br from-white to-emerald-50` - Subtle page background
- `bg-gradient-to-br from-white to-gray-50` - Card gradient

**Dark Theme**:
- `bg-gradient-to-r from-emerald-500 to-emerald-600` - Accent gradient
- `bg-gradient-to-br from-black to-emerald-950/20` - Subtle page background
- `bg-gradient-to-br from-[#0A0A0A] to-[#141414]` - Card gradient

### Emerald Glow Effect (Dark Theme Only)
```typescript
// Add emerald glow to cards in dark mode
<div className="dark:bg-emerald-glow">
  Content with subtle emerald glow background
</div>

// Box shadow glow
<div className="dark:shadow-emerald-glow">
  Element with emerald glow shadow
</div>
```

## Shadows

### Light Theme Shadows
```css
shadow-sm  /* Subtle shadow */
shadow-md  /* Medium shadow */
shadow-lg  /* Large shadow */
shadow-xl  /* Extra large shadow */
```

### Dark Theme Shadows (Emerald-tinted)
```css
dark:shadow-emerald-sm
dark:shadow-emerald-md
dark:shadow-emerald-lg
dark:shadow-emerald-xl
dark:shadow-emerald-glow  /* Special glow effect */
```

## Typography

### Font Families
- **Primary**: Poppins (sans-serif)
- **Monospace**: JetBrains Mono

### Font Weights
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Usage
```typescript
<p className="font-light">Light text</p>
<p className="font-normal">Normal text</p>
<p className="font-medium">Medium text</p>
<p className="font-semibold">Semibold text</p>
<p className="font-bold">Bold text</p>
<code className="font-mono">Monospace code</code>
```

## Spacing System

Based on rem units:
```
xs:  0.25rem  (4px)
sm:  0.5rem   (8px)
md:  1rem     (16px)
lg:  1.5rem   (24px)
xl:  2rem     (32px)
2xl: 3rem     (48px)
3xl: 4rem     (64px)
```

## Transitions

### Duration
```
fast:   150ms
normal: 300ms
slow:   500ms
```

### Easing
```
default: cubic-bezier(0.4, 0, 0.2, 1)
in:      cubic-bezier(0.4, 0, 1, 1)
out:     cubic-bezier(0, 0, 0.2, 1)
inOut:   cubic-bezier(0.4, 0, 0.2, 1)
```

### Usage
```typescript
<div className="transition-all duration-300 ease-in-out">
  Smooth transition
</div>
```

## Migration Guide

### Migrating Existing Components

1. **Replace hardcoded colors**:
   ```typescript
   // Before
   <div className="bg-green-500">
   
   // After
   <div className="bg-emerald-500">
   ```

2. **Use theme classes**:
   ```typescript
   // Before
   <button className="bg-blue-500 text-white px-4 py-2 rounded">
   
   // After
   import { themeClasses } from '@/styles/theme-classes';
   <button className={themeClasses.button.primary}>
   ```

3. **Add dark mode support**:
   ```typescript
   // Before
   <div className="bg-white text-black">
   
   // After
   <div className="bg-white dark:bg-black text-black dark:text-white">
   ```

4. **Use CSS variables for inline styles**:
   ```typescript
   // Before
   <div style={{ backgroundColor: '#FFFFFF' }}>
   
   // After
   <div style={{ backgroundColor: 'var(--bg-primary)' }}>
   ```

## Testing Themes

### Toggle Theme Programmatically
```typescript
import { useTheme } from '@/context/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme} - Click to toggle
    </button>
  );
}
```

### Access Current Theme
```typescript
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();
  
  // Use theme value programmatically
  const colors = getThemeColors(theme);
  
  return <div>{/* ... */}</div>;
}
```

## Troubleshooting

### Issue: Colors not updating in dark mode
**Solution**: Ensure `html.dark` class is being added correctly. Check `ThemeContext` is wrapping your app in `layout.tsx`.

### Issue: CSS variables not working
**Solution**: Make sure you're using `var(--variable-name)` syntax. Variables are defined in `globals.css`.

### Issue: Tailwind classes not applying
**Solution**: Check that the class names match exactly. Use `dark:` prefix for dark mode variants.

### Issue: Inconsistent colors across components
**Solution**: Always reference `theme-classes.ts` or `theme.config.ts` instead of hardcoding colors.

## Future Enhancements

- [ ] Add theme preview/customization panel
- [ ] Support for additional color schemes (blue, purple, etc.)
- [ ] Auto-generate theme from brand colors
- [ ] Export theme as CSS/Sass variables for external use
- [ ] Add high contrast mode for accessibility

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0
**Maintainer**: TradeTaper Development Team

