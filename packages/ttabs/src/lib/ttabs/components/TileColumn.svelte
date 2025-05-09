<script lang="ts">
  import TilePanel from "./TilePanel.svelte";
  import TileGrid from "./TileGrid.svelte";
  import type { TtabsProps } from "./props";
  import type {
    TileColumnState,
    TileRowState,
    SizeInfo,
  } from "../types/tile-types";
  import type { Component } from "svelte";

  interface ColumnProps extends TtabsProps {
    widthPx: number;
  }

  let { ttabs, id, widthPx }: ColumnProps = $props();

  const widthStyle = $derived(`width: ${widthPx}px;`);

  // Get column data
  const column = $derived(ttabs.getTile<TileColumnState>(id));
  const parentId = $derived(column?.parent || null);

  // Check if column width is zero
  const isZeroWidth = $derived(widthPx === 0);

  // Get parent row to access siblings
  const parentRow = $derived(
    parentId ? ttabs.getTile<TileRowState>(parentId) : null
  );
  const columnIndex = $derived(
    parentRow?.type === "row" && parentRow.columns
      ? parentRow.columns.indexOf(id)
      : -1
  );
  const isLast = $derived(
    columnIndex >= 0 && parentRow?.type === "row" && parentRow.columns
      ? columnIndex === parentRow.columns.length - 1
      : false
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

    const nextColumn = ttabs.getTile<TileColumnState>(nextColId);
    if (!nextColumn) return;

    // Store initial values
    startX = e.clientX;
    startWidthA = column.width;
    startWidthB = nextColumn.width;

    isResizing = true;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!isResizing || !column || !nextColId || !startWidthA || !startWidthB)
      return;

    if (!parentId) return;

    // Get a reference to the containing row element
    const rowElement = document.querySelector(
      `[data-tile-id="${parentId}"]`
    ) as HTMLElement;
    if (!rowElement) return;

    // Calculate pixel movement from the start position
    const deltaPixels = e.clientX - startX;

    // Get the next column
    const nextColumn = ttabs.getTile<TileColumnState>(nextColId);
    if (!nextColumn) return;

    // Get the row's total width
    const rowWidth = rowElement.offsetWidth;

    // Calculate original widths in pixels based on startWidth values
    let originalWidthAPixels: number;
    let originalWidthBPixels: number;

    if (startWidthA.unit === "px") {
      originalWidthAPixels = startWidthA.value;
    } else { // percentage
      originalWidthAPixels = (startWidthA.value / 100) * rowWidth;
    }

    if (startWidthB.unit === "px") {
      originalWidthBPixels = startWidthB.value;
    } else { // percentage
      originalWidthBPixels = (startWidthB.value / 100) * rowWidth;
    }

    // Calculate new widths in pixels with constraints, based on original widths
    const MIN_WIDTH_PX = 50; // Minimum width in pixels
    const newWidthAPixels = Math.max(MIN_WIDTH_PX, originalWidthAPixels + deltaPixels);
    const newWidthBPixels = Math.max(MIN_WIDTH_PX, originalWidthBPixels - deltaPixels);

    // Update the columns based on their original unit types
    if (startWidthA.unit === "px") {
      // Update column A with pixel value
      ttabs.updateTile(id, {
        width: { value: newWidthAPixels, unit: "px" as const },
      });
    } else if (startWidthA.unit === "%") {
      // Convert pixels to percentage for column A
      const newPercentageA = (newWidthAPixels / rowWidth) * 100;
      ttabs.updateTile(id, {
        width: { value: newPercentageA, unit: "%" as const },
      });
    }

    if (startWidthB.unit === "px") {
      // Update column B with pixel value
      ttabs.updateTile(nextColId, {
        width: { value: newWidthBPixels, unit: "px" as const },
      });
    } else if (startWidthB.unit === "%") {
      // Convert pixels to percentage for column B
      const newPercentageB = (newWidthBPixels / rowWidth) * 100;
      ttabs.updateTile(nextColId, {
        width: { value: newPercentageB, unit: "%" as const },
      });
    }
  }

  function onMouseUp() {
    isResizing = false;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if column?.type === "column"}
  <div
    class="ttabs-column {ttabs.theme?.classes?.column || ''}"
    class:is-resizing={isResizing}
    class:zero-width={isZeroWidth}
    data-tile-id={id}
    style={widthStyle}
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
      background-color: var(
        --ttabs-resizer-hover-color,
        rgba(74, 108, 247, 0.6)
      );
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
