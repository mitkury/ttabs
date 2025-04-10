<script lang="ts">
  import TilePanel from "./TilePanel.svelte";
  import TileGrid from "./TileGrid.svelte";
  import type { TtabsProps } from "./props";
  import type {
    TileColumn as TileColumnType,
    TileRow,
    TileContent,
  } from "../types/tile-types";
  import type { Component } from "svelte";

  let { ttabs, id }: TtabsProps = $props();

  // Get column data
  const column = $derived(ttabs.getTile<TileColumnType>(id));
  const parentId = $derived(column?.parent || null);

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
  let startWidthA = $state(0);
  let startWidthB = $state(0);
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
    if (!isResizing || !column || !nextColId) return;

    // Get a reference to the containing row element
    const rowElement = document.querySelector(
      `[data-tile-id="${parentId}"]`,
    ) as HTMLElement;
    if (!rowElement) return;

    // Calculate percentage based on row width and mouse movement
    const deltaPixels = e.clientX - startX;
    const deltaPercent = (deltaPixels / rowElement.offsetWidth) * 100;

    // Ensure minimum width
    const MIN_WIDTH = 5;
    const maxDeltaRight = startWidthA - MIN_WIDTH;
    const maxDeltaLeft = startWidthB - MIN_WIDTH;

    // Limit delta to keep both columns above minimum width
    let limitedDelta = deltaPercent;
    if (deltaPercent > 0) {
      // Moving right (expanding this column)
      limitedDelta = Math.min(deltaPercent, maxDeltaLeft);
    } else {
      // Moving left (shrinking this column)
      limitedDelta = Math.max(deltaPercent, -maxDeltaRight);
    }

    // Apply the new widths
    const newWidthA = startWidthA + limitedDelta;
    const newWidthB = startWidthB - limitedDelta;

    ttabs.updateTile(id, { width: newWidthA });
    ttabs.updateTile(nextColId, { width: newWidthB });
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
    data-tile-id={id}
    style="width: {column.width}%;"
  >
    {#if childTile?.type === "panel" && childId !== null}
      <TilePanel {ttabs} id={childId} />
    {:else if childTile?.type === "grid" && childId !== null}
      <TileGrid {ttabs} id={childId} />
    {:else if childTile?.type === "content" && DirectComponent}
      <div class="ttabs-direct-content {ttabs.theme?.classes?.['direct-content'] || ''}">
        <DirectComponent {...componentProps} />
      </div>
    {/if}

    {#if !isLast}
      <div
        class="column-resizer {ttabs.theme?.classes?.['column-resizer'] || ''}"
        role="separator"
        onmousedown={onResizerMouseDown}
      ></div>
    {/if}
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">Column not found or invalid type</div>
{/if}

<style>
  .ttabs-column {
    flex-shrink: 0;
    overflow: hidden;
    border-right: var(--ttabs-column-border, 1px solid #ddd);
    position: relative;
    color: var(--ttabs-text-color, inherit);
    background-color: var(--ttabs-panel-bg, inherit);
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
    color: var(--ttabs-content-text-color, inherit);
    background-color: var(--ttabs-content-bg, inherit);
  }

  .column-resizer {
    position: absolute;
    top: 0;
    right: -3px;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 10;
  }

  .column-resizer:hover,
  .is-resizing .column-resizer {
    background-color: var(--ttabs-resizer-hover-color, rgba(74, 108, 247, 0.3));
  }

  .ttabs-error {
    padding: 1rem;
    color: var(--ttabs-error-color, tomato);
    background-color: var(--ttabs-error-bg, #fff5f5);
    border: var(--ttabs-error-border, 1px solid tomato);
    border-radius: 4px;
  }
</style>
