import type { TileState, TilePanelState } from '../types/tile-types';
import type { TtabsStorageAdapter, TtabsStorageData } from './adapter';

/**
 * LocalStorage adapter for Ttabs
 */
export class LocalStorageAdapter implements TtabsStorageAdapter {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceDelay: number;

  /**
   * Create a LocalStorage adapter
   * @param storageKey Key to use in localStorage
   * @param debounceMs Debounce delay in milliseconds (default: 500ms)
   */
  constructor(private storageKey: string, debounceMs: number = 500) {
    this.debounceDelay = debounceMs;
  }
  
  /**
   * Save ttabs state to localStorage with debounce
   * @param state The tiles state
   */
  save(state: Record<string, TileState>): void {
    // Clear any existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set a new timer
    this.debounceTimer = setTimeout(() => {
      this.saveToStorage(state);
      this.debounceTimer = null;
    }, this.debounceDelay);
  }
  
  /**
   * Perform the actual save to localStorage
   */
  private saveToStorage(state: Record<string, TileState>): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    try {
      // Extract focused tab from state if needed
      const focusedTab = this.findFocusedTab(state);
      
      const serialized = JSON.stringify({
        tiles: Object.values(state),
        focusedTab
      });
      
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save ttabs state:', error);
    }
  }
  
  /**
   * Helper method to find focused tab from state
   */
  private findFocusedTab(state: Record<string, TileState>): string | undefined {
    // Find panels with active tabs
    const panels = Object.values(state).filter((tile): tile is TilePanelState => 
      tile.type === 'panel' && !!tile.activeTab);
      
    // Find the active panel (could be based on other criteria)
    const activePanel = panels[0];
    
    return activePanel?.activeTab || undefined;
  }
  
  /**
   * Load ttabs state from localStorage
   */
  load(): TtabsStorageData | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.tiles)) return null;
      
      // Convert array to record
      const tiles: Record<string, TileState> = {};
      parsed.tiles.forEach((tile: TileState) => {
        tiles[tile.id] = tile;
      });
      
      return {
        tiles,
        focusedTab: parsed.focusedTab
      };
    } catch (error) {
      console.error('Failed to load ttabs state:', error);
      return null;
    }
  }
} 