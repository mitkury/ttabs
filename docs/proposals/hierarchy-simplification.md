# Hierarchy Simplification Logic Proposal

## Background

The ttabs layout system is built with a hierarchical structure:

```
TileGrid -> TileRow[] -> TileColumn[] -> TileContent | TilePanel | TileGrid
TilePanel -> TileTab[] -> TileContent
```

Over time, as users move tabs, collapse panels, or rearrange the layout, unnecessary grid nesting can occur. This results in structures like:

```
Column -> Grid -> Row -> Column -> Panel
```

When a simpler structure would be:

```
Column -> Panel
```

This document proposes a solution for automatically simplifying these grid hierarchies.

## Problem Statement

The current system already handles:
- Removing empty containers (panels with no tabs, columns with no children, etc.)
- Redistributing widths/heights when columns or rows are removed

However, it doesn't address the issue of **unnecessary grid nesting**, where a grid with a single row and column acts as a mere pass-through that adds no structural value.

## Specific Simplification Cases

### 1. Direct Grid Pass-through

```
Column -> Grid -> Row -> Column -> Content
```

The grid and its row and inner column are unnecessary if there's only one path through them. This should be simplified to:

```
Column -> Content
```

### 2. Multiple Levels of Grid Nesting

```
Column -> Grid1 -> Row1 -> Column1 -> Grid2 -> Row2 -> Column2 -> Content
```

Should be simplified to:

```
Column -> Content
```

### 3. Grid with Single Row/Column but Multiple Tabs in Panel

Even when a panel has multiple tabs, if it's wrapped in an unnecessary grid structure, that structure should be simplified:

```
Column -> Grid -> Row -> Column -> Panel (with multiple tabs)
```

Should become:

```
Column -> Panel (with multiple tabs)
```

## Proposed Algorithm

```typescript
function simplifyGridHierarchy(containerId: string): void {
  const container = getTile(containerId);
  if (!container) return;
  
  // Case: Container is a column containing a grid
  if (container.type === 'column') {
    const column = container as TileColumn;
    if (!column.child) return;
    
    const child = getTile(column.child);
    if (!child || child.type !== 'grid') return;
    
    // We have a column -> grid structure, check if grid has a single path
    const grid = child as TileGrid;
    
    // Skip root grid
    if (!grid.parent) return;
    
    // If grid has exactly one row
    if (grid.rows.length === 1) {
      const rowId = grid.rows[0];
      const row = getTile(rowId);
      if (!row) return;
      
      // If row has exactly one column
      if (row.columns.length === 1) {
        const innerColumnId = row.columns[0];
        const innerColumn = getTile(innerColumnId);
        if (!innerColumn || !innerColumn.child) return;
        
        // We have column -> grid -> row -> column -> something
        // Connect the outer column directly to the innermost child
        const targetChildId = innerColumn.child;
        
        // Update references
        updateTile(column.id, { child: targetChildId });
        updateTile(targetChildId, { parent: column.id });
        
        // Remove the intermediate structures
        removeTile(innerColumnId);
        removeTile(rowId);
        removeTile(grid.id);
        
        return; // Done with simplification
      }
    }
  }
  
  // Case: Container is a grid
  if (container.type === 'grid') {
    // Handle nested grids case
    // ...similar logic but looking for grid -> row -> column -> grid patterns
  }
}
```

## Implementation Approach

1. Implement a single, focused `simplifyGridHierarchy` function that specifically looks for grid nesting patterns
2. Call this function after:
   - Moving tabs between panels when a panel becomes empty
   - Creating new layout elements that might introduce unnecessary grids
   - Explicit user commands to "optimize layout"
3. Make this function recursively check parent containers after performing a simplification

## Testing Strategy

Create test fixtures for the following scenarios:

1. **Basic Grid Simplification**: Column -> Grid -> Row -> Column -> Panel
2. **Multi-level Grid Simplification**: Column -> Grid -> Row -> Column -> Grid -> Row -> Column -> Panel
3. **Edge Cases**:
   - Grid is the root grid (should not be removed)
   - Grid has multiple rows or columns (should not be simplified)
   - Panel has multiple tabs (should still simplify the grid structure)

## Implementation Phases

1. Implement and test the basic grid simplification for the most common case
2. Add support for handling multiple levels of grid nesting
3. Add safeguards and edge case handling
4. Consider performance optimizations if needed

## Conclusion

Focusing specifically on grid simplification will address the most significant source of unnecessary nesting in the ttabs layout system. This will keep layouts clean and efficient without disrupting the existing container cleanup and space redistribution mechanisms. 