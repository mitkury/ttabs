<script lang="ts">
  import type { TileContent as TileContentType } from "../types/tile-types";
  import type { TtabsProps } from "./props";
  import type { Component } from "svelte";

  let { ttabs, id }: TtabsProps = $props();

  // Get tab data
  const tab = $derived(ttabs.getTile(id));

  // Get content
  const contentId = $derived(tab?.type === "tab" ? tab.content : null);
  const content = $derived(
    contentId ? (ttabs.getTile(contentId) as TileContentType) : null,
  );

  // Component storage
  let ComponentToRender = $state<Component<any> | null>(null);
  let componentProps = $state<Record<string, any>>({});

  $effect(() => {
    if (content?.componentId) {
      const componentData = ttabs.getContentComponent(content.componentId);
      if (componentData) {
        // Set the component to render
        ComponentToRender = componentData.component;

        // Create combined props (default + content-specific)
        componentProps = {
          ...componentData.defaultProps,
          ...content.data?.componentProps,
          ttabs,
          contentId,
        };
      } else {
        ComponentToRender = null;
      }
    } else {
      ComponentToRender = null;
    }
  });
</script>

{#if tab?.type === "tab"}
  <div class="ttabs-tab {ttabs.theme?.classes?.tab || ''}" data-tile-id={id}>
    {#if content?.type === "content"}
      <div
        class="ttabs-content {ttabs.theme?.classes?.content || ''}"
        data-component-id={content.componentId}
      >
        {#if ComponentToRender}
          <ComponentToRender {...componentProps} />
        {:else}
          <div
            class="content-container {ttabs.theme?.classes?.[
              'content-container'
            ] || ''}"
          >
            <h3>{tab.name || "Unnamed Tab"}</h3>
            {#if content.componentId}
              <p>Component '{content.componentId}' not registered</p>
            {/if}
            <p>Tab ID: {id}</p>
            <p>Content ID: {contentId}</p>
          </div>
        {/if}
      </div>
    {:else}
      <div
        class="ttabs-empty-state {ttabs.theme?.classes?.['empty-state'] || ''}"
      >
        No content available
      </div>
    {/if}
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">
    Tab not found or invalid type
  </div>
{/if}

<style>
  :global {
    .ttabs-tab {
      width: 100%;
      height: 100%;
      overflow: auto;
      color: var(--ttabs-text-color);
      background-color: var(--ttabs-content-bg);
    }

    .ttabs-content {
      height: 100%;
      background-color: var(--ttabs-content-bg);
    }

    .content-container {
      padding: 1rem;
      color: var(--ttabs-content-text-color);
      background-color: var(--ttabs-content-bg);
    }

    .ttabs-empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--ttabs-empty-state-color);
      font-style: italic;
    }

    .ttabs-error {
      padding: 1rem;
      color: var(--ttabs-error-color);
      background-color: var(--ttabs-error-bg);
      border: var(--ttabs-error-border);
      border-radius: 4px;
    }

    .ttabs-tab h3 {
      margin-top: 0;
      color: var(--ttabs-text-color);
    }

    .ttabs-tab p {
      color: var(--ttabs-text-color-secondary);
      opacity: 0.7;
      margin: 0.5rem 0;
    }
  }
</style>
