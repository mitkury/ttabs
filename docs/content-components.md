# Content Components in ttabs

This guide explains how to use the content components system in ttabs, allowing you to create custom content for tabs using Svelte components.

## Overview

The content components system lets you:
- Register Svelte components that can be used for tab content
- Add these components to tabs with customizable props
- Dynamically update the content of existing tabs
- Add components directly to columns without panels (for sidebars, etc.)

## Basic Usage

### 1. Register Your Components

First, import and register your components with ttabs:

```typescript
import { Ttabs } from 'ttabs';
import EditorComponent from './EditorComponent.svelte';
import DocumentComponent from './DocumentComponent.svelte';
import SidePanelComponent from './SidePanelComponent.svelte';

// Initialize ttabs
const ttabs = new Ttabs();

// Register components with unique IDs
ttabs.registerContentComponent('editor', EditorComponent, { readOnly: false });
ttabs.registerContentComponent('document', DocumentComponent);
ttabs.registerContentComponent('sidepanel', SidePanelComponent);
```

The last parameter is optional and allows you to set default props for the component.

### 2. Create Tabs with Content Components

Once registered, you can add these components to tabs:

```typescript
// Create a tab structure first
const rootId = ttabs.addGrid();
const rowId = ttabs.addRow(rootId);
const columnId = ttabs.addColumn(rowId);
const panelId = ttabs.addPanel(columnId);

// Create a tab and add editor component to it
const editorTabId = ttabs.addTab(panelId, 'Editor');
ttabs.addComponentContent(editorTabId, 'editor', { 
  content: 'console.log("Hello World!");',
  language: 'javascript'
});

// Create another tab with document component
const docTabId = ttabs.addTab(panelId, 'Document');
ttabs.addComponentContent(docTabId, 'document', { 
  documentId: 'doc-12345',
  title: 'Getting Started'
});
```

### 3. Update Existing Content

You can update the content of an existing tab by calling `addComponentContent` again with the same tab ID:

```typescript
// Update the editor content
ttabs.addComponentContent(editorTabId, 'editor', { 
  content: 'console.log("Updated content");',
  language: 'javascript',
  readOnly: true
});
```

### 4. Add Components Directly to Columns

For components like sidebars that don't need tabs, you can add them directly to columns:

```typescript
// Create a layout with two columns
const rootId = ttabs.addGrid();
const rowId = ttabs.addRow(rootId);
const sidebarColumnId = ttabs.addColumn(rowId, 20); // 20% width
const mainColumnId = ttabs.addColumn(rowId, 80);    // 80% width

// Add sidebar component directly to the column (no panel or tabs)
ttabs.addColumnComponent(sidebarColumnId, 'sidepanel', {
  title: 'Navigation',
  items: [
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]
});

// Add normal panel with tabs to the main column
const panelId = ttabs.addPanel(mainColumnId);
// ... add tabs to the panel as normal
```

This is perfect for creating IDE-like interfaces with sidebars, navigation panels, or other persistent UI elements.

## Creating Content Components

When creating components for use with ttabs, follow these guidelines:

1. Use Svelte 5's `$props()` for prop declaration:

```svelte
<script lang="ts">
  // Props for your component
  let { content = '', additionalProp = 'default', ttabs, contentId } = $props();
  
  // Your component logic here
</script>

<!-- Your component template -->
```

2. The system automatically passes these props to your component:
   - `ttabs`: Reference to the ttabs instance
   - `contentId`: ID of the content tile this component is rendering

3. Any props you pass to `addComponentContent` or `addColumnComponent` will be available to your component.

## Example Components

Here's a simple editor component example:

```svelte
<!-- EditorComponent.svelte -->
<script lang="ts">
  let { content = '', language = 'text', readOnly = false } = $props();
  
  // Additional state handling if needed
  let editorFocused = $state(false);
  
  function handleFocus() {
    editorFocused = true;
  }
  
  function handleBlur() {
    editorFocused = false;
  }
</script>

<div class="editor" class:focused={editorFocused}>
  <div class="header">{language}</div>
  {#if readOnly}
    <pre><code>{content}</code></pre>
  {:else}
    <textarea 
      value={content} 
      onfocus={handleFocus}
      onblur={handleBlur}
    ></textarea>
  {/if}
</div>

<style>
  /* Your styles here */
</style>
```

And a sidebar component example:

```svelte
<!-- SidePanelComponent.svelte -->
<script lang="ts">
  let { title = 'Side Panel', items = [] } = $props<{
    title: string;
    items: Array<{ id: string; label: string; icon?: string }>;
  }>();

  // Track selected item
  let selectedItem = $state(items.length > 0 ? items[0].id : null);
  
  function selectItem(id) {
    selectedItem = id;
  }
</script>

<div class="sidepanel">
  <h3>{title}</h3>
  <ul>
    {#each items as item}
      <li 
        class:active={selectedItem === item.id}
        onclick={() => selectItem(item.id)}
      >
        {#if item.icon}<span>{item.icon}</span>{/if}
        {item.label}
      </li>
    {/each}
  </ul>
</div>
```

## Best Practices

1. **Component Registration**: Register components early in your application lifecycle.
2. **Unique IDs**: Use clear, unique IDs for each component type.
3. **Default Props**: Provide sensible defaults in both the registration and the component itself.
4. **Error Handling**: Components should gracefully handle missing or invalid props.
5. **Sidebar Components**: For components added directly to columns, design them to fill the entire space.
6. **Reactivity**: Use `$state()` for reactive variables and `$derived()` for computed values.
7. **Event Handling**: Use `onclick`, `onfocus`, etc. instead of `on:click`, `on:focus` in Svelte 5.

---

For more advanced usage, refer to the full ttabs API documentation. 