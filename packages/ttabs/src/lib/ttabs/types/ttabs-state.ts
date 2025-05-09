import type { TileState } from './tile-types';

/**
 * Interface representing the complete state of a Ttabs instance
 * Used for state synchronization between core and wrapper implementations
 */
export interface TtabsState {
  /**
   * All tiles in the layout
   */
  tiles: Record<string, TileState>;
  
  /**
   * ID of the active panel
   */
  activePanel: string | null;
  
  /**
   * ID of the currently focused tab
   */
  focusedActiveTab: string | null;
  
  /**
   * ID of the root grid
   */
  rootGridId: string | null;
  
  /**
   * Theme configuration
   */
  theme: any; // We'll import the proper type later
} 