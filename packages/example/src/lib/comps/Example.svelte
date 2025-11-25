<script lang="ts">
  import {
    createTtabs,
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
  import AddTabButton from "./AddTabButton.svelte";

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
  ttabs.registerComponent("add-tab-button", AddTabButton);

  // Track if the layout has been initialized
  let isInitialized = $state(false);

  // Track the upper panel ID for adding new tabs
  let upperPanelId = $state("");

  // Keep track of new tab count for header button
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
  function createLayoutStructure(grid: any) {
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

    // Show a "+" control next to the tab headers (inline after tabs)
    upperPanel.tabBarComponents = [
      {
        componentId: "add-tab-button",
        props: {
          tabBaseName: "New Tab",
          componentId: "editor",
          componentProps: {
            content: "// New tab\n",
            language: "typescript",
            readOnly: false,
          },
        },
      },
      {
        componentId: "add-tab-button",
        props: {
          tabBaseName: "Doc",
          componentId: "document",
          componentProps: {
            title: "New Doc",
            content: "Document body",
          },
          label: "📄",
          title: "New document tab",
        },
      },
      {
        componentId: "add-tab-button",
        align: "right",
        props: {
          tabBaseName: "Scratch",
          componentId: "editor",
          componentProps: {
            content: "// Scratchpad\n",
            language: "typescript",
            readOnly: false,
          },
          label: "⋯",
          title: "Scratch tab",
        },
      },
      {
        componentId: "add-tab-button",
        align: "right",
        props: {
          tabBaseName: "Debug",
          componentId: "editor",
          componentProps: {
            content: "// Debug notes\n",
            language: "plaintext",
            readOnly: true,
          },
          label: "🧪",
          title: "New debug tab",
        },
      },
    ];

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
    const tab = panel.newTab(tabName, true); // true to make it active
    tab.setComponent("editor", {
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

  // Initialize the layout on mount if not already initialized
  onMount(() => {
    if (!isInitialized) {
      setupCustomLayout();
      isInitialized = true;
    }

    // Connect storage
    const unsubscribe = ttabs.subscribe((state) => {
      storage.save(state);
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<div class="example-container">
  <header>
    <h1>ttabs advanced example</h1>
    <div class="actions">
      <button onclick={resetLayout}>Reset Layout</button>
      <button onclick={createNewTab}>Add Tab</button>
      <button onclick={toggleSidebar}>
        {sidebarVisible ? "Hide" : "Show"} Sidebar
      </button>
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
