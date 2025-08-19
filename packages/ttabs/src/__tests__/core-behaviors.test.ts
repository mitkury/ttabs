import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTtabs, type TileTabState, type TilePanelState } from 'ttabs-svelte';

// Minimal mock Svelte component type
const MockComponent: any = {};

describe('TTabs core behaviors', () => {
  it('manages active panel and active/focused tabs', () => {
    const ttabs = createTtabs();

    // Build minimal layout
    const rowId = ttabs.addRow(ttabs.rootGridId);
    const colId = ttabs.addColumn(rowId);
    const panelId = ttabs.addPanel(colId);

    // Add two tabs: first active, second inactive
    const tabAId = ttabs.addTab(panelId, 'A', true);
    const tabBId = ttabs.addTab(panelId, 'B', false);

    // Active panel is not set implicitly by addTab; set via setActiveTab
    ttabs.setActiveTab(tabAId);
    expect(ttabs.getActivePanel()).toBe(panelId);
    expect(ttabs.getActivePanelTab()?.id).toBe(tabAId);

    // Activate the second tab
    const setActiveRes = ttabs.setActiveTab(tabBId);
    expect(setActiveRes).toBe(true);
    expect(ttabs.getActivePanel()).toBe(panelId);
    expect(ttabs.getActivePanelTab()?.id).toBe(tabBId);

    // Focus the active tab
    const setFocusedRes = ttabs.setFocusedActiveTab(tabBId);
    expect(setFocusedRes).toBe(true);
    expect(ttabs.focusedActiveTab).toBe(tabBId);
  });

  it('setComponent on a tab creates content and subsequent calls update same content', () => {
    const ttabs = createTtabs();
    ttabs.registerComponent('mock', MockComponent);

    // Layout
    const rowId = ttabs.addRow(ttabs.rootGridId);
    const colId = ttabs.addColumn(rowId);
    const panelId = ttabs.addPanel(colId);
    const tabId = ttabs.addTab(panelId, 'T');

    // First set
    const content1 = ttabs.setComponent(tabId, 'mock', { a: 1 });
    const tab1 = ttabs.getTab(tabId);
    expect(tab1.content).toBe(content1);

    // Second set should update the same content id
    const content2 = ttabs.setComponent(tabId, 'mock', { b: 2 });
    expect(content2).toBe(content1);
  });

  it('setComponent on a column reuses existing content child', () => {
    const ttabs = createTtabs();
    ttabs.registerComponent('mock', MockComponent);

    const rowId = ttabs.addRow(ttabs.rootGridId);
    const colId = ttabs.addColumn(rowId);

    // First set creates content child
    const c1 = ttabs.setComponent(colId, 'mock', { x: 1 });
    const col1 = ttabs.getColumn(colId);
    expect(col1.child).toBe(c1);

    // Second set should update same content child, not replace
    const c2 = ttabs.setComponent(colId, 'mock', { y: 2 });
    expect(c2).toBe(c1);
    const col2 = ttabs.getColumn(colId);
    expect(col2.child).toBe(c1);
  });

  it('object-oriented builder API creates structure and sets active/focused entities', () => {
    const ttabs = createTtabs();
    ttabs.registerComponent('mock', MockComponent);

    // newGrid() returns existing root if present
    const grid = ttabs.newGrid();
    const tab = grid
      .newRow()
      .newColumn()
      .newPanel()
      .newTab('Hello', true)
      .setComponent('mock', { hello: true })
      .setFocused();

    // Validate state reflects builder operations
    const activePanel = ttabs.getActivePanelTile() as TilePanelState | null;
    expect(activePanel).toBeTruthy();
    const activeTab = ttabs.getActivePanelTab() as TileTabState | null;
    expect(activeTab?.name).toBe('Hello');
    expect(ttabs.focusedActiveTab).toBe(activeTab?.id);
  });

  describe('subscriptions', () => {
    const originalRAF = globalThis.requestAnimationFrame;

    beforeEach(() => {
      // Stub requestAnimationFrame to run callbacks on next tick
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        return setTimeout(() => cb(performance.now()), 0) as unknown as number;
      });
    });

    afterEach(() => {
      // Restore original RAF
      vi.unstubAllGlobals();
      if (originalRAF) {
        vi.stubGlobal('requestAnimationFrame', originalRAF);
        vi.unstubAllGlobals();
      }
    });

    it('subscribe is called immediately and on subsequent state changes', async () => {
      const ttabs = createTtabs();
      const calls: number[] = [];

      const unsub = ttabs.subscribe(() => {
        calls.push(Date.now());
      });

      // Immediate call
      expect(calls.length).toBe(1);

      // Trigger change
      ttabs.addRow(ttabs.rootGridId);
      expect(calls.length).toBeGreaterThan(1);

      unsub();
    });

    it('subscribeDebounced is called immediately and debounced after changes', async () => {
      const ttabs = createTtabs();
      const calls: number[] = [];

      const unsub = ttabs.subscribeDebounced(() => {
        calls.push(Date.now());
      });

      // Immediate call
      expect(calls.length).toBe(1);

      // Trigger a few changes quickly
      ttabs.addRow(ttabs.rootGridId);
      ttabs.addRow(ttabs.rootGridId);

      // Allow our stubbed RAF to flush
      await new Promise((r) => setTimeout(r, 5));
      expect(calls.length).toBeGreaterThan(1);

      unsub();
    });
  });
});

