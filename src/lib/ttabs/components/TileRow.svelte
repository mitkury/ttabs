<script lang="ts">
  import TileColumn from './TileColumn.svelte';
  import type { TtabsProps } from './props';
  import type { TileRow as TileRowType, TileGrid } from '../types/tile-types';
  
  let { ttabs, id }: TtabsProps = $props();
  
  // Get row data
  const row = $derived(ttabs.getTile<TileRowType>(id));
  const parentId = $derived(row?.parent || null);
  
  // Get parent grid to access siblings
  const parentGrid = $derived(parentId ? ttabs.getTile<TileGrid>(parentId) : null);
  const rowIndex = $derived(parentGrid?.type === 'grid' && parentGrid.rows ? 
    parentGrid.rows.indexOf(id) : -1);
  const isLast = $derived(rowIndex >= 0 && parentGrid?.type === 'grid' && parentGrid.rows ? 
    rowIndex === parentGrid.rows.length - 1 : false);
  
  // Get columns
  const columns = $derived(row?.type === 'row' ? row.columns : []);
  
  // Resizing state
  let isResizing = $state(false);
  let startY = $state(0);
  let startHeightA = $state(0);
  let startHeightB = $state(0);
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
    if (!isResizing || !row || !nextRowId) return;
    
    // Get a reference to the containing grid element
    const gridElement = document.querySelector(
      `[data-tile-id="${parentId}"]`
    ) as HTMLElement;
    if (!gridElement) return;
    
    // Calculate percentage based on grid height and mouse movement
    const deltaPixels = e.clientY - startY;
    const deltaPercent = (deltaPixels / gridElement.offsetHeight) * 100;
    
    // Ensure minimum height
    const MIN_HEIGHT = 5;
    const maxDeltaDown = startHeightA - MIN_HEIGHT;
    const maxDeltaUp = startHeightB - MIN_HEIGHT;
    
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
    const newHeightA = startHeightA + limitedDelta;
    const newHeightB = startHeightB - limitedDelta;
    
    ttabs.updateTile(id, { height: newHeightA });
    ttabs.updateTile(nextRowId, { height: newHeightB });
  }
  
  function onMouseUp() {
    isResizing = false;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

{#if row?.type === 'row'}
  <div 
    class="ttabs-row {ttabs.theme?.classes?.row || ''}" 
    class:is-resizing={isResizing}
    data-tile-id={id} 
    style="height: {row.height}%;"
  >
    {#each columns as columnId (columnId)}
      <TileColumn ttabs={ttabs} id={columnId} />
    {/each}
    
    {#if !isLast}
      <div class="row-resizer {ttabs.theme?.classes?.['row-resizer'] || ''}" on:mousedown={onResizerMouseDown}></div>
    {/if}
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">
    Row not found or invalid type
  </div>
{/if}

<style>
  .ttabs-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    overflow: hidden;
    position: relative;
  }
  
  .ttabs-row.is-resizing {
    user-select: none;
  }
  
  .row-resizer {
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: row-resize;
    z-index: 10;
  }
  
  .row-resizer:hover,
  .is-resizing .row-resizer {
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