<script lang="ts">
  import {
    createTtabs,
    TTabsRoot,
    LocalStorageAdapter,
    DEFAULT_THEME,
    type TtabsTheme,
  } from "ttabs-svelte";
  import { onMount } from "svelte";
  import SimpleTextComponent from "./SimpleTextComponent.svelte";
  import EditorComponent from "./EditorComponent.svelte";

  // Create a storage adapter
  const storageAdapter = new LocalStorageAdapter("ttabs-theme-demo", 500);

  // Load saved state
  const savedData = storageAdapter.load();

  // Create custom themes
  const darkTheme: TtabsTheme = {
    name: 'dark',
    extends: DEFAULT_THEME,
    variables: {
      '--ttabs-panel-bg': '#1e1e1e',
      '--ttabs-tab-bar-bg': '#2d2d30',
      '--ttabs-active-tab-bg': '#1e1e1e',
      '--ttabs-active-tab-indicator': '#007acc',
      '--ttabs-grid-bg': '#252526',
      '--ttabs-grid-border': '1px solid #3c3c3c',
      '--ttabs-column-border': '1px solid #3c3c3c',
      '--ttabs-tab-text-color': '#cccccc',
      '--ttabs-tab-active-text-color': '#ffffff',
      '--ttabs-content-bg': '#1e1e1e',
      '--ttabs-content-border': '1px solid #3c3c3c',
      '--ttabs-content-text-color': '#cccccc',
      '--ttabs-tab-bar-border': '1px solid #3c3c3c',
      '--ttabs-close-button-color': '#cccccc',
      '--ttabs-close-button-hover-color': '#ffffff',
      '--ttabs-close-button-hover-bg': 'rgba(255, 255, 255, 0.1)',
    }
  };

  const blueTheme: TtabsTheme = {
    name: 'blue',
    extends: DEFAULT_THEME,
    variables: {
      '--ttabs-panel-bg': '#f0f8ff',
      '--ttabs-tab-bar-bg': '#e6f3ff',
      '--ttabs-active-tab-bg': '#ffffff',
      '--ttabs-active-tab-indicator': '#0066cc',
      '--ttabs-grid-bg': '#f8fbff',
      '--ttabs-grid-border': '1px solid #b3d9ff',
      '--ttabs-column-border': '1px solid #b3d9ff',
      '--ttabs-tab-text-color': '#0066cc',
      '--ttabs-tab-active-text-color': '#003366',
      '--ttabs-content-bg': '#ffffff',
      '--ttabs-content-border': '1px solid #b3d9ff',
      '--ttabs-content-text-color': '#003366',
      '--ttabs-tab-bar-border': '1px solid #b3d9ff',
      '--ttabs-close-button-color': '#0066cc',
      '--ttabs-close-button-hover-color': '#003366',
      '--ttabs-close-button-hover-bg': 'rgba(0, 102, 204, 0.1)',
    }
  };

  // Initialize ttabs with the loaded state
  const ttabs = $state(
    createTtabs({
      tiles: savedData?.tiles,
      focusedTab: savedData?.focusedTab,
      theme: DEFAULT_THEME,
    })
  );

  // Register components
  ttabs.registerComponent("text", SimpleTextComponent);
  ttabs.registerComponent("editor", EditorComponent);

  // Connect storage
  const unsubscribe = ttabs.subscribe((state) => {
    storageAdapter.save(state);
  });

  // Cleanup on unmount
  onMount(() => {
    return () => {
      unsubscribe();
    };
  });

  // Theme management
  let currentTheme = $state<'default' | 'dark' | 'blue'>('default');

  function setTheme(theme: 'default' | 'dark' | 'blue') {
    currentTheme = theme;
    switch (theme) {
      case 'dark':
        ttabs.theme = darkTheme;
        break;
      case 'blue':
        ttabs.theme = blueTheme;
        break;
      default:
        ttabs.theme = DEFAULT_THEME;
        break;
    }
  }

  // Layout management
  function createSimpleLayout() {
    ttabs.resetTiles();
    const grid = ttabs.newGrid();
    const row = grid.newRow();
    const column = row.newColumn();
    const panel = column.newPanel();
    
    const tab = panel.newTab("Welcome", true);
    tab.setComponent("text", {
      text: "Welcome to the Theme Example!\n\nThis demonstrates the theming system and various layout features.",
    });
    tab.setFocused();
  }

  function createAdvancedLayout() {
    ttabs.resetTiles();
    const grid = ttabs.newGrid();
    
    // Create two rows
    const topRow = grid.newRow("60%");
    const bottomRow = grid.newRow("40%");
    
    // Top row: two columns
    const leftCol = topRow.newColumn("30%");
    const rightCol = topRow.newColumn("70%");
    
    // Left column panel
    const leftPanel = leftCol.newPanel();
    const infoTab = leftPanel.newTab("Info", true);
    infoTab.setComponent("text", {
      text: "Theme Information\n\nCurrent theme: " + currentTheme + "\n\nThis panel shows theme details and controls.",
    });
    
    // Right column panel
    const rightPanel = rightCol.newPanel();
    const editorTab = rightPanel.newTab("Editor", true);
    editorTab.setComponent("editor", {
      content: '// Theme Example\nconsole.log("Current theme:", "' + currentTheme + '");\n\n// Try switching themes to see the changes!',
      language: "javascript",
    });
    
    // Bottom row: single column
    const bottomCol = bottomRow.newColumn();
    const bottomPanel = bottomCol.newPanel();
    const consoleTab = bottomPanel.newTab("Console", true);
    consoleTab.setComponent("text", {
      text: "Console Output\n\nTheme changes will be logged here.\n\nCurrent theme: " + currentTheme,
    });
    
    leftPanel.setActive();
  }

  function addTab() {
    const activePanel = ttabs.getActivePanel();
    if (activePanel) {
      const panel = ttabs.getPanelObject(activePanel);
      const tabName = "New Tab " + new Date().toLocaleTimeString();
      const tab = panel.newTab(tabName, true);
      tab.setComponent("text", {
        text: `Content for ${tabName}\nCreated at ${new Date().toISOString()}\nCurrent theme: ${currentTheme}`,
      });
      tab.setFocused();
    }
  }

  // Initialize layout
  onMount(() => {
    if (!savedData?.tiles) {
      createSimpleLayout();
    }
  });
</script>

<div class="example-container">
  <header>
    <h1>ttabs theme example</h1>
    <div class="controls">
      <div class="theme-controls">
        <label for="theme-select">Theme:</label>
        <select 
          id="theme-select"
          value={currentTheme} 
          onchange={(e) => {
            const target = e.target as HTMLSelectElement;
            if (target) {
              setTheme(target.value as 'default' | 'dark' | 'blue');
            }
          }}
        >
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="blue">Blue</option>
        </select>
      </div>
      <div class="actions">
        <button onclick={createSimpleLayout}>Simple Layout</button>
        <button onclick={createAdvancedLayout}>Advanced Layout</button>
        <button onclick={addTab}>Add Tab</button>
      </div>
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

  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .theme-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .theme-controls label {
    font-weight: 500;
  }

  .theme-controls select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
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