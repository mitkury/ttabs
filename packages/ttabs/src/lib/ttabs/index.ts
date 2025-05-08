/**
 * ttabs - tiled tabs
 * A flexible layout management system with draggable, resizable tiles and tabs
 */

import type { TtabsOptions } from './Ttabs.svelte';
import { Ttabs } from './Ttabs.svelte';
import { extendTtabs } from './TtabsObjects';
export { TtabsGrid, TtabsRow, TtabsColumn, TtabsPanel, TtabsTab } from './TtabsObjects';
export type { TtabsWithObjects } from './TtabsObjects';

// Export tile types
export type { 
  Tile, 
  TileGrid, 
  TileRow, 
  TileColumn, 
  TilePanel, 
  TileTab, 
  TileContent,
  TileType 
} from './types/tile-types';

// Export theme types
export type { TtabsTheme } from './types/theme-types';
export { DEFAULT_THEME } from './types/theme-types';

// Export options type
export type { TtabsOptions } from './Ttabs.svelte';

// Tile components
export { default as TileGridComponent } from './components/TileGrid.svelte';
export { default as TileRowComponent } from './components/TileRow.svelte';
export { default as TileColumnComponent } from './components/TileColumn.svelte';
export { default as TilePanelComponent } from './components/TilePanel.svelte';
export { default as TileTabComponent } from './components/TileTab.svelte';
export { default as TtabsRoot } from './components/TtabsRoot.svelte';

// Types
export type * from './types/tile-types';

// Theming system
export type { TtabsCssVariables, TtabsElementType } from './types/theme-types';
// Export themes from the themes directory only
export * from './themes';

// Storage adapters and interfaces
export type { TtabsStorageAdapter, TtabsStorageData } from './storage/adapter';
export { LocalStorageAdapter } from './storage/local-storage';

// Utilities
export { generateId } from './utils/tile-utils';

// Convenience factory function for Svelte
export function createTtabs(options: TtabsOptions = {}): Ttabs {
  return new Ttabs(options);
}

// Convenience factory function for object-oriented API
export function createObjectTtabs(options: TtabsOptions = {}) {
  const ttabs = createTtabs(options);
  return extendTtabs(ttabs);
}

// Function to extend an existing ttabs instance with object-oriented API
export { extendTtabs };