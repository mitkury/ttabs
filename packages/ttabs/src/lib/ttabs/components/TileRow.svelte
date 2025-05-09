<script lang="ts">
  import TileColumn from "./TileColumn.svelte";
  import type { TtabsProps } from "./props";
  import type {
    TileRowState,
    TileGridState,
    TileColumnState,
    SizeInfo,
  } from "../types/tile-types";
  import { calculateSizes } from "../utils/size-utils";
  import { onMount } from "svelte";
  import { areTileArraysEqual } from "../utils/tile-comparisons";

  interface RowProps extends TtabsProps {
    heightPx?: number;
  }

  let { ttabs, id, heightPx }: RowProps = $props();
  
  const heightStyle = $derived(heightPx !== undefined ? `height: ${heightPx}px;` : "");

  // Get row data
  let row: TileRowState | undefined = $state();
  let columnTiles: TileColumnState[] = $state([]);
  const parentId = $derived(row?.parent || null);

  type SizedColumns = {
    id: string;
    widthPx: number;
  };

  // We construct it out of two states: columnTiles and columnWidths
  // Those states update independently that is why we make sure that
  // we render only when they're ready (of the same length, assuming that they
  // address the same columns)
  const sizedColumns: SizedColumns[] = $derived.by(() => {
    if (columnTiles.length !== columnWidths.length) {
      // This happens when the html element we use to calculate the width is not ready
      return [];
    }

    const arr: SizedColumns[] = [];

    for (let i = 0; i < columnTiles.length; i++) {
      arr[i] = {
        id: columnTiles[i].id,
        widthPx: columnWidths[i],
      };
    }

    return arr;
  });

  // Get parent grid to access siblings
  const parentGrid = $derived(
    parentId ? ttabs.getTile<TileGridState>(parentId) : null
  );
  const rowIndex = $derived(
    parentGrid?.type === "grid" && parentGrid.rows
      ? parentGrid.rows.indexOf(id)
      : -1
  );
  const isLast = $derived(
    rowIndex >= 0 && parentGrid?.type === "grid" && parentGrid.rows
      ? rowIndex === parentGrid.rows.length - 1
      : false
  );

  // Element reference for width calculations
  let rowElement = $state<HTMLElement | null>(null);

  // Column width calculations
  let columnWidths: number[] = $state([]);
  let resizeObserver: ResizeObserver | null = null;

  function getColumnWidths(columnTiles: TileColumnState[]): number[] {
    if (!rowElement || columnTiles.length === 0) return [];

    const rowWidth = rowElement.offsetWidth;
    const columnSizeInfos = columnTiles
      .map((column) => {
        return { id: column.id, size: column.width };
      })
      .filter(Boolean) as Array<{ id: string; size: SizeInfo }>;

    const calculatedSizes = calculateSizes(rowWidth, columnSizeInfos);

    // Create a map of column ID to computed pixel width
    const newWidths = calculatedSizes.map((s) => s.computedSize);

    return newWidths;
  }

  function handleResize() {
    requestAnimationFrame(() => {
      columnWidths = getColumnWidths(columnTiles);
    });
  }

  onMount(() => {
    const sub = ttabs.subscribe((state) => {
      const tile = state[id];
      if (!tile) {
        return;
      }

      row = tile as TileRowState;

      const updColumns: TileColumnState[] = [];
      for (let i = 0; i < row.columns.length; i++) {
        const column = ttabs.getColumn(row.columns[i]);
        updColumns.push(column);
      }

      // We do this so we don't overwhelm our reactive state
      if (!areTileArraysEqual(columnTiles, updColumns)) {
        columnTiles = updColumns;
        columnWidths = getColumnWidths(updColumns);
      }
    });

    return () => {
      sub();
    };
  });

  $effect(() => {
    //console.log(columnTiles);
  });

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

    // Cleanup when component is destroyed or rowElement changes
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    };
  });

  let isResizing = $state(false);
  let startY = 0;
  let startHeightA: SizeInfo | null = null;
  let startHeightB: SizeInfo | null = null;
  let nextRowId: string | null = null;

  function onResizerMouseDown(e: MouseEvent) {
    if (isLast || !row || !parentGrid || !parentGrid.rows) return;

    nextRowId = parentGrid.rows[rowIndex + 1];
    if (!nextRowId) return;

    const nextRow = ttabs.getTile<TileRowState>(nextRowId);
    if (!nextRow) return;

    // Store initial values
    startY = e.clientY;
    startHeightA = row.height;
    startHeightB = nextRow.height;

    isResizing = true;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!isResizing || !row || !nextRowId || !startHeightA || !startHeightB)
      return;

    if (!parentId) return;

    // Get a reference to the containing grid element
    const gridElement = document.querySelector(
      `[data-tile-id="${parentId}"]`
    ) as HTMLElement;
    if (!gridElement) return;

    // Calculate pixel movement from the start position
    const deltaPixels = e.clientY - startY;

    // Get the next row
    const nextRow = ttabs.getTile<TileRowState>(nextRowId);
    if (!nextRow) return;

    // Get the grid's total height
    const gridHeight = gridElement.offsetHeight;

    // Calculate original heights in pixels based on startHeight values
    let originalHeightAPixels: number;
    let originalHeightBPixels: number;

    if (startHeightA.unit === "px") {
      originalHeightAPixels = startHeightA.value;
    } else { // percentage
      originalHeightAPixels = (startHeightA.value / 100) * gridHeight;
    }

    if (startHeightB.unit === "px") {
      originalHeightBPixels = startHeightB.value;
    } else { // percentage
      originalHeightBPixels = (startHeightB.value / 100) * gridHeight;
    }

    // Calculate new heights in pixels with constraints, based on original heights
    const MIN_HEIGHT_PX = 50; // Minimum height in pixels
    const newHeightAPixels = Math.max(MIN_HEIGHT_PX, originalHeightAPixels + deltaPixels);
    const newHeightBPixels = Math.max(MIN_HEIGHT_PX, originalHeightBPixels - deltaPixels);

    // Update the rows based on their original unit types
    if (startHeightA.unit === "px") {
      // Update row A with pixel value
      ttabs.updateTile(id, {
        height: { value: newHeightAPixels, unit: "px" as const },
      });
    } else if (startHeightA.unit === "%") {
      // Convert pixels to percentage for row A
      const newPercentageA = (newHeightAPixels / gridHeight) * 100;
      ttabs.updateTile(id, {
        height: { value: newPercentageA, unit: "%" as const },
      });
    }

    if (startHeightB.unit === "px") {
      // Update row B with pixel value
      ttabs.updateTile(nextRowId, {
        height: { value: newHeightBPixels, unit: "px" as const },
      });
    } else if (startHeightB.unit === "%") {
      // Convert pixels to percentage for row B
      const newPercentageB = (newHeightBPixels / gridHeight) * 100;
      ttabs.updateTile(nextRowId, {
        height: { value: newPercentageB, unit: "%" as const },
      });
    }
  }

  function onMouseUp() {
    isResizing = false;
  }

  // Add a function to generate the style string based on SizeInfo
  function getSizeStyle(size: SizeInfo | undefined): string {
    if (!size) return "";

    return `height: ${size.value}${size.unit};`;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if row?.type === "row"}
  <div
    class="ttabs-row {ttabs.theme?.classes?.row || ''}"
    class:is-resizing={isResizing}
    data-tile-id={id}
    style={heightPx !== undefined ? heightStyle : getSizeStyle(row.height)}
    bind:this={rowElement}
  >
    {#each sizedColumns as column (column.id)}
      <TileColumn {ttabs} id={column.id} widthPx={column.widthPx} />
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
