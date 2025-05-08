import type { Ttabs } from './Ttabs.svelte';
import type { TtabsOptions } from './Ttabs.svelte';
import type { Component } from 'svelte';

/**
 * Base class for all ttabs objects
 */
abstract class TtabsObject {
  constructor(protected ttabs: Ttabs, protected _id: string) {}

  /**
   * Get the ID of this object
   */
  get id(): string {
    return this._id;
  }
}

/**
 * Grid object - the root container of the layout
 */
export class TtabsGrid extends TtabsObject {
  /**
   * Create a new row in this grid
   * @param height Height of the row (e.g., "100%", "260px", "auto")
   */
  newRow(height: string = 'auto'): TtabsRow {
    const rowId = this.ttabs.addRow(this._id, height);
    return new TtabsRow(this.ttabs, rowId);
  }
}

/**
 * Row object - contains columns
 */
export class TtabsRow extends TtabsObject {
  /**
   * Create a new column in this row
   * @param width Width of the column (e.g., "100%", "260px", "auto")
   */
  newColumn(width: string = 'auto'): TtabsColumn {
    const columnId = this.ttabs.addColumn(this._id, width);
    return new TtabsColumn(this.ttabs, columnId);
  }
}

/**
 * Column object - contains panels or other components
 */
export class TtabsColumn extends TtabsObject {
  /**
   * Create a new panel in this column
   */
  newPanel(): TtabsPanel {
    const panelId = this.ttabs.addPanel(this._id);
    return new TtabsPanel(this.ttabs, panelId);
  }

  /**
   * Add a component directly to this column
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   */
  setComponent(componentId: string, props: Record<string, any> = {}): this {
    this.ttabs.setComponent(this._id, componentId, props);
    return this;
  }
}

/**
 * Panel object - contains tabs
 */
export class TtabsPanel extends TtabsObject {
  /**
   * Create a new tab in this panel
   * @param name Name of the tab
   * @param active Whether to make this tab active
   */
  newTab(name: string, active: boolean = false): TtabsTab {
    const tabId = this.ttabs.addTab(this._id, name, active);
    return new TtabsTab(this.ttabs, tabId);
  }

  /**
   * Set this panel as the active panel
   */
  setActive(): this {
    this.ttabs.setActivePanel(this._id);
    return this;
  }
}

/**
 * Tab object - contains content
 */
export class TtabsTab extends TtabsObject {
  /**
   * Set a component for this tab
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   */
  setComponent(componentId: string, props: Record<string, any> = {}): this {
    this.ttabs.setComponent(this._id, componentId, props);
    return this;
  }

  /**
   * Set this tab as the active tab
   */
  setActive(): this {
    this.ttabs.setActiveTab(this._id);
    return this;
  }

  /**
   * Set this tab as the focused active tab
   */
  setFocused(): this {
    this.ttabs.setFocusedActiveTab(this._id);
    return this;
  }
}

/**
 * Extension methods for the Ttabs class
 */
export function extendTtabs(ttabs: Ttabs): TtabsWithObjects {
  const extended = ttabs as TtabsWithObjects;
  
  // Add the newGrid method to the ttabs instance
  extended.newGrid = function(): TtabsGrid {
    // If there's already a root grid, use it
    if (this.rootGridId) {
      return new TtabsGrid(this, this.rootGridId);
    }
    
    // Otherwise create a new grid
    const gridId = this.addGrid();
    return new TtabsGrid(this, gridId);
  };
  
  // Add method to get a wrapper for an existing tile
  extended.getGridObject = function(id: string): TtabsGrid {
    return new TtabsGrid(this, id);
  };
  
  extended.getRowObject = function(id: string): TtabsRow {
    return new TtabsRow(this, id);
  };
  
  extended.getColumnObject = function(id: string): TtabsColumn {
    return new TtabsColumn(this, id);
  };
  
  extended.getPanelObject = function(id: string): TtabsPanel {
    return new TtabsPanel(this, id);
  };
  
  extended.getTabObject = function(id: string): TtabsTab {
    return new TtabsTab(this, id);
  };
  
  return extended;
}

/**
 * Extended Ttabs interface with object-oriented methods
 */
export interface TtabsWithObjects extends Ttabs {
  newGrid(): TtabsGrid;
  getGridObject(id: string): TtabsGrid;
  getRowObject(id: string): TtabsRow;
  getColumnObject(id: string): TtabsColumn;
  getPanelObject(id: string): TtabsPanel;
  getTabObject(id: string): TtabsTab;
}

// The actual implementation of createObjectTtabs will be in index.ts
// to avoid circular dependencies
