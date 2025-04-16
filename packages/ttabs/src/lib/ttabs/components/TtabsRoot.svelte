<script lang="ts">
  import TileGrid from "./TileGrid.svelte";
  import type { Ttabs } from "../Ttabs.ts";

  let { ttabs }: { ttabs: Ttabs } = $props();

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
  {#if ttabs.rootGridId}
    <TileGrid {ttabs} id={ttabs.rootGridId} />
  {:else}
    <div
      class="ttabs-empty-state {ttabs.theme?.classes?.['empty-state'] || ''}"
    >
      <div class="error-message">
        No root grid found. Need to create one.
      </div>
    </div>
  {/if}
</div>

<style>
  :global {
    .ttabs-root {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
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
  }
</style>
