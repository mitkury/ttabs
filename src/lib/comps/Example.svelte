<script lang="ts">
  import { Ttabs, TileGrid } from '$lib/ttabs';
  import type { TilePanel, TileTab } from '$lib/ttabs/types/tile-types';
  import EditorComponent from './EditorComponent.svelte';
  import DocumentComponent from './DocumentComponent.svelte';
  
  // Initialize ttabs on component mount
  const ttabs = new Ttabs({
    storageKey: 'ttabs-layout'
  });
  
  // Register content components
  ttabs.registerContentComponent('editor', EditorComponent, { readOnly: false });
  ttabs.registerContentComponent('document', DocumentComponent);
  
  // Store panel ID for adding new tabs
  let upperPanelId = $state('');
  
  // Create the root grid and store its ID
  let rootId = $state(createCustomLayout());
  
  // Create a custom layout structure using built-in methods
  function createCustomLayout() {
    // Create root grid
    const rootId = ttabs.addGrid();
    
    // Create main row
    const mainRowId = ttabs.addRow(rootId, 100);
    
    // Create columns
    const leftColumnId = ttabs.addColumn(mainRowId, 20);
    const rightColumnId = ttabs.addColumn(mainRowId, 80);
    
    // Create a panel for the left column
    const leftPanelId = ttabs.addPanel(leftColumnId);
    
    // Create explorer tab
    const explorerTabId = ttabs.addTab(leftPanelId, 'Explorer');
    
    // Update content type for explorer tab
    const explorerTab = ttabs.getTile<TileTab>(explorerTabId);
    if (explorerTab && explorerTab.content) {
      ttabs.updateTile(explorerTab.content, { contentType: 'explorer' });
    }
    
    // Create additional tabs for the left panel
    const filesTabId = ttabs.addTab(leftPanelId, 'Files', false);
    const searchTabId = ttabs.addTab(leftPanelId, 'Search', false);
    
    // Update content types
    const filesTab = ttabs.getTile<TileTab>(filesTabId);
    if (filesTab && filesTab.content) {
      ttabs.updateTile(filesTab.content, { contentType: 'files' });
    }
    
    const searchTab = ttabs.getTile<TileTab>(searchTabId);
    if (searchTab && searchTab.content) {
      ttabs.updateTile(searchTab.content, { contentType: 'search' });
    }
    
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
    ttabs.addComponentContent(editorTabId, 'editor', { 
      content: 'function hello() {\n  console.log("Hello, world!");\n}',
      language: 'javascript'
    });
    
    // Create document tab for upper panel
    const documentTabId = ttabs.addTab(upperPanelId, 'Document', false);
    
    // Add document component to the document tab
    ttabs.addComponentContent(documentTabId, 'document', {
      documentId: 'doc-12345',
      title: 'Getting Started',
      content: 'This is a sample document that demonstrates the content component system in ttabs.'
    });
    
    // Create settings tab for upper panel
    const settingsTabId = ttabs.addTab(upperPanelId, 'Settings', false);
    
    // Update content type for settings tab
    const settingsTab = ttabs.getTile<TileTab>(settingsTabId);
    if (settingsTab && settingsTab.content) {
      ttabs.updateTile(settingsTab.content, { contentType: 'settings' });
    }
    
    // Create a column for the lower row
    const lowerColumnId = ttabs.addColumn(lowerRowId, 100);
    
    // Create a panel for the lower column
    const lowerPanelId = ttabs.addPanel(lowerColumnId);
    
    // Create console tab for lower panel
    const consoleTabId = ttabs.addTab(lowerPanelId, 'Console');
    
    // Update content type for console tab
    const consoleTab = ttabs.getTile<TileTab>(consoleTabId);
    if (consoleTab && consoleTab.content) {
      ttabs.updateTile(consoleTab.content, { contentType: 'console' });
    }
    
    // Create additional tabs for lower panel
    const outputTabId = ttabs.addTab(lowerPanelId, 'Output', false);
    const debugTabId = ttabs.addTab(lowerPanelId, 'Debug', false);
    
    // Update content types
    const outputTab = ttabs.getTile<TileTab>(outputTabId);
    if (outputTab && outputTab.content) {
      ttabs.updateTile(outputTab.content, { contentType: 'output' });
    }
    
    const debugTab = ttabs.getTile<TileTab>(debugTabId);
    if (debugTab && debugTab.content) {
      ttabs.updateTile(debugTab.content, { contentType: 'debug' });
    }
    
    // Set active panel
    ttabs.setActivePanel(upperPanelId);
    
    return rootId;
  }
  
  // Function to reset the layout
  function resetLayout() {
    rootId = createCustomLayout();
  }
  
  // Keep track of new tab count for naming
  let newTabCount = $state(1);
  
  // Function to create a new tab using the built-in method
  function createNewTab() {
    if (!upperPanelId) return;
    
    // Create a new tab in the upper panel
    const tabName = `New Tab ${newTabCount}`;
    const newTabId = ttabs.addTab(upperPanelId, tabName, true); // true to make it active
    
    // Add editor content to the new tab
    ttabs.addComponentContent(newTabId, 'editor', {
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
    <h1>ttabs example</h1>
    <div class="actions">
      <button onclick={resetLayout}>Reset Layout</button>
      <button onclick={createNewTab} class="create-tab-btn">Create New Tab</button>
    </div>
  </header>
  
  <main>
    <TileGrid ttabs={ttabs} id={rootId} />
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
</style> 