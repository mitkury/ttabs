/**
 * ttabs - tiled tabs
 * A flexible layout management system with draggable, resizable tiles and tabs
 */

// Main class export
export { Ttabs } from './Ttabs.svelte';
export type { TtabsOptions } from './Ttabs.svelte';

// Tile components
export { default as TileGrid } from './components/TileGrid.svelte';
export { default as TileRow } from './components/TileRow.svelte';
export { default as TileColumn } from './components/TileColumn.svelte';
export { default as TilePanel } from './components/TilePanel.svelte';
export { default as TileTab } from './components/TileTab.svelte';
export { default as TtabsRoot } from './components/TtabsRoot.svelte';

// Types
export type * from './types/tile-types';

// Theming system
export type { TtabsTheme } from './types/theme-types';
export { DEFAULT_THEME } from './types/theme-types';
export { DARK_THEME } from './themes/dark-theme';

// Utilities
export { generateId } from './utils/tile-utils';

// Convenience factory function
import { Ttabs, type TtabsOptions } from './Ttabs.svelte';
export function createTtabs(options: TtabsOptions = {}): Ttabs {
  return new Ttabs(options);
}

// Re-export components once they're created
// export * from './components';