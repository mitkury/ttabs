# Hierarchy Simplification Logic Proposal

## Background

The ttabs layout system is built with a hierarchical structure:

```
TileGrid -> TileRow[] -> TileColumn[] -> TileContent | TilePanel | TileGrid
TilePanel -> TileTab[] -> TileContent
```

Over time, as users move tabs, collapse panels, or rearrange the layout, unnecessary nesting can occur. This results in structures like:

```
Column -> Grid -> Row -> Column -> Panel
```

When a simpler structure would be:

```
Column -> Panel
```

This document proposes a solution for automatically simplifying these hierarchies.

## Problem Cases

### 1. Empty Container Cleanup

When a container becomes empty (e.g., panel with no tabs), it should be removed, and its parent containers should be checked to see if they also need cleanup.

### 2. Single-Child Container Simplification

Containers that have a single child but add no value to the hierarchy should be simplified:
- A grid with a single row containing a single column
- A row with a single column
- A nested grid structure that can be flattened

### 3. Path Simplification

Detect and simplify specific patterns like:
```
Column -> Grid -> Row -> Column -> Panel/Content
```

## Proposed Approach

### Key Principles

1. **Safety First**: Never remove containers that would break the layout structure
2. **Separate Concerns**: Handle empty container cleanup separately from hierarchy simplification
3. **Targeted Operations**: Be selective about which operations trigger simplification
4. **Preserve State**: Maintain element properties through simplification

### Implementation Strategy

#### 1. Empty Container Cleanup

```typescript
function cleanupEmptyContainer(containerId: string): void {
  // 1. Check if container is empty based on its type
  // 2. Only remove if empty
  // 3. Update parent references
  // 4. Redistribute space if needed
  // 5. Continue cleanup with parent
}
```

Rules:
- Only remove a panel if it has no tabs
- Only remove a column if it has no valid child AND it's not the only column in a row
- Only remove a row if it has no columns AND it's not the only row in a grid
- Only remove a grid if it has no rows AND it's not the root grid

#### 2. Hierarchy Simplification

```typescript
function simplifyHierarchy(containerId: string): void {
  // 1. Identify simplifiable patterns
  // 2. Update child/parent references to bypass unnecessary containers
  // 3. Remove bypassed containers
  // 4. Preserve properties (width, height) through the simplification
}
```

Rules for simplification:
- A grid with one row containing one column can be bypassed by connecting the grid's parent directly to the column's child
- Only simplify if doing so won't break the layout's structure
- Always preserve the root grid and ensure grids have at least one row

#### 3. When to Trigger Simplification

Simplification should be triggered:
- After a tab is moved between panels
- After a panel is emptied
- When explicitly requested by the user (e.g., "optimize layout")
- After operations that could lead to unnecessary nesting

## Implementation Phases

1. **Phase 1**: Basic empty container cleanup
2. **Phase 2**: Pattern-based hierarchy simplification
3. **Phase 3**: Optimized unified approach

## Challenges

1. **Preserving IDs**: Ensure references to tiles are updated when simplifying
2. **Maintaining Active States**: Don't lose track of active panels/tabs
3. **Avoiding Over-Simplification**: Some structures might look unnecessary but serve a purpose
4. **Edge Cases**: Handle special cases like:
   - The only column in a row
   - The only row in a grid
   - The root grid

## Testing Strategy

1. Create test cases for each simplification pattern
2. Verify simplified structures maintain all content
3. Test edge cases to ensure layout integrity
4. Test complex operations like collapsing a row by moving all tabs

## Future Considerations

1. **User Control**: Allow users to opt out of automatic simplification
2. **Optimization Triggers**: Consider when simplification runs for performance
3. **Visual Feedback**: Indicate when simplification occurs
4. **Undo Support**: Allow reverting simplification

## Conclusion

A well-implemented hierarchy simplification system will keep ttabs layouts clean and efficient, improving performance and reducing unnecessary complexity for users. The implementation should prioritize safety and gradual introduction of simplification features. 