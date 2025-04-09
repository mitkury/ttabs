# ttabs - Tiles with Tabs

## Overview

ttabs is a layout system that allows users to create resizable and rearrangeable interfaces with tiles and tabs.

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