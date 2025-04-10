# Content Components Proposal for ttabs

## Overview

This proposal outlines a system to register and instantiate Svelte components for content within ttabs. This would allow users to define custom components that can be used to render content in tabs, providing a more flexible and powerful way to customize the content.

## Current Implementation

Currently, `TileContent` contains:
- `contentType`: A string identifier used for simple type identification but without component rendering
- `data`: A generic Record for storing key-value data

Content rendering in `TileTab.svelte` simply displays static information without any actual component rendering mechanism.

## Proposed Solution

We propose adding a component registry system to the `Ttabs` class that would allow:

1. Registering Svelte components by ID
2. Instantiating these components when rendering content
3. Passing data/props to these components

## Implementation Details

### 1. Extend the Ttabs Class

```typescript
// Add to Ttabs.svelte.ts

import type { Component } from 'svelte';

// Type for component registry
interface ContentComponent {
  component: Component<any>;
  defaultProps?: Record<string, any>;
}

// Add to Ttabs class
export class Ttabs {
  // Existing code...

  // Component registry
  private componentRegistry = $state<Record<string, ContentComponent>>({});

  /**
   * Register a component for content rendering
   * @param componentId Unique identifier for the component
   * @param component Svelte component to render
   * @param defaultProps Optional default props for the component
   */
  registerContentComponent(
    componentId: string, 
    component: Component<any>, 
    defaultProps: Record<string, any> = {}
  ): void {
    this.componentRegistry[componentId] = { component, defaultProps };
  }

  /**
   * Get a registered component by ID
   * @param componentId The component identifier
   * @returns The component and its default props, or null if not found
   */
  getContentComponent(componentId: string): ContentComponent | null {
    return this.componentRegistry[componentId] || null;
  }

  /**
   * Check if a component is registered
   * @param componentId The component identifier
   * @returns True if the component is registered
   */
  hasContentComponent(componentId: string): boolean {
    return !!this.componentRegistry[componentId];
  }

  /**
   * Add content with component reference
   * @param parentId ID of the parent tab
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   * @returns ID of the new content
   */
  addComponentContent(
    parentId: string, 
    componentId: string, 
    props: Record<string, any> = {}
  ): string {
    // Verify component exists
    if (!this.hasContentComponent(componentId)) {
      throw new Error(`Component with ID ${componentId} is not registered`);
    }

    // Create content with component reference and props
    return this.addContent(parentId, componentId, props);
  }

  /**
   * Add content to a tab
   * @param parentId ID of the parent tab
   * @param componentId ID of the component to use for rendering
   * @param props Props to pass to the component
   */
  addContent(
    parentId: string,
    componentId: string,
    props: Record<string, any> = {}
  ): string {
    // Validate parent is a tab
    const parent = this.getTile(parentId);
    if (!parent) {
      throw new Error(`Parent tile with ID ${parentId} not found`);
    }
    
    if (parent.type !== 'tab') {
      throw new Error(`Cannot add content to a parent of type ${parent.type}. Content can only be child of a tab.`);
    }
    
    const tab = parent as TileTab;
    
    // Check if tab already has content
    if (tab.content && this.getTile(tab.content)) {
      throw new Error(`Tab ${parentId} already has content. Remove it first.`);
    }
    
    // Create the content
    const contentId = this.addTile({
      type: 'content',
      parent: parentId,
      componentId,
      data: {
        componentProps: props
      }
    });
    
    // Update tab's content
    this.updateTile(parentId, {
      content: contentId
    });
    
    return contentId;
  }
}
```

### 2. Update TileContent Type

Remove `contentType` and add `componentId` to the `TileContent` interface:

```typescript
export interface TileContent extends TileBase {
  type: 'content';
  componentId: string;        // ID of the component to render this content
  data?: Record<string, any>; // Data payload as key-value pairs
}
```

### 3. Update TileTab Component

Modify the TileTab component to use the componentId:

```svelte
<!-- TileTab.svelte -->
<script lang="ts">
  import type { TileContent as TileContentType } from '../types/tile-types';
  import type { TtabsProps } from './props';
  
  let { ttabs, id }: TtabsProps = $props();
  
  // Get tab data
  const tab = $derived(ttabs.getTile(id));
  
  // Get content
  const contentId = $derived(tab?.type === 'tab' ? tab.content : null);
  const content = $derived(contentId ? ttabs.getTile(contentId) as TileContentType : null);
  
  // Component instance
  let componentInstance = $state(null);
  
  $effect(() => {
    if (content?.componentId) {
      const componentData = ttabs.getContentComponent(content.componentId);
      if (componentData) {
        // Create combined props (default + content-specific)
        const props = {
          ...componentData.defaultProps,
          ...content.data?.componentProps,
          ttabs,
          contentId
        };
        
        // Create component instance
        componentInstance = {
          component: componentData.component,
          props
        };
      }
    }
  });
</script>

{#if tab?.type === 'tab'}
  <div class="ttabs-tab" data-tile-id={id}>
    {#if content?.type === 'content'}
      <div class="ttabs-content" data-component-id={content.componentId}>
        {#if componentInstance}
          <svelte:component 
            this={componentInstance.component} 
            {...componentInstance.props} 
          />
        {:else}
          <div class="ttabs-empty-state">
            Component '{content.componentId}' not found
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
```

### 4. Example Usage

Here's how this would be used in practice:

```svelte
<script>
  import { Ttabs, TileGrid } from '$lib/ttabs';
  import EditorComponent from './EditorComponent.svelte';
  import DocumentComponent from './DocumentComponent.svelte';
  
  // Initialize ttabs
  const ttabs = new Ttabs();
  
  // Register components
  ttabs.registerContentComponent('editor', EditorComponent, { readOnly: false });
  ttabs.registerContentComponent('document', DocumentComponent);
  
  // Create tabs and add content with components
  const rootId = ttabs.addGrid();
  const mainRowId = ttabs.addRow(rootId);
  const mainColumnId = ttabs.addColumn(mainRowId);
  const panelId = ttabs.addPanel(mainColumnId);
  
  // Create a tab with editor component
  const editorTabId = ttabs.addTab(panelId, 'Editor');
  ttabs.addComponentContent(editorTabId, 'editor', { 
    content: 'Hello World',
    language: 'typescript' 
  });
  
  // Create a tab with document component
  const docTabId = ttabs.addTab(panelId, 'Document');
  ttabs.addComponentContent(docTabId, 'document', { 
    documentId: '12345' 
  });
</script>

<TileGrid ttabs={ttabs} id={rootId} />
```

## Benefits

1. **Improved Flexibility**: Users can define their own components for rendering content
2. **Proper Typing**: Component props can be properly typed with TypeScript
3. **Separation of Concerns**: Content logic is encapsulated in dedicated components
4. **Extended Functionality**: Components can have their own state and lifecycle
5. **Consistent API**: Using `componentId` consistently throughout the API makes the system more intuitive

## Implementation Considerations

1. **Component Registration**: Components are registered at runtime, so they need to be available in the client code
2. **Server-Side Rendering**: The dynamic nature of the component instantiation may require special handling for SSR
3. **Serialization**: The component registry is not serialized with the layout, so components need to be re-registered when deserializing a layout

## Next Steps

1. Implement the component registry in the `Ttabs` class
2. Update the `TileContent` interface to include the componentId field
3. Update the `TileTab` component to use the registry
4. Update existing examples to use the new component-based approach
5. Add documentation on how to use custom components

## Conclusion

This proposal outlines a simple yet powerful way to enhance ttabs with custom component rendering. By using `componentId` consistently throughout the API, we create an intuitive system that allows for advanced customization of content. 