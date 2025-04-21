<script lang="ts">
  import TileColumn from "./TileColumn.svelte";
  import type { TtabsProps } from "./props";
  import type { TileRow as TileRowType, TileGrid, SizeInfo } from "../types/tile-types";

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

    // Only handle percentage units for now in the resize logic
    if (startHeightA.unit === '%' && startHeightB.unit === '%') {
      // Calculate percentage based on grid height and mouse movement
      const deltaPixels = e.clientY - startY;
      const deltaPercent = (deltaPixels / gridElement.offsetHeight) * 100;

      // Ensure minimum height
      const MIN_HEIGHT = 5;
      const maxDeltaDown = startHeightA.value - MIN_HEIGHT;
      const maxDeltaUp = startHeightB.value - MIN_HEIGHT;

      // Limit delta to keep both rows above minimum height
      let limitedDelta = deltaPercent;
      if (deltaPercent > 0) {
        // Moving down (expanding this row)
        limitedDelta = Math.min(deltaPercent, maxDeltaUp);
      } else {
        // Moving up (shrinking this row)
        limitedDelta = Math.max(deltaPercent, -maxDeltaDown);
      }

      // Apply the new heights
      const newHeightA = {
        value: startHeightA.value + limitedDelta,
        unit: startHeightA.unit
      };
      const newHeightB = {
        value: startHeightB.value - limitedDelta,
        unit: startHeightB.unit
      };

      ttabs.updateTile(id, { height: newHeightA });
      ttabs.updateTile(nextRowId, { height: newHeightB });
    }
    // Handle other unit combinations later, or trigger recalculateLayout
  }

  function onMouseUp() {
    isResizing = false;
  }

  // Add a function to generate the style string based on SizeInfo
  function getSizeStyle(size: SizeInfo | undefined): string {
    if (!size) return '';
    
    if (size.unit === 'auto') {
      return 'flex: 1; height: auto;';
    }
    
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
  >
    {#each columns as columnId (columnId)}
      <TileColumn {ttabs} id={columnId} />
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
    }

    .row-resizer:hover,
    .is-resizing .row-resizer {
      background-color: var(--ttabs-resizer-hover-color);
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
