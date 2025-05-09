<script lang="ts">
  import TilePanel from "./TilePanel.svelte";
  import TileGrid from "./TileGrid.svelte";
  import type { TtabsProps } from "./props";
  import type {
    TileColumn as TileColumnType,
    TileRow,
    TileContent,
    SizeInfo,
  } from "../types/tile-types";
  import type { Component } from "svelte";

  interface ColumnProps extends TtabsProps {
    widthPx?: number;
  }

  let { ttabs, id, widthPx = 0 }: ColumnProps = $props();

  // Get column data
  const column = $derived(ttabs.getTile<TileColumnType>(id));
  const parentId = $derived(column?.parent || null);

  // Check if column width is zero
  const isZeroWidth = $derived(widthPx === 0 || column?.computedSize === 0);

  // Get parent row to access siblings
  const parentRow = $derived(
    parentId ? ttabs.getTile<TileRow>(parentId) : null,
  );
  const columnIndex = $derived(
    parentRow?.type === "row" && parentRow.columns
      ? parentRow.columns.indexOf(id)
      : -1,
  );
  const isLast = $derived(
    columnIndex >= 0 && parentRow?.type === "row" && parentRow.columns
      ? columnIndex === parentRow.columns.length - 1
      : false,
  );

  // Get the child panel, grid, or content
  const childId = $derived(column?.type === "column" ? column.child : null);
  const childTile = $derived(childId ? ttabs.getTile(childId) : null);

  // Component instance for direct content
  let DirectComponent = $state<Component<any> | null>(null);
  let componentProps = $state<Record<string, any>>({});

  $effect(() => {
    // Check if child is content with componentId
    if (childTile?.type === "content" && childTile.componentId) {
      const componentData = ttabs.getContentComponent(childTile.componentId);
      if (componentData) {
        // Set the component to render
        DirectComponent = componentData.component;

        // Create combined props
        componentProps = {
          ...componentData.defaultProps,
          ...childTile.data?.componentProps,
          ttabs,
          contentId: childId,
        };
      } else {
        DirectComponent = null;
      }
    } else {
      DirectComponent = null;
    }
  });

  // Resizing state
  let isResizing = $state(false);
  let startX = $state(0);
  let startWidthA = $state<SizeInfo | null>(null);
  let startWidthB = $state<SizeInfo | null>(null);
  let nextColId = $state<string | null>(null);

  function onResizerMouseDown(e: MouseEvent) {
    if (isLast || !column || !parentRow || !parentRow.columns) return;

    // Store the next column ID
    nextColId = parentRow.columns[columnIndex + 1];
    if (!nextColId) return;

    const nextColumn = ttabs.getTile<TileColumnType>(nextColId);
    if (!nextColumn) return;

    // Store initial values
    startX = e.clientX;
    startWidthA = column.width;
    startWidthB = nextColumn.width;

    isResizing = true;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!isResizing || !column || !nextColId || !startWidthA || !startWidthB) return;

    console.log("Resizing...")

    /*
    // Get a reference to the containing row element
    const rowElement = document.querySelector(
      `[data-tile-id="${parentId}"]`,
    ) as HTMLElement;
    if (!rowElement) return;

    // Calculate pixel movement
    const deltaPixels = e.clientX - startX;
    
    // Handle resizing based on unit types
    if (startWidthA.unit === 'px' && startWidthB.unit === 'px') {
      // Both columns use pixels - direct pixel adjustment
      const MIN_WIDTH_PX = 50; // Minimum width in pixels
      
      // Calculate new widths ensuring minimum width
      const newWidthValueA = Math.max(MIN_WIDTH_PX, startWidthA.value + deltaPixels);
      const newWidthValueB = Math.max(MIN_WIDTH_PX, startWidthB.value - deltaPixels);
      
      // Apply the new widths
      const newWidthA = { value: newWidthValueA, unit: 'px' as const };
      const newWidthB = { value: newWidthValueB, unit: 'px' as const };
      
      ttabs.updateTile(id, { width: newWidthA });
      ttabs.updateTile(nextColId, { width: newWidthB });
    } 
    else if (startWidthA.unit === '%' && startWidthB.unit === '%') {
      // Both columns use percentage - percentage adjustment
      const MIN_WIDTH_PERCENT = 5; // Minimum width in percentage
      
      // Convert pixel movement to percentage
      const deltaPercent = (deltaPixels / rowElement.offsetWidth) * 100;
      
      // Calculate new widths ensuring minimum width
      const newWidthValueA = Math.max(MIN_WIDTH_PERCENT, startWidthA.value + deltaPercent);
      const newWidthValueB = Math.max(MIN_WIDTH_PERCENT, startWidthB.value - deltaPercent);
      
      // Apply the new widths
      const newWidthA = { value: newWidthValueA, unit: '%' as const };
      const newWidthB = { value: newWidthValueB, unit: '%' as const };
      
      ttabs.updateTile(id, { width: newWidthA });
      ttabs.updateTile(nextColId, { width: newWidthB });
    }
    else if (startWidthA.unit === 'px' && startWidthB.unit === '%') {
      // First column in pixels (fixed width), second is percentage-based
      const MIN_WIDTH_PX = 50;
      
      // Adjust pixel column directly with constraints
      const newWidthValueA = Math.max(MIN_WIDTH_PX, startWidthA.value + deltaPixels);
      const newWidthA = { value: newWidthValueA, unit: 'px' as const };
      
      // Update first column
      ttabs.updateTile(id, { width: newWidthA });
      
      // Update second column
      const newWidthValueB = Math.max(0, startWidthB.value - (deltaPixels / rowElement.offsetWidth) * 100);
      const newWidthB = { value: newWidthValueB, unit: '%' as const };
      ttabs.updateTile(nextColId, { width: newWidthB });
    }
    else if (startWidthA.unit === '%' && startWidthB.unit === 'px') {
      // First column is percentage-based, second in pixels
      const MIN_WIDTH_PX = 50;
      
      // Adjust pixel column directly
      const newWidthValueB = Math.max(MIN_WIDTH_PX, startWidthB.value - deltaPixels);
      const newWidthB = { value: newWidthValueB, unit: 'px' as const };
      
      // Update second column
      ttabs.updateTile(nextColId, { width: newWidthB });
      
      // Update first column
      const newWidthValueA = Math.max(0, startWidthA.value + (deltaPixels / rowElement.offsetWidth) * 100);
      const newWidthA = { value: newWidthValueA, unit: '%' as const };
      ttabs.updateTile(id, { width: newWidthA });
    }
    // All other cases are handled by the percentage-percentage case or recalculate layout
    */
  }

  function onMouseUp() {
    isResizing = false;
  }

  // Add a function to generate the style string
  function getWidthStyle(): string {
    // If we have a calculated pixel width, use it
    if (widthPx > 0) {
      return `width: ${widthPx}px;`;
    }
    
    // Fallback to the column's size info
    if (column?.width) {
      return `width: ${column.width.value}${column.width.unit};`;
    }
    
    return '';
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if column?.type === "column"}
  <div
    class="ttabs-column {ttabs.theme?.classes?.column || ''}"
    class:is-resizing={isResizing}
    class:zero-width={isZeroWidth}
    data-tile-id={id}
    style={getWidthStyle()}
  >
    {#if childTile?.type === "panel" && childId !== null}
      <TilePanel {ttabs} id={childId} />
    {:else if childTile?.type === "grid" && childId !== null}
      <TileGrid {ttabs} id={childId} />
    {:else if childTile?.type === "content" && DirectComponent}
      <div
        class="ttabs-direct-content {ttabs.theme?.classes?.['direct-content'] ||
          ''}"
      >
        <DirectComponent {...componentProps} />
      </div>
    {/if}

    {#if !isLast && !isZeroWidth}
      <div
        class="column-resizer {ttabs.theme?.classes?.['column-resizer'] || ''}"
        role="button"
        tabindex="0"
        onmousedown={onResizerMouseDown}
      ></div>
    {/if}
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">
    Column not found or invalid type
  </div>
{/if}

<style>
  :global {
    .ttabs-column {
      flex-shrink: 0;
      overflow: hidden;
      border-right: var(--ttabs-column-border);
      position: relative;
      color: var(--ttabs-text-color);
      background-color: var(--ttabs-panel-bg);
    }

    .ttabs-column.zero-width {
      border-right: none;
    }

    .ttabs-column:last-child {
      border-right: none;
    }

    .ttabs-column.is-resizing {
      user-select: none;
    }

    .ttabs-direct-content {
      width: 100%;
      height: 100%;
      overflow: auto;
      color: var(--ttabs-content-text-color);
      background-color: var(--ttabs-content-bg);
    }

    .column-resizer {
      position: absolute;
      top: 0;
      right: var(--ttabs-column-resizer-offset);
      width: var(--ttabs-column-resizer-size);
      height: 100%;
      cursor: col-resize;
      z-index: 10;
      transition: background-color 150ms ease-in-out;
    }

    .column-resizer:hover,
    .is-resizing .column-resizer {
      background-color: var(--ttabs-resizer-hover-color, rgba(74, 108, 247, 0.6));
      transition-delay: 200ms;
    }

    .ttabs-error {
      padding: var(--ttabs-error-padding);
      color: var(--ttabs-error-color);
      background-color: var(--ttabs-error-bg);
      border: var(--ttabs-error-border);
      border-radius: var(--ttabs-error-border-radius);
    }
  }
</style>
