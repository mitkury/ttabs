<script lang="ts">
  import {
    createTtabs,
    Grid,
    TTabsRoot,
    LocalStorageAdapter,
    DEFAULT_THEME,
    type TilePanelState,
    type TileTabState,
  } from "ttabs-svelte";

  import { onMount } from "svelte";
  import EditorComponent from "./EditorComponent.svelte";
    import DocumentComponent from "./DocumentComponent.svelte";
  import SidePanelComponent from "./SidePanelComponent.svelte";

  // Create a storage adapter for persisting layout
  const storage = new LocalStorageAdapter("ttabs-example");

  // Load any saved layout data
  const savedData = storage.load();

  // Create the ttabs instance with saved data if available
  const ttabs = createTtabs({
    tiles: savedData?.tiles,
    focusedTab: savedData?.focusedTab,
    theme: DEFAULT_THEME,
  });

  // Register components
  ttabs.registerComponent("editor", EditorComponent, { readOnly: false });
  ttabs.registerComponent("document", DocumentComponent);
  ttabs.registerComponent("sidepanel", SidePanelComponent);

  // Track if the layout has been initialized
  let isInitialized = $state(false);

  // Track the upper panel ID for adding new tabs
  let upperPanelId = $state("");

  // Keep track of new tab count for naming
  let newTabCount = $state(1);

  // Track sidebar visibility
  let sidebarVisible = $state(true);
  
  // Store reference to sidebar column ID
  let sidebarColumnId = $state("");

  // Toggle sidebar visibility
  function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
    
    // Update the sidebar column width directly if we have its ID
    if (sidebarColumnId) {
      ttabs.updateTile(sidebarColumnId, {
        width: { value: sidebarVisible ? 260 : 0, unit: "px" as const }
      });
    }
  }

  // Setup the custom layout using the object-oriented API
  function setupCustomLayout() {    
    // Get or create a grid object
    ttabs.resetTiles();
    const grid = ttabs.newGrid();
    createLayoutStructure(grid);
  }

  // Helper to create the actual layout structure
  function createLayoutStructure(grid: Grid) {
    // Create main row
    const mainRow = grid.newRow();

    // Create columns
    const leftColumn = mainRow.newColumn(sidebarVisible ? "260px" : "0px");
    // Store reference to the sidebar column
    sidebarColumnId = leftColumn.id;
    const rightColumn = mainRow.newColumn();

    // Add side panel directly to left column (no panel/tabs)
    leftColumn.setComponent("sidepanel", {
      title: "Navigation",
      items: [
        { id: "files", label: "Files", icon: "📁" },
        { id: "search", label: "Search", icon: "🔍" },
        { id: "extensions", label: "Extensions", icon: "🧩" },
        { id: "settings", label: "Settings", icon: "⚙️" },
      ],
    });

    // Add a grid to the right column
    const rightGrid = ttabs.addGrid(rightColumn.id);

    // Get the grid object
    const rightGridObj = ttabs.getGridObject(rightGrid);

    // Create two rows for the right grid
    const upperRow = rightGridObj.newRow("60%");
    const lowerRow = rightGridObj.newRow("40%");

    // Create a column for the upper row
    const upperColumn = upperRow.newColumn();

    // Create a panel for the upper column
    const upperPanel = upperColumn.newPanel();

    // Store the upper panel ID for adding new tabs
    upperPanelId = upperPanel.id;

    // Create editor tab for upper panel
    upperPanel.newTab("Editor").setComponent("editor", {
      content: 'function hello() {\n  console.log("Hello, world!");\n}',
      language: "javascript",
    });

    // Create document tab for upper panel
    upperPanel.newTab("Document", false).setComponent("document", {
      documentId: "doc-12345",
      title: "Getting Started",
      content:
        "This is a sample document that demonstrates the content component system in ttabs.",
    });

    // Create settings tab for upper panel
    upperPanel.newTab("Settings", false);

    // Create a column for the lower row
    const lowerColumn = lowerRow.newColumn();

    // Create a panel for the lower column
    const lowerPanel = lowerColumn.newPanel();

    // Create console tab for lower panel
    lowerPanel.newTab("Console");

    // Create additional tabs for lower panel
    lowerPanel.newTab("Output", false);
    lowerPanel.newTab("Debug", false);

    // Set active panel
    upperPanel.setActive();
  }

  // Function to create a new tab using the object-oriented API
  function createNewTab() {
    console.log("Creating new tab, upperPanelId:", upperPanelId);

    // Get the target panel
    let panel;

    if (upperPanelId) {
      panel = ttabs.getPanelObject(upperPanelId);
    } else {
      // Fall back to active panel if upperPanelId is not available
      const activePanelId = ttabs.getActivePanel();
      if (activePanelId) {
        panel = ttabs.getPanelObject(activePanelId);
        console.log("Using active panel instead:", panel.id);
      } else {
        // If no panel is active or available, find any panel
        const anyPanelId = Object.values(ttabs.getTiles()).find(
          (tile) => tile.type === "panel"
        )?.id;

        if (anyPanelId) {
          panel = ttabs.getPanelObject(anyPanelId);
          console.log("Using found panel:", panel.id);
        } else {
          console.error("No panels found, cannot create tab");
          return;
        }
      }
    }

    // Create a new tab with editor component using method chaining
    const tabName = `New Tab ${newTabCount}`;
    panel
      .newTab(tabName, true) // true to make it active
      .setComponent("editor", {
        content: `// New tab ${newTabCount}\n// Write your code here...\n`,
        language: "typescript",
        readOnly: newTabCount % 2 === 0, // Alternate between editable and read-only
      });

    // Increment tab counter
    newTabCount++;
  }

  // Function to reset the layout
  function resetLayout() {
    console.log("Resetting layout...");

    // Reset the panel ID
    upperPanelId = "";

    // Now set up the custom layout
    setupCustomLayout();

    console.log("Layout reset complete, new upperPanelId:", upperPanelId);
  }

  // Setup the layout on mount
  onMount(() => {
    // Check if we have a stored layout
    if (savedData?.tiles) {
      console.log("Found saved layout, loading...");

      // Try to find the upper panel in the saved layout
      findUpperPanel();

      // Mark as initialized
      isInitialized = true;
    } else {
      console.log("No saved layout found, creating custom layout...");

      // Set up the custom layout
      setupCustomLayout();

      // Mark as initialized
      isInitialized = true;
    }

    // Save the layout whenever it changes
    ttabs.subscribe((state) => {
      storage.save(state);
    });
  });

  // Helper to find the upper panel in the saved layout
  function findUpperPanel() {
    // Look for a panel with an 'Editor' tab
    const tiles = ttabs.getTiles();

    // Find panels
    const panels = Object.values(tiles).filter((tile) => tile.type === "panel");

    // Look for a panel with an 'Editor' tab
    for (const panel of panels as TilePanelState[]) {
      const tabs = panel.tabs || [];

      // Check if this panel has a tab named 'Editor'
      if (
        tabs &&
        tabs.some((tabId: string) => {
          const tab = tiles[tabId] as TileTabState;
          return tab.name === "Editor";
        })
      ) {
        // Found our panel
        upperPanelId = panel.id;
        console.log("Found upper panel in saved layout:", upperPanelId);
        return;
      }
    }

    // If we didn't find a panel with an 'Editor' tab, just use the first panel
    if (panels.length > 0) {
      upperPanelId = panels[0].id;
      console.log("Using first panel as upper panel:", upperPanelId);
    } else {
      console.error("No panels found in the layout!");
    }
  }
</script>

<div class="container">
  <div class="header">
    <h1>ttabs Example</h1>
    <div class="controls">
      <button onclick={() => resetLayout()}>Reset Layout</button>
      <button onclick={() => createNewTab()}>New Tab</button>
      <button onclick={() => toggleSidebar()}>{sidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}</button>
    </div>
  </div>

  {#if isInitialized}
    <div class="ttabs-container">
      <TTabsRoot {ttabs} />
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #2c3e50;
    color: white;
  }

  .ttabs-container {
    flex: 1;
    overflow: hidden;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  button:hover {
    background-color: #2980b9;
  }
</style>
