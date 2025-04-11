# ttabs-svelte

A flexible layout management system with draggable, resizable tiles and tabs for Svelte applications.

## Features

- Hierarchical tile grid system
- Draggable and resizable tiles
- Tabbed interface
- Customizable themes
- State persistence

## Installation

```bash
npm install ttabs-svelte
```

## Quick Start

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs-svelte';
  
  // Create a ttabs instance
  const ttabs = createTtabs();
  
  // Add a grid to serve as the root
  const rootGridId = ttabs.addGrid();
  
  // Add a row to the grid
  const rowId = ttabs.addRow(rootGridId, 100);
  
  // Add a column to the row
  const columnId = ttabs.addColumn(rowId, 100);
  
  // Add a panel to the column
  const panelId = ttabs.addPanel(columnId);
  
  // Add a tab to the panel
  const tabId = ttabs.addTab(panelId, 'My Tab');
</script>

<div style="width: 100%; height: 500px;">
  <TtabsRoot {ttabs} />
</div>
```

## Documentation

For full documentation and examples, visit [ttabs documentation](https://github.com/mitkury/ttabs).

## Hierarchical Structure

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

## License

MIT 