import type { Tile, TileGrid, TileRow, TileColumn, TilePanel, TileTab, TileContent, TileType } from './types/tile-types';
import { generateId } from './utils/tile-utils';
import type { Component } from 'svelte';
import type { TtabsTheme } from './types/theme-types';
import { DEFAULT_THEME, resolveTheme } from './types/theme-types';

/**
 * Type for component registry
 */
interface ContentComponent {
  component: Component<any>;
  defaultProps?: Record<string, any>;
}

/**
 * Type for state change callback
 */
export type StateChangeCallback = (state: Record<string, Tile>) => void;

/**
 * Options for creating a ttabs instance
 */
export interface TtabsOptions {
  /**
   * Initial tiles state (optional)
   * If provided, the instance will be initialized with these tiles
   * If not provided, a default root grid will be created
   */
  tiles?: Record<string, Tile> | Tile[];

  /**
   * Initially focused tab (optional)
   * If provided, this tab will be set as the focused active tab
   */
  focusedTab?: string;

  /**
   * Theme configuration (optional)
   * If not provided, the default theme will be used
   */
  theme?: TtabsTheme;
}

/**
 * Ttabs class implementation
 */
export class Ttabs {

  private tiles = $state<Record<string, Tile>>({});
  private activePanel = $state<string | null>(null);
  private focusedActiveTabInternal = $state<string | null>(null);

  // Root grid tracking
  rootGridId = $state<string>('');

  // Component registry
  private componentRegistry = $state<Record<string, ContentComponent>>({});

  // Theme state
  theme = $state<TtabsTheme>(DEFAULT_THEME);

  // State change listeners
  private stateChangeListeners: StateChangeCallback[] = [];

  // Public read-only derived value for focused tab
  focusedActiveTab = $derived(this.focusedActiveTabInternal);

  /**
   * Find the root grid ID from the current tiles
   * @returns The ID of the root grid
   * @throws Error if no root grid is found
   * @private
   */
  private findRootGridId(): string {
    const rootGridId = Object.values(this.tiles)
      .find(tile => tile.type === 'grid' && !tile.parent)?.id || '';

    if (rootGridId === '') {
      throw new Error('No root grid found');
    }

    return rootGridId;
  }

  constructor(options: TtabsOptions = {}) {
    // Initialize state
    if (options.tiles) {
      if (Array.isArray(options.tiles)) {
        // Convert array to record
        this.tiles = {};

        // Add each tile to the state
        options.tiles.forEach(tile => {
          this.tiles[tile.id] = tile;
        });

        // Find the root grid in the initial state
        this.rootGridId = this.findRootGridId();
      } else {
        // Record format provided directly
        this.tiles = options.tiles;

        // Find the root grid
        this.rootGridId = this.findRootGridId();
      }
    } else {
      // Auto-create a root grid if no initial state is provided
      this.rootGridId = this.addGrid();
    }

    // Initialize theme with resolution for inheritance
    if (options.theme) {
      this.theme = resolveTheme(options.theme);
    } else {
      this.theme = DEFAULT_THEME;
    }

    // Set focused tab if provided
    if (options.focusedTab && this.getTile<TileTab>(options.focusedTab)) {
      this.focusedActiveTabInternal = options.focusedTab;
    }

    // Setup notification effect to call subscribers when tiles change
    $effect(() => {
      // Access tiles to trigger the effect when they change
      const currentTiles = this.tiles;

      // Notify listeners
      this.notifyStateChange();
    });
  }

  /**
   * Subscribe to state changes
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.push(callback);

    // Call immediately with current state
    callback(this.tiles);

    // Return unsubscribe function
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(callback => {
      callback(this.tiles);
    });
  }

  /**
   * Register a component for content rendering
   * @param componentId Unique identifier for the component
   * @param component Svelte component to render
   * @param defaultProps Optional default props for the component
   */
  registerComponent(
    componentId: string,
    component: Component<any>,
    defaultProps: Record<string, any> = {}
  ): void {
    this.componentRegistry[componentId] = { component, defaultProps };
  }

