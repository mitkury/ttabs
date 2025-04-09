# Panel Splitting Implementation Proposal

## Overview

This proposal outlines how to implement panel splitting functionality for ttabs, allowing users to drag tabs to create new panel layouts. When a panel is split, the dragged tab provides the content for the newly created panel.

## Split Directions

The system will support four splitting directions:
- Top: Create a new row above the target panel
- Bottom: Create a new row below the target panel
- Left: Create a new column to the left of the target panel
- Right: Create a new column to the right of the target panel

## Implementation Strategy

### 1. Extend TilePanel Component

Modify the `TilePanel.svelte` component to handle drag events not only for tab reordering but also for panel splitting. This will include:

- Detecting when a tab is dragged to the edge of a panel
- Visual indicators showing the split target area (top, bottom, left, right)
- Handling drop events to trigger the split operation

### 2. Add New Method to Ttabs Class

Add a new `splitPanel` method to the `Ttabs` class that:

```typescript
splitPanel(
  tabId: string,          // The tab being dragged - provides content for the new panel
  sourcePanelId: string,  // The panel where the tab currently resides
  targetPanelId: string,  // The panel being split
  direction: 'top' | 'right' | 'bottom' | 'left'
): boolean
```

This method will:
1. Validate the source tab and panels
2. Determine the appropriate parent container to modify
3. Create necessary new containers (grid, row, column)
4. Create a new panel for the tab
5. Move the tab to the new panel
6. Rebalance dimensions for the affected containers

### 3. Algorithm for Split Operations

#### For Top/Bottom Splits:
1. Find the column containing the target panel
2. Create a new grid or modify the existing grid in the column
3. Add/modify rows to represent the split
4. Create a new panel in the new row
5. Move the tab from the source panel to the new panel

#### For Left/Right Splits:
1. Find the row containing the column with the target panel
2. Add a new column to the row
3. Create a new panel in the new column
4. Move the tab from the source panel to the new panel

### 4. UI Enhancement

1. Add visual indicators during drag operations to show split targets
2. Create CSS styles to represent the drop zones (top/right/bottom/left edges)
3. Add appropriate transitions for a smooth user experience

### 5. Default Dimensions

When splitting:
- Top/Bottom: The new and existing panels will each get 50% of the height
- Left/Right: The new and existing panels will each get 50% of the width

## Example Flow (Right Split)

1. User drags Tab A to the right edge of Panel B
2. System finds Panel B's parent column and its parent row
3. New column is created in the row with 50% width (existing columns are resized)
4. New panel is created in the new column
5. Tab A is moved from its original panel to the new panel
6. UI updates to show the new layout

## Cleanup Considerations

The existing `cleanupContainers` method already handles removal of empty containers, which will be useful when:
- All tabs are moved out of a panel
- The last tab in a layout section is moved or closed

## Next Steps

1. Implement `splitPanel` method in Ttabs class
2. Enhance TilePanel component to handle split UI indicators
3. Update drag handling to detect edge positions
4. Add drag visualization for split directions
5. Connect the UI events to the new method 