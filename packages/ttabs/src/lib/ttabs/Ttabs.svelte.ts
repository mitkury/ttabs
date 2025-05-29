import type { TileState, TileGridState, TileRowState, TileColumnState, TilePanelState, TileTabState, TileContentState, TileType, SizeInfo } from './types/tile-types';
import { generateId } from './utils/tile-utils';
import type { Component } from 'svelte';
import type { TtabsTheme } from './types/theme-types';
import { DEFAULT_THEME, resolveTheme } from './types/theme-types';
import { parseSizeValue, calculateSizes } from './utils/size-utils';
import { Column, Grid, Panel, Row, Tab } from './ttabsObjects';
import { createValidationMiddleware, type LayoutValidator, type ValidationErrorHandler, type ValidationMiddleware } from './validation';

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
export type StateChangeCallback = (state: Record<string, TileState>) => void;

/**
 * Type for setup callback
 */
export type SetupCallback = (result: { didResetToDefaultLayout: boolean }) => void;

/**
 * Options for creating a ttabs instance
 */
export interface TtabsOptions {
  /**
   * Initial tiles state (optional)
   * If provided, the instance will be initialized with these tiles
   * If not provided, a default root grid will be created
   */
  tiles?: Record<string, TileState> | TileState[];

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

  /**
   * Custom validators to add to the validation middleware (optional)
   * These will be run after the default validator
   */
  validators?: LayoutValidator[];

  /**
   * Function to create a default layout when validation fails (optional)
   * If not provided, a minimal valid layout will be created
   */
  defaultLayoutCreator?: (ttabs: Ttabs) => void;

  setupFromScratch?: SetupCallback;
}

/**
 * Ttabs class implementation
 */
export class Ttabs {
  tiles: Record<string, TileState> = $state({});
  activePanel: string | null = $state(null);
  focusedActiveTab: string | null = $state(null);
  rootGridId: string = $state('');
  componentRegistry: Record<string, ContentComponent> = $state({});
  theme: TtabsTheme = $state(DEFAULT_THEME);

  // State change listeners
  stateChangeListeners: StateChangeCallback[] = [];
  debouncedStateChangeListeners: StateChangeCallback[] = [];
  pendingNotification: number | null = null;
  pendingStateChanges: boolean = false;

  // Validation middleware
  private validationMiddleware: ValidationMiddleware;

  private setupFromScratchCallback?: SetupCallback;

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
    // Initialize validation middleware
    this.validationMiddleware = createValidationMiddleware(
      this,
      options.validators || [],
      options.defaultLayoutCreator
    );

    this.setupFromScratchCallback = options.setupFromScratch;

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

