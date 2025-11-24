<script lang="ts">
  import type { TTabs } from "ttabs-svelte";

  let {
    ttabs,
    panelId,
    label = "+",
    title = "New tab",
    tabBaseName = "New Tab",
    componentId,
    componentProps = {},
    children,
  }: {
    ttabs: TTabs;
    panelId: string;
    label?: string;
    title?: string;
    tabBaseName?: string;
    componentId?: string;
    componentProps?: Record<string, any>;
    children?: () => any;
  } = $props();

  function handleClick() {
    const panel = ttabs.getPanelObject(panelId);
    if (!panel) return;

    const panelState = ttabs.getPanel(panelId);
    const nextIndex = (panelState?.tabs?.length ?? 0) + 1;
    const tabName = `${tabBaseName} ${nextIndex}`;

    const tab = panel.newTab(tabName, true);

    // If a component is provided and registered, attach it to the new tab
    if (componentId && ttabs.hasContentComponent(componentId)) {
      tab.setComponent(componentId, componentProps);
    }
  }
</script>

<button class="ttabs-add-tab-button" title={title} onclick={handleClick}>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>

<style>
  .ttabs-add-tab-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    height: 24px;
    margin-left: 6px;
    border: 1px solid var(--ttabs-tab-bar-border-color, #d0d7de);
    border-radius: 4px;
    background: var(--ttabs-tab-bar-bg);
    color: var(--ttabs-tab-text-color);
    cursor: pointer;
    line-height: 1;
  }

  .ttabs-add-tab-button:hover {
    background: var(--ttabs-active-tab-bg);
  }
</style>