  /**
   * Get a registered component by ID
   * @param componentId The component identifier
   * @returns The component and its default props, or null if not found
   */
  getContentComponent(componentId: string): ContentComponent | null {
    return this.componentRegistry[componentId] || null;
  }

  /**
   * Check if a component is registered
   * @param componentId The component identifier
   * @returns True if the component is registered
   */
  hasContentComponent(componentId: string): boolean {
    return !!this.componentRegistry[componentId];
  }

  /**
   * Set component to a column or a tab
   * @param parentId ID of the parent column or tab
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   * @returns ID of the new content with component
   */
  setComponent(
    parentId: string,
    componentId: string,
    props: Record<string, any> = {}
  ): string {
    // Verify component exists
    if (!this.hasContentComponent(componentId)) {
      throw new Error(`Component with ID ${componentId} is not registered`);
    }

    // Get parent tile
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Handle different parent types
    if (parent.type === 'tab') {
      // Tab content handling
      const tab = parent as TileTab;

      // Check if tab already has content - update it instead of creating new
      if (tab.content && this.getTile(tab.content)) {
        const existingContent = this.getTile<TileContent>(tab.content);
        if (existingContent && existingContent.type === 'content') {
          this.updateTile(tab.content, {
            componentId,
            data: {
              ...existingContent.data,
              componentProps: props
            }
          });
          return tab.content;
        }
      }

      // Create the content
      const contentId = this.addTile({
        type: 'content',
        parent: parentId,
        componentId,
        data: {
          componentProps: props
        }
      });

      // Update tab's content
      this.updateTile(parentId, {
        content: contentId
      });

      return contentId;
    }
    else if (parent.type === 'column') {
      // Column content handling
      const column = parent as TileColumn;

      // Check if column already has a child
      if (column.child && this.getTile(column.child)) {
        // Remove existing child if it's content type
        const existingChild = this.getTile(column.child);
        if (existingChild && existingChild.type === 'content') {
          // Update existing content instead of creating new
          this.updateTile(column.child, {
            componentId,
            data: {
              componentProps: props
            }
          });
          return column.child;
        } else {
          // Remove existing child that's not content type
          this.removeTile(column.child);
        }
      }

      // Create the content
      const contentId = this.addTile({
        type: 'content',
        parent: parentId,
        componentId,
        data: {
          componentProps: props
        }
      });

      // Update column's child reference
      this.updateTile(parentId, {
        child: contentId
      });

      return contentId;
    }
    else {
      throw new Error(`Cannot add content to a parent of type ${parent.type}. Content can only be child of a tab or column.`);
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
   * Get a grid by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a grid
   */
  getGrid(id: string): TileGrid {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Grid not found: ${id}`);
    }
    if (tile.type !== 'grid') {
      throw new Error(`Tile ${id} is not a grid, found ${tile.type}`);
    }
    return tile as TileGrid;
  }

  /**
   * Get a row by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a row
   */
  getRow(id: string): TileRow {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Row not found: ${id}`);
    }
    if (tile.type !== 'row') {
      throw new Error(`Tile ${id} is not a row, found ${tile.type}`);
    }
    return tile as TileRow;
  }

