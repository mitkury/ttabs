<script lang="ts">
  import TileGrid from './TileGrid.svelte';
  import type { Ttabs } from '../Ttabs.svelte.ts';
  
  let { ttabs }: { ttabs: Ttabs } = $props();
</script>

<div class="ttabs-root">
  {#if ttabs.rootGridId}
    <TileGrid {ttabs} id={ttabs.rootGridId} />
  {:else}
    <div class="ttabs-empty-state">
      <button onclick={() => ttabs.createDefaultLayout()}>
        Create Default Layout
      </button>
    </div>
  {/if}
</div>

<style>
  .ttabs-root {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .ttabs-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }
  
  button {
    padding: 8px 16px;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    opacity: 0.9;
  }
</style> 