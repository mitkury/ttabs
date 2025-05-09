<script lang="ts">
  import TileColumn from "./TileColumn.svelte";
  import type { TtabsProps } from "./props";
  import type { TileRow as TileRowType, TileGrid, SizeInfo } from "../types/tile-types";
  import { calculateSizes } from "../utils/size-utils";
  import type { ComputedSizeInfo } from "../utils/size-utils";

  let { ttabs, id }: TtabsProps = $props();

  // Get row data
  const row = $derived(ttabs.getTile<TileRowType>(id));
  const parentId = $derived(row?.parent || null);

  // Get parent grid to access siblings
  const parentGrid = $derived(
    parentId ? ttabs.getTile<TileGrid>(parentId) : null,
  );
  const rowIndex = $derived(
    parentGrid?.type === "grid" && parentGrid.rows
      ? parentGrid.rows.indexOf(id)
      : -1,
  );
  const isLast = $derived(
    rowIndex >= 0 && parentGrid?.type === "grid" && parentGrid.rows
      ? rowIndex === parentGrid.rows.length - 1
      : false,
  );

  // Get columns
  const columns = $derived(row?.type === "row" ? row.columns : []);
  
  // Element reference for width calculations
  let rowElement = $state<HTMLElement | null>(null);
  
  // Column width calculations
  let columnWidths = $state<Record<string, number>>({});
  let resizeObserver: ResizeObserver | null = null; // Not reactive
  
  // Function to calculate column widths
  function calculateColumnWidths() {
    if (!rowElement || !row || columns.length === 0) return;
    
    const rowWidth = rowElement.offsetWidth;
    const columnSizeInfos = columns.map(id => {
      const column = ttabs.getTile(id);
      if (!column || column.type !== 'column') return null;
      return { id, size: column.width };
    }).filter(Boolean) as Array<{id: string, size: SizeInfo}>;
    
    const calculatedSizes = calculateSizes(rowWidth, columnSizeInfos);
    
    // Create a map of column ID to computed pixel width
    const newWidths: Record<string, number> = {};
    calculatedSizes.forEach(({ id, computedSize }) => {
      newWidths[id] = computedSize;
    });
    
    // Update the state in a way that doesn't trigger cascading updates
    columnWidths = newWidths;
  }
  
  // Handle resize events from the ResizeObserver
  function handleResize() {
    // Use requestAnimationFrame to avoid excessive updates during resize
    requestAnimationFrame(calculateColumnWidths);
  }
  
  // Setup ResizeObserver when row element is available
  $effect(() => {
    if (!rowElement) return;
    
    // Clean up any existing observer
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    
    // Create a new ResizeObserver
    resizeObserver = new ResizeObserver(handleResize);
    
    // Start observing the row element
    resizeObserver.observe(rowElement);
    
    // Initial calculation (after a small delay to ensure DOM is ready)
    setTimeout(calculateColumnWidths, 0);
    
    // Cleanup when component is destroyed or rowElement changes
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    };
  });
  
  // Recalculate when columns change (but not on every render)
  let prevColumnsLength = -1;
  $effect(() => {
    // Only recalculate if columns array length actually changed
    if (rowElement && columns.length > 0 && columns.length !== prevColumnsLength) {
      prevColumnsLength = columns.length;
      setTimeout(calculateColumnWidths, 0);
    }
  });

  // Resizing state
  let isResizing = $state(false);
  let startY = $state(0);
  let startHeightA = $state<SizeInfo | null>(null);
  let startHeightB = $state<SizeInfo | null>(null);
  let nextRowId = $state<string | null>(null);

  function onResizerMouseDown(e: MouseEvent) {
    if (isLast || !row || !parentGrid || !parentGrid.rows) return;

    // Store the next row ID
    nextRowId = parentGrid.rows[rowIndex + 1];
    if (!nextRowId) return;

    const nextRow = ttabs.getTile<TileRowType>(nextRowId);
    if (!nextRow) return;

    // Store initial values
    startY = e.clientY;
    startHeightA = row.height;
    startHeightB = nextRow.height;

    isResizing = true;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!isResizing || !row || !nextRowId || !startHeightA || !startHeightB) return;

    // Get a reference to the containing grid element
    const gridElement = document.querySelector(
      `[data-tile-id="${parentId}"]`,
    ) as HTMLElement;
    if (!gridElement) return;

    // Calculate pixel movement
    const deltaPixels = e.clientY - startY;
    
    // Handle resizing based on unit types
    if (startHeightA.unit === 'px' && startHeightB.unit === 'px') {
      // Both rows use pixels - direct pixel adjustment
      const MIN_HEIGHT_PX = 50; // Minimum height in pixels
      
      // Calculate new heights ensuring minimum height
      const newHeightValueA = Math.max(MIN_HEIGHT_PX, startHeightA.value + deltaPixels);
      const newHeightValueB = Math.max(MIN_HEIGHT_PX, startHeightB.value - deltaPixels);
      
      // Apply the new heights
      const newHeightA = { value: newHeightValueA, unit: 'px' as const };
      const newHeightB = { value: newHeightValueB, unit: 'px' as const };
      
      ttabs.updateTile(id, { height: newHeightA });
      ttabs.updateTile(nextRowId, { height: newHeightB });
    } 
    else if (startHeightA.unit === '%' && startHeightB.unit === '%') {
      // Both rows use percentage - percentage adjustment
      const MIN_HEIGHT_PERCENT = 5; // Minimum height in percentage
      
      // Convert pixel movement to percentage
      const deltaPercent = (deltaPixels / gridElement.offsetHeight) * 100;
      
      // Calculate new heights ensuring minimum height
      const newHeightValueA = Math.max(MIN_HEIGHT_PERCENT, startHeightA.value + deltaPercent);
      const newHeightValueB = Math.max(MIN_HEIGHT_PERCENT, startHeightB.value - deltaPercent);
      
      // Apply the new heights
      const newHeightA = { value: newHeightValueA, unit: '%' as const };
      const newHeightB = { value: newHeightValueB, unit: '%' as const };
      
      ttabs.updateTile(id, { height: newHeightA });
      ttabs.updateTile(nextRowId, { height: newHeightB });
    }
    else if (startHeightA.unit === 'px' && startHeightB.unit === '%') {
      // First row in pixels, second in percentage
      const MIN_HEIGHT_PX = 50;
      const MIN_HEIGHT_PERCENT = 5;
      
      // Adjust pixel row directly
      const newHeightValueA = Math.max(MIN_HEIGHT_PX, startHeightA.value + deltaPixels);
      const newHeightA = { value: newHeightValueA, unit: 'px' as const };
      
      // Update first row
      ttabs.updateTile(id, { height: newHeightA });
      
      // Update second row with percentage adjustment
      const deltaPercent = (deltaPixels / gridElement.offsetHeight) * 100;
      const newHeightValueB = Math.max(MIN_HEIGHT_PERCENT, startHeightB.value - deltaPercent);
      const newHeightB = { value: newHeightValueB, unit: '%' as const };
      ttabs.updateTile(nextRowId, { height: newHeightB });
    }
    else if (startHeightA.unit === '%' && startHeightB.unit === 'px') {
      // First row in percentage, second in pixels
      const MIN_HEIGHT_PERCENT = 5;
      const MIN_HEIGHT_PX = 50;
      
      // Adjust pixel row directly
      const newHeightValueB = Math.max(MIN_HEIGHT_PX, startHeightB.value - deltaPixels);
      const newHeightB = { value: newHeightValueB, unit: 'px' as const };
      
      // Update second row
      ttabs.updateTile(nextRowId, { height: newHeightB });
      
      // Update first row with percentage adjustment
      const deltaPercent = (deltaPixels / gridElement.offsetHeight) * 100;
      const newHeightValueA = Math.max(MIN_HEIGHT_PERCENT, startHeightA.value + deltaPercent);
      const newHeightA = { value: newHeightValueA, unit: '%' as const };
      ttabs.updateTile(id, { height: newHeightA });
    }
    // No more auto unit handling - all rows now use either px or %
  }

  function onMouseUp() {
    isResizing = false;
  }

  // Add a function to generate the style string based on SizeInfo
  function getSizeStyle(size: SizeInfo | undefined): string {
    if (!size) return '';
    
    return `height: ${size.value}${size.unit};`;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if row?.type === "row"}
  <div
    class="ttabs-row {ttabs.theme?.classes?.row || ''}"
    class:is-resizing={isResizing}
    data-tile-id={id}
    style={getSizeStyle(row.height)}
    bind:this={rowElement}
  >
    {#each columns as columnId (columnId)}
      <TileColumn 
        {ttabs} 
        id={columnId} 
        widthPx={columnWidths[columnId] || 0} 
      />
    {/each}

    {#if !isLast}
      <div
        class="row-resizer {ttabs.theme?.classes?.['row-resizer'] || ''}"
        role="button"
        tabindex="0"
        onmousedown={onResizerMouseDown}
      ></div>
    {/if}
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">
    Row not found or invalid type
  </div>
{/if}

<style>
  :global {
    .ttabs-row {
      display: flex;
      flex-direction: row;
      width: 100%;
      overflow: hidden;
      position: relative;
      color: var(--ttabs-text-color);
    }

    .ttabs-row.is-resizing {
      user-select: none;
    }

    .row-resizer {
      position: absolute;
      bottom: var(--ttabs-row-resizer-offset);
      left: 0;
      width: 100%;
      height: var(--ttabs-row-resizer-size);
      cursor: row-resize;
      z-index: 10;
      transition: background-color 150ms ease-in-out;
    }

    .row-resizer:hover,
    .is-resizing .row-resizer {
      background-color: var(--ttabs-resizer-hover-color);
      transition-delay: 200ms;
    }

    .ttabs-error {
      padding: var(--ttabs-error-padding);
      color: var(--ttabs-error-color);
      background-color: var(--ttabs-error-bg);
      border: var(--ttabs-error-border);
      border-radius: none;
    }
  }
</style>
