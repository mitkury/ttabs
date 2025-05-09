import type { TileState } from '../types/tile-types';

/**
 * Storage adapter interface for Ttabs
 */
export interface TtabsStorageAdapter {
  /**
   * Save ttabs state
   * @param state The tiles state
   */
  save(state: Record<string, TileState>): Promise<void> | void;
  
  /**
   * Load ttabs state
   * @returns Promise resolving to state object or null if no state exists
   */
  load(): Promise<TtabsStorageData | null> | TtabsStorageData | null;
}

/**
 * Storage data structure containing tiles and focused tab
 */
export interface TtabsStorageData {
  tiles: Record<string, TileState>;
  focusedTab?: string;
} 