<script lang="ts">
  import { Ttabs, TileGrid } from '$lib/ttabs';
  import type { TilePanel } from '$lib/ttabs/types/tile-types';
  
  // Initialize ttabs on component mount
  const ttabs = new Ttabs({
    storageKey: 'ttabs-layout'
  });
  
  // Create the root grid and store its ID
  let rootId = $state(createCustomLayout());
  
  // Create a custom layout structure
  function createCustomLayout() {
    // Create basic structure
    const rootId = ttabs.addTile({
      type: 'grid',
      rows: []
    });
    
    const mainRowId = ttabs.addTile({
      parent: rootId,
      type: 'row',
      columns: [],
      height: 100
    });
    
    // Add the row to the root grid
    ttabs.updateTile(rootId, {
      rows: [mainRowId]
    });
    
    // Create columns
    const leftColumnId = ttabs.addTile({
      parent: mainRowId,
      type: 'column',
      child: '',
      width: 20 // 20% width
    });
    
    const rightColumnId = ttabs.addTile({
      parent: mainRowId,
      type: 'column',
      child: '',
      width: 80 // 80% width
    });
    
    // Add columns to the row
    ttabs.updateTile(mainRowId, {
      columns: [leftColumnId, rightColumnId]
    });
    
    // Create a panel for the left column
    const leftPanelId = ttabs.addTile({
      parent: leftColumnId,
      type: 'panel',
      tabs: [],
      activeTab: null
    });
    
    // Update left column with its panel
    ttabs.updateTile(leftColumnId, { child: leftPanelId });
    
    // Create explorer tab for left panel
    const explorerTabId = ttabs.addTile({
      parent: leftPanelId,
      type: 'tab',
      name: 'Explorer',
      content: ''
    });
    
    // Create content for explorer tab
    const explorerContentId = ttabs.addTile({
      parent: explorerTabId,
      type: 'content',
      contentType: 'explorer'
    });
    
    // Update explorer tab with its content
    ttabs.updateTile(explorerTabId, { content: explorerContentId });
    
    // Update left panel with its tab
    ttabs.updateTile(leftPanelId, {
      tabs: [explorerTabId],
      activeTab: explorerTabId
    });
    
    // Create additional tabs for the left panel
    const filesTabId = ttabs.addTile({
      parent: leftPanelId,
      type: 'tab',
      name: 'Files',
      content: ''
    });
    
    const searchTabId = ttabs.addTile({
      parent: leftPanelId,
      type: 'tab',
      name: 'Search',
      content: ''
    });
    
    // Create content for additional tabs
    const filesContentId = ttabs.addTile({
      parent: filesTabId,
      type: 'content',
      contentType: 'files'
    });
    
    const searchContentId = ttabs.addTile({
      parent: searchTabId,
      type: 'content',
      contentType: 'search'
    });
    
    // Update additional tabs with their content
    ttabs.updateTile(filesTabId, { content: filesContentId });
    ttabs.updateTile(searchTabId, { content: searchContentId });
    
    // Add the new tabs to the left panel
    ttabs.updateTile(leftPanelId, {
      tabs: [explorerTabId, filesTabId, searchTabId],
      activeTab: explorerTabId
    });
    
    // Create a grid for the right column
    const rightGridId = ttabs.addTile({
      parent: rightColumnId,
      type: 'grid',
      rows: []
    });
    
    // Update right column with its grid
    ttabs.updateTile(rightColumnId, { child: rightGridId });
    
    // Create two rows for the right grid
    const upperRowId = ttabs.addTile({
      parent: rightGridId,
      type: 'row',
      columns: [],
      height: 60 // 60% height
    });
    
    const lowerRowId = ttabs.addTile({
      parent: rightGridId,
      type: 'row',
      columns: [],
      height: 40 // 40% height
    });
    
    // Add rows to the right grid
    ttabs.updateTile(rightGridId, {
      rows: [upperRowId, lowerRowId]
    });
    
    // Create a column for the upper row
    const upperColumnId = ttabs.addTile({
      parent: upperRowId,
      type: 'column',
      child: '',
      width: 100 // 100% width
    });
    
    // Add the column to the upper row
    ttabs.updateTile(upperRowId, {
      columns: [upperColumnId]
    });
    
    // Create a panel for the upper column
    const upperPanelId = ttabs.addTile({
      parent: upperColumnId,
      type: 'panel',
      tabs: [],
      activeTab: null
    });
    
    // Update upper column with its panel
    ttabs.updateTile(upperColumnId, { child: upperPanelId });
    
    // Create editor tab for upper panel
    const editorTabId = ttabs.addTile({
      parent: upperPanelId,
      type: 'tab',
      name: 'Editor',
      content: ''
    });
    
    // Create content for editor tab
    const editorContentId = ttabs.addTile({
      parent: editorTabId,
      type: 'content',
      contentType: 'editor'
    });
    
    // Update editor tab with its content
    ttabs.updateTile(editorTabId, { content: editorContentId });
    
    // Update upper panel with its tab
    ttabs.updateTile(upperPanelId, {
      tabs: [editorTabId],
      activeTab: editorTabId
    });
    
    // Create additional tabs for upper panel
    const documentTabId = ttabs.addTile({
      parent: upperPanelId,
      type: 'tab',
      name: 'Document',
      content: ''
    });
    
    const settingsTabId = ttabs.addTile({
      parent: upperPanelId,
      type: 'tab',
      name: 'Settings',
      content: ''
    });
    
    // Create content for additional tabs
    const documentContentId = ttabs.addTile({
      parent: documentTabId,
      type: 'content',
      contentType: 'document'
    });
    
    const settingsContentId = ttabs.addTile({
      parent: settingsTabId,
      type: 'content',
      contentType: 'settings'
    });
    
    // Update additional tabs with their content
    ttabs.updateTile(documentTabId, { content: documentContentId });
    ttabs.updateTile(settingsTabId, { content: settingsContentId });
    
    // Add the new tabs to the upper panel
    ttabs.updateTile(upperPanelId, {
      tabs: [editorTabId, documentTabId, settingsTabId],
      activeTab: editorTabId
    });
    
    // Create a column for the lower row
    const lowerColumnId = ttabs.addTile({
      parent: lowerRowId,
      type: 'column',
      child: '',
      width: 100 // 100% width
    });
    
    // Add the column to the lower row
    ttabs.updateTile(lowerRowId, {
      columns: [lowerColumnId]
    });
    
    // Create a panel for the lower column
    const lowerPanelId = ttabs.addTile({
      parent: lowerColumnId,
      type: 'panel',
      tabs: [],
      activeTab: null
    });
    
    // Update lower column with its panel
    ttabs.updateTile(lowerColumnId, { child: lowerPanelId });
    
    // Create console tab for lower panel
    const consoleTabId = ttabs.addTile({
      parent: lowerPanelId,
      type: 'tab',
      name: 'Console',
      content: ''
    });
    
    // Create content for console tab
    const consoleContentId = ttabs.addTile({
      parent: consoleTabId,
      type: 'content',
      contentType: 'console'
    });
    
    // Update console tab with its content
    ttabs.updateTile(consoleTabId, { content: consoleContentId });
    
    // Update lower panel with its tab
    ttabs.updateTile(lowerPanelId, {
      tabs: [consoleTabId],
      activeTab: consoleTabId
    });
    
    // Create additional tabs for lower panel
    const outputTabId = ttabs.addTile({
      parent: lowerPanelId,
      type: 'tab',
      name: 'Output',
      content: ''
    });
    
    const debugTabId = ttabs.addTile({
      parent: lowerPanelId,
      type: 'tab',
      name: 'Debug',
      content: ''
    });
    
    // Create content for additional tabs
    const outputContentId = ttabs.addTile({
      parent: outputTabId,
      type: 'content',
      contentType: 'output'
    });
    
    const debugContentId = ttabs.addTile({
      parent: debugTabId,
      type: 'content',
      contentType: 'debug'
    });
    
    // Update additional tabs with their content
    ttabs.updateTile(outputTabId, { content: outputContentId });
    ttabs.updateTile(debugTabId, { content: debugContentId });
    
    // Add the new tabs to the lower panel
    ttabs.updateTile(lowerPanelId, {
      tabs: [consoleTabId, outputTabId, debugTabId],
      activeTab: consoleTabId
    });
    
    // Set active panel
    ttabs.setActivePanel(upperPanelId);
    
    return rootId;
  }
  
  // Function to reset the layout
  function resetLayout() {
    rootId = createCustomLayout();
  }
  
  // Function to create a new tab
  function createNewTab() {
    const allTiles = ttabs.getTiles();
    
    // Get all panels
    const panels = Object.values(allTiles)
      .filter((tile): tile is TilePanel => tile.type === 'panel');
    
    if (panels.length > 0) {
      const firstPanel = panels[0];
      
      // Create a new tab with a unique name
      const newTabId = ttabs.addTile({
        parent: firstPanel.id,
        type: 'tab',
        name: `New Tab ${Math.floor(Math.random() * 1000)}`,
        content: ''
      });
      
      // Create content for the new tab
      const newContentId = ttabs.addTile({
        parent: newTabId,
        type: 'content',
        contentType: 'editor'
      });
      
      // Update the tab with its content
      ttabs.updateTile(newTabId, { content: newContentId });
      
      // Add the new tab to the panel and set it as active
      ttabs.updateTile(firstPanel.id, {
        tabs: [...firstPanel.tabs, newTabId],
        activeTab: newTabId
      });
    }
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