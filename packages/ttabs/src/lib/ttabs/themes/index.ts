import { DEFAULT_THEME, resolveTheme } from '../types/theme-types';
import { DARK_THEME } from './dark-theme';
import ThemeStyles from './theme-styles.svelte';

// Log themes to help with debugging
console.log('DEBUG - Themes importing in themes/index.ts:', {
  DEFAULT_THEME,
  DARK_THEME
});

// Re-export the themes
export { default as defaultTheme } from './default';
export { default as darkTheme } from './dark';

// Export utilities
export { resolveTheme, ThemeStyles };

// Export types
export type { TtabsTheme, TtabsCssVariables, TtabsElementType } from '../types/theme-types'; 