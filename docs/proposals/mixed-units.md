# Mixed Units (px and %) in ttabs

## Overview

This proposal outlines a strategy to allow users to specify dimensions (widths and heights) in both percentage (%) and pixel (px) units for rows and columns in ttabs.

## Current Implementation

Currently, ttabs uses percentage-based sizing exclusively:

1. Rows have a `height` property as a percentage (0-100)
2. Columns have a `width` property as a percentage (0-100)
3. When resizing, calculations convert pixel movements to percentage changes
4. The redistribution of space when elements are added or removed is done proportionally

## Proposed Implementation

### 1. Update the Type Definitions

We'll define a new `SizeInfo` type for dimensions:

```typescript
export interface SizeInfo {
  value: number;
  unit: 'px' | '%' | 'auto';
}

export interface TileRow extends TileBase {
  type: 'row';
  columns: string[];
  height: SizeInfo;
}

export interface TileColumn extends TileBase {
  type: 'column';
  child: string;
  width: SizeInfo;
}
```

### 2. Update the API Methods

Update `addRow` and `addColumn` to handle string inputs only:

```typescript
addRow(parentId: string, height: string = 'auto'): string {
  // Parse string input to SizeInfo
  const sizeInfo = parseSizeValue(height);
  
  // Create the row with size info
  const rowId = this.addTile({
    type: 'row',
    parent: parentId,
    columns: [],
    height: sizeInfo
  });
  
  // Rest of the method remains the same
  // ...
}

addColumn(parentId: string, width: string = 'auto'): string {
  // Parse string input to SizeInfo
  const sizeInfo = parseSizeValue(width);
  
  // Create the column with size info
  const columnId = this.addTile({
    type: 'column',
    parent: parentId,
    child: '',
    width: sizeInfo
  });
  
  // Rest of the method remains the same
  // ...
}
```

### 3. Size Calculation Strategy

Since all rows and columns should always fill their containers, we'll implement a simple and predictable sizing strategy:

1. **Three unit types**:
   - `px`: Fixed size in pixels (exact measurement)
   - `%`: Percentage of the container size
   - `auto`: Takes up remaining space after fixed and percentage-based elements

2. **Distribution rules**:
   - First, allocate space to fixed-size (`px`) elements
   - If fixed elements exceed container size, scale them down proportionally
   - Next, allocate space to percentage-based (`%`) elements
   - Finally, distribute any remaining space equally among `auto` elements
   - If percentage totals exceed 100%, normalize them proportionally

3. **Default behavior**:
   - By default, elements use `auto` sizing, sharing space equally
   - When explicit dimensions are set, they take precedence

### 4. Size Calculation Algorithm