  /**
   * Get a column by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a column
   */
  getColumn(id: string): TileColumn {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Column not found: ${id}`);
    }
    if (tile.type !== 'column') {
      throw new Error(`Tile ${id} is not a column, found ${tile.type}`);
    }
    return tile as TileColumn;
  }

  /**
   * Get a panel by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a panel
   */
  getPanel(id: string): TilePanel {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Panel not found: ${id}`);
    }
    if (tile.type !== 'panel') {
      throw new Error(`Tile ${id} is not a panel, found ${tile.type}`);
    }
    return tile as TilePanel;
  }

  /**
   * Get a tab by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a tab
   */
  getTab(id: string): TileTab {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Tab not found: ${id}`);
    }
    if (tile.type !== 'tab') {
      throw new Error(`Tile ${id} is not a tab, found ${tile.type}`);
    }
    return tile as TileTab;
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
   * Add a new tile to the layout
   * @param tile Tile to add (requires type property)
   * @returns ID of the new tile
   */
  addTile<T extends Tile>(tile: Partial<T> & { type: T['type'] }): string {
    // Generate ID if not provided
    const id = tile.id || generateId();

    // Create a new tile with the ID
    const newTile = {
      id,
      ...tile
    } as T;

    // Add to state
    this.tiles[id] = newTile;

    // Notify state changes
    this.notifyStateChange();

    return id;
  }

  /**
   * Update a tile with the given changes
   * @param id ID of the tile to update
   * @param updates Changes to apply
   * @returns True if successful
   */
  updateTile<T extends Tile>(id: string, updates: Partial<T>): boolean {
    const tile = this.getTile(id);
    if (!tile) return false;

    this.tiles[id] = { ...tile, ...updates };

    // Notify state changes
    this.notifyStateChange();

    return true;
  }

  /**
   * Find all tiles that reference the specified tile
   * @param tileId ID of the tile to find references to
   * @returns Array of tiles that reference the specified tile
   */
  private findTilesReferencingTile(tileId: string): Tile[] {
    return Object.values(this.tiles).filter(tile => {
      if (tile.type === 'grid' && tile.rows.includes(tileId)) {
        return true;
      }
      if (tile.type === 'row' && tile.columns.includes(tileId)) {
        return true;
      }
      if (tile.type === 'column' && tile.child === tileId) {
        return true;
      }
      if (tile.type === 'panel' && tile.tabs.includes(tileId)) {
        return true;
      }
      if (tile.type === 'tab' && tile.content === tileId) {
        return true;
      }
      return false;
    });
  }

  /**
   * Remove a tile from the layout
   * @param id ID of the tile to remove
   * @returns True if successful
   */
  removeTile(id: string): boolean {
    const tile = this.getTile(id);
    if (!tile) return false;

    // Check for references to this tile throughout the layout
    const referencingTiles = this.findTilesReferencingTile(id);

    // Remove references to this tile
    referencingTiles.forEach((referencingTile: Tile) => {
      if (referencingTile.type === 'grid' && 'rows' in referencingTile) {
        this.updateTile(referencingTile.id, {
          rows: referencingTile.rows.filter((rowId: string) => rowId !== id)
        });
      }
      else if (referencingTile.type === 'row' && 'columns' in referencingTile) {
        this.updateTile(referencingTile.id, {
          columns: referencingTile.columns.filter((colId: string) => colId !== id)
        });
      }
      else if (referencingTile.type === 'column' && 'child' in referencingTile) {
        if (referencingTile.child === id) {
          this.updateTile(referencingTile.id, {
            child: ''
          });
        }
      }
      else if (referencingTile.type === 'panel' && 'tabs' in referencingTile) {
        this.updateTile(referencingTile.id, {
          tabs: referencingTile.tabs.filter((tabId: string) => tabId !== id),
          activeTab: referencingTile.activeTab === id ? null : referencingTile.activeTab
        });
      }
      else if (referencingTile.type === 'tab' && 'content' in referencingTile) {
        if (referencingTile.content === id) {
          this.updateTile(referencingTile.id, {
            content: ''
          });
        }
      }
    });

    // Delete the tile itself
    delete this.tiles[id];

    // Notify state changes
    this.notifyStateChange();

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

    // Also set as focused tab
    this.focusedActiveTabInternal = tabId;

    return true;
  }

  /**
   * Set the focused active tab
   * @param tabId ID of the tab to focus
   * @returns True if successful
   */
  setFocusedActiveTab(tabId: string): boolean {
    const tab = this.getTile<TileTab>(tabId);
    if (!tab || tab.type !== 'tab') return false;

    // Ensure the tab is active in its panel
    const panelId = tab.parent;
    if (!panelId) return false;

    const panel = this.getTile<TilePanel>(panelId);
    if (!panel || panel.type !== 'panel') return false;

    // If the tab is not the active one in its panel, make it active
    if (panel.activeTab !== tabId) {
      this.updateTile(panelId, { activeTab: tabId });
    }

    // Set the panel as active if it's not already
    if (this.activePanel !== panelId) {
      this.setActivePanel(panelId);
    }

    // Set the focused tab
    this.focusedActiveTabInternal = tabId;

    return true;
  }

  /**
   * Get the focused active tab
   */
  getFocusedActiveTabTile(): TileTab | null {
    return this.focusedActiveTabInternal ? this.getTile<TileTab>(this.focusedActiveTabInternal) : null;
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
   * @param tabId The tab to move
   * @param targetPanelId The panel to move the tab to
   * @param targetIndex Optional index where to insert the tab in the target panel
   * @returns boolean True if the operation was successful
   */
  moveTab(tabId: string, targetPanelId: string, targetIndex?: number): boolean {
    try {
      // Get the tab and determine source panel
      const tab = this.getTab(tabId);

      const sourcePanelId = tab.parent;
      if (!sourcePanelId) {
        throw new Error(`Tab ${tabId} has no parent panel`);
      }

      // Get the source and target panels
      const sourcePanel = this.getPanel(sourcePanelId);
      const targetPanel = this.getPanel(targetPanelId);

      // Check if the tab is in the source panel
      if (!sourcePanel.tabs.includes(tabId)) {
        throw new Error(`Tab ${tabId} is not in source panel ${sourcePanelId}`);
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
    } catch (error) {
      console.error('Error in moveTab:', error);
      return false;
    }
  }

  /**
   * Split a panel to create a new layout
   * @param tabId The tab to move to the new panel
   * @param targetPanelId The panel being split
   * @param direction The direction to split ('top', 'right', 'bottom', 'left')
   * @returns boolean True if the split operation was successful
   */
  splitPanel(
    tabId: string,
    targetPanelId: string,
    direction: 'top' | 'right' | 'bottom' | 'left'
  ): boolean {
    try {
      // Get the tab and determine source panel
      const tab = this.getTab(tabId);
      const sourcePanelId = tab.parent;

      if (!sourcePanelId) {
        throw new Error(`Tab ${tabId} has no parent panel`);
      }

      // Get the source and target panels
      const sourcePanel = this.getPanel(sourcePanelId);
      const targetPanel = this.getPanel(targetPanelId);

      // Check if the tab is in the source panel
      if (!sourcePanel.tabs.includes(tabId)) {
        throw new Error(`Tab ${tabId} is not in source panel ${sourcePanelId}`);
      }

      // Prevent splitting a panel with its only tab
      if (sourcePanelId === targetPanelId && sourcePanel.tabs.length === 1) {
        console.warn('Cannot split a panel with its only tab');
        return false;
      }

      // Find the column containing the target panel
      const targetParentId = targetPanel.parent;
      if (!targetParentId) {
        throw new Error(`Target panel ${targetPanelId} has no parent`);
      }

      const parentColumn = this.getColumn(targetParentId);

      // Different approach based on split direction
      if (direction === 'left' || direction === 'right') {
        // Horizontal split: Find the row containing the column with the target panel
        const rowId = parentColumn.parent;
        if (!rowId) {
          throw new Error(`Column ${parentColumn.id} has no parent row`);
        }

        const row = this.getRow(rowId);

        // Find the index of the current column in the row
        const columnIndex = row.columns.indexOf(parentColumn.id);
        if (columnIndex === -1) {
          throw new Error(`Column ${parentColumn.id} not found in row ${rowId}`);
        }

        // Calculate new width for existing and new column (50/50 split)
        const newWidth = parentColumn.width / 2;

        // Update existing column width
        this.updateTile(parentColumn.id, { width: newWidth });

        // Create a new column
        const newColumnId = this.addTile<TileColumn>({
          type: 'column',
          parent: rowId,
          width: newWidth,
          child: undefined
        });

        // Create a new panel in the new column
        const newPanelId = this.addTile<TilePanel>({
          type: 'panel',
          parent: newColumnId,
          tabs: [],
          activeTab: null
        });

        // Update new column with the new panel
        this.updateTile(newColumnId, { child: newPanelId });

        // Update row with the new column in the correct position (left or right of existing)
        const newColumns = [...row.columns];
        if (direction === 'right') {
          // Add after the current column
          newColumns.splice(columnIndex + 1, 0, newColumnId);
        } else {
          // Add before the current column
          newColumns.splice(columnIndex, 0, newColumnId);
        }

        this.updateTile(rowId, { columns: newColumns });

        // Move the tab to the new panel
        return this.moveTab(tabId, newPanelId);

      } else if (direction === 'top' || direction === 'bottom') {
        // Vertical split

        // Check if the column already contains a grid
        let gridId: string;

        if (parentColumn.child === targetPanelId) {
          // Column directly contains the panel, need to create a grid

          // Create new grid
          gridId = this.addTile<TileGrid>({
            type: 'grid',
            parent: parentColumn.id,
            rows: []
          });

          // Create two rows for the existing panel and the new one
          const rowHeight = 50; // 50% each

          // Create rows in appropriate order based on direction
          const firstRowId = this.addTile<TileRow>({
            type: 'row',
            parent: gridId,
            height: rowHeight,
            columns: []
          });

          const secondRowId = this.addTile<TileRow>({
            type: 'row',
            parent: gridId,
            height: rowHeight,
            columns: []
          });

          // Create a column for the existing panel
          const existingPanelColumnId = this.addTile<TileColumn>({
            type: 'column',
            parent: direction === 'top' ? secondRowId : firstRowId,
            width: 100, // 100% of row width
            child: targetPanelId
          });

          // Create a column for the new panel
          const newPanelColumnId = this.addTile<TileColumn>({
            type: 'column',
            parent: direction === 'top' ? firstRowId : secondRowId,
            width: 100, // 100% of row width
            child: undefined
          });

          // Update rows with their columns
          this.updateTile(firstRowId, {
            columns: [direction === 'top' ? newPanelColumnId : existingPanelColumnId]
          });

          this.updateTile(secondRowId, {
            columns: [direction === 'top' ? existingPanelColumnId : newPanelColumnId]
          });

          // Update grid with rows
          this.updateTile(gridId, {
            rows: [firstRowId, secondRowId]
          });

          // Create a new panel
          const newPanelId = this.addTile<TilePanel>({
            type: 'panel',
            parent: newPanelColumnId,
            tabs: [],
            activeTab: null
          });

          // Update column with new panel
          this.updateTile(newPanelColumnId, { child: newPanelId });

          // Update target panel parent to point to its new column
          this.updateTile(targetPanelId, { parent: existingPanelColumnId });

          // Update column to point to the grid instead of directly to the panel
          this.updateTile(parentColumn.id, { child: gridId });

          // Move the tab to the new panel
          return this.moveTab(tabId, newPanelId);

        } else {
          // Column already contains a grid or something else, need to handle differently
          const existingChild = parentColumn.child;
          if (!existingChild) {
            throw new Error(`Column ${parentColumn.id} has no child`);
          }

          try {
            // Try to get the child as a grid
            const grid = this.getGrid(existingChild);
            gridId = existingChild;

            // Find the row containing the target panel
            let targetRowId: string | null = null;
            let targetRow: TileRow | null = null;

            for (const rowId of grid.rows) {
              try {
                const row = this.getRow(rowId);

                // Check if any column in this row contains the target panel
                for (const colId of row.columns) {
                  try {
                    const col = this.getColumn(colId);
                    if (col.child === targetPanelId) {
                      targetRowId = rowId;
                      targetRow = row;
                      break;
                    }
                  } catch (error) {
                    console.error(`Error checking column ${colId}:`, error);
                    // Continue to next column
                  }
                }

                if (targetRowId) break;
              } catch (error) {
                console.error(`Error checking row ${rowId}:`, error);
                // Continue to next row
              }
            }

            if (!targetRowId || !targetRow) {
              throw new Error(`Could not find row containing panel ${targetPanelId}`);
            }

            // Calculate height for the new row
            const rowIndex = grid.rows.indexOf(targetRowId);
            const newHeight = targetRow.height / 2;

            // Update existing row height
            this.updateTile(targetRowId, { height: newHeight });

            // Create a new row
            const newRowId = this.addTile<TileRow>({
              type: 'row',
              parent: gridId,
              height: newHeight,
              columns: []
            });

            // Create a new column in the row
            const newColumnId = this.addTile<TileColumn>({
              type: 'column',
              parent: newRowId,
              width: 100, // 100% of the row
              child: undefined
            });

            // Create a new panel in the column
            const newPanelId = this.addTile<TilePanel>({
              type: 'panel',
              parent: newColumnId,
              tabs: [],
              activeTab: null
            });

            // Update column with panel
            this.updateTile(newColumnId, { child: newPanelId });

            // Update row with column
            this.updateTile(newRowId, { columns: [newColumnId] });

            // Update grid with new row in the right position
            const newRows = [...grid.rows];
            if (direction === 'bottom') {
              // Add after the current row
              newRows.splice(rowIndex + 1, 0, newRowId);
            } else {
              // Add before the current row
              newRows.splice(rowIndex, 0, newRowId);
            }

            this.updateTile(gridId, { rows: newRows });

            // Move the tab to the new panel
            return this.moveTab(tabId, newPanelId);
          } catch (error) {
            // The child is not a grid
            console.error(`Error handling existing child ${existingChild}:`, error);
            return false;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error in splitPanel:', error);
      return false;
    }
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
          const row = this.getRow(parentId);
          const siblingColumns = row.columns.filter(id => id !== tileId);
          if (siblingColumns.length > 0) {
            this.redistributeWidths(siblingColumns, column.width);
          }

        }
        break;

      case 'row':
        // Remove the row if it has no columns
        const row = tile as TileRow;
        shouldRemove = row.columns.length === 0;

        // Redistribute the height to siblings if removing
        if (shouldRemove && parentId) {
          const grid = this.getGrid(parentId);
          const siblingRows = grid.rows.filter(id => id !== tileId);
          if (siblingRows.length > 0) {
            this.redistributeHeights(siblingRows, row.height);
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
                this.updateTile(child, { parent: parentColumn.id });
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
   * Reset the state
   */
  resetState(): void {
    // With runes we can directly assign
    this.tiles = {};
    this.activePanel = null;
    this.focusedActiveTabInternal = null;
    this.rootGridId = this.addGrid();
  }

  /**
   * Adds a grid to the layout
   * @param parentId Optional parent column ID
   * @returns ID of the new grid
   * @throws Error if parent hierarchy rules are violated
   */
  addGrid(parentId?: string | null): string {
    if (parentId) {
      const parent = this.getTile(parentId);
      if (!parent) {
        throw new Error(`Parent tile with ID ${parentId} not found`);
      }

      // Validate parent hierarchy rules
      if (parent.type === 'column') {
        // A grid can be added to a column
      } else {
        throw new Error(`Cannot add a grid to a parent of type ${parent.type}. Grids can only be children of columns.`);
      }
    }

    const gridId = this.addTile({
      type: 'grid',
      parent: parentId || null,
      rows: []
    });

    // If parent is a column, update the column's child reference
    if (parentId) {
      const parent = this.getTile(parentId);
      if (parent && parent.type === 'column') {
        this.updateTile(parentId, {
          child: gridId
        });
      }
    }

    return gridId;
  }

  /**
   * Adds a row to a grid
   * @param parentId ID of the parent grid
   * @param height Height of the row as a percentage
   * @returns ID of the new row
   * @throws Error if parent hierarchy rules are violated
   */
  addRow(parentId: string, height: number = 100): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Validate parent hierarchy rules
    if (parent.type !== 'grid') {
      throw new Error(`Cannot add a row to a parent of type ${parent.type}. Rows can only be children of grids.`);
    }

    const grid = parent as TileGrid;

    // Create the row
    const rowId = this.addTile({
      type: 'row',
      parent: parentId,
      columns: [],
      height
    });

    // Update grid's rows
    this.updateTile(parentId, {
      rows: [...grid.rows, rowId]
    });

    return rowId;
  }

  /**
   * Adds a column to a row
   * @param parentId ID of the parent row
   * @param width Width of the column as a percentage
   * @returns ID of the new column
   * @throws Error if parent hierarchy rules are violated
   */
  addColumn(parentId: string, width: number = 100): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Validate parent hierarchy rules
    if (parent.type !== 'row') {
      throw new Error(`Cannot add a column to a parent of type ${parent.type}. Columns can only be children of rows.`);
    }

    const row = parent as TileRow;

    // Create the column
    const columnId = this.addTile({
      type: 'column',
      parent: parentId,
      child: '',
      width
    });

    // Update row's columns
    this.updateTile(parentId, {
      columns: [...row.columns, columnId]
    });

    return columnId;
  }

  /**
   * Adds a panel to a column
   * @param parentId ID of the parent column
   * @returns ID of the new panel
   * @throws Error if parent hierarchy rules are violated
   */
  addPanel(parentId: string): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Validate parent hierarchy rules
    if (parent.type !== 'column') {
      throw new Error(`Cannot add a panel to a parent of type ${parent.type}. Panels can only be children of columns.`);
    }

    const column = parent as TileColumn;

    // Check if column already has a child
    if (column.child && this.getTile(column.child)) {
      throw new Error(`Column ${parentId} already has a child. Remove it first.`);
    }

    // Create the panel
    const panelId = this.addTile({
      type: 'panel',
      parent: parentId,
      tabs: [],
      activeTab: null
    });

    // Update column's child
    this.updateTile(parentId, {
      child: panelId
    });

    return panelId;
  }

  /**
   * Adds a tab to a panel
   * @param parentId ID of the parent panel
   * @param name Name of the tab
   * @param setActive Whether to set this tab as active
   * @returns ID of the new tab
   * @throws Error if parent hierarchy rules are violated
   */
  addTab(parentId: string, name: string, setActive: boolean = true): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Validate parent hierarchy rules
    if (parent.type !== 'panel') {
      throw new Error(`Cannot add a tab to a parent of type ${parent.type}. Tabs can only be children of panels.`);
    }

    const panel = parent as TilePanel;

    // Create the tab
    const tabId = this.addTile({
      type: 'tab',
      parent: parentId,
      name,
      content: ''
    });

    // Create content for the tab
    const contentId = this.addTile({
      type: 'content',
      parent: tabId,
    });

    // Update tab with its content
    this.updateTile(tabId, {
      content: contentId
    });

    // Update panel's tabs
    const updatedTabs = [...panel.tabs, tabId];
    this.updateTile(parentId, {
      tabs: updatedTabs,
      ...(setActive ? { activeTab: tabId } : {})
    });

    return tabId;
  }

  /**
   * Ads a new tab in the active panel
   * @param name Name of the tab
   * @returns ID of the new tab, or null if no active panel exists
   */
  addTabInActivePanel(name: string, setActive: boolean = true): string | null {
    const activePanel = this.getActivePanelTile();
    if (!activePanel) return null;

    const tabId = this.addTab(activePanel.id, name, setActive);

    return tabId;
  }

  /**
   * Serialize the layout to JSON
   */
  serializeLayout(): string {
    // Get all tiles as an array
    const tilesArray = Object.values(this.tiles);

    // Add metadata for focused tab
    const metadata = {
      focusedActiveTab: this.focusedActiveTabInternal
    };

    return JSON.stringify({
      tiles: tilesArray,
      metadata
    });
  }

  /**
   * Deserialize a layout from JSON
   */
  deserializeLayout(json: string): boolean {
    try {
      // Try to parse as new format first (with metadata)
      try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object' && 'tiles' in parsed && Array.isArray(parsed.tiles)) {
          // Reset current state
          this.resetState();

          // Set tiles from array
          parsed.tiles.forEach((tile: Tile) => {
            this.tiles[tile.id] = tile;
          });

          // Find the root grid
          this.rootGridId = this.findRootGridId();

          // Restore metadata
          if (parsed.metadata && 'focusedActiveTab' in parsed.metadata) {
            const focusedTabId = parsed.metadata.focusedActiveTab;
            if (focusedTabId && this.getTile<TileTab>(focusedTabId)) {
              this.focusedActiveTabInternal = focusedTabId;
            }
          }

          return true;
        }
      } catch (e) {
        // Fall back to older formats
      }

      // Try to parse as array format (without metadata)
      try {
        const parsedTiles = JSON.parse(json) as Tile[];
        if (Array.isArray(parsedTiles)) {
          // Reset current state
          this.resetState();

          // Set tiles from array
          parsedTiles.forEach(tile => {
            this.tiles[tile.id] = tile;
          });

          // Find the root grid
          this.rootGridId = this.findRootGridId();

          // Try to find a suitable tab to focus
          this.findAndSetDefaultFocusedTab();

          return true;
        }
      } catch (e) {
        // Fall back to record format if array parsing fails
        console.error('Failed to deserialize layout:', e);
        return false;
      }

      return false;
    } catch (e) {
      console.error('Failed to deserialize layout:', e);
      return false;
    }
  }

  /**
   * Find and set a default focused tab when none is specified
   * Used after deserializing older layouts
   */
  private findAndSetDefaultFocusedTab(): void {
    // If active panel exists, try to use its active tab
    if (this.activePanel) {
      const panel = this.getTile<TilePanel>(this.activePanel);
      if (panel && panel.activeTab) {
        this.focusedActiveTabInternal = panel.activeTab;
        return;
      }
    }

    // Otherwise find the first panel with an active tab
    const panelsWithActiveTabs = Object.values(this.tiles)
      .filter((tile): tile is TilePanel =>
        tile.type === 'panel' && tile.activeTab !== null && !!this.getTile(tile.activeTab));

    if (panelsWithActiveTabs.length > 0 && panelsWithActiveTabs[0].activeTab) {
      this.focusedActiveTabInternal = panelsWithActiveTabs[0].activeTab;
    }
  }

  /**
   * Close a tab and remove it
   * @param tabId The ID of the tab to close
   * @returns True if successful
   */
  closeTab(tabId: string): boolean {
    try {
      const tab = this.getTile<TileTab>(tabId);
      if (!tab || tab.type !== 'tab') return false;

      const panelId = tab.parent;
      if (!panelId) return false;

      const panel = this.getTile<TilePanel>(panelId);
      if (!panel || panel.type !== 'panel') return false;

      // Find index of tab to remove
      const tabIndex = panel.tabs.indexOf(tabId);
      if (tabIndex === -1) return false;

      // If we're closing the focused tab, we need to find a new tab to focus
      let newFocusedTab: string | null = null;
      if (this.focusedActiveTabInternal === tabId) {
        // First try to find another tab in the same panel
        if (panel.tabs.length > 1) {
          // Use the same logic as for activeTab - get next or previous tab
          const newTabIndex = Math.min(tabIndex, panel.tabs.length - 2);
          newFocusedTab = panel.tabs[newTabIndex];
          if (newFocusedTab === tabId) {
            // Extra safety check
            newFocusedTab = panel.tabs.find(t => t !== tabId) || null;
          }
        } else {
          // Look for a tab in another panel
          const otherPanels = Object.values(this.tiles)
            .filter((tile): tile is TilePanel =>
              tile.type === 'panel' && tile.id !== panelId && tile.tabs.length > 0);

          // Find the first panel with tabs and use its active tab
          const otherPanel = otherPanels[0];
          if (otherPanel && otherPanel.activeTab) {
            newFocusedTab = otherPanel.activeTab;
          }
        }
      }

      // Remove tab
      this.removeTile(tabId);

      // Update panel's tabs array
      const newTabs = [...panel.tabs];
      newTabs.splice(tabIndex, 1);

      // If closed tab was active, activate another tab
      let newActiveTab = panel.activeTab;
      if (panel.activeTab === tabId) {
        if (newTabs.length > 0) {
          // Activate either the tab at the same index, or the last tab
          const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveTab = newTabs[newActiveIndex];
        } else {
          newActiveTab = null;
        }
      }

      // Update panel
      this.updateTile(panelId, {
        tabs: newTabs,
        activeTab: newActiveTab
      });

      // Update the focused tab if needed
      if (newFocusedTab) {
        this.focusedActiveTabInternal = newFocusedTab;
      }

      // Clean up empty containers
      this.cleanupContainers(panelId);

      return true;
    } catch (error) {
      console.error('Error closing tab:', error);
      return false;
    }
  }

  /**
   * Set or update the theme
   */
  setTheme(theme: TtabsTheme): void {
    console.log('Setting theme:', theme.name);

    // Resolve the theme to handle inheritance
    const resolvedTheme = resolveTheme(theme);

    // Ensure we're making a full replacement to trigger reactivity
    this.theme = { ...resolvedTheme };

    console.log('Theme updated:', this.theme.name);
  }
}