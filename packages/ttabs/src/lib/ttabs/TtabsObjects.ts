import { Ttabs } from "./Ttabs.svelte";

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
  newRow(height?: string): TtabsRow {
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
  newColumn(width?: string): TtabsColumn {
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