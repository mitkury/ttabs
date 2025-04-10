/**
 * ttabs - tiled tabs
 * A flexible layout management system with draggable, resizable tiles and tabs
 */

// Export main factory function
export { Ttabs, type TtabsOptions } from './Ttabs.svelte';

// Export types
export * from './types/tile-types';

// Export utility functions
export * from './utils/tile-utils';

// Export components
export { default as TileGrid } from './components/TileGrid.svelte';
export { default as TileRow } from './components/TileRow.svelte';
export { default as TileColumn } from './components/TileColumn.svelte';
export { default as TilePanel } from './components/TilePanel.svelte';
export { default as TileTab } from './components/TileTab.svelte';

// Re-export components once they're created
// export * from './components';