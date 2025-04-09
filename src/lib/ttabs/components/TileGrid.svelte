<script lang="ts">
  import TileRow from './TileRow.svelte';
  import type { TtabsProps } from './props';
  
  let { ttabs, id }: TtabsProps = $props();
  
  // Get the grid data
  const grid = $derived(ttabs.getTile(id));
  
  // Get child rows
  const rows = $derived(grid?.type === 'grid' ? grid.rows : []);
</script>

{#if grid?.type === 'grid'}
  <div class="ttabs-grid" data-tile-id={id}>
    {#each rows as rowId (rowId)}
      <TileRow ttabs={ttabs} id={rowId} />
    {/each}
  </div>
{:else}
  <div class="ttabs-error">
    Grid not found or invalid type
  </div>
{/if}

<style>
  .ttabs-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--ttabs-grid-bg, #f0f0f0);
    border: var(--ttabs-grid-border, 1px solid #ddd);
  }
  
  .ttabs-error {
    padding: 1rem;
    color: tomato;
    background-color: #fff5f5;
    border: 1px solid tomato;
    border-radius: 4px;
  }
</style> 