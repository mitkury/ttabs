<script lang="ts">
  import RootTile from "$lib/comps/tiles/RootTile.svelte";
  
  let rootTileComponent: RootTile;
  
  function resetLayout() {
    if (rootTileComponent) {
      rootTileComponent.resetLayout();
    }
  }
</script>

<div class="app-container">
  <header>
    <h1>ttabs example</h1>
    <div class="actions">
      <button on:click={resetLayout}>Reset Layout</button>
    </div>
  </header>
  
  <main>
    <RootTile bind:this={rootTileComponent} />
  </main>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  main {
    flex: 1;
    overflow: hidden;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #3a5ce7;
  }
</style>
