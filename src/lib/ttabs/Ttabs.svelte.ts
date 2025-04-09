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

    let parentId = tile.parent;
    let shouldRemove = false;

    // Check if the tile should be removed based on its type
    switch (tile.type) {
      case 'panel':
        // Remove the panel if it has no tabs
        const panel = tile as TilePanel;
        shouldRemove = panel.tabs.length === 0;
        break;

      case 'column':
        // Remove the column if it has no valid child
        const column = tile as TileColumn;
        shouldRemove = !column.child || !this.tiles[column.child];

        // Redistribute the width to siblings if removing
        if (shouldRemove && parentId) {
          const row = this.getTile<TileRow>(parentId);
          if (row) {
            const siblingColumns = row.columns.filter(id => id !== tileId);
            if (siblingColumns.length > 0) {
              this.redistributeWidths(siblingColumns, column.width);
            }
          }
        }
        break;

      case 'row':
        // Remove the row if it has no columns
        const row = tile as TileRow;
        shouldRemove = row.columns.length === 0;

        // Redistribute the height to siblings if removing
        if (shouldRemove && parentId) {
          const grid = this.getTile<TileGrid>(parentId);
          if (grid) {
            const siblingRows = grid.rows.filter(id => id !== tileId);
            if (siblingRows.length > 0) {
              this.redistributeHeights(siblingRows, row.height);
            }
          }
        }
        break;

      case 'grid':
        // Remove the grid if it has no rows and is not the root
        const grid = tile as TileGrid;
        shouldRemove = grid.rows.length === 0 && !!grid.parent;

        // Check if we can simplify the grid hierarchy (for non root grids)
        if (!shouldRemove && grid.parent) {
          // In case if we have a grid with a single row and a single column, we can remove 
          // the grid and replace it with the only child of the column from that grid.
          if (grid.rows.length === 1) {
            const row = this.getTile<TileRow>(grid.rows[0]);
            // Just one row with a single column
            if (row && row.columns.length === 1) {
              const column = this.getTile<TileColumn>(row.columns[0]);
              const child = column?.child;
              const parentColumn = this.getTile<TileColumn>(grid.parent);
              if (child && parentColumn) {
                this.updateTile(parentColumn.id, { child: child });
                this.updateTile(grid.id, { rows: [] });
                this.removeTile(grid.id);
              }
            }
          }
        }

        break;
    }

    // Remove the tile if necessary and continue cleanup with parent
    if (shouldRemove) {
      this.removeTile(tileId);
    }

    if (parentId) {
      this.cleanupContainers(parentId);
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

    // Check for grid > row > column > grid pattern
    const row = this.getTile<TileRow>(grid.rows[0]);
    if (!row || row.columns.length !== 1) return;

    const column = this.getTile<TileColumn>(row.columns[0]);
    if (!column || !column.child) return;

    const childTile = this.getTile(column.child);
    if (!childTile || childTile.type !== 'grid') return;

    // We found a simplifiable pattern
    const childGrid = childTile as TileGrid;

    // Transfer rows from child grid to parent grid
    const newRows = [...childGrid.rows];

    // Update parent references
    newRows.forEach(childRowId => {
      const childRow = this.getTile<TileRow>(childRowId);
      if (childRow) {
        this.updateTile(childRowId, { parent: gridId });
      }
    });

    // Update parent grid and clean up
    this.updateTile(gridId, { rows: newRows });
    this.removeTile(childGrid.id);
    this.removeTile(column.id);
    this.removeTile(row.id);
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