```typescript
function calculateSizes(containerSize: number, elements: Array<{id: string, size: SizeInfo}>): 
  Array<{id: string, computedSize: number, scaledDown: boolean}> {
  
  // Identify different types of elements
  let totalFixedSize = 0;
  let totalPercentage = 0;
  const fixedElements: Array<{id: string, size: number}> = [];
  const percentElements: Array<{id: string, percent: number}> = [];
  const autoElements: string[] = [];
  
  // First pass: categorize elements and calculate fixed totals
  elements.forEach(element => {
    if (element.size.unit === 'px') {
      totalFixedSize += element.size.value;
      fixedElements.push({id: element.id, size: element.size.value});
    } else if (element.size.unit === '%') {
      totalPercentage += element.size.value;
      percentElements.push({id: element.id, percent: element.size.value});
    } else if (element.size.unit === 'auto') {
      autoElements.push(element.id);
    }
  });
  
  // Check if fixed sizes need scaling
  const fixedScaleFactor = totalFixedSize > containerSize ? 
    containerSize / totalFixedSize : 1;
  
  // Adjusted total fixed size after scaling (if needed)
  const adjustedFixedSize = totalFixedSize * fixedScaleFactor;
  
  // Space calculations
  const remainingAfterFixed = Math.max(0, containerSize - adjustedFixedSize);
  
  // Determine if percentages need normalization
  const percentageScaleFactor = totalPercentage > 0 ? 
    (totalPercentage > 100 ? 100 / totalPercentage : 1) : 1;
  
  // Calculate space used by percentage elements
  let percentageSpace = 0;
  if (totalPercentage > 0) {
    // If percentages add up to more than 100%, normalize them
    percentageSpace = remainingAfterFixed * Math.min(totalPercentage * percentageScaleFactor, 100) / 100;
  }
  
  // Space for auto elements
  const remainingForAuto = Math.max(0, remainingAfterFixed - percentageSpace);
  const autoElementSize = autoElements.length > 0 ? remainingForAuto / autoElements.length : 0;
  
  // Results array
  const results: Array<{id: string, computedSize: number, scaledDown: boolean}> = [];
  
  // Process fixed elements - scale them down if needed
  fixedElements.forEach(element => {
    const scaledSize = element.size * fixedScaleFactor;
    results.push({
      id: element.id,
      computedSize: scaledSize,
      scaledDown: fixedScaleFactor < 1
    });
  });
  
  // Process percentage elements
  if (totalPercentage > 0) {
    percentElements.forEach(element => {
      // Normalize percentage if needed
      const adjustedPercent = element.percent * percentageScaleFactor;
      const computedSize = (remainingAfterFixed * adjustedPercent) / 100;
      
      results.push({
        id: element.id,
        computedSize,
        scaledDown: false
      });
    });
  }
  
  // Process auto elements
  autoElements.forEach(element => {
    results.push({
      id: element.id,
      computedSize: autoElementSize,
      scaledDown: false
    });
  });
  
  return results;
}
```

### 5. Component Changes

Update the row and column components to use the SizeInfo for styling:

```svelte
<!-- TileRow.svelte -->
<div
  class="ttabs-row {ttabs.theme?.classes?.row || ''}"
  class:is-resizing={isResizing}
  data-tile-id={id}
  style={getSizeStyle(row.height, 'height')}
>
  <!-- Component content -->
</div>

<!-- TileColumn.svelte -->
<div
  class="ttabs-column {ttabs.theme?.classes?.column || ''}"
  class:is-resizing={isResizing}
  data-tile-id={id}
  style={getSizeStyle(column.width, 'width')}
>
  <!-- Component content -->
</div>

<!-- Helper function in both components -->
function getSizeStyle(size: SizeInfo, property: 'width' | 'height') {
  if (size.unit === 'auto') {
    // For auto, we use flex properties
    return property === 'width' ? 'flex: 1; width: auto;' : 'flex: 1; height: auto;';
  }
  return `${property}: ${size.value}${size.unit};`;
}
```

### 6. Resize Handling

The resize handlers need to be updated to maintain the correct unit types:

