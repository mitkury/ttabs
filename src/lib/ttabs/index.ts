/**
 * ttabs - tiled tabs
 * A flexible layout management system with draggable, resizable tiles and tabs
 */

// Export main factory function and class
export { Ttabs, type TtabsOptions } from './Ttabs.svelte';

// Convenience factory function
import { Ttabs, type TtabsOptions } from './Ttabs.svelte';
export function createTtabs(options: TtabsOptions = {}): Ttabs {
  return new Ttabs(options);
}

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
export { default as TtabsRoot } from './components/TtabsRoot.svelte';

// Re-export components once they're created
// export * from './components';