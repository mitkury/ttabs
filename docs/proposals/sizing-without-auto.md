# Proposal: Percentage-Based Sizing Without Auto

## Overview

This proposal suggests removing the `auto` unit option from ttabs sizing system and replacing it with a fully percentage-based approach. Instead of relying on `auto` for flexible sizing, we would calculate percentages for all tiles based on their relative sizes within their container.

## Current Implementation

Currently, ttabs supports three sizing units:
- `px`: Fixed pixel size
- `%`: Percentage of container size
- `auto`: Flexible size that takes remaining space

When users don't specify a size or use `auto`, the system distributes the remaining space (after fixed and percentage sizes are allocated) equally among all `auto` elements.

## Problems with the Current Approach

1. **Mixed Units Complexity**: Managing the interaction between `px`, `%`, and `auto` units adds complexity to the codebase.
2. **Resizing Behavior**: When resizing, `auto` elements need to be converted to percentages, creating inconsistent behavior.
3. **Serialization Issues**: `auto` elements with value 0 don't represent their actual rendered size when serialized.
4. **Predictability**: Users may find it difficult to predict how `auto` elements will behave in different scenarios.

## Proposed Solution

### 1. Remove `auto` Unit

Remove the `auto` unit option entirely from the `SizeInfo` interface:

```typescript
export interface SizeInfo {
  value: number;
  unit: 'px' | '%'; // Removed 'auto'
}
```

### 2. Default to Percentage-Based Sizing

When users don't specify a size:
- When adding a new element to an existing layout, assign a default percentage based on the number of existing percentage-based elements and redistribute the remaining space proportionally among existing elements

### 3. Proportional Distribution

When adding new elements without specified sizes:
- Assign a default percentage to the new element (e.g., if we have 2 columns, the new one will get 33.3%)
- Redistribute the remaining space (66.6%) among existing percentage-based elements proportionally
- This preserves the relative sizes of existing elements while making space for the new one

For example, if we have two columns at 30% and 70%:
- When adding a new column (33.3%), the remaining 66.6% is distributed proportionally
- First column becomes: 30% × (66.6%/100%) = 19.98%
- Second column becomes: 70% × (66.6%/100%) = 46.62%
- Result: 19.98%, 46.62%, and 33.3% (new column)

### 4. Handling Fixed-Size Elements

When mixing fixed-size (`px`) and percentage elements:
- Calculate the remaining space after allocating fixed-size elements
- Distribute the remaining space proportionally among percentage elements

### 5. Resizing Behavior

When resizing:
- For percentage-based elements: Update percentages directly
- For fixed-size elements: Maintain pixel values but recalculate percentages for other elements

## Implementation Details

### Changes Required

1. **Type Updates**:
   - Update `SizeInfo` interface to remove `auto` unit
   - Update all related type checking throughout the codebase

2. **Default Sizing**:
   - Modify `addColumn` and `addRow` methods to assign percentage values by default
   - Calculate equal percentages based on the number of siblings

3. **Layout Calculation**:
   - Update `calculateSizes` function to handle only `px` and `%` units
   - Remove all `auto` handling logic

4. **Style Generation**:
   - Update `getSizeStyle` function in components to handle only `px` and `%` units
   - Remove special handling for `auto` (currently using `flex: 1`)

5. **Resizing Logic**:
   - Simplify resizing logic in `TileColumn` and `TileRow` components
   - Remove conversion from `auto` to percentages during resize

### Example: Adding a New Column

```typescript
// Current implementation (simplified)
addColumn(rowId: string, width: string = 'auto'): string {
  // Create column with auto width
  const columnId = generateId();
  const column = {
    id: columnId,
    parent: rowId,
    type: 'column',
    width: parseSizeValue(width),
    child: null
  };
  
  // Add to state
  this.tiles[columnId] = column;
  
  // Add to parent
  const row = this.getRow(rowId);
  row.columns.push(columnId);
  this.updateTile(rowId, { columns: row.columns });
  
  return columnId;
}

// Proposed implementation
addColumn(rowId: string, width?: string): string {
  const columnId = generateId();
  const row = this.getRow(rowId);
  
  // If width not specified, calculate percentage
  let sizeInfo;
  if (!width) {
    // Default percentage for the new column
    const newColumnPercentage = 100 / (row.columns.length + 1);
    sizeInfo = { value: newColumnPercentage, unit: '%' as const };
    
    // Get existing percentage-based columns
    const percentageColumns = row.columns
      .map(id => this.getTile<TileColumn>(id))
      .filter(col => col && col.width.unit === '%') as TileColumn[];
    
    if (percentageColumns.length > 0) {
      // Calculate total existing percentage
      const totalExistingPercentage = percentageColumns.reduce(
        (sum, col) => sum + col.width.value, 0
      );
      
      // Calculate scaling factor to redistribute remaining space
      const remainingPercentage = 100 - newColumnPercentage;
      const scalingFactor = remainingPercentage / totalExistingPercentage;
      
      // Update existing columns proportionally
      percentageColumns.forEach(col => {
        const newPercentage = col.width.value * scalingFactor;
        this.updateTile(col.id, {
          width: { value: newPercentage, unit: '%' as const }
        });
      });
    }
  } else {
    // Use specified width
    sizeInfo = parseSizeValue(width);
  }
  
  // Create column with calculated width
  const column = {
    id: columnId,
    parent: rowId,
    type: 'column',
    width: sizeInfo,
    child: null
  };
  
  // Add to state and parent
  this.tiles[columnId] = column;
  row.columns.push(columnId);
  this.updateTile(rowId, { columns: row.columns });
  
  return columnId;
}
```

## Benefits

1. **Simplified Mental Model**: Users only need to understand two units (`px` and `%`).
2. **Predictable Behavior**: Percentage-based sizing provides more predictable layouts.
3. **Improved Serialization**: All elements have meaningful size values when serialized.
4. **Reduced Code Complexity**: Removing `auto` handling simplifies the codebase.
5. **Consistent Resizing**: Resizing behavior becomes more consistent without unit conversion.

## Potential Challenges

1. **Migration**: Existing layouts using `auto` will need to be migrated to percentage-based sizing.
2. **Fixed + Percentage Interactions**: Need careful handling of the interaction between fixed-size and percentage elements.
3. **Minimum Sizes**: Need to ensure elements don't become too small when distributing percentages.

## Migration Strategy

1. **Version Compatibility**:
   - Add a version flag to identify layouts created with the old system
   - Provide automatic conversion from `auto` to percentages based on computed sizes

2. **Documentation Updates**:
   - Update documentation to reflect the new sizing approach
   - Provide migration guides for users

3. **Deprecation Period**:
   - Consider a deprecation period where both systems are supported
   - Emit warnings when `auto` is used in new layouts

## Conclusion

Removing the `auto` unit and implementing a fully percentage-based sizing system will simplify the ttabs layout engine, making it more predictable and easier to maintain. The proposed changes focus on providing a better developer experience while maintaining the flexibility and power of the current system.
