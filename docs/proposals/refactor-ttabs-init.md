# Refactoring Ttabs Initialization and Root Component

## Overview

This proposal outlines improvements to the Ttabs initialization process and introduces a new `TtabsRoot` component to simplify usage. These changes aim to make ttabs more user-friendly while maintaining its flexibility.

## Current Approach

Currently, working with ttabs requires several manual steps:

1. Creating a Ttabs instance
2. Manually creating a root grid
3. Manually tracking the root grid ID
4. Passing the root grid ID to TileGrid component
5. Constructing the layout hierarchy manually

## Proposed Solution

### 1. Automatic Root Grid Creation

Modify the Ttabs class to automatically create a root grid when initialized, unless existing state is provided:

```typescript
// Modify TtabsOptions interface in Ttabs.svelte.ts
export interface TtabsOptions {
  // Existing options...
  
  /**
   * Initial tiles state (optional)
   * If provided, the instance will be initialized with this state
   * If not provided, a default root grid will be created
   */
  initialState?: Tile[];
  
  // Other options...
}

// Update Ttabs class
export class Ttabs {
  // Existing state...
  
  // Add root grid tracking
  rootGridId = $state<string | null>(null);
  
  constructor(options: TtabsOptions = {}) {
    // Initialize state from options or create empty state
    if (options.initialState) {
      // Convert array to record (or whatever format is used internally)
      this.tiles = {}; // Initialize empty
      
      // Add each tile to the state
      options.initialState.forEach(tile => {
        this.tiles[tile.id] = tile;
      });
      
      // Find the root grid in the initial state
      this.rootGridId = Object.values(this.tiles)
        .find(tile => tile.type === 'grid' && !tile.parent)?.id || null;
    } else {
      // Auto-create a root grid if no initial state is provided
      this.rootGridId = this.addGrid();
    }
    
    // Other initialization...
  }
  
  /**
   * Get the root grid ID
   */
  getRootGridId(): string | null {
    // If root grid ID is already set, return it
    if (this.rootGridId) {
      return this.rootGridId;
    }
    
    // Find the grid without a parent
    const rootGrid = Object.values(this.getTiles())
      .find(tile => tile.type === 'grid' && !tile.parent);
    
    // Store it for future use
    if (rootGrid) {
      this.rootGridId = rootGrid.id;
    }
    
    return rootGrid?.id || null;
  }
  
  /**
   * Create a default empty layout
   * This can be called to create a standard layout if needed
   */
  createDefaultLayout(): string {
    // Create root grid if it doesn't exist
    if (!this.getRootGridId()) {
      this.rootGridId = this.addGrid();
    }
    
    const rootId = this.rootGridId as string;
    
    // Create a main row
    const mainRowId = this.addRow(rootId, 100);
    
    // Create a column
    const mainColumnId = this.addColumn(mainRowId, 100);
    
    // Create a panel
    const mainPanelId = this.addPanel(mainColumnId);
    
    // Create a default tab
    this.addTab(mainPanelId, 'New Tab');
    
    return rootId;
  }
}
```

### 2. TtabsRoot Component

Create a new TtabsRoot component that automatically finds and renders the root grid:

```svelte
<!-- TtabsRoot.svelte -->
<script lang="ts">
  import TileGrid from './TileGrid.svelte';
  
  export let ttabs;
  
  // Find the root grid ID
  $: rootGridId = ttabs.getRootGridId();
</script>

<div class="ttabs-root">
  {#if rootGridId}
    <TileGrid {ttabs} id={rootGridId} />
  {:else}
    <div class="ttabs-empty-state">
      <button on:click={() => ttabs.createDefaultLayout()}>
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
  }
  
  .ttabs-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }
  
  button {
    padding: 8px 16px;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    opacity: 0.9;
  }
</style>
```

### 3. Serialization Improvements

Update serialization methods to work with the new root grid tracking:

```typescript
// Add to Ttabs class
export class Ttabs {
  // ... existing code ...
  
  /**
   * Serialize the layout to JSON
   */
  serializeLayout(): string {
    // Get all tiles as an array
    const tilesArray = Object.values(this.tiles);
    return JSON.stringify(tilesArray);
  }
  
  /**
   * Deserialize a layout from JSON
   */
  deserializeLayout(json: string): boolean {
    try {
      const parsedTiles = JSON.parse(json) as Tile[];
      if (!Array.isArray(parsedTiles)) return false;
      
      // Reset current state
      this.resetState();
      
      // Set as initialState (will handle finding the root grid)
      parsedTiles.forEach(tile => {
        this.tiles[tile.id] = tile;
      });
      
      // Find the root grid
      this.rootGridId = Object.values(this.tiles)
        .find(tile => tile.type === 'grid' && !tile.parent)?.id || null;
      
      return true;
    } catch (e) {
      console.error('Failed to deserialize layout:', e);
      return false;
    }
  }
}
```

## Implementation Benefits

Using this simplified approach has several advantages:

1. **Zero Configuration**: Users can create a complete layout with just `new Ttabs()`
2. **Automatic Root Detection**: No need to manually track and pass root grid IDs
3. **Single Container Component**: Just use `<TtabsRoot {ttabs} />` to render everything
4. **Simplified API**: Fewer steps required to create and manage layouts
5. **Better Serialization**: More straightforward JSON structure using arrays
6. **Fallback Handling**: Empty state with easy option to create a default layout

## Usage Examples

### Basic Usage

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  
  // Create ttabs instance
  // Root grid is automatically created
  const ttabs = createTtabs();
</script>

<TtabsRoot {ttabs} />
```

### Custom Layout Creation

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  
  // Create ttabs instance
  const ttabs = createTtabs();
  
  // Set up a custom layout
  function setupCustomLayout() {
    const rootId = ttabs.getRootGridId();
    if (!rootId) return;
    
    // Create a layout with two columns
    const mainRowId = ttabs.addRow(rootId, 100);
    const leftColumnId = ttabs.addColumn(mainRowId, 30);
    const rightColumnId = ttabs.addColumn(mainRowId, 70);
    
    // Add panels and tabs
    const leftPanelId = ttabs.addPanel(leftColumnId);
    ttabs.addTab(leftPanelId, 'Navigation');
    
    const rightPanelId = ttabs.addPanel(rightColumnId);
    ttabs.addTab(rightPanelId, 'Content');
  }
  
  // Call it immediately or on a button click
  setupCustomLayout();
</script>

<TtabsRoot {ttabs} />
```

### Loading Saved Layout

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  
  // Load saved layout from localStorage if available
  let savedLayout;
  if (typeof window !== 'undefined') {
    savedLayout = localStorage.getItem('my-layout');
  }
  
  // Parse saved layout or start fresh
  let initialState;
  if (savedLayout) {
    try {
      initialState = JSON.parse(savedLayout);
    } catch (e) {
      console.error('Failed to parse saved layout:', e);
    }
  }
  
  // Create ttabs with saved layout or auto-create new one
  const ttabs = createTtabs({
    initialState,
    storageKey: 'my-layout' // Optional auto-save
  });
</script>

<TtabsRoot {ttabs} />
```

## Next Steps

1. Update the Ttabs class to track root grid ID
2. Implement automatic root grid creation in the constructor
3. Create the TtabsRoot component with auto-detection and rendering
4. Update serialization methods to work with arrays
5. Add helper methods for creating default layouts 