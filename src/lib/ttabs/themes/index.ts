import { DEFAULT_THEME, resolveTheme } from '../types/theme-types';
import { DARK_THEME } from './dark-theme';
import ThemeStyles from './theme-styles.svelte';

// Log themes to help with debugging
console.log('DEBUG - Themes importing in themes/index.ts:', {
  DEFAULT_THEME,
  DARK_THEME
});

export {
  DEFAULT_THEME,
  DARK_THEME,
  resolveTheme,
  ThemeStyles
}; 