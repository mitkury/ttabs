<script lang="ts">
  import { createTtabs, Ttabs, TtabsRoot, LocalStorageAdapter } from "ttabs-svelte";
  import { onMount } from "svelte";
  import SimpleTextComponent from "./SimpleTextComponent.svelte";

  // Create a storage adapter
  const storageAdapter = new LocalStorageAdapter("ttabs-simple-demo", 500);
  
  // First, try to load saved state
  const savedData = storageAdapter.load();
  
  // Initialize ttabs with the loaded state
  const ttabs = createTtabs({
    // Use saved tiles if available, otherwise use empty state
    tiles: savedData?.tiles,
    // Use saved focused tab if available
    focusedTab: savedData?.focusedTab
  });
  
  // Register the text component
  ttabs.registerComponent('text', SimpleTextComponent);
  
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
    
    const rootId = ttabs.rootGridId;
    
    // Create a main row
    const mainRowId = ttabs.addRow(rootId, 100);
    
    // Create a column
    const mainColumnId = ttabs.addColumn(mainRowId, 100);
    
    // Create a panel
    const mainPanelId = ttabs.addPanel(mainColumnId);
    
    // Create a default tab with welcome text
    const tabId = ttabs.addTab(mainPanelId, 'Welcome', true);
    
    // Set the focused tab to the new tab
    ttabs.setFocusedActiveTab(tabId);
    
    // Find the tab content and update it
    const tab = ttabs.getTile(tabId);
    if (tab?.type === 'tab' && tab.content) {
      ttabs.updateTile(tab.content, {
        data: {
          text: "Welcome to ttabs simple example!\n\nThis is a basic demo showing how ttabs layout system works with storage."
        }
      });
    }
  }
  
  // Function to create a new tab
  function addTab() {
    console.log("Add Tab clicked");
    
    // Find a panel to add the tab to
    let panelId = null;
    
    // Try to get all panels
    const allPanels = Object.values(ttabs.getTiles())
      .filter(tile => tile.type === 'panel');
    
    console.log("Available panels:", allPanels.length);
    
    // First try to use the active panel
    const activePanel = ttabs.getActivePanel();
    if (activePanel && ttabs.getTile(activePanel)) {
      panelId = activePanel;
      console.log("Using active panel:", panelId);
    } 
    // If no active panel, find the first panel
    else if (allPanels.length > 0) {
      panelId = allPanels[0].id;
      console.log("Using first available panel:", panelId);
    } 
    // If no panels at all, create a default layout
    else {
      console.log("No panels found, creating default layout");
      resetLayout();
      
      // Try to find a panel again after reset
      const newPanels = Object.values(ttabs.getTiles())
        .filter(tile => tile.type === 'panel');
      
      if (newPanels.length > 0) {
        panelId = newPanels[0].id;
        console.log("Using panel from new layout:", panelId);
      } else {
        console.error("Failed to create panels, cannot add tab");
        return;
      }
    }
    
    if (!panelId) {
      console.error("No panel ID found, aborting tab creation");
      return;
    }
    
    // Create a new tab with timestamp in the name
    const tabName = "New Tab " + new Date().toLocaleTimeString();
    console.log("Creating tab with name:", tabName, "in panel:", panelId);
    
    try {
      // Create the tab
      const tabId = ttabs.addTab(panelId, tabName, true);
      console.log("Created tab with ID:", tabId);
      
      // Get the tab and set its content
      const tab = ttabs.getTile(tabId);
      if (tab?.type === 'tab' && tab.content) {
        // Update the content
        ttabs.updateTile(tab.content, {
          data: {
            text: `Content for ${tabName}\nCreated at ${new Date().toISOString()}`
          }
        });
        
        // Set as focused tab
        ttabs.setFocusedActiveTab(tabId);
        console.log("Tab created successfully");
      } else {
        console.error("Failed to get content for new tab");
      }
    } catch (err) {
      console.error("Error creating tab:", err);
    }
  }
</script>

<div class="example-container">
  <header>
    <h1>ttabs simple example</h1>
    <div class="actions">
      <button onclick={resetLayout}>Reset Layout</button>
      <button onclick={addTab}>Add Tab</button>
    </div>
  </header>
  
  <main>
    <TtabsRoot {ttabs} />
  </main>
</div>

<style>
  .example-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #3a5ce7;
  }
  
  main {
    flex: 1;
    overflow: hidden;
  }
</style> 