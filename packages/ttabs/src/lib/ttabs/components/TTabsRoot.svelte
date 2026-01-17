<script lang="ts">
  import TileGrid from "./TileGrid.svelte";
  import { TTabs } from "../TTabs.svelte";
  import { BROWSER } from "esm-env";

  let { ttabs }: { ttabs: TTabs } = $props();
  let rootElement = $state<HTMLElement | null>(null);

  // Generate CSS variable style string from theme
  let themeStyle = $derived.by(() =>
    ttabs.theme?.variables
      ? Object.entries(ttabs.theme.variables)
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")
      : ""
  );

  function updateMobileLayout() {
    if (!rootElement) return;
    const width = rootElement.clientWidth;
    const isMobile = width <= ttabs.mobileBreakpoint;
    if (ttabs.isMobileLayout !== isMobile) {
      ttabs.isMobileLayout = isMobile;
    }
  }

  $effect(() => {
    if (!BROWSER || !rootElement) return;

    updateMobileLayout();

    const observer = new ResizeObserver(() => updateMobileLayout());
    observer.observe(rootElement);

    return () => observer.disconnect();
  });
</script>

<div
  class="ttabs-root {ttabs.theme?.classes?.root || ''}"
  style={themeStyle}
  data-theme={ttabs.theme?.name}
  data-layout={ttabs.isMobileLayout ? "mobile" : "desktop"}
  bind:this={rootElement}
>
  {#if ttabs.rootGridId}
    <TileGrid {ttabs} id={ttabs.rootGridId} />
  {:else}
    <div
      class="ttabs-empty-state {ttabs.theme?.classes?.['empty-state'] || ''}"
    >
      <div class="error-message">No root grid found. Need to create one.</div>
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
  }
</style>
