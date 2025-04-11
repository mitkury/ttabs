import type { Tile, TileGrid, TileRow, TileColumn, TilePanel, TileTab, TileContent, TileType } from './types/tile-types';
import { generateId, deserializeTiles } from './utils/tile-utils';
import type { Component } from 'svelte';
import type { TtabsTheme } from './types/theme-types';
import { DEFAULT_THEME, resolveTheme } from './types/theme-types';
import { TtabsInternal, type TtabsOptions, type TtabsState } from './TtabsInternal';

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
 * Ttabs Svelte wrapper using runes for reactivity
 */
export class Ttabs extends TtabsInternal {
  // Reactive state using Svelte 5 runes
  tiles = $state<Record<string, Tile>>({});
  activePanel = $state<string | null>(null);
  focusedActiveTabInternal = $state<string | null>(null);
  rootGridId = $state<string | null>(null);
  theme = $state<TtabsTheme>({} as TtabsTheme);
  
  // Component registry - Svelte specific
  private componentRegistry = $state<Record<string, ContentComponent>>({});

  // Public read-only derived value for focused tab
  focusedActiveTab = $derived(this.focusedActiveTabInternal);

  constructor(options: TtabsOptions = {}) {
    super(options);
    
    // Subscribe to state changes from core
    this.subscribe(this.handleStateChange.bind(this));
  }

  /**
   * Handle state changes from core Ttabs
   */
  private handleStateChange(state: TtabsState): void {
    this.tiles = state.tiles;
    this.activePanel = state.activePanel;
    this.focusedActiveTabInternal = state.focusedActiveTab;
    this.rootGridId = state.rootGridId;
    this.theme = state.theme;
  }

  /**
   * Register a component for content rendering
   * @param componentId Unique identifier for the component
   * @param component Svelte component to render
   * @param defaultProps Optional default props for the component
   */
  registerContentComponent(
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
   * Add content with component reference
   * @param parentId ID of the parent tab
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   * @returns ID of the new content
   */
  addComponentContent(
    parentId: string, 
    componentId: string, 
    props: Record<string, any> = {}
  ): string {
    // Verify component exists
    if (!this.hasContentComponent(componentId)) {
      throw new Error(`Component with ID ${componentId} is not registered`);
    }

    // Get the tab to check if it exists
    const tab = this.getTile(parentId);
    if (!tab) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }
    
    if (tab.type !== 'tab') {
      throw new Error(`Cannot add content to a parent of type ${tab.type}. Content can only be child of a tab.`);
    }
    
    // Create the content with tab-specific identifier
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

  // Additional Svelte-specific methods for component content

  /**
   * Add component content directly to a column without a panel
   * @param columnId ID of the column to add content to
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   * @returns ID of the new content
   */
  addColumnComponent(
    columnId: string, 
    componentId: string, 
    props: Record<string, any> = {}
  ): string {
    // Verify component exists
    if (!this.hasContentComponent(componentId)) {
      throw new Error(`Component with ID ${componentId} is not registered`);
    }

    // Verify the column exists
    const column = this.getTile<TileColumn>(columnId);
    if (!column) {
      throw new Error(`Column with ID ${columnId} not found`);
    }
    
    if (column.type !== 'column') {
      throw new Error(`Tile with ID ${columnId} is not a column`);
    }
    
    // Check if column already has a child
    if (column.child && this.getTile(column.child)) {
      // Remove existing child
      this.removeTile(column.child);
    }
    
    // Create the content
    const contentId = this.addTile({
      type: 'content',
      parent: columnId,
      componentId,
      data: {
        componentProps: props
      }
    });
    
    // Update column's child reference
    this.updateTile(columnId, {
      child: contentId
    });
    
    return contentId;
  }
}