      // Validate initial layout when created with tiles
      this.validateLayout();
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
    if (options.focusedTab && this.getTile<TileTabState>(options.focusedTab)) {
      this.focusedActiveTab = options.focusedTab;
    }
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
   * Subscribe to state changes with debouncing (calls at the end of the frame)
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribeDebounced(callback: StateChangeCallback): () => void {
    this.debouncedStateChangeListeners.push(callback);

    // Call immediately with current state
    callback(this.tiles);

    // Return unsubscribe function
    return () => {
      this.debouncedStateChangeListeners = this.debouncedStateChangeListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyStateChange(): void {
    // Immediately notify regular subscribers
    this.stateChangeListeners.forEach(callback => {
      callback(this.tiles);
    });

    // Mark that we have pending state changes
    this.pendingStateChanges = true;
    
    // Schedule debounced notifications at the end of the frame
    if (this.debouncedStateChangeListeners.length > 0 && this.pendingNotification === null) {
      this.pendingNotification = requestAnimationFrame(() => {
        // Only process if we have pending changes
        if (this.pendingStateChanges) {
          this.debouncedStateChangeListeners.forEach(callback => {
            callback(this.tiles);
          });
          // Reset the pending state changes flag
          this.pendingStateChanges = false;
        }
        this.pendingNotification = null;
      });
    }
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
      const tab = parent as TileTabState;

      // Check if tab already has content - update it instead of creating new
      if (tab.content && this.getTile(tab.content)) {
        const existingContent = this.getTile<TileContentState>(tab.content);
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
      const column = parent as TileColumnState;

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
  getTiles(): Record<string, TileState> {
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
  getTile<T extends TileState = TileState>(id: string): T | null {
    return (this.tiles[id] || null) as T | null;
  }

  /**
   * Get a grid by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a grid
   */
  getGrid(id: string): TileGridState {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Grid not found: ${id}`);
    }
    if (tile.type !== 'grid') {
      throw new Error(`Tile ${id} is not a grid, found ${tile.type}`);
    }
    return tile as TileGridState;
  }

  /**
   * Get a row by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a row
   */
  getRow(id: string): TileRowState {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Row not found: ${id}`);
    }
    if (tile.type !== 'row') {
      throw new Error(`Tile ${id} is not a row, found ${tile.type}`);
    }
    return tile as TileRowState;
  }

  /**
   * Get a column by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a column
   */
  getColumn(id: string): TileColumnState {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Column not found: ${id}`);
    }
    if (tile.type !== 'column') {
      throw new Error(`Tile ${id} is not a column, found ${tile.type}`);
    }
    return tile as TileColumnState;
  }

  /**
   * Get a panel by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a panel
   */
  getPanel(id: string): TilePanelState {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Panel not found: ${id}`);
    }
    if (tile.type !== 'panel') {
      throw new Error(`Tile ${id} is not a panel, found ${tile.type}`);
    }
    return tile as TilePanelState;
  }

  /**
   * Get a tab by ID, throwing an error if not found
   * @throws Error if the tile is not found or not a tab
   */
  getTab(id: string): TileTabState {
    const tile = this.tiles[id];
    if (!tile) {
      throw new Error(`Tab not found: ${id}`);
    }
    if (tile.type !== 'tab') {
      throw new Error(`Tile ${id} is not a tab, found ${tile.type}`);
    }
    return tile as TileTabState;
  }

  /**
   * Get children of a tile filtered by type
   */
  getChildren(parentId: string, tileType: TileType | null = null): TileState[] {
    return Object.values(this.tiles)
      .filter((tile): tile is TileState => Boolean(tile))
      .filter(tile => tile.parent === parentId)
      .filter(tile => !tileType || tile.type === tileType);
  }

  /**
   * Get the currently active panel
   */
  getActivePanelTile(): TilePanelState | null {
    return this.activePanel ? this.getTile<TilePanelState>(this.activePanel) : null;
  }

  /**
   * Get the active tab of the active panel
   */
  getActivePanelTab(): TileTabState | null {
    const panel = this.getActivePanelTile();
    if (!panel || !panel.activeTab) return null;
    return this.getTile<TileTabState>(panel.activeTab);
  }

  /**
   * Get the content associated with a tab
   */
  getTabContent(tabId: string): TileContentState | null {
    const tab = this.getTile<TileTabState>(tabId);
    if (!tab) return null;
    return this.getTile<TileContentState>(tab.content);
  }

  /**
   * Add a new tile to the layout
   * @param tile Tile to add (requires type property)
   * @returns ID of the new tile
   */
  addTile<T extends TileState>(tile: Partial<T> & { type: T['type'] }): string {
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
  updateTile<T extends TileState>(id: string, updates: Partial<T>): boolean {
    const tile = this.getTile(id);
    if (!tile) return false;

    // Special handling for grid rows to ensure it's always an array
    if (tile.type === 'grid' && 'rows' in updates) {
      updates = { ...updates, rows: updates.rows || [] };
    }
    
    // Create the new tile state
    const newTile = { ...tile, ...updates };
    
    // Check if anything actually changed
    if (JSON.stringify(tile) === JSON.stringify(newTile)) {
      // No changes, return without updating or notifying
      return true;
    }
    
    // Apply changes
    this.tiles[id] = newTile;
    
    // Notify state changes
    this.notifyStateChange();
    return true;
  }

  /**
   * Find all tiles that reference the specified tile
   * @param tileId ID of the tile to find references to
   * @returns Array of tiles that reference the specified tile
   */
  private findTilesReferencingTile(tileId: string): TileState[] {
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
    referencingTiles.forEach((referencingTile: TileState) => {
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
    const panel = this.getTile<TilePanelState>(id);
    if (!panel || panel.type !== 'panel') return false;

    this.activePanel = id;
    return true;
  }

  /**
   * Set the active tab
   */
  setActiveTab(tabId: string): boolean {
    const tab = this.getTile<TileTabState>(tabId);
    if (!tab || tab.type !== 'tab') return false;

    const panelId = tab.parent;
    if (!panelId) return false;

    const panel = this.getTile<TilePanelState>(panelId);
    if (!panel || panel.type !== 'panel') return false;

    this.updateTile(panelId, { activeTab: tabId });
    this.setActivePanel(panelId);

    // Also set as focused tab
    this.focusedActiveTab = tabId;

    return true;
  }

  /**
   * Set the focused active tab
   * @param tabId ID of the tab to focus
   * @returns True if successful
   */
  setFocusedActiveTab(tabId: string): boolean {
    const tab = this.getTile<TileTabState>(tabId);
    if (!tab || tab.type !== 'tab') return false;

    // Ensure the tab is active in its panel
    const panelId = tab.parent;
    if (!panelId) return false;

    const panel = this.getTile<TilePanelState>(panelId);
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
    this.focusedActiveTab = tabId;

    return true;
  }

  /**
   * Get the focused active tab
   */
  getFocusedActiveTabTile(): TileTabState | null {
    return this.focusedActiveTab ? this.getTile<TileTabState>(this.focusedActiveTab) : null;
  }

  /**
   * Reorder tabs within a panel
   */
  reorderTabs(panelId: string, oldIndex: number, newIndex: number): boolean {
    const panel = this.getTile<TilePanelState>(panelId);
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

        // Get the target column width
        let targetColumnWidth = parentColumn.width;

        // Calculate new width - half of the current column's width
        const newWidth = {
          value: targetColumnWidth.value / 2,
          unit: targetColumnWidth.unit
        };

        // Update existing column width
        this.updateTile(parentColumn.id, { width: newWidth });

        // Create a new column
        const newColumnId = this.addTile<TileColumnState>({
          type: 'column',
          parent: rowId,
          width: newWidth,
          child: undefined
        });

        // Create a new panel in the new column
        const newPanelId = this.addTile<TilePanelState>({
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

        // Update the target panel's parent reference if needed
        if (parentColumn.child === targetPanelId) {
          this.updateTile(targetPanelId, { parent: parentColumn.id });
        }

        // Move the tab to the new panel
        return this.moveTab(tabId, newPanelId);

      } else if (direction === 'top' || direction === 'bottom') {
        // Vertical split

        // Check if the column already contains a grid
        let gridId: string;

        if (parentColumn.child === targetPanelId) {
          // Column directly contains the panel, need to create a grid

          // Create new grid
          gridId = this.addTile<TileGridState>({
            type: 'grid',
            parent: parentColumn.id,
            rows: []
          });

          // Create two rows for the existing panel and the new one
          const rowHeight = { value: 50, unit: '%' as const }; // 50% each

          // Create rows in appropriate order based on direction
          const firstRowId = this.addTile<TileRowState>({
            type: 'row',
            parent: gridId,
            height: rowHeight,
            columns: []
          });

          const secondRowId = this.addTile<TileRowState>({
            type: 'row',
            parent: gridId,
            height: rowHeight,
            columns: []
          });

          // Create a column for the existing panel
          const existingPanelColumnId = this.addTile<TileColumnState>({
            type: 'column',
            parent: direction === 'top' ? secondRowId : firstRowId,
            width: { value: 100, unit: '%' as const }, // 100% of row width
            child: targetPanelId
          });

          // Create a column for the new panel
          const newPanelColumnId = this.addTile<TileColumnState>({
            type: 'column',
            parent: direction === 'top' ? firstRowId : secondRowId,
            width: { value: 100, unit: '%' as const }, // 100% of row width
            child: undefined
          });

          // Create a new panel
          const newPanelId = this.addTile<TilePanelState>({
            type: 'panel',
            parent: newPanelColumnId,
            tabs: [],
            activeTab: null
          });

          // Update column with new panel
          this.updateTile(newPanelColumnId, { child: newPanelId });

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
            let targetRow: TileRowState | null = null;

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

            // Get the target row height
            let targetRowHeight = targetRow.height;

            // Calculate new height - half of the current row's height
            const newHeight = {
              value: targetRowHeight.unit === '%' ? targetRowHeight.value / 2 : 50,
              unit: targetRowHeight.unit
            };

            // Update existing row height
            this.updateTile(targetRowId, { height: newHeight });

            // Create a new row
            const newRowId = this.addTile<TileRowState>({
              type: 'row',
              parent: gridId,
              height: newHeight,
              columns: []
            });

            // Create a new column in the row
            const newColumnId = this.addTile<TileColumnState>({
              type: 'column',
              parent: newRowId,
              width: { value: 100, unit: '%' as const }, // 100% of the row
              child: undefined
            });

            // Create a new panel in the column
            const newPanelId = this.addTile<TilePanelState>({
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
            const rowIndex = grid.rows.indexOf(targetRowId);
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

    if (tile.dontClean) {
      if (parentId) {
        // If the tile is marked as dontClean, we don't try to clean it but 
        // go up the hierarchy in case if the parent's parent needs cleaning.
        this.cleanupContainers(parentId);
      }
      return;
    }

    let shouldRemove = false;

    // Check if the tile should be removed based on its type
    switch (tile.type) {
      case 'panel':
        // Remove the panel if it has no tabs
        const panel = tile as TilePanelState;
        shouldRemove = panel.tabs.length === 0;
        break;

      case 'column':
        // Remove the column if it has no valid child
        const column = tile as TileColumnState;
        shouldRemove = !column.child || !this.tiles[column.child];

        // Redistribute the width to siblings if removing
        if (shouldRemove && parentId) {
          const row = this.getRow(parentId);
          const siblingColumns = row.columns.filter(id => id !== tileId);
          if (siblingColumns.length > 0) {
            this.redistributeWidths(column);
          }

        }
        break;

      case 'row':
        // Remove the row if it has no columns
        const row = tile as TileRowState;
        shouldRemove = row.columns.length === 0;

        // Redistribute the height to siblings if removing
        if (shouldRemove && parentId) {
          const grid = this.getGrid(parentId);
          const siblingRows = grid.rows.filter(id => id !== tileId);
          if (siblingRows.length > 0) {
            this.redistributeHeights(row);
          }

        }
        break;

      case 'grid':
        // Remove the grid if it has no rows and is not the root
        const grid = tile as TileGridState;
        shouldRemove = grid.rows.length === 0 && !!grid.parent;

        // Check if we can simplify the grid hierarchy (for non root grids)
        if (!shouldRemove && grid.parent) {
          // In case if we have a grid with a single row and a single column, we can remove 
          // the grid and replace it with the only child of the column from that grid.
          if (grid.rows.length === 1) {
            const row = this.getRow(grid.rows[0]);
            // Just one row with a single column
            if (row.columns.length === 1) {
              const column = this.getColumn(row.columns[0]);
              const child = column.child;
              if (child) {
                const parentColumn = this.getColumn(grid.parent);
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
   * Redistributes width from a removed column to its sibling columns
   * @param removedColumnId ID of the column being removed
   */
  redistributeWidths(removedColumn: TileColumnState): void {
    // Get the available width to redistribute
    const availableWidth = removedColumn.width;
    if (availableWidth.value <= 0) return;

    // Get the parent row to find siblings
    const parentRowId = removedColumn.parent;
    if (!parentRowId) return;

    const parentRow = this.getTile<TileRowState>(parentRowId);
    if (!parentRow || parentRow.type !== 'row') return;

    // Get sibling columns (excluding the one being removed)
    const siblingColumnIds = parentRow.columns.filter(id => id !== removedColumn.id);
    if (siblingColumnIds.length === 0) return;

    // Get the sibling column objects
    const siblingColumns = siblingColumnIds
      .map(id => this.getTile<TileColumnState>(id))
      .filter(Boolean) as TileColumnState[];

    if (siblingColumns.length === 0) return;

    // Check if any siblings have % units
    const percentColumns = siblingColumns.filter(col => col.width.unit === '%');

    // If we have percentage-based columns, only distribute to those
    const targetColumns = percentColumns.length > 0 ? percentColumns : siblingColumns;

    const totalExistingWidth = targetColumns.reduce((sum, col) => sum + col.width.value, 0);
    if (totalExistingWidth <= 0) return; // Prevent division by zero

    // Distribute proportionally among target columns
    targetColumns.forEach(column => {
      const proportion = column.width.value / totalExistingWidth;
      const newWidth = column.width.value + (availableWidth.value * proportion);
      this.updateTile(column.id, {
        width: {
          value: newWidth,
          unit: column.width.unit
        }
      });
    });
  }

  /**
   * Redistributes height from a removed row to its sibling rows
   * @param removedRow The row being removed
   */
  redistributeHeights(removedRow: TileRowState): void {
    // Get the available height to redistribute
    const availableHeight = removedRow.height;
    if (availableHeight.value <= 0) return;

    // Get the parent grid to find siblings
    const parentGridId = removedRow.parent;
    if (!parentGridId) return;

    const parentGrid = this.getTile<TileGridState>(parentGridId);
    if (!parentGrid || parentGrid.type !== 'grid') return;

    // Get sibling rows (excluding the one being removed)
    const siblingRowIds = parentGrid.rows.filter(id => id !== removedRow.id);
    if (siblingRowIds.length === 0) return;

    // Get the sibling row objects
    const siblingRows = siblingRowIds
      .map(id => this.getTile<TileRowState>(id))
      .filter(Boolean) as TileRowState[];

    if (siblingRows.length === 0) return;

    // Check if any siblings have % units
    const percentRows = siblingRows.filter(row => row.height.unit === '%');

    // If we have percentage-based rows, only distribute to those
    const targetRows = percentRows.length > 0 ? percentRows : siblingRows;

    const totalExistingHeight = targetRows.reduce((sum, row) => sum + row.height.value, 0);
    if (totalExistingHeight <= 0) return; // Prevent division by zero

    // Distribute proportionally among target rows
    targetRows.forEach(row => {
      const proportion = row.height.value / totalExistingHeight;
      const newHeight = row.height.value + (availableHeight.value * proportion);
      this.updateTile(row.id, {
        height: {
          value: newHeight,
          unit: row.height.unit
        }
      });
    });
  }

  /**
   * Reset the layout (but keeping the theme, components, etc.)
   */
  /**
   * Reset the layout (but keeping the theme, components, etc.)
   */
  resetTiles(): void {
    this.tiles = {};
    this.activePanel = null;
    this.focusedActiveTab = null;
    this.rootGridId = "";
  }

  /**
   * Validate the current layout
   * @returns True if layout is valid, false otherwise
   */
  validateLayout(): boolean {
    return this.validationMiddleware.validate(this);
  }

  /**
   * Reset to the default layout
   */
  resetToDefaultLayout(): void {
    this.validationMiddleware.resetToDefault(this);
  }

  /**
   * Add a custom validator to the validation middleware
   * @param validator The validator to add
   */
  addValidator(validator: LayoutValidator): void {
    this.validationMiddleware.validators.push(validator);
  }

  /**
   * Set the default layout creator function
   * @param creator Function that creates a default layout
   */
  setDefaultLayoutCreator(creator: (ttabs: Ttabs) => void): void {
    this.validationMiddleware.defaultLayoutCreator = creator;
  }

  /**
   * Subscribe to layout validation errors
   * @param handler Function to call when validation errors occur
   * @returns Unsubscribe function
   */
  onValidationError(handler: ValidationErrorHandler): () => void {
    this.validationMiddleware.addErrorHandler(handler);

    // Return unsubscribe function
    return () => {
      this.validationMiddleware.errorHandlers =
        this.validationMiddleware.errorHandlers.filter(h => h !== handler);
    };
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
    } else {
      if (this.rootGridId) {
        throw new Error("Cannot add a grid to the root grid");
      }
    }

    const gridId = this.addTile({
      type: 'grid',
      parent: parentId || null,
      rows: []
    });

    if (!parentId) {
      this.rootGridId = gridId;
    }

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
   * @param height Height of the row as a string (e.g., "100%", "260px")
   * @returns ID of the new row
   * @throws Error if parent hierarchy rules are violated
   */
  addRow(parentId: string, height?: string): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Validate parent hierarchy rules
    if (parent.type !== 'grid') {
      throw new Error(`Cannot add a row to a parent of type ${parent.type}. Rows can only be children of grids.`);
    }

    const grid = parent as TileGridState;
    let sizeInfo: SizeInfo;

    if (!height) {
      if (grid.rows.length === 0) {
        height = '100%';
      } else {
        // Calculate default percentage for the new row
        const newRowPercentage = 100 / (grid.rows.length + 1);

        // Get existing percentage-based rows
        const percentageRows = grid.rows
          .map(id => this.getTile<TileRowState>(id))
          .filter((row): row is TileRowState => !!row && row.height.unit === '%');

        if (percentageRows.length > 0) {
          // Calculate total existing percentage
          const totalExistingPercentage = percentageRows.reduce(
            (sum, row) => sum + row.height.value, 0
          );

          // Calculate scaling factor to redistribute remaining space
          const remainingPercentage = 100 - newRowPercentage;
          const scalingFactor = remainingPercentage / totalExistingPercentage;

          // Update existing rows proportionally
          percentageRows.forEach(row => {
            const newPercentage = row.height.value * scalingFactor;
            this.updateTile(row.id, {
              height: { value: newPercentage, unit: '%' as const }
            });
          });
        }

        height = `${newRowPercentage}%`;
      }
    }

    // Parse the height value
    sizeInfo = parseSizeValue(height);

    // Create the row
    const rowId = this.addTile({
      type: 'row',
      parent: parentId,
      columns: [],
      height: sizeInfo
    });

    // Update grid's rows
    this.updateTile(parentId, {
      rows: [...grid.rows, rowId]
    });

    //this.recalculateLayout(parentId);

    return rowId;
  }

  /**
   * Adds a column to a row
   * @param parentId ID of the parent row
   * @param width Width of the column as a string (e.g., "100%", "260px")
   * @returns ID of the new column
   * @throws Error if parent hierarchy rules are violated
   */
  addColumn(parentId: string, width?: string): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    // Validate parent hierarchy rules
    if (parent.type !== 'row') {
      throw new Error(`Cannot add a column to a parent of type ${parent.type}. Columns can only be children of rows.`);
    }

    const row = parent as TileRowState;

    // if width is not specified, calculate it based on the existing columns
    // if it's specified - use it as is for px and calculate size for % based. But also run detection of invalid sizes

    if (!width) {
      if (row.columns.length === 0) {
        width = '100%';
      } else {
        // Calculate default percentage for the new column
        const newColumnPercentage = 100 / (row.columns.length + 1);

        // Get existing percentage-based columns
        const percentageColumns = row.columns
          .map(id => this.getTile<TileColumnState>(id))
          .filter((col): col is TileColumnState => !!col && col.width.unit === '%');

        if (percentageColumns.length > 0) {
          // Calculate total existing percentage
          const totalExistingPercentage = percentageColumns.reduce(
            (sum, col) => sum + col.width.value, 0
          );

          // Calculate scaling factor to redistribute remaining space
          const remainingPercentage = 100 - newColumnPercentage;
          const scalingFactor = remainingPercentage / totalExistingPercentage;

          // Update existing columns proportionally
          percentageColumns.forEach(col => {
            const newPercentage = col.width.value * scalingFactor;
            this.updateTile(col.id, {
              width: { value: newPercentage, unit: '%' as const }
            });
          });
        }

        width = `${newColumnPercentage}%`;
      }
    } else {
      // Validate the width
      try {
        parseSizeValue(width);
      } catch (error) {
        throw new Error(`Invalid width format: ${width}. Expected format: "100%" or "260px"`);
      }
    }

    // Parse the width value
    const sizeInfo = parseSizeValue(width);

    // Create the column
    const columnId = this.addTile({
      type: 'column',
      parent: parentId,
      child: '',
      width: sizeInfo
    });

    // Update row's columns
    this.updateTile(parentId, {
      columns: [...row.columns, columnId]
    });

    //this.recalculateLayout(parentId);

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

    const column = parent as TileColumnState;

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
   * @param panelId ID of the parent panel
   * @param name Name of the tab
   * @param setActive Whether to set this tab as active
   * @param isLazy Whether to add the tab as lazy
   * @returns ID of the new tab
   * @throws Error if parent hierarchy rules are violated
   */
  private addTabToPanel(panel: TilePanelState, name: string, setActive: boolean = true, isLazy: boolean = false): string {
    // Create the tab
    const tabId = this.addTile({
      type: 'tab',
      parent: panel.id,
      name,
      content: '',
      isLazy
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
    this.updateTile(panel.id, {
      tabs: updatedTabs,
      ...(setActive ? { activeTab: tabId } : {})
    });

    return tabId;
  }

  /**
   * Adds a tab to a panel. If the parent is a grid, it will be added to the first row and column of the grid.
   * @param parentId ID of the parent container (grid, column, or panel)
   * @param name Name of the tab
   * @param setActive Whether to set this tab as active
   * @param isLazy Whether to add the tab as lazy
   * @returns ID of the new tab
   */
  addTab(parentId: string, name: string, setActive: boolean = true, isLazy: boolean = false): string {
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }

    switch (parent.type) {
      case 'panel':
        // Panel is the direct container for tabs, add directly
        return this.addTabToPanel(parent as TilePanelState, name, setActive, isLazy);

      case 'column':
        // Need to check if column already has a child
        const column = parent as TileColumnState;
        let panelId = '';

        if (column.child) {
          // If column already has a child, it might be a panel or a grid
          const child = this.getTile(column.child);
          if (!child) {
            // Child reference exists but tile doesn't, create a new panel
            panelId = this.addPanel(column.id);
          } else if (child.type === 'panel') {
            // Column already has a panel, use it
            panelId = child.id;
          } else if (child.type === 'grid') {
            // Column has a grid, find or create a panel in the grid
            panelId = this.findOrCreatePanelInGrid(child.id);
          } else {
            // Column has some other child (should be a content), replace with a panel
            this.removeTile(child.id);
            panelId = this.addPanel(column.id);
          }
        } else {
          // Column has no child, add a panel
          panelId = this.addPanel(column.id);
        }

        return this.addTabToPanel(this.getPanel(panelId), name, setActive, isLazy);

      case 'row':
        // For rows, we need to find or create a column to contain our panel
        const row = parent as TileRowState;
        let columnId: string;

        if (row.columns.length > 0) {
          // Use the last column in the row
          columnId = row.columns[row.columns.length - 1];
        } else {
          // Create a new column
          columnId = this.addColumn(row.id);
        }

        // Recursively call addTab with the column ID
        return this.addTab(columnId, name, setActive, isLazy);

      case 'grid':
        // Find or create a panel in the grid
        const panelInGridId = this.findOrCreatePanelInGrid(parentId);
        return this.addTabToPanel(this.getPanel(panelInGridId), name, setActive, isLazy);

      default:
        throw new Error(`Cannot add a tab to a parent of type ${parent.type}. Use a panel, column, row, or grid.`);
    }
  }

  /**
   * Finds an existing panel in a grid or creates a new one
   * @param gridId ID of the grid
   * @returns ID of a panel in the grid
   */
  private findOrCreatePanelInGrid(gridId: string): string {
    const grid = this.getGrid(gridId);

    // Try to find an existing panel
    for (const rowId of grid.rows) {
      const row = this.getRow(rowId);
      for (const columnId of row.columns) {
        try {
          const col = this.getColumn(columnId);
          if (col.child) {
            const child = this.getTile(col.child);
            if (child && child.type === 'panel') {
              return child.id;
            }
          }
        } catch (error) {
          console.error(`Error processing column ${columnId}:`, error);
        }
      }
    }

    // No panel found, create a new row, column, and panel
    let rowId: string;
    if (grid.rows.length === 0) {
      // No rows exist, create one
      rowId = this.addRow(gridId);
    } else {
      // Use the last row
      rowId = grid.rows[grid.rows.length - 1];
    }

    // Create a column in the row
    const columnId = this.addColumn(rowId);

    // Create a panel in the column
    return this.addPanel(columnId);
  }

  /**
   * Ads a new tab in the active panel
   * @param name Name of the tab
   * @returns ID of the new tab, or null if no active panel exists
   */
  addTabInActivePanel(name: string, setActive: boolean = true, isLazy: boolean = false): string | null {
    const activePanel = this.getActivePanelTile();
    if (!activePanel) return null;

    const tabId = this.addTabToPanel(activePanel, name, setActive, isLazy);

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
      activePanel: this.activePanel,
      focusedActiveTab: this.focusedActiveTab
    };

    return JSON.stringify({
      tiles: tilesArray,
      metadata
    });
  }

  /**
   * Setup the ttabs instance with the given tiles
   * This will validate the layout and reset to default if invalid
   * @param tiles The tiles to set up
   * @param options Optional settings for active panel and focused tab
   */
  setup(tiles: TileState[], { activePanel, focusedActiveTab }: { activePanel?: string, focusedActiveTab?: string } = {}) {
    this.resetTiles();

    let didResetToDefaultLayout = false;
    let success = true;

    try {
      const rootGrids = tiles.filter(tile =>
        tile.type === 'grid' && !tile.parent
      );

      if (rootGrids.length !== 1) {
        throw new Error('Invalid number of root grids. There has to be a single root grid.');
      }

      tiles.forEach((tile: TileState) => {
        this.tiles[tile.id] = tile;
      });

      this.rootGridId = rootGrids[0].id;

      // Validate the layout after setting up tiles
      this.validateLayout();

      if (activePanel) {
        const panel = this.getTile<TilePanelState>(activePanel);
        if (panel) {
          this.activePanel = activePanel;
        }
      }

      if (focusedActiveTab) {
        const focusedTab = this.getTile<TileTabState>(focusedActiveTab);
        if (focusedTab) {
          this.focusedActiveTab = focusedActiveTab;
        } else {
          this.findAndSetDefaultFocusedTab();
        }
      }

      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to setup ttabs:', error);
      // If setup fails, reset to default layout
      this.resetToDefaultLayout();
      didResetToDefaultLayout = true;
      success = false;
    }

    // Call the callback with the result if provided
    this.setupFromScratchCallback?.({
      didResetToDefaultLayout
    });
  }

  /**
   * Setup the ttabs instance with the given tiles as a record
   * @param tiles The tiles to set up as a record
   * @param callback Optional callback that will be called when setup is complete with information about the result
   */
  setupWithRecord(tiles: Record<string, TileState>): void {
    this.resetTiles();
    this.tiles = tiles;

    try {
      this.rootGridId = this.findRootGridId();

      // Validate the layout after setting up tiles
      this.validateLayout();

      this.notifyStateChange();

      this.setupFromScratchCallback?.({
        didResetToDefaultLayout: false
      });
    } catch (error) {
      console.error('Failed to setup ttabs with record:', error);
      // If setup fails, reset to default layout
      this.resetToDefaultLayout();

      this.setupFromScratchCallback?.({
        didResetToDefaultLayout: true
      });
    }
  }

  /**
   * Deserialize a layout from JSON
   * @param json The JSON string to deserialize
   * @param callback Optional callback that will be called when setup is complete with information about the result
   * @returns True if deserialization was successful, false otherwise
   */
  deserializeLayout(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object' && 'tiles' in parsed && Array.isArray(parsed.tiles)) {
        this.setup(parsed.tiles, {
          activePanel: parsed.metadata?.activePanel,
          focusedActiveTab: parsed.metadata?.focusedActiveTab
        });
        return true;
      }

      return false;
    } catch (e) {
      console.error('Failed to deserialize layout:', e);

      // If we couldn't even parse the JSON, reset to default layout and call callback
      this.resetToDefaultLayout();

      this.setupFromScratchCallback?.({
        didResetToDefaultLayout: true
      });

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
      const panel = this.getTile<TilePanelState>(this.activePanel);
      if (panel && panel.activeTab) {
        this.focusedActiveTab = panel.activeTab;
        return;
      }
    }

    // Otherwise find the first panel with an active tab
    const panelsWithActiveTabs = Object.values(this.tiles)
      .filter((tile): tile is TilePanelState =>
        tile.type === 'panel' && tile.activeTab !== null && !!this.getTile(tile.activeTab));

    if (panelsWithActiveTabs.length > 0 && panelsWithActiveTabs[0].activeTab) {
      this.focusedActiveTab = panelsWithActiveTabs[0].activeTab;
      this.activePanel = panelsWithActiveTabs[0].id;
    }
  }

  /**
   * Close a tab and remove it
   * @param tabId The ID of the tab to close
   * @returns True if successful
   */
  closeTab(tabId: string): boolean {
    try {
      const tab = this.getTile<TileTabState>(tabId);
      if (!tab || tab.type !== 'tab') return false;

      const panelId = tab.parent;
      if (!panelId) return false;

      const panel = this.getTile<TilePanelState>(panelId);
      if (!panel || panel.type !== 'panel') return false;

      // Find index of tab to remove
      const tabIndex = panel.tabs.indexOf(tabId);
      if (tabIndex === -1) return false;

      // If we're closing the focused tab, we need to find a new tab to focus
      let newFocusedTab: string | null = null;
      if (this.focusedActiveTab === tabId) {
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
            .filter((tile): tile is TilePanelState =>
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
        this.focusedActiveTab = newFocusedTab;
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

  // @TODO: consider making a universal search function for all properties of a tab (including its content)
  /**
   * Get all lazy tabs in a panel, grid, or across the entire layout
   * @param containerId Optional ID of a panel or grid to search within. If not provided, searches all panels.
   * @returns Array of lazy tab tiles
   */
  getLazyTabs(containerId?: string): TileTabState[] {
    if (containerId) {
      const container = this.getTile(containerId);
      if (!container) return [];

      if (container.type === 'panel') {
        // Get lazy tabs directly from the panel
        const panel = container as TilePanelState;
        return panel.tabs
          .map(tabId => this.getTile<TileTabState>(tabId))
          .filter((tab): tab is TileTabState => !!tab && tab.isLazy === true);
      }
      else if (container.type === 'grid') {
        // Find all panels within the grid and get their lazy tabs
        const lazyTabs: TileTabState[] = [];

        // Recursively find all panels within the grid
        const findPanelsInGrid = (gridId: string): TilePanelState[] => {
          const grid = this.getGrid(gridId);
          const panels: TilePanelState[] = [];

          for (const rowId of grid.rows) {
            try {
              const row = this.getRow(rowId);
              for (const colId of row.columns) {
                try {
                  const col = this.getColumn(colId);
                  if (col.child) {
                    const child = this.getTile(col.child);
                    if (child?.type === 'panel') {
                      panels.push(child as TilePanelState);
                    } else if (child?.type === 'grid') {
                      // Recursive case - grid within grid
                      panels.push(...findPanelsInGrid(child.id));
                    }
                  }
                } catch (error) {
                  console.error(`Error processing column ${colId}:`, error);
                }
              }
            } catch (error) {
              console.error(`Error processing row ${rowId}:`, error);
            }
          }

          return panels;
        };

        const panels = findPanelsInGrid(container.id);

        // Get lazy tabs from each panel
        for (const panel of panels) {
          const panelLazyTabs = panel.tabs
            .map(tabId => this.getTile<TileTabState>(tabId))
            .filter((tab): tab is TileTabState => !!tab && tab.isLazy === true);
          lazyTabs.push(...panelLazyTabs);
        }

        return lazyTabs;
      }

      return [];
    } else {
      // Search all panels for lazy tabs
      return Object.values(this.tiles)
        .filter((tile): tile is TileTabState =>
          tile.type === 'tab' && tile.isLazy === true);
    }
  }

  // @TODO: do we need it?
  /**
   * Recalculates the layout for a container and its children
   * @param containerId ID of the container to recalculate
   */
  recalculateLayout(containerId: string): void {
    const container = this.getTile(containerId);
    if (!container) return;

    // Depending on container type, recalculate children
    if (container.type === 'row') {
      const row = container as TileRowState;
      const containerEl = document.querySelector(
        `[data-tile-id="${containerId}"]`,
      ) as HTMLElement;
      if (!containerEl) return;

      const containerWidth = containerEl.offsetWidth;
      const columns = row.columns.map(id => {
        const col = this.getTile<TileColumnState>(id);
        if (!col) return null;
        return { id, size: col.width };
      }).filter(Boolean) as Array<{ id: string, size: SizeInfo }>;

      const calculatedSizes = calculateSizes(containerWidth, columns);

      // Apply the calculated sizes
      calculatedSizes.forEach(({ id, computedSize, scaledDown }) => {
        const column = this.getTile<TileColumnState>(id);
        if (!column) return;

        // Store computed size for reference during resize operations
        this.updateTile(id, { computedSize });

        // Update tiles based on their unit type
        if (column.width.unit === 'px' && scaledDown) {
          // If original px size was scaled down, update the rendered size
          this.updateTile(id, {
            computedSize,
            originalWidth: column.width.value
          });
        }
        else if (column.width.unit === '%') {
          // Update percentage based on computed size
          this.updateTile(id, {
            width: {
              value: (computedSize / containerWidth) * 100,
              unit: '%'
            }
          });
        }
      });
    } else if (container.type === 'grid') {
      const grid = container as TileGridState;
      const containerEl = document.querySelector(
        `[data-tile-id="${containerId}"]`,
      ) as HTMLElement;
      if (!containerEl) return;

      const containerHeight = containerEl.offsetHeight;
      const rows = grid.rows.map(id => {
        const row = this.getTile<TileRowState>(id);
        if (!row) return null;
        return { id, size: row.height };
      }).filter(Boolean) as Array<{ id: string, size: SizeInfo }>;

      const calculatedSizes = calculateSizes(containerHeight, rows);

      // Apply the calculated sizes
      calculatedSizes.forEach(({ id, computedSize, scaledDown }) => {
        const row = this.getTile<TileRowState>(id);
        if (!row) return;

        // Store computed size for reference during resize operations
        this.updateTile(id, { computedSize });

        // Update tiles based on their unit type
        if (row.height.unit === 'px' && scaledDown) {
          // If original px size was scaled down, update the rendered size
          this.updateTile(id, {
            computedSize,
            originalHeight: row.height.value
          });
        }
        else if (row.height.unit === '%') {
          // Update percentage based on computed size
          this.updateTile(id, {
            height: {
              value: (computedSize / containerHeight) * 100,
              unit: '%'
            }
          });
        }
      });
    }
  }

  /**
   * Gets the parent column of a tile
   * @param tileId ID of the tile to find the parent column for
   * @returns The parent column if found, or null if not found
   */
  getParentColumn(tileId: string): TileColumnState | null {
    const tile = this.getTile(tileId);
    if (!tile) return null;

    // If parent is a column, return it
    if (tile.parent) {
      const parent = this.getTile(tile.parent);
      if (parent && parent.type === 'column') {
        return parent as TileColumnState;
      }
    }

    return null;
  }

  /**
   * Create a new grid or get the existing root grid as an object
   * @returns A TtabsGrid object for the root grid
   */
  newGrid(): Grid {
    // If there's already a root grid, use it
    if (this.rootGridId) {
      return new Grid(this, this.rootGridId);
    }

    // Otherwise create a new grid
    const gridId = this.addGrid();
    return new Grid(this, gridId);
  }

  /**
   * Get a grid object for an existing grid
   * @param id ID of the grid
   * @returns A TtabsGrid object
   */
  getGridObject(id: string): Grid {
    return new Grid(this, id);
  }

  /**
   * Get a row object for an existing row
   * @param id ID of the row
   * @returns A TtabsRow object
   */
  getRowObject(id: string): Row {
    return new Row(this, id);
  }

  /**
   * Get a column object for an existing column
   * @param id ID of the column
   * @returns A TtabsColumn object
   */
  getColumnObject(id: string): Column {
    return new Column(this, id);
  }

  /**
   * Get a panel object for an existing panel
   * @param id ID of the panel
   * @returns A TtabsPanel object
   */
  getPanelObject(id: string): Panel {
    return new Panel(this, id);
  }

  /**
   * Get a tab object for an existing tab
   * @param id ID of the tab
   * @returns A TtabsTab object
   */
  getTabObject(id: string): Tab {
    return new Tab(this, id);
  }
}