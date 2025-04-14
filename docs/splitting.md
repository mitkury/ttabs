# Panel Splitting in ttabs

This guide explains how to use the panel splitting functionality in ttabs, which allows you to create more complex layouts by splitting panels in different directions.

## Overview

Panel splitting lets you:
- Create new panels from existing tabs
- Split panels in four directions: top, right, bottom, or left
- Build complex layouts through drag and drop interactions

## How It Works

When you drag a tab to the edge of a panel, visual indicators appear showing where the new panel will be created. When you drop the tab, the panel splits and the tab moves to the newly created panel.

### Split Directions

You can split a panel in four directions:

- **Top**: Creates a new panel above the target panel
- **Right**: Creates a new panel to the right of the target panel
- **Bottom**: Creates a new panel below the target panel
- **Left**: Creates a new panel to the left of the target panel

## Using Panel Splitting

### 1. Drag and Drop (UI Method)

The simplest way to split panels is through the drag and drop interface:

1. Click and hold on a tab
2. Drag the tab to the edge of any panel (including its own panel)
3. When you see the split indicator, release the tab
4. The panel will split and the tab will move to the new panel

Each new panel starts with equal dimensions (50/50 split).

### 2. Programmatic Splitting

You can also split panels programmatically using the `splitPanel` method:

```typescript
// Get references to the ttabs instance
const ttabs = new Ttabs();

// Create your initial layout
const rootId = ttabs.addGrid();
// ... create rows, columns, panels, and tabs

// Split a panel programmatically
ttabs.splitPanel(
  'tab-id-to-move',   // The tab to move to the new panel
  'target-panel-id',  // The panel to split
  'right'             // Direction: 'top', 'right', 'bottom', or 'left'
);
```

## Example: Creating a Three-Panel Layout

Here's how to create a layout with three panels programmatically:

```typescript
// Create basic layout
const rootId = ttabs.addGrid();
const rowId = ttabs.addRow(rootId);
const colId = ttabs.addColumn(rowId);
const panelId = ttabs.addPanel(colId);

// Create tabs
const tab1 = ttabs.addTab(panelId, 'Tab 1');
const tab2 = ttabs.addTab(panelId, 'Tab 2');
const tab3 = ttabs.addTab(panelId, 'Tab 3');

// Split the panel to the right with Tab 2
ttabs.splitPanel(tab2, panelId, 'right');

// Split the original panel to the bottom with Tab 3
ttabs.splitPanel(tab3, panelId, 'bottom');
```

This creates a layout with Tab 1 in the top-left, Tab 2 in the top-right, and Tab 3 in the bottom-left.

## Combining with Content Components

Panel splitting works seamlessly with content components:

```typescript
// Register your components first
ttabs.registerContentComponent('editor', EditorComponent);
ttabs.registerContentComponent('preview', PreviewComponent);

// Create tabs with content
const codeTab = ttabs.addTab(panelId, 'Code');
ttabs.setComponent(codeTab, 'editor', { language: 'javascript' });

const previewTab = ttabs.addTab(panelId, 'Preview');
ttabs.setComponent(previewTab, 'preview');

// Split the panel to show code and preview side by side
ttabs.splitPanel(previewTab, panelId, 'right');
```

## Technical Details

When a panel is split:

1. The appropriate containers (rows, columns, grids) are created or modified
2. The tab is moved from its source panel to the new panel
3. The dimensions are adjusted to maintain a balanced layout
4. The new panel becomes the active panel

## Best Practices

1. **Equal Dimensions**: Split panels start with equal dimensions (50/50)
2. **Nesting**: You can split panels repeatedly to create complex layouts
3. **Empty Panels**: When the last tab is moved out of a panel, the panel is automatically removed
4. **Related Content**: Place related content in adjacent panels for better workflow

---

For more advanced usage, refer to the full ttabs API documentation. 