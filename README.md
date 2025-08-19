# TTabs - Tiling Tabs Like in VSCode

## Overview

TTabs is a layout system that allows users to create resizable and rearrangeable interfaces with tiling tabs. Like in VSCode.

### How it Works

You create an instance of TTabs, register your components (can be any Svelte component), create a layout, and add instances of your components to tabs and columns.

## API

### Installation

```bash
npm install ttabs-svelte
```

### Basic Usage

```javascript
import { createTtabs, TTabsRoot } from 'ttabs-svelte';

// Create a ttabs instance
const ttabs = createTtabs({
  // Optional: provide initial state
  tiles: savedData?.tiles,
  focusedTab: savedData?.focusedTab
});

<TTabsRoot {ttabs} />
```

TtabsRoot is the container component that renders your layout and manages the root grid.

### Creating Layouts

First, register your components:

```javascript
// Register components that will be used in tabs
import MyComponent from './MyComponent.svelte';
ttabs.registerComponent('my-component', MyComponent);
```

Then create your layout using method chaining:

```javascript
// Create a new grid and build the layout using method chaining
ttabs
  .newGrid()
  .newRow()
  .newColumn()
  .newPanel()
  .newTab("My Tab", true)
  .setComponent("my-component", { prop1: "value1" })
  .setFocused();
```

### Working with Components

Once you've registered components, you can add them to tabs in various ways:

```javascript
// Add component to a tab using method chaining
panel
  .newTab("Tab Name", true)
  .setComponent("my-component", {
    prop1: "value1"
  });

// Or set a component on an existing tab
const tab = ttabs.getTabObject(tabId);
tab.setComponent("my-component", { prop1: "value1" });
```

### Managing Tabs

```javascript
// Get the active panel
const activePanel = ttabs.getActivePanel();
const panel = ttabs.getPanelObject(activePanel);

// Create a new tab in a panel
panel
  .newTab("New Tab", true)
  .setFocused();

// Reset the entire layout
ttabs.resetTiles();

// Create a new layout from scratch
ttabs
  .newGrid()
  .newRow()
  .newColumn()
  .newPanel();
```

### Persisting State

```javascript
import { createTtabs, LocalStorageAdapter } from 'ttabs-svelte';
import { onMount } from 'svelte';

// Create a storage adapter with optional debounce time in ms
const storageAdapter = new LocalStorageAdapter("my-app-layout", 500);

// First, try to load saved state
const savedData = storageAdapter.load();

// Initialize ttabs with the loaded state
const ttabs = createTtabs({
  // Use saved tiles if available, otherwise use empty state
  tiles: savedData?.tiles,
  // Use saved focused tab if available
  focusedTab: savedData?.focusedTab,
});

// Connect the storage adapter to save changes
const unsubscribe = ttabs.subscribe((state) => {
  storageAdapter.save(state);
});

// Register cleanup on component destroy
onMount(() => {
  return () => {
    // Unsubscribe from state changes when component is destroyed
    unsubscribe();
  };
});
```

### Hierarchical Structure

```
TileGrid -> TileRow[] -> TileColumn[] -> TileContent | TilePanel | TileGrid

TilePanel -> TileTab[] -> TileContent
```

Each level follows strict containment rules:
- **TileGrid** contains only TileRows
- **TileRow** contains only TileColumns 
- **TileColumn** contains exactly one of: TileContent, TilePanel, or nested TileGrid
- **TilePanel** contains TileTabs
- **TileTab** contains TileContent
- **TileContent** contains reference to any content to be displayed in a tab or a column

## Technical Details

### Implementation

- Built with **Svelte 5**, leveraging its reactive runes (`$state`, `$effect`) for state management
- Each tile is a separate entity with a unique ID and parent-child relationships
- Handles tab operations (moving, reordering, splitting panels)
- Implements automatic cleanup of empty containers and redistribution of space when elements are removed
- Hierarchical simplification to prevent unnecessary nesting of grid elements