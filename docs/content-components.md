# Content Components in ttabs

This guide explains how to use the content components system in ttabs, allowing you to create custom content for tabs using Svelte components.

## Overview

The content components system lets you:
- Register Svelte components that can be used for tab content
- Add these components to tabs with customizable props
- Dynamically update the content of existing tabs

## Basic Usage

### 1. Register Your Components

First, import and register your components with ttabs:

```typescript
import { Ttabs } from 'ttabs';
import EditorComponent from './EditorComponent.svelte';
import DocumentComponent from './DocumentComponent.svelte';

// Initialize ttabs
const ttabs = new Ttabs();

// Register components with unique IDs
ttabs.registerContentComponent('editor', EditorComponent, { readOnly: false });
ttabs.registerContentComponent('document', DocumentComponent);
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

3. Any props you pass to `addComponentContent` will be available to your component.

## Example Components

Here's a simple editor component example:

```svelte
<!-- EditorComponent.svelte -->
<script lang="ts">
  let { content = '', language = 'text', readOnly = false } = $props();
</script>

<div class="editor">
  <div class="header">{language}</div>
  {#if readOnly}
    <pre><code>{content}</code></pre>
  {:else}
    <textarea bind:value={content}></textarea>
  {/if}
</div>

<style>
  /* Your styles here */
</style>
```

## Best Practices

1. **Component Registration**: Register components early in your application lifecycle.
2. **Unique IDs**: Use clear, unique IDs for each component type.
3. **Default Props**: Provide sensible defaults in both the registration and the component itself.
4. **Error Handling**: Components should gracefully handle missing or invalid props.

---

For more advanced usage, refer to the full ttabs API documentation. 