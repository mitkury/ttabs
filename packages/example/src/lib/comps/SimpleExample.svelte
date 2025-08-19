<script lang="ts">
  import { createTtabs, TTabsRoot, LocalStorageAdapter } from "ttabs-svelte";
  import { onMount } from "svelte";
  import SimpleTextComponent from "./SimpleTextComponent.svelte";

  // Create a storage adapter
  const storageAdapter = new LocalStorageAdapter("ttabs-simple-demo", 500);

  // First, try to load saved state
  const savedData = storageAdapter.load();

  // Initialize ttabs with the loaded state using the new object-oriented API
  const ttabs = $state(
    createTtabs({
      // Use saved tiles if available, otherwise use empty state
      tiles: savedData?.tiles,
      // Use saved focused tab if available
      focusedTab: savedData?.focusedTab,
    })
  );

  // Register the text component
  ttabs.registerComponent("text", SimpleTextComponent);

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

  // Function to reset the layout using the new object-oriented API
  function resetLayout() {
    console.log("Resetting layout...");

    // Clear all tiles and create a fresh layout
    ttabs.resetTiles();

    // Create a new grid and build the layout using method chaining
    const grid = ttabs.newGrid();
    const row = grid.newRow();
    const column = row.newColumn();
    const panel = column.newPanel();
    
    // Create the welcome tab
    const tab = panel.newTab("Welcome", true);
    tab.setComponent("text", {
      text: "Welcome to ttabs simple example!\n\nThis is a basic demo showing how ttabs layout system works with storage.",
    });
    tab.setFocused();
  }

  // Function to create a new tab
  function addTab() {
    console.log("Add Tab clicked");

    // Try to get the active panel using the new API
    let panel = null;
    const activePanel = ttabs.getActivePanel();

    if (activePanel) {
      // If we have an active panel, use it
      panel = ttabs.getPanelObject(activePanel);
      console.log("Using active panel:", panel.id);
    } else {
      // If no active panel, find the first panel
      const allPanels = Object.values(ttabs.getTiles()).filter(
        (tile) => tile.type === "panel"
      );

      if (allPanels.length > 0) {
        panel = ttabs.getPanelObject(allPanels[0].id);
        console.log("Using first available panel:", panel.id);
      } else {
        // If no panels at all, create a default layout
        console.log("No panels found, creating default layout");
        resetLayout();

        // Try to get the active panel again after reset
        const newActivePanel = ttabs.getActivePanel();
        if (newActivePanel) {
          panel = ttabs.getPanelObject(newActivePanel);
          console.log("Using panel from new layout:", panel.id);
        } else {
          console.error("Failed to create panels, cannot add tab");
          return;
        }
      }
    }

    if (!panel) {
      console.error("No panel found, aborting tab creation");
      return;
    }

    // Create a new tab with timestamp in the name using the new API
    const tabName = "New Tab " + new Date().toLocaleTimeString();
    console.log("Creating tab with name:", tabName, "in panel:", panel.id);

    try {
      // Create the tab and set its content using method chaining
      const tab = panel.newTab(tabName, true);
      tab.setComponent("text", {
        text: `Content for ${tabName}\nCreated at ${new Date().toISOString()}`,
      });
      tab.setFocused();

      console.log("Tab created successfully");
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
    <TTabsRoot {ttabs} />
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
