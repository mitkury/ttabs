# ttabs - tiling tabs in Svelte

## Overview

ttabs is a layout system that allows users to create resizable and rearrangeable interfaces with tiles and tabs.

### How it Works

You create an instance of ttabs, register your components (can be any Svelte component), create a layout, and add instances of your components to tabs and columns.

## API

### Installation

```bash
npm install ttabs-svelte
```

### Basic Usage

```javascript
import { Ttabs, TtabsRoot } from 'ttabs-svelte';

// Create a ttabs instance
const ttabs = new Ttabs({
  theme: darkTheme // Optional: specify a theme
});

// In your Svelte component
<div class="container">
  <TtabsRoot {ttabs} />
</div>
```

TtabsRoot is the container component that renders your layout and manages the root grid.

### Creating Layouts

```javascript
// The rootGridId is automatically managed by TtabsRoot
const rowId = ttabs.addRow(ttabs.getRootGridId());
const columnId = ttabs.addColumn(rowId);
const panelId = ttabs.addPanel(columnId);
const tabId = ttabs.addTab(panelId, 'My Tab');

// Split panels
ttabs.splitPanel(tabId, panelId, 'right'); // directions: 'top', 'right', 'bottom', 'left'
```

### Content Components

```javascript
// Register components
import MyComponent from './MyComponent.svelte';
ttabs.registerComponent('my-component', MyComponent, { defaultProp: 'value' });

// Add component to a tab
ttabs.setComponent(tabId, 'my-component', { prop1: 'value1' });

// Add component directly to a column (without a panel)
ttabs.addColumnComponent(columnId, 'my-component', { prop1: 'value1' });
```

### Managing Tabs

```javascript
// Create a new tab in the active panel
const newTabId = ttabs.createNewTabInActivePanel('New Tab');

// Close a tab
ttabs.closeTab(tabId);

// Set a tab as active
ttabs.setActiveTab(tabId);

// Move tab between panels
ttabs.moveTab(tabId, targetPanelId);
```

### Persisting State

```javascript
import { LocalStorageAdapter } from 'ttabs-svelte';

// Create storage adapter
const storage = new LocalStorageAdapter('my-app-layout');

// Load saved state
const savedData = storage.load();
const ttabs = new Ttabs({ 
  tiles: savedData?.tiles,
  focusedTab: savedData?.focusedTab
});

// Save changes
const unsubscribe = ttabs.subscribe(state => storage.save(state));

// Cleanup when component is destroyed
onDestroy(() => unsubscribe());
```

### Hierarchical Structure

```
TileGrid -> TileRow[] -> TileColumn[] -> TileContent | TilePanel | TileGrid

TilePanel -> TileTab[] -> TileContnet
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