```typescript
function onMouseMove(e: MouseEvent) {
  if (!isResizing || !column || !nextColId) return;

  const nextColumn = ttabs.getTile<TileColumnType>(nextColId);
  if (!nextColumn) return;

  // Get a reference to the containing row element
  const rowElement = document.querySelector(
    `[data-tile-id="${parentId}"]`,
  ) as HTMLElement;
  if (!rowElement) return;

  const deltaPixels = e.clientX - startX;
  
  // Handle resize based on unit types
  if (column.width.unit === 'px' && nextColumn.width.unit === 'px') {
    // Both columns use pixels - direct adjustment
    const newWidthA = Math.max(MIN_WIDTH_PX, startWidthA.value + deltaPixels);
    const newWidthB = Math.max(MIN_WIDTH_PX, startWidthB.value - deltaPixels);
    
    ttabs.updateTile(column.id, { width: { value: newWidthA, unit: 'px' } });
    ttabs.updateTile(nextColId, { width: { value: newWidthB, unit: 'px' } });
  } 
  else if (column.width.unit === '%' && nextColumn.width.unit === '%') {
    // Both columns use percentage - percentage adjustment
    const deltaPercent = (deltaPixels / rowElement.offsetWidth) * 100;
    const newWidthA = Math.max(MIN_WIDTH_PERCENT, startWidthA.value + deltaPercent);
    const newWidthB = Math.max(MIN_WIDTH_PERCENT, startWidthB.value - deltaPercent);
    
    ttabs.updateTile(column.id, { width: { value: newWidthA, unit: '%' } });
    ttabs.updateTile(nextColId, { width: { value: newWidthB, unit: '%' } });
  }
  else {
    // Mixed units - adjust each according to its unit
    if (column.width.unit === 'px') {
      // First column is pixels, second is percentage/auto
      const newWidthA = Math.max(MIN_WIDTH_PX, startWidthA.value + deltaPixels);
      ttabs.updateTile(column.id, { width: { value: newWidthA, unit: 'px' } });
      
      // Trigger recalculation of layout
      ttabs.recalculateLayout(parentId);
    } 
    else if (nextColumn.width.unit === 'px') {
      // First column is percentage/auto, second is pixels
      const newWidthB = Math.max(MIN_WIDTH_PX, startWidthB.value - deltaPixels);
      ttabs.updateTile(nextColId, { width: { value: newWidthB, unit: 'px' } });
      
      // Trigger recalculation of layout
      ttabs.recalculateLayout(parentId);
    }
    else {
      // One is percentage, one is auto - convert auto to percentage during resize
      const totalWidth = rowElement.offsetWidth;
      const deltaPercent = (deltaPixels / totalWidth) * 100;
      
      if (column.width.unit === 'auto') {
        // Convert auto to percentage based on current computed size
        const currentWidthPercent = (column.computedSize / totalWidth) * 100;
        const newWidthA = Math.max(MIN_WIDTH_PERCENT, currentWidthPercent + deltaPercent);
        ttabs.updateTile(column.id, { width: { value: newWidthA, unit: '%' } });
      } else {
        // Adjust percentage directly
        const newWidthA = Math.max(MIN_WIDTH_PERCENT, startWidthA.value + deltaPercent);
        ttabs.updateTile(column.id, { width: { value: newWidthA, unit: '%' } });
      }
      
      // Always recalculate after mixed-unit resizing
      ttabs.recalculateLayout(parentId);
    }
  }
}
```

## Utility Functions

```typescript
function parseSizeValue(size: string): SizeInfo {
  // Default case
  if (!size || size === 'auto') {
    return { value: 0, unit: 'auto' as const };
  }
  
  // Parse percentage values
  if (size.endsWith('%')) {
    const percentValue = parseFloat(size);
    if (isNaN(percentValue)) {
      throw new Error(`Invalid percentage format: ${size}`);
    }
    return { value: percentValue, unit: '%' as const };
  }
  
  // Parse pixel values
  if (size.endsWith('px')) {
    const pixelValue = parseFloat(size);
    if (isNaN(pixelValue)) {
      throw new Error(`Invalid pixel format: ${size}`);
    }
    return { value: pixelValue, unit: 'px' as const };
  }
  
  // Try to parse as a number and assume it's a percentage
  const numericValue = parseFloat(size);
  if (!isNaN(numericValue)) {
    return { value: numericValue, unit: '%' as const };
  }
  
  throw new Error(`Invalid size format: ${size}. Expected format: "100%", "260px", or "auto"`);
}

// New recalculation method for Ttabs class
recalculateLayout(containerId: string): void {
  const container = this.getTile(containerId);
  if (!container) return;
  
  // Depending on container type, recalculate children
  if (container.type === 'row') {
    const row = container as TileRow;
    const containerEl = document.querySelector(`[data-tile-id="${containerId}"]`) as HTMLElement;
    if (!containerEl) return;
    
    const containerWidth = containerEl.offsetWidth;
    const columns = row.columns.map(id => {
      const col = this.getTile<TileColumn>(id);
      return {id, size: col.width};
    });
    
    const calculatedSizes = calculateSizes(containerWidth, columns);
    
    // Apply the calculated sizes
    calculatedSizes.forEach(({id, computedSize, scaledDown}) => {
      const column = this.getTile<TileColumn>(id);
      
      // Store computed size for reference during resize operations
      column.computedSize = computedSize;
      
      // Update tiles based on their unit type
      if (column.width.unit === 'px' && scaledDown) {
        // If original px size was scaled down, update the rendered size
        this.updateTile(id, {
          scaledWidth: computedSize,
          originalWidth: column.width.value
        });
      }
      else if (column.width.unit === '%') {
        // Update percentage based on computed size
        this.updateTile(id, {
          width: {
            value: (computedSize / containerWidth) * 100,
            unit: '%'
          }
        });
      }
      // No need to update auto units as they'll be handled by CSS
    });
  }
  
  // Similar logic for 'grid' type and row height calculations
}
```

