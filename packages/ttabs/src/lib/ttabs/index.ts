/**
 * ttabs - tiled tabs
 * A flexible layout management system with draggable, resizable tiles and tabs
 */

import type { TtabsOptions } from './TTabs.svelte';
import { TTabs } from './TTabs.svelte';
export { Grid, Row as Row, Column, Panel, Tab } from './ttabsObjects';

// Export tile types
export type {
  TileState,
  TileGridState,
  TileRowState,
  TileColumnState,
  TilePanelState as TilePanel,
  TileTabState as TileTab,
  TileContentState as TileContent,
  TileType
} from './types/tile-types';

// Export theme types
export type { TtabsTheme } from './types/theme-types';
export { DEFAULT_THEME } from './types/theme-types';

// Export options type
export type { TtabsOptions } from './TTabs.svelte';

// Tile components
export { default as TileGridComponent } from './components/TileGrid.svelte';
export { default as TileRowComponent } from './components/TileRow.svelte';
export { default as TileColumnComponent } from './components/TileColumn.svelte';
export { default as TilePanelComponent } from './components/TilePanel.svelte';
export { default as TileTabComponent } from './components/TileTab.svelte';
export { default as TTabsRoot } from './components/TTabsRoot.svelte';

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

// Validation system
export { 
  LayoutValidationError,
  type LayoutValidator,
  type ValidationErrorHandler,
  type ValidationMiddleware
} from './validation';

// Convenience factory function for Svelte
export function createTtabs(options: TtabsOptions = {}): TTabs {
  return new TTabs(options);
}