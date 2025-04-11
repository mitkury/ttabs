<script lang="ts">
  import { createTtabs, TtabsRoot, LocalStorageAdapter } from "ttabs-svelte";
  import { onMount } from "svelte";
  import Example from "$lib/comps/Example.svelte";
  import SimpleExample from "$lib/comps/SimpleExample.svelte";
  
  // Create a storage adapter
  const storageAdapter = new LocalStorageAdapter("ttabs-demo", 500);
  
  // First, try to load saved state
  const savedData = storageAdapter.load();
  
  // Initialize ttabs with the loaded state
  const ttabs = createTtabs({
    // Use saved tiles if available, otherwise use empty state
    tiles: savedData?.tiles,
    // Use saved focused tab if available
    focusedTab: savedData?.focusedTab
  });
  
  // Connect the storage adapter to save changes
  const unsubscribe = ttabs.subscribe((state) => {
    storageAdapter.save(state);
  });
  
  // Register cleanup on component destroy
  onMount(() => {
    return () => {
      // Unsubscribe from state changes when component is destroyed
      unsubscribe();
    };
  });
  
  // Function to reset the layout
  function resetLayout() {
    ttabs.resetState();
    ttabs.createDefaultLayout();
  }
  
  // Function to create a new tab
  function addTab() {
    const panelId = ttabs.getActivePanel();
    if (panelId) {
      const tabId = ttabs.addTab(panelId, "New Tab " + new Date().toLocaleTimeString());
      ttabs.setFocusedActiveTab(tabId);
    }
  }
  
  let exampleType = $state("simple"); // "simple" or "advanced"
  
  function switchExample(type: "simple" | "advanced") {
    exampleType = type;
  }
</script>

<div class="container">
  <div class="example-switcher">
    <button 
      class:active={exampleType === "simple"}
      on:click={() => switchExample("simple")}
    >
      Simple Example
    </button>
    <button 
      class:active={exampleType === "advanced"}
      on:click={() => switchExample("advanced")}
    >
      Advanced Example
    </button>
  </div>
  
  <div class="example-content">
    {#if exampleType === "simple"}
      <SimpleExample />
    {:else if exampleType === "advanced"}
      <Example />
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
  }
  
  .example-switcher {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: #1e293b;
    gap: 1rem;
  }
  
  .example-switcher button {
    padding: 0.5rem 1.5rem;
    background: #475569;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .example-switcher button:hover {
    background: #64748b;
  }
  
  .example-switcher button.active {
    background: #3b82f6;
  }
  
  .example-content {
    flex: 1;
    overflow: hidden;
  }
  
  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>