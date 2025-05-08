<script lang="ts">
  import {
    createTtabs,
    TtabsRoot,
    LocalStorageAdapter,
    DEFAULT_THEME,
  } from "ttabs-svelte";
  import type { TilePanel, TileTab } from "ttabs-svelte";
  import type { TtabsTheme } from "ttabs-svelte";
  import { TtabsGrid } from "ttabs-svelte";
  import EditorComponent from "./EditorComponent.svelte";
  import DocumentComponent from "./DocumentComponent.svelte";
  import SidePanelComponent from "./SidePanelComponent.svelte";
  import { onMount } from "svelte";

  console.log("Themes available:", { DEFAULT_THEME });

  // Create a storage adapter
  const storageAdapter = new LocalStorageAdapter("ttabs-layout");

  // Load saved state
  const savedData = storageAdapter.load();

  // Initialize ttabs with the loaded state
  const ttabs = $state(
    createTtabs({
      tiles: savedData?.tiles,
      focusedTab: savedData?.focusedTab,
      theme: DEFAULT_THEME,
    })
  );

  // Connect storage adapter
  const unsubscribe = ttabs.subscribe((state) => {
    storageAdapter.save(state);
  });

  // Register content components
  ttabs.registerComponent("editor", EditorComponent, { readOnly: false });
  ttabs.registerComponent("document", DocumentComponent);
  ttabs.registerComponent("sidepanel", SidePanelComponent);

  // Store panel ID for adding new tabs
  let upperPanelId = $state("");
  let isInitialized = $state(false);

  // Keep track of the current theme
  // Setup the layout on mount
  onMount(() => {
    // Check if we have a stored layout
    const rootId = ttabs.rootGridId;

    if (!rootId) {
      // No valid layout found, create a new one
      setupCustomLayout();
    } else {
      // We have a stored layout, need to find the upper panel
      findUpperPanel();
    }

    isInitialized = true;
    console.log("Layout initialized, upperPanelId:", upperPanelId);
    console.log("Current theme:", ttabs.theme);

    // Cleanup on destroy
    return () => {
      unsubscribe();
    };
  });

  // Helper function to find the upper panel in an existing layout
  function findUpperPanel() {
    // Since we don't know the exact structure in a restored layout,
    // we'll try to find a panel that looks like our upper panel
    // by checking if it has tabs with the names we expect

    const allPanels = Object.values(ttabs.getTiles()).filter(
      (tile) => tile.type === "panel"
    );

    console.log("Found panels:", allPanels);

    // Try to find a panel that has the "Editor" tab
    for (const panel of allPanels) {
      const panelObj = panel as TilePanel;

      // Look through this panel's tabs
      const tabs = panelObj.tabs
        .map((tabId) => ttabs.getTile<TileTab>(tabId))
        .filter(Boolean);

      // If any tab is named "Editor", this is likely our upper panel
      if (tabs.some((tab) => tab?.name === "Editor")) {
        upperPanelId = panelObj.id;
        console.log("Found upper panel:", upperPanelId);
        return;
      }
    }

    // If we couldn't find a matching panel, just use the first one
    if (allPanels.length > 0) {
      upperPanelId = allPanels[0].id;
      console.log("Using first panel as upper panel:", upperPanelId);
    } else {
      console.error("No panels found in the layout!");
    }
  }

  // Setup the custom layout using the object-oriented API
  function setupCustomLayout() {
    ttabs.resetTiles();

    // Get or create a grid object
    const grid = ttabs.newGrid();

    // Create main row
    const mainRow = grid.newRow();

    // Create columns
    const leftColumn = mainRow.newColumn("260px");
    const rightColumn = mainRow.newColumn();

    // Add a component to the left column (sidebar)
    leftColumn.setComponent("sidepanel", { view: "explorer" });

    // Create a nested grid in the right column
    // First, create a content for the right column
    const rightColumnContent = ttabs.setComponent(rightColumn.id, "grid");

    // Get the grid object for this content
    const rightGrid = ttabs.getGridObject(rightColumnContent);

    // Create two rows in the right grid
    const upperRow = rightGrid.newRow("70%");
    const lowerRow = rightGrid.newRow("30%");

    // Create a column and panel for the upper row
    const upperPanel = upperRow.newColumn().newPanel();

    // Store the upper panel ID for adding new tabs
    upperPanelId = upperPanel.id;

    // Create editor tab for upper panel with component
    upperPanel.newTab("Editor").setComponent("editor", {
      content: 'function hello() {\n  console.log("Hello, world!");\n}',
      language: "javascript",
    });

    // Create document tab for upper panel with component
    upperPanel.newTab("Document", false).setComponent("document", {
      documentId: "doc-12345",
      title: "Getting Started",
      content:
        "# Getting Started\n\nWelcome to the ttabs example!\n\nThis demonstrates how to use ttabs to create a flexible layout with tabs and panels.",
    });

    // Create a panel for the lower row
    const lowerPanel = lowerRow.newColumn().newPanel();

    // Create tabs for lower panel
    lowerPanel.newTab("Console");
    lowerPanel.newTab("Output", false);
    lowerPanel.newTab("Debug", false);

    // Set active panel
    upperPanel.setActive();
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

  // Keep track of new tab count for naming
  let newTabCount = $state(1);

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
</script>

<div class="example-container">
  <header>
    <h1>ttabs advanced example</h1>
    <div class="actions">
      <button onclick={resetLayout}>Reset Layout</button>
      <button onclick={createNewTab} class="create-tab-btn"
        >Create New Tab</button
      >
    </div>
  </header>

  <main>
    {#if isInitialized}
      <TtabsRoot {ttabs} />
    {:else}
      <div class="loading">Initializing layout...</div>
    {/if}
  </main>
</div>

<style>
  .example-container {
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

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.2rem;
    color: #666;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #4a6cf7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 0.5rem;
  }

  button:hover {
    background-color: #3a5ce7;
  }

  .create-tab-btn {
    background-color: #38a169;
  }

  .create-tab-btn:hover {
    background-color: #2f855a;
  }

  .theme-btn {
    background-color: #805ad5;
  }

  .theme-btn:hover {
    background-color: #6b46c1;
  }
</style>
