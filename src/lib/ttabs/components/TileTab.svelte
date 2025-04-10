<script lang="ts">
  import type { TileContent as TileContentType } from '../types/tile-types';
  import type { TtabsProps } from './props';
  import type { Component } from 'svelte';
  
  let { ttabs, id }: TtabsProps = $props();
  
  // Get tab data
  const tab = $derived(ttabs.getTile(id));
  
  // Get content
  const contentId = $derived(tab?.type === 'tab' ? tab.content : null);
  const content = $derived(contentId ? ttabs.getTile(contentId) as TileContentType : null);

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
          contentId
        };
      } else {
        ComponentToRender = null;
      }
    } else {
      ComponentToRender = null;
    }
  });
</script>

{#if tab?.type === 'tab'}
  <div class="ttabs-tab" data-tile-id={id}>
    {#if content?.type === 'content'}
      <div class="ttabs-content" 
           data-content-type={content.contentType}
           data-component-id={content.componentId}>
        {#if ComponentToRender}
          <ComponentToRender {...componentProps} />
        {:else}
          <div class="content-container">
            <h3>{tab.name || 'Unnamed Tab'}</h3>
            {#if content.componentId}
              <p>Component '{content.componentId}' not registered</p>
            {:else}
              <p>Content Type: {content.contentType}</p>
            {/if}
            <p>Tab ID: {id}</p>
            <p>Content ID: {contentId}</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="ttabs-empty-state">
        No content available
      </div>
    {/if}
  </div>
{:else}
  <div class="ttabs-error">
    Tab not found or invalid type
  </div>
{/if}

<style>
  .ttabs-tab {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
  
  .ttabs-content {
    height: 100%;
  }
  
  .content-container {
    padding: 1rem;
  }
  
  .ttabs-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }
  
  .ttabs-error {
    padding: 1rem;
    color: tomato;
    background-color: #fff5f5;
    border: 1px solid tomato;
    border-radius: 4px;
  }
  
  h3 {
    margin-top: 0;
    color: #333;
  }
  
  p {
    color: #666;
    margin: 0.5rem 0;
  }
</style>