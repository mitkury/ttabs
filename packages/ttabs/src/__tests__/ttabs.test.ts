import { describe, it, expect } from 'vitest';
import { createTtabs, DEFAULT_THEME } from 'ttabs-svelte';
import type { Component } from 'svelte';

describe('Ttabs', () => {
  it('should create a ttabs instance with default options', () => {
    const ttabs = createTtabs();
    
    // Should create a root grid automatically
    expect(ttabs.rootGridId).toBeTruthy();
    expect(ttabs.tiles[ttabs.rootGridId]).toBeDefined();
    expect(ttabs.tiles[ttabs.rootGridId].type).toBe('grid');
    
    // Should use default theme
    expect(ttabs.theme).toEqual(DEFAULT_THEME);
    
    // Should have no focused tab initially
    expect(ttabs.focusedActiveTab).toBeNull();
  });

  it('should add a row to the grid', () => {
    const ttabs = createTtabs();
    const rowId = ttabs.addRow(ttabs.rootGridId);
    
    // Row should be added to the grid
    expect(ttabs.tiles[rowId]).toBeDefined();
    expect(ttabs.tiles[rowId].type).toBe('row');
    expect(ttabs.tiles[rowId].parent).toBe(ttabs.rootGridId);
  });

  it('should add a column to a row', () => {
    const ttabs = createTtabs();
    const rowId = ttabs.addRow(ttabs.rootGridId);
    const columnId = ttabs.addColumn(rowId);
    
    // Column should be added to the row
    expect(ttabs.tiles[columnId]).toBeDefined();
    expect(ttabs.tiles[columnId].type).toBe('column');
    expect(ttabs.tiles[columnId].parent).toBe(rowId);
  });

  it('should add a panel to a column', () => {
    const ttabs = createTtabs();
    const rowId = ttabs.addRow(ttabs.rootGridId);
    const columnId = ttabs.addColumn(rowId);
    const panelId = ttabs.addPanel(columnId);
    
    // Panel should be added to the column
    expect(ttabs.tiles[panelId]).toBeDefined();
    expect(ttabs.tiles[panelId].type).toBe('panel');
    expect(ttabs.tiles[panelId].parent).toBe(columnId);
  });

  it('should add a tab to a panel', () => {
    const ttabs = createTtabs();
    const rowId = ttabs.addRow(ttabs.rootGridId);
    const columnId = ttabs.addColumn(rowId);
    const panelId = ttabs.addPanel(columnId);
    const tabId = ttabs.addTab(panelId, 'Test Tab');
    
    // Tab should be added to the panel
    expect(ttabs.tiles[tabId]).toBeDefined();
    expect(ttabs.tiles[tabId].type).toBe('tab');
    expect(ttabs.tiles[tabId].parent).toBe(panelId);
  });

  it('should register and set components', () => {
    const ttabs = createTtabs();
    const rowId = ttabs.addRow(ttabs.rootGridId);
    const columnId = ttabs.addColumn(rowId);
    const panelId = ttabs.addPanel(columnId);
    const tabId = ttabs.addTab(panelId, 'Component Tab');
    
    // Register a mock component
    const mockComponent = {} as Component<any>;
    ttabs.registerComponent('test-component', mockComponent, { defaultProp: 'value' });
    
    // Set the component for the tab
    ttabs.setComponent(tabId, 'test-component', { customProp: 'custom-value' });
    
    // Verify the component was registered
    expect(ttabs.componentRegistry['test-component']).toBeDefined();
  });
});
