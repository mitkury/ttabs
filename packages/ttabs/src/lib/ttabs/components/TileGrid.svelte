<script lang="ts">
  import TileRow from "./TileRow.svelte";
  import type { TtabsProps } from "./props";
  import type {
    TileGridState,
    TileRowState,
    SizeInfo,
  } from "../types/tile-types";
  import { calculateSizes } from "../utils/size-utils";
  import { onMount } from "svelte";
  import { areTileArraysEqual } from "../utils/tile-comparisons";

  type SizedRows = {
    id: string;
    heightPx: number;
  };

  let { ttabs, id }: TtabsProps = $props();

  let grid: TileGridState | undefined = $state();
  let rowTiles: TileRowState[] = $state([]);
  let gridElement = $state<HTMLElement | null>(null);
  let rowHeights: number[] = $state([]);
  let resizeObserver: ResizeObserver | null = null;

  // We construct it out of two states: rowTiles and rowHeights
  // Those states update independently that is why we make sure that
  // we render only when they're ready (of the same length, assuming that they
  // address the same rows)
  const sizedRows: SizedRows[] = $derived.by(() => {
    if (rowTiles.length !== rowHeights.length) {
      // This happens when the html element we use to calculate the height is not ready
      return [];
    }

    const arr: SizedRows[] = [];

    for (let i = 0; i < rowTiles.length; i++) {
      arr[i] = {
        id: rowTiles[i].id,
        heightPx: rowHeights[i],
      };
    }

    return arr;
  });

  function getRowHeights(rowTiles: TileRowState[]): number[] {
    if (!gridElement || rowTiles.length === 0) return [];

    const gridHeight = gridElement.offsetHeight;
    const rowSizeInfos = rowTiles
      .map((row) => {
        return { id: row.id, size: row.height };
      })
      .filter(Boolean) as Array<{ id: string; size: SizeInfo }>;

    const calculatedSizes = calculateSizes(gridHeight, rowSizeInfos);

    // Create a map of row ID to computed pixel height
    const newHeights = calculatedSizes.map((s) => s.computedSize);

    return newHeights;
  }

  function handleResize() {
    requestAnimationFrame(() => {
      rowHeights = getRowHeights(rowTiles);
    });
  }

  onMount(() => {
    const sub = ttabs.subscribe((state) => {
      const tile = state[id];
      if (!tile) {
        return;
      }

      grid = tile as TileGridState;

      const updRows: TileRowState[] = [];
      for (let i = 0; i < grid.rows.length; i++) {
        const row = ttabs.getRow(grid.rows[i]);
        updRows.push(row);
      }

      // We do this so we don't overwhelm our reactive state
      if (!areTileArraysEqual(rowTiles, updRows)) {
        rowTiles = updRows;
        rowHeights = getRowHeights(updRows);
      }
    });

    return () => {
      sub();
    };
  });

  $effect(() => {
    if (!gridElement) return;

    // Clean up any existing observer
    if (resizeObserver) {
      resizeObserver.disconnect();
    }

    // Create a new ResizeObserver
    resizeObserver = new ResizeObserver(handleResize);

    // Start observing the grid element
    resizeObserver.observe(gridElement);

    // Cleanup when component is destroyed or gridElement changes
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    };
  });
</script>

{#if grid?.type === "grid"}
  <div
    class="ttabs-grid {ttabs.theme?.classes?.grid || ''}"
    data-tile-id={id}
    bind:this={gridElement}
  >
    {#each sizedRows as row (row.id)}
      <TileRow {ttabs} id={row.id} heightPx={row.heightPx} />
    {/each}
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">
    Grid not found or invalid type
  </div>
{/if}

<style>
  :global {
    .ttabs-grid {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: var(--ttabs-grid-bg, #f0f0f0);
      border: var(--ttabs-grid-border, 1px solid #ddd);
      color: var(--ttabs-text-color, inherit);
      border-radius: none;
    }

    .ttabs-error {
      padding: var(--ttabs-error-padding, 1rem);
      color: var(--ttabs-error-color, tomato);
      background-color: var(--ttabs-error-bg, #fff5f5);
      border: var(--ttabs-error-border, 1px solid tomato);
      border-radius: none;
    }
  }
</style>