## Example Usage

```typescript
function setupTtabs() {
  ttabs.resetState();
  const root = ttabs.rootGridId as string;
  
  // Create row with full height (100%)
  const row = ttabs.addRow(root, "100%");
  
  // Column with fixed width + auto column (takes remaining space)
  const sidebarColumn = ttabs.addColumn(row, "260px");
  const mainColumn = ttabs.addColumn(row, "auto"); // Explicit 'auto' (also the default)
  
  // Row with percentage columns that will normalize
  const row2 = ttabs.addRow(root, "100%");
  // Two columns with 10% each (they'll be scaled to fill the container)
  const col1 = ttabs.addColumn(row2, "10%"); 
  const col2 = ttabs.addColumn(row2, "10%");
  // Since percentages add up to 20%, they'll each actually be 50%
  
  // Example with fixed sizes that might need scaling
  const row3 = ttabs.addRow(root, "100%");
  // If container is smaller than 800px, these will scale proportionally
  const col3 = ttabs.addColumn(row3, "300px");
  const col4 = ttabs.addColumn(row3, "500px");
  
  // Complex layout example
  const contentGrid = ttabs.addGrid(mainColumn);
  ttabs.updateTile(contentGrid, { dontClean: true });
  
  // Fixed height header row
  const topRow = ttabs.addRow(contentGrid, "80px");
  // Middle row takes remaining space automatically
  const middleRow = ttabs.addRow(contentGrid, "auto");
  // Fixed height footer
  const bottomRow = ttabs.addRow(contentGrid, "40px");
  
  // Add content panels
  const topPanel = ttabs.addPanel(ttabs.addColumn(topRow));
  const middlePanel = ttabs.addPanel(ttabs.addColumn(middleRow));
  const bottomPanel = ttabs.addPanel(ttabs.addColumn(bottomRow));
}
```

## Implementation Considerations

1. **String-Only Input**:
   - All dimensions are specified as strings with explicit units
   - This eliminates any ambiguity about what a numeric value means
   - Valid formats: "100%", "260px", "auto"
   - For backward compatibility, numbers without units can be interpreted as percentages

2. **Simplicity First**:
   - This design prioritizes simplicity and predictability
   - Every row/column will always expand to fill its container
   - Explicit sizing takes priority over automatic sizing

3. **Percentage Normalization**:
   - When percentages don't add up to 100%, they're automatically normalized
   - Example: Two columns at "30%" each (60% total) automatically become 50% each
   - Example: Three columns at "40%" each (120% total) become 33.33% each

4. **Fixed Size Scaling**:
   - When fixed-size elements exceed container size, scale them proportionally
   - Example: Two columns at "300px" and "500px" in a 600px container → scaled to 180px and 300px
   - Maintain the aspect ratio between elements when scaling is necessary
   - Store original requested size alongside the computed size for future container resizing

5. **Minimum Sizes**:
   - Define reasonable minimum sizes for both pixel and percentage units
   - Prevent resizing below these minimums for usability

## Next Steps

1. Update the type definitions in `tile-types.ts` to use `SizeInfo` interface
2. Implement the `parseSizeValue` utility function for string input only
3. Create the `calculateSizes` function with proportional scaling logic
4. Update `addRow` and `addColumn` methods to use 'auto' as the default
5. Modify the rendering components to apply the correct CSS units
6. Enhance resize handlers to properly handle mixed unit types
7. Implement layout recalculation logic
8. Add tests for mixed-unit calculations and proportional scaling behavior 