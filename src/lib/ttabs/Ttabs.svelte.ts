/**
 * Factory function for creating ttabs instances
 */

import type { Tile, TileGrid, TileRow, TileColumn, TilePanel, TileTab, TileContent, TileType } from './types/tile-types';
import { generateId, serializeTiles, deserializeTiles } from './utils/tile-utils';

/**
 * Options for creating a ttabs instance
 */
export interface TtabsOptions {
  /**
   * Initial tiles state (optional)
   */
  initialState?: Record<string, Tile>;

  /**
   * Auto-save storage key (optional)
   * If provided, layout will be auto-saved to localStorage
   */
  storageKey?: string;
}

/**
 * Ttabs class implementation
 */
export class Ttabs {

  private tiles = $state<Record<string, Tile>>({});
  private activePanel = $state<string | null>(null);
  private storageKey?: string;

  constructor(options: TtabsOptions = {}) {
    // Initialize state
    if (options.initialState) {
      this.tiles = options.initialState;
    }

    this.storageKey = options.storageKey;

    // Setup auto-save if requested
    if (this.storageKey && typeof window !== 'undefined' && window.localStorage) {
      // Load saved layout if it exists
      const savedLayout = localStorage.getItem(this.storageKey);
      if (savedLayout) {
        this.deserializeLayout(savedLayout);
      }

      // Setup auto-save effect
      $effect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(this.storageKey!, this.serializeLayout());
        }
      });
    }
  }

  /**
   * Get all tiles
   */
  getTiles(): Record<string, Tile> {
    return this.tiles;
  }

  /**
   * Get the active panel ID
   */
  getActivePanel(): string | null {
    return this.activePanel;
  }

  /**
   * Get a specific tile by ID with type casting
   */
  getTile<T extends Tile = Tile>(id: string): T | null {
    return (this.tiles[id] || null) as T | null;
  }

  /**
   * Get children of a tile filtered by type
   */
  getChildren(parentId: string, tileType: TileType | null = null): Tile[] {
    return Object.values(this.tiles)
      .filter((tile): tile is Tile => Boolean(tile))
      .filter(tile => tile.parent === parentId)
      .filter(tile => !tileType || tile.type === tileType);
  }

  /**
   * Get the currently active panel
   */
  getActivePanelTile(): TilePanel | null {
    return this.activePanel ? this.getTile<TilePanel>(this.activePanel) : null;
  }

  /**
   * Get the active tab of the active panel
   */
  getActivePanelTab(): TileTab | null {
    const panel = this.getActivePanelTile();
    if (!panel || !panel.activeTab) return null;
    return this.getTile<TileTab>(panel.activeTab);
  }

  /**
   * Get the content associated with a tab
   */
  getTabContent(tabId: string): TileContent | null {
    const tab = this.getTile<TileTab>(tabId);
    if (!tab) return null;
    return this.getTile<TileContent>(tab.content);
  }

  /**
   * Add a new tile to the state
   */
  addTile<T extends Tile>(tile: Partial<T> & { type: T['type'] }): string {
    // Generate ID if not provided
    const id = tile.id || generateId(tile.type);

    // Create the complete tile with defaults
    const newTile = {
      id,
      parent: null,
      ...tile,
    } as Tile;

    // Add to state - with runes we can directly mutate
    this.tiles[id] = newTile;
    return id;
  }

  /**
   * Update an existing tile
   */
  updateTile<T extends Tile>(id: string, updates: Partial<T>): boolean {
    if (!this.tiles[id]) return false;

    // With runes we can directly update properties
    this.tiles[id] = { ...this.tiles[id], ...updates } as Tile;
    return true;
  }

  /**
   * Remove a tile and all its descendants
   */
  removeTile(id: string): boolean {
    const tile = this.tiles[id];
    if (!tile) return false;

    // Handle cleanup based on tile type
    if (tile.type === 'grid') {
      [...(tile as TileGrid).rows].forEach(rowId => this.removeTile(rowId));
    } else if (tile.type === 'row') {
      [...(tile as TileRow).columns].forEach(colId => this.removeTile(colId));
    } else if (tile.type === 'column') {
      const childId = (tile as TileColumn).child;
      if (childId && this.tiles[childId]) {
        this.removeTile(childId);
      }
    } else if (tile.type === 'panel') {
      [...(tile as TilePanel).tabs].forEach(tabId => this.removeTile(tabId));
    } else if (tile.type === 'tab') {
      const contentId = (tile as TileTab).content;
      if (contentId && this.tiles[contentId]) {
        this.removeTile(contentId);
      }
    }

    // Remove from parent's children array
    if (tile.parent && this.tiles[tile.parent]) {
      const parent = this.tiles[tile.parent];

      if (parent.type === 'grid') {
        this.updateTile(parent.id, {
          rows: (parent as TileGrid).rows.filter(rowId => rowId !== id)
        });
      } else if (parent.type === 'row') {
        this.updateTile(parent.id, {
          columns: (parent as TileRow).columns.filter(colId => colId !== id)
        });
      } else if (parent.type === 'panel') {
        const panelTile = parent as TilePanel;
        this.updateTile(parent.id, {
          tabs: panelTile.tabs.filter(tabId => tabId !== id),
          // If we removed the active tab, select another one if available
          activeTab: panelTile.activeTab === id
            ? (panelTile.tabs.length > 1 ? panelTile.tabs.find(t => t !== id) || null : null)
            : panelTile.activeTab
        });
      }
    }

    // If the active panel is being removed, clear it
    if (id === this.activePanel) {
      this.activePanel = null;
    }

    // Delete the tile - with runes we can directly delete
    delete this.tiles[id];
    return true;
  }

  /**
   * Set the active panel
   */
  setActivePanel(id: string): boolean {
    const panel = this.getTile<TilePanel>(id);
    if (!panel || panel.type !== 'panel') return false;

    // With runes we can directly assign
    this.activePanel = id;
    return true;
  }

  /**
   * Set the active tab
   */
  setActiveTab(tabId: string): boolean {
    const tab = this.getTile<TileTab>(tabId);
    if (!tab || tab.type !== 'tab') return false;

    const panelId = tab.parent;
    if (!panelId) return false;

    const panel = this.getTile<TilePanel>(panelId);
    if (!panel || panel.type !== 'panel') return false;

    this.updateTile(panelId, { activeTab: tabId });
    this.setActivePanel(panelId);
    return true;
  }

  /**
   * Reorder tabs within a panel
   */
  reorderTabs(panelId: string, oldIndex: number, newIndex: number): boolean {
    const panel = this.getTile<TilePanel>(panelId);
    if (!panel || panel.type !== 'panel') return false;

    // Make sure indices are valid
    if (oldIndex < 0 || oldIndex >= panel.tabs.length ||
      newIndex < 0 || newIndex >= panel.tabs.length) {
      return false;
    }

    // Create a new array with reordered tabs
    const reorderedTabs = [...panel.tabs];
    const [movedTab] = reorderedTabs.splice(oldIndex, 1);
    reorderedTabs.splice(newIndex, 0, movedTab);

    // Update the panel
    this.updateTile(panelId, { tabs: reorderedTabs });
    return true;
  }

  /**
   * Move a tab from one panel to another
   */
  moveTab(tabId: string, sourcePanelId: string, targetPanelId: string, targetIndex?: number): boolean {
    // Get the source and target panels
    const sourcePanel = this.getTile<TilePanel>(sourcePanelId);
    const targetPanel = this.getTile<TilePanel>(targetPanelId);
    const tab = this.getTile<TileTab>(tabId);

    // Check if everything exists and is valid
    if (!sourcePanel || sourcePanel.type !== 'panel' ||
      !targetPanel || targetPanel.type !== 'panel' ||
      !tab || tab.type !== 'tab') {
      return false;
    }

    // Check if the tab is in the source panel
    if (!sourcePanel.tabs.includes(tabId)) {
      return false;
    }

    // Create copies of the tab arrays
    const sourceTabs = [...sourcePanel.tabs];
    const targetTabs = [...targetPanel.tabs];

    // Remove the tab from the source panel
    const sourceIndex = sourceTabs.indexOf(tabId);
    sourceTabs.splice(sourceIndex, 1);

    // Find a new active tab for the source panel if needed
    let newSourceActiveTab = sourcePanel.activeTab;
    if (sourcePanel.activeTab === tabId) {
      // Get the next tab, or the previous one if there is no next
      newSourceActiveTab = sourceTabs.length > 0 ? sourceTabs[Math.min(sourceIndex, sourceTabs.length - 1)] : null;
    }

    // Add the tab to the target panel at the specified index or at the end
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= targetTabs.length) {
      targetTabs.splice(targetIndex, 0, tabId);
    } else {
      // Append to the end
      targetTabs.push(tabId);
    }

    // Update the tab's parent reference
    this.updateTile(tabId, { parent: targetPanelId });

    // Update the source panel
    this.updateTile(sourcePanelId, {
      tabs: sourceTabs,
      activeTab: newSourceActiveTab
    });

    // Update the target panel and make the moved tab active
    this.updateTile(targetPanelId, {
      tabs: targetTabs,
      activeTab: tabId
    });

    // Set the target panel as active
    this.setActivePanel(targetPanelId);

    // Check if source panel is now empty and should be cleaned up
    this.cleanupContainers(sourcePanelId);

    return true;
  }

  /**
   * Recursively checks and cleans up empty containers
   * Traverses up the hierarchy to remove unnecessary container structures
   */
  cleanupContainers(tileId: string): void {
    const tile = this.getTile(tileId);
    if (!tile) return;

    // Handle based on tile type
    if (tile.type === 'panel') {
      const panel = tile as TilePanel;
      
      // Skip if panel has tabs
      if (panel.tabs.length > 0) return;
      
      // Get parent container
      const parentId = panel.parent;
      if (!parentId) return;
      
      // Remove empty panel
      this.removeTile(tileId);
      
      // Continue cleanup with parent
      this.cleanupContainers(parentId);
    }
    else if (tile.type === 'column') {
      const column = tile as TileColumn;
      
      // Skip if column has a valid child
      if (column.child && this.tiles[column.child]) return;
      
      // Get parent row
      const parentId = column.parent;
      if (!parentId) return;
      
      const row = this.getTile<TileRow>(parentId);
      if (!row) return;
      
      // Get sibling columns
      const siblingColumns = row.columns.filter(id => id !== tileId);
      
      // Redistribute width if there are siblings
      if (siblingColumns.length > 0) {
        this.redistributeWidths(siblingColumns, column.width);
      }
      
      // Remove column
      this.removeTile(tileId);
      
      // Continue cleanup with parent
      this.cleanupContainers(parentId);
    }
    else if (tile.type === 'row') {
      const row = tile as TileRow;
      
      // Skip if row has columns
      if (row.columns.length > 0) return;
      
      // Get parent grid
      const parentId = row.parent;
      if (!parentId) return;
      
      const grid = this.getTile<TileGrid>(parentId);
      if (!grid) return;
      
      // Get sibling rows
      const siblingRows = grid.rows.filter(id => id !== tileId);
      
      // Redistribute height if there are siblings
      if (siblingRows.length > 0) {
        this.redistributeHeights(siblingRows, row.height);
      }
      
      // Remove row
      this.removeTile(tileId);
      
      // Continue with grid cleanup or simplification
      if (siblingRows.length === 0) {
        this.cleanupContainers(parentId);
      } else {
        this.simplifyGridHierarchy(parentId);
      }
    }
    else if (tile.type === 'grid') {
      const grid = tile as TileGrid;
      
      // Skip if grid has rows or is the root grid
      if (grid.rows.length > 0 || !grid.parent) return;
      
      // Remove empty grid
      this.removeTile(tileId);
      
      // Continue cleanup with parent
      this.cleanupContainers(grid.parent);
    }
  }

  /**
   * Redistributes width proportionally among columns
   */
  redistributeWidths(columnIds: string[], availableWidth: number): void {
    if (columnIds.length === 0 || availableWidth <= 0) return;

    const columns = columnIds.map(id => this.getTile<TileColumn>(id)).filter(Boolean) as TileColumn[];
    if (columns.length === 0) return;

    const totalExistingWidth = columns.reduce((sum, col) => sum + col.width, 0);
    if (totalExistingWidth <= 0) return; // Prevent division by zero

    // Distribute proportionally
    columns.forEach(column => {
      const proportion = column.width / totalExistingWidth;
      const newWidth = column.width + (availableWidth * proportion);
      this.updateTile(column.id, { width: newWidth });
    });
  }

  /**
   * Redistributes height proportionally among rows
   */
  redistributeHeights(rowIds: string[], availableHeight: number): void {
    if (rowIds.length === 0 || availableHeight <= 0) return;

    const rows = rowIds.map(id => this.getTile<TileRow>(id)).filter(Boolean) as TileRow[];
    if (rows.length === 0) return;

    const totalExistingHeight = rows.reduce((sum, row) => sum + row.height, 0);
    if (totalExistingHeight <= 0) return; // Prevent division by zero

    // Distribute proportionally
    rows.forEach(row => {
      const proportion = row.height / totalExistingHeight;
      const newHeight = row.height + (availableHeight * proportion);
      this.updateTile(row.id, { height: newHeight });
    });
  }

  /**
   * Simplifies grid hierarchy by merging nested grids when possible
   */
  simplifyGridHierarchy(gridId: string): void {
    const grid = this.getTile<TileGrid>(gridId);
    if (!grid || grid.rows.length !== 1) return;

    const rowId = grid.rows[0];
    const row = this.getTile<TileRow>(rowId);
    if (!row || row.columns.length !== 1) return;

    const columnId = row.columns[0];
    const column = this.getTile<TileColumn>(columnId);
    if (!column || !column.child) return;

    const childTile = this.getTile(column.child);
    if (!childTile || childTile.type !== 'grid') return;

    // We have a grid > row > column > grid structure that can be simplified
    const childGridId = childTile.id;
    const childGrid = childTile as TileGrid;

    // Transfer all rows from child grid to this grid
    const newRows = [...childGrid.rows];

    // Update parent references for all transferred rows
    newRows.forEach(childRowId => {
      const childRow = this.getTile<TileRow>(childRowId);
      if (childRow) {
        this.updateTile(childRowId, { parent: gridId });
      }
    });

    // Update the grid with the new rows
    this.updateTile(gridId, { rows: newRows });

    // Clean up the old structure (row, column, and child grid)
    this.removeTile(childGridId);
    this.removeTile(columnId);
    this.removeTile(rowId);
  }

  /**
   * Reset the state to empty
   */
  resetState(): void {
    // In runes, we can replace the entire state
    for (const key in this.tiles) {
      delete this.tiles[key];
    }

    // Clear active panel
    this.activePanel = null;
  }

  /**
   * Serialize the current layout to JSON
   */
  serializeLayout(): string {
    return serializeTiles(this.tiles);
  }

  /**
   * Deserialize a layout from JSON
   */
  deserializeLayout(json: string): boolean {
    try {
      const parsedTiles = deserializeTiles(json);
      if (!parsedTiles) return false;

      // Reset current state
      this.resetState();

      // Load new state - with runes we can add each tile directly
      Object.entries(parsedTiles).forEach(([key, value]) => {
        this.tiles[key] = value as Tile;
      });

      return true;
    } catch (e) {
      console.error('Failed to deserialize layout:', e);
      return false;
    }
  }
}