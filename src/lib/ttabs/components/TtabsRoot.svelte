<script lang="ts">
  import TileGrid from "./TileGrid.svelte";
  import type { Ttabs } from "../Ttabs.svelte";

  let { ttabs }: { ttabs: Ttabs } = $props();

  let rootGridId = $derived(ttabs.getRootGridId());

  // Generate CSS variable style string from theme
  let themeStyle = $derived.by(() =>
    ttabs.theme?.variables
      ? Object.entries(ttabs.theme.variables)
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")
      : "",
  );
</script>

<div
  class="ttabs-root {ttabs.theme?.classes?.root || ''}"
  style={themeStyle}
  data-theme={ttabs.theme?.name}
>
  {#if rootGridId}
    <TileGrid {ttabs} id={rootGridId} />
  {:else}
    <div
      class="ttabs-empty-state {ttabs.theme?.classes?.['empty-state'] || ''}"
    >
      <button onclick={() => ttabs.createDefaultLayout()}>
        Create Default Layout
      </button>
    </div>
  {/if}
</div>

<style>
  .ttabs-root {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    /* Default theme variables, will be overridden by inline styles */
    --ttabs-panel-bg: white;
    --ttabs-tab-bar-bg: #f5f5f5;
    --ttabs-active-tab-bg: white;
    --ttabs-active-tab-indicator: #4a6cf7;
    --ttabs-grid-bg: #f0f0f0;
    --ttabs-grid-border: 1px solid #ddd;
    --ttabs-column-border: 1px solid #ddd;
    --ttabs-error-bg: #fff5f5;
    --ttabs-error-color: tomato;
    --ttabs-error-border: 1px solid tomato;
    --ttabs-empty-state-color: #666;
    --ttabs-tab-header-padding: 0.5rem 1rem;
    --ttabs-tab-header-border: 1px solid #ddd;
    --ttabs-tab-header-font-size: 0.9rem;
    --ttabs-tab-bar-border: 1px solid #ddd;
    --ttabs-resizer-hover-color: rgba(74, 108, 247, 0.3);
    --ttabs-drop-indicator-color: #4a6cf7;
    --ttabs-drop-target-outline: 2px dashed rgba(74, 108, 247, 0.5);
    --ttabs-split-indicator-color: rgba(74, 108, 247, 0.1);
    --ttabs-show-close-button: none; /* Default: hidden close button */
  }

  .ttabs-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--ttabs-empty-state-color);
    font-style: italic;
  }

  button {
    padding: 8px 16px;
    background-color: var(--ttabs-active-tab-indicator);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.9;
  }
</style>
