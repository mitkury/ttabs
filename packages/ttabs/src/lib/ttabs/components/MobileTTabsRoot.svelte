<script lang="ts">
  import type { TTabs } from "../TTabs.svelte";
  import type { TilePanelState, TileTabState } from "../types/tile-types";
  import TileTab from "./TileTab.svelte";

  let { ttabs }: { ttabs: TTabs } = $props();

  let mobileTabsOpen = $state(false);

  const activePanelId = $derived.by(() => {
    const activePanel = ttabs.getActivePanel();
    if (activePanel) return activePanel;

    const firstPanel = Object.values(ttabs.tiles).find(
      (tile) => tile.type === "panel"
    ) as TilePanelState | undefined;

    return firstPanel?.id ?? null;
  });

  const panel = $derived(
    activePanelId ? ttabs.getTile<TilePanelState>(activePanelId) : null
  );
  const tabs = $derived(
    panel?.type === "panel" ? panel.tabs.map((id) => ttabs.getTab(id)) : []
  );
  const activeTab = $derived(panel?.type === "panel" ? panel.activeTab : null);
  const activeTabName = $derived.by(() => {
    if (!activeTab) return "Tabs";
    const active = tabs.find((tab) => tab.id === activeTab);
    return active?.name || "Tabs";
  });

  function selectTab(tabId: string) {
    if (!panel || panel.type !== "panel") return;

    try {
      const tab = ttabs.getTab(tabId);
      if (tab.isLazy === true) {
        ttabs.updateTile(tabId, { isLazy: false });
      }
    } catch (e) {
      // Tab not found or invalid, ignore the error
    }

    ttabs.setActiveTab(tabId);
    mobileTabsOpen = false;
  }

  function closeTab(e: Event, tabId: string) {
    e.preventDefault();
    e.stopPropagation();
    ttabs.closeTab(tabId);
  }
</script>

<div class="ttabs-mobile-root {ttabs.theme?.classes?.root || ''}">
  <div
    class="ttabs-mobile-content {ttabs.theme?.classes?.content || ''}"
    data-panel-id={activePanelId || undefined}
  >
    {#if activeTab}
      <TileTab {ttabs} id={activeTab} />
    {:else if ttabs.defaultComponentIdForEmptyTiles}
      {@const NoContent = ttabs.getContentComponent(
        ttabs.defaultComponentIdForEmptyTiles
      )?.component}
      {#if NoContent}
        <div class="ttabs-direct-content">
          <NoContent />
        </div>
      {/if}
    {:else}
      <div
        class="ttabs-empty-state {ttabs.theme?.classes?.['empty-state'] || ''}"
      >
        No active tab
      </div>
    {/if}
  </div>

  <button
    class="ttabs-mobile-tabs-toggle {ttabs.theme?.classes?.[
      'mobile-tabs-toggle'
    ] || ''}"
    onclick={() => (mobileTabsOpen = !mobileTabsOpen)}
    aria-haspopup="dialog"
    aria-expanded={mobileTabsOpen}
    aria-controls="ttabs-mobile-tabs-overlay"
    type="button"
  >
    <span class="ttabs-mobile-tabs-label">{activeTabName}</span>
    <span class="ttabs-mobile-tabs-count">{tabs.length}</span>
  </button>

  <div
    class="ttabs-mobile-tabs-overlay {ttabs.theme?.classes?.[
      'mobile-tabs-overlay'
    ] || ''} {mobileTabsOpen ? 'is-open' : ''}"
    id="ttabs-mobile-tabs-overlay"
    aria-hidden={!mobileTabsOpen}
  >
    <div class="ttabs-mobile-tabs-overlay-header">
      <span class="ttabs-mobile-tabs-overlay-title">Tabs</span>
      <button
        class="ttabs-mobile-tabs-close"
        onclick={() => (mobileTabsOpen = false)}
        type="button"
      >
        Close
      </button>
    </div>
    {#if tabs.length}
      <div class="ttabs-mobile-tabs-grid">
        {#each tabs as tab (tab.id)}
          <div
            class="ttabs-mobile-tab-tile {ttabs.theme?.classes?.[
              'mobile-tab-tile'
            ] || ''} {tab.id === activeTab ? 'is-active' : ''}"
          >
            <button
              class="ttabs-mobile-tab-select"
              onclick={() => selectTab(tab.id)}
              type="button"
            >
              <span class="ttabs-mobile-tab-title">
                {tab.name || "Unnamed Tab"}
              </span>
            </button>
            <button
              class="ttabs-mobile-tab-close"
              onclick={(e) => closeTab(e, tab.id)}
              aria-label={`Close ${tab.name || "tab"}`}
              type="button"
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="ttabs-mobile-tabs-empty">No tabs</div>
    {/if}
  </div>
</div>

<style>
  :global {
    .ttabs-mobile-root {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: var(--ttabs-panel-bg);
    }

    .ttabs-mobile-content {
      flex: 1;
      overflow: hidden;
    }

    .ttabs-mobile-tabs-toggle {
      position: absolute;
      right: 1rem;
      bottom: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 0.9rem;
      font-size: var(--ttabs-tab-header-font-size);
      color: var(--ttabs-mobile-tabs-toggle-color);
      background-color: var(--ttabs-mobile-tabs-toggle-bg);
      border: var(--ttabs-mobile-tabs-toggle-border);
      border-radius: 999px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 30;
    }

    .ttabs-mobile-tabs-toggle:hover {
      background-color: var(--ttabs-close-button-hover-bg);
    }

    .ttabs-mobile-tabs-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 0.75rem;
      background-color: var(--ttabs-active-tab-indicator);
      color: var(--ttabs-tab-active-text-color);
    }

    .ttabs-mobile-tabs-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      background-color: var(--ttabs-mobile-tabs-overlay-bg);
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transition: opacity var(--ttabs-transition-duration)
        var(--ttabs-transition-timing);
      z-index: 20;
    }

    .ttabs-mobile-tabs-overlay.is-open {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    .ttabs-mobile-tabs-overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: var(--ttabs-tab-bar-border);
      background-color: var(--ttabs-tab-bar-bg);
    }

    .ttabs-mobile-tabs-overlay-title {
      font-weight: 600;
      color: var(--ttabs-tab-text-color);
    }

    .ttabs-mobile-tabs-close {
      border: none;
      background: none;
      color: var(--ttabs-tab-text-color);
      cursor: pointer;
      font-size: 0.9rem;
    }

    .ttabs-mobile-tabs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      padding: 1rem;
      overflow: auto;
    }

    .ttabs-mobile-tab-tile {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0.75rem;
      border: var(--ttabs-mobile-tabs-tile-border);
      background-color: var(--ttabs-mobile-tabs-tile-bg);
      border-radius: var(--ttabs-border-radius-sm);
    }

    .ttabs-mobile-tab-tile.is-active {
      box-shadow: inset 0 0 0 2px var(--ttabs-active-tab-indicator);
    }

    .ttabs-mobile-tab-select {
      flex: 1;
      text-align: left;
      border: none;
      background: none;
      color: var(--ttabs-tab-text-color);
      font-size: 0.9rem;
      cursor: pointer;
    }

    .ttabs-mobile-tab-title {
      display: block;
      line-height: 1.2;
    }

    .ttabs-mobile-tab-close {
      border: none;
      background: none;
      color: var(--ttabs-close-button-color);
      cursor: pointer;
      font-size: 0.9rem;
    }

    .ttabs-mobile-tabs-empty {
      padding: 1rem;
      color: var(--ttabs-empty-state-color);
    }
  }
</style>
