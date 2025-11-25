import { TTabs } from "./TTabs.svelte";

/**
 * Base class for all ttabs objects
 */
abstract class TileObject {
  constructor(protected ttabs: TTabs, protected _id: string) {}

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
export class Grid extends TileObject {
  /**
   * Create a new row in this grid
   * @param height Height of the row (e.g., "100%", "260px", "auto")
   */
  newRow(height?: string): Row {
    const rowId = this.ttabs.addRow(this._id, height);
    return new Row(this.ttabs, rowId);
  }
}

/**
 * Row object - contains columns
 */
export class Row extends TileObject {
  /**
   * Create a new column in this row
   * @param width Width of the column (e.g., "100%", "260px", "auto")
   */
  newColumn(width?: string): Column {
    const columnId = this.ttabs.addColumn(this._id, width);
    return new Column(this.ttabs, columnId);
  }
}

/**
 * Column object - contains panels or other components
 */
export class Column extends TileObject {
  /**
   * Create a new panel in this column
   */
  newPanel(): Panel {
    const panelId = this.ttabs.addPanel(this._id);
    return new Panel(this.ttabs, panelId);
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
export class Panel extends TileObject {
  /**
   * Create a new tab in this panel
   * @param name Name of the tab
   * @param active Whether to make this tab active
   */
  newTab(name: string, active: boolean = false): Tab {
    const tabId = this.ttabs.addTab(this._id, name, active);
    return new Tab(this.ttabs, tabId);
  }

  /**
   * Set this panel as the active panel
   */
  setActive(): this {
    this.ttabs.setActivePanel(this._id);
    return this;
  }

  /**
   * Get or set the left components of the panel
   */
  get leftComponents(): Array<{ componentId: string, props?: Record<string, any> }> {
    const panel = this.ttabs.getPanel(this._id);
    return panel.leftComponents || [];
  }
  
  set leftComponents(components: Array<{ componentId: string, props?: Record<string, any> }>) {
    this.ttabs.updateTile(this._id, { 
      leftComponents: components.map(c => ({
        componentId: c.componentId,
        props: c.props || {}
      }))
    });
  }
  
  /**
   * Get or set the right components of the panel
   */
  get rightComponents(): Array<{ componentId: string, props?: Record<string, any> }> {
    const panel = this.ttabs.getPanel(this._id);
    return panel.rightComponents || [];
  }
  
  set rightComponents(components: Array<{ componentId: string, props?: Record<string, any> }>) {
    this.ttabs.updateTile(this._id, { 
      rightComponents: components.map(c => ({
        componentId: c.componentId,
        props: c.props || {}
      }))
    });
  }

  /**
   * Get or set components rendered inside the tab bar (after tabs by default)
   */
  get tabBarComponents(): Array<{ componentId: string, props?: Record<string, any>, position?: 'before-tabs' | 'after-tabs' | 'far-right' }> {
    const panel = this.ttabs.getPanel(this._id);
    return panel.tabBarComponents || [];
  }
  
  set tabBarComponents(components: Array<{ componentId: string, props?: Record<string, any>, position?: 'before-tabs' | 'after-tabs' | 'far-right' }>) {
    this.ttabs.updateTile(this._id, { 
      tabBarComponents: components.map(c => ({
        componentId: c.componentId,
        props: c.props || {},
        position: c.position
      }))
    });
  }
}

/**
 * Tab object - contains content
 */
export class Tab extends TileObject {
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
