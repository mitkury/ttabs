<script lang="ts">
  import { createTtabs, TtabsRoot, LocalStorageAdapter, defaultTheme as DEFAULT_THEME, darkTheme as DARK_THEME } from 'ttabs-svelte';
  import type { TilePanel, TileTab } from 'ttabs-svelte';
  import type { TtabsTheme } from 'ttabs-svelte';
  import EditorComponent from './EditorComponent.svelte';
  import DocumentComponent from './DocumentComponent.svelte';
  import SidePanelComponent from './SidePanelComponent.svelte';
  import { onMount } from 'svelte';
  
  console.log('Themes available:', { DEFAULT_THEME, DARK_THEME });
  
  // Create a storage adapter
  const storageAdapter = new LocalStorageAdapter('ttabs-layout');
  
  // Load saved state
  const savedData = storageAdapter.load();
  
  // Initialize ttabs with the loaded state
  const ttabs = $state(createTtabs({
    tiles: savedData?.tiles,
    focusedTab: savedData?.focusedTab,
    theme: DEFAULT_THEME
  }));
  
  // Connect storage adapter
  const unsubscribe = ttabs.subscribe((state) => {
    storageAdapter.save(state);
  });
  
  // Register content components
  ttabs.registerComponent('editor', EditorComponent, { readOnly: false });
  ttabs.registerComponent('document', DocumentComponent);
  ttabs.registerComponent('sidepanel', SidePanelComponent);
  
  // Store panel ID for adding new tabs
  let upperPanelId = $state('');
  let isInitialized = $state(false);
  
  // Define a high contrast version of the dark theme
  const highContrastDarkTheme = {
    name: 'high-contrast-dark',
    extends: DARK_THEME, // Inherit from the dark theme
    variables: {
      '--ttabs-text-color': '#ffffff', // Brighter white text
      '--ttabs-active-tab-indicator': '#f59e0b', // Orange accent
      '--ttabs-drop-indicator-color': '#f59e0b'
    }
  };
  
  // Define a blue theme that just overrides accent colors
  const blueTheme = {
    name: 'blue',
    variables: {
      '--ttabs-active-tab-indicator': '#2563eb', // Blue accent
      '--ttabs-drop-indicator-color': '#2563eb',
      '--ttabs-resizer-hover-color': 'rgba(37, 99, 235, 0.3)'
    }
  };
  
  // Keep track of the current theme
  let currentTheme = $state(0); // 0 = default, 1 = dark, 2 = high contrast, 3 = blue
  let isDarkTheme = $state(false);
  
  // Toggle between themes
  function toggleTheme() {
    currentTheme = (currentTheme + 1) % 4;
    
    // Initialize with a default value to avoid undefined
    let newTheme = DEFAULT_THEME;
    
    // Then assign based on currentTheme
    if (currentTheme === 0) {
      newTheme = DEFAULT_THEME;
    } else if (currentTheme === 1) {
      newTheme = DARK_THEME;
    } else if (currentTheme === 2) {
      newTheme = highContrastDarkTheme;
    } else if (currentTheme === 3) {
      newTheme = blueTheme;
    }
    
    console.log('Toggling to theme:', newTheme.name);
    ttabs.setTheme(newTheme);
    console.log('Current theme after toggle:', ttabs.theme.name);
  }
  
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
    console.log('Layout initialized, upperPanelId:', upperPanelId);
    console.log('Current theme:', ttabs.theme);
    
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
    
    const allPanels = Object.values(ttabs.getTiles())
      .filter(tile => tile.type === 'panel');
      
    console.log('Found panels:', allPanels);
    
    // Try to find a panel that has the "Editor" tab
    for (const panel of allPanels) {
      const panelObj = panel as TilePanel;
      
      // Look through this panel's tabs
      const tabs = panelObj.tabs
        .map(tabId => ttabs.getTile<TileTab>(tabId))
        .filter(Boolean);
        
      // If any tab is named "Editor", this is likely our upper panel
      if (tabs.some(tab => tab?.name === 'Editor')) {
        upperPanelId = panelObj.id;
        console.log('Found upper panel:', upperPanelId);
        return;
      }
    }
    
    // If we couldn't find a matching panel, just use the first one
    if (allPanels.length > 0) {
      upperPanelId = allPanels[0].id;
      console.log('Using first panel as upper panel:', upperPanelId);
    } else {
      console.error('No panels found in the layout!');
    }
  }
  
  // Setup the custom layout (no need to track root grid ID anymore)
  function setupCustomLayout() {
    // Get the root grid ID
    const rootId = ttabs.rootGridId;
    
    // If no root grid exists, create one
    if (!rootId) {
      console.error('No root grid found, creating one...');
      const newRootId = ttabs.addGrid();
      
      if (!newRootId) {
        console.error('Failed to create root grid');
        return;
      }
      
      // Continue with the new root ID
      createLayoutStructure(newRootId);
    } else {
      // Use the existing root ID
      createLayoutStructure(rootId);
    }
  }
  
  // Helper to create the actual layout structure
  function createLayoutStructure(rootId: string) {
    // Create main row
    const mainRowId = ttabs.addRow(rootId, 100);
    
    // Create columns
    const leftColumnId = ttabs.addColumn(mainRowId, 20);
    const rightColumnId = ttabs.addColumn(mainRowId, 80);
    
    // Add side panel directly to left column (no panel/tabs)
    ttabs.setComponent(leftColumnId, 'sidepanel', {
      title: 'Navigation',
      items: [
        { id: 'files', label: 'Files', icon: '📁' },
        { id: 'search', label: 'Search', icon: '🔍' },
        { id: 'extensions', label: 'Extensions', icon: '🧩' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
      ]
    });
    
    // Create a grid for the right column
    const rightGridId = ttabs.addGrid(rightColumnId);
    
    // Create two rows for the right grid
    const upperRowId = ttabs.addRow(rightGridId, 60);
    const lowerRowId = ttabs.addRow(rightGridId, 40);
    
    // Create a column for the upper row
    const upperColumnId = ttabs.addColumn(upperRowId, 100);
    
    // Create a panel for the upper column
    upperPanelId = ttabs.addPanel(upperColumnId);
    
    // Create editor tab for upper panel
    const editorTabId = ttabs.addTab(upperPanelId, 'Editor');
    
    // Add editor component to the editor tab
    ttabs.setComponent(editorTabId, 'editor', { 
      content: 'function hello() {\n  console.log("Hello, world!");\n}',
      language: 'javascript'
    });
    
    // Create document tab for upper panel
    const documentTabId = ttabs.addTab(upperPanelId, 'Document', false);
    
    // Add document component to the document tab
    ttabs.setComponent(documentTabId, 'document', {
      documentId: 'doc-12345',
      title: 'Getting Started',
      content: 'This is a sample document that demonstrates the content component system in ttabs.'
    });
    
    // Create settings tab for upper panel
    const settingsTabId = ttabs.addTab(upperPanelId, 'Settings', false);
    
    // Create a column for the lower row
    const lowerColumnId = ttabs.addColumn(lowerRowId, 100);
    
    // Create a panel for the lower column
    const lowerPanelId = ttabs.addPanel(lowerColumnId);
    
    // Create console tab for lower panel
    const consoleTabId = ttabs.addTab(lowerPanelId, 'Console');
    
    // Create additional tabs for lower panel
    const outputTabId = ttabs.addTab(lowerPanelId, 'Output', false);
    const debugTabId = ttabs.addTab(lowerPanelId, 'Debug', false);
    
    // Set active panel
    ttabs.setActivePanel(upperPanelId);
  }
  
  // Function to reset the layout
  function resetLayout() {
    console.log('Resetting layout...');
    
    // Reset the state
    ttabs.resetState();
    
    // Reset the panel ID
    upperPanelId = '';
    
    // Create a new root grid explicitly (will set the rootGridId internally)
    ttabs.addGrid();
    
    // Now set up the custom layout
    setupCustomLayout();
    
    console.log('Layout reset complete, new upperPanelId:', upperPanelId);
  }
  
  // Keep track of new tab count for naming
  let newTabCount = $state(1);
  
  // Function to create a new tab using the built-in method
  function createNewTab() {
    console.log('Creating new tab, upperPanelId:', upperPanelId);
    
    // Fall back to active panel if upperPanelId is not available
    let targetPanelId = upperPanelId;
    
    if (!targetPanelId) {
      const activePanel = ttabs.getActivePanel();
      if (activePanel) {
        targetPanelId = activePanel;
        console.log('Using active panel instead:', targetPanelId);
      } else {
        // If no panel is active or available, find any panel
        const anyPanel = Object.values(ttabs.getTiles())
          .find(tile => tile.type === 'panel')?.id;
          
        if (anyPanel) {
          targetPanelId = anyPanel;
          console.log('Using found panel:', targetPanelId);
        } else {
          console.error('No panels found, cannot create tab');
          return;
        }
      }
    }
    
    // Create a new tab in the target panel
    const tabName = `New Tab ${newTabCount}`;
    const newTabId = ttabs.addTab(targetPanelId, tabName, true); // true to make it active
    
    // Add editor content to the new tab
    ttabs.setComponent(newTabId, 'editor', {
      content: `// New tab ${newTabCount}\n// Write your code here...\n`,
      language: 'typescript',
      readOnly: newTabCount % 2 === 0 // Alternate between editable and read-only
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
      <button onclick={createNewTab} class="create-tab-btn">Create New Tab</button>
      <button onclick={toggleTheme} class="theme-btn">
        {currentTheme === 0 ? '☀️ Light Theme' : currentTheme === 1 ? '🌙 Dark Theme' : currentTheme === 2 ? '🌓 High Contrast' : '💙 Blue Theme'}
      </button>
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