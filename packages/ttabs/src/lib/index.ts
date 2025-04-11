/**
 * ttabs-svelte - A flexible layout management system with draggable, resizable tiles and tabs for Svelte applications
 */

// Re-export everything from the ttabs implementation
export * from './ttabs';

// Export default theme
export { default as defaultTheme } from './ttabs/themes/default';
export { default as darkTheme } from './ttabs/themes/dark';

// Explicitly export the main Ttabs class
export { Ttabs } from './ttabs/Ttabs.svelte'; 