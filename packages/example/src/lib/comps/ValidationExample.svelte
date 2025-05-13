<script lang="ts">
  import {
    createTtabs,
    TtabsRoot,
    type TileState,
    LayoutValidationError,
    type ValidationErrorHandler
  } from "ttabs-svelte";
  import { onMount } from "svelte";

  // Create a ttabs instance
  const ttabs = createTtabs();
  
  // Track validation errors
  let validationErrors = $state<LayoutValidationError[]>([]);
  
  // Track current layout status
  let layoutStatus = $state("Valid");
  
  // Subscribe to validation errors
  onMount(() => {
    ttabs.onValidationError((error: LayoutValidationError) => {
      validationErrors = [...validationErrors, error];
      layoutStatus = `Invalid: ${error.message} (${error.code})`;
    });
  });
  
  // Create a valid layout
  function createValidLayout() {
    layoutStatus = "Creating valid layout...";
    validationErrors = [];
    
    // Create a default layout
    const grid = ttabs.newGrid();
    const row = grid.newRow();
    const column = row.newColumn();
    const panel = column.newPanel();
    panel.newTab("Default Tab");
    
    layoutStatus = "Valid";
  }
  
  // Create an invalid layout with no rows
  function createInvalidLayoutNoRows() {
    layoutStatus = "Creating invalid layout (no rows)...";
    validationErrors = [];
    
    // Reset tiles first
    ttabs.resetTiles();
    
    // Create a grid with no rows
    ttabs.addGrid();
    
    // This should trigger validation error
    ttabs.validateLayout();
  }
  
  // Create an invalid layout with empty rows
  function createInvalidLayoutEmptyRow() {
    layoutStatus = "Creating invalid layout (empty row)...";
    validationErrors = [];
    
    // Reset tiles first
    ttabs.resetTiles();
    
    // Create a grid with an empty row
    const gridId = ttabs.addGrid();
    ttabs.addRow(gridId);
    
    // This should trigger validation error
    ttabs.validateLayout();
  }
  
  // Create an invalid layout with orphaned tiles
  function createInvalidLayoutOrphanedTiles() {
    layoutStatus = "Creating invalid layout (orphaned tiles)...";
    validationErrors = [];
    
    // Reset tiles first
    ttabs.resetTiles();
    
    // Create a grid
    const gridId = ttabs.addGrid();
    const rowId = ttabs.addRow(gridId);
    const columnId = ttabs.addColumn(rowId);
    
    // Create an orphaned tile by setting a non-existent parent
    const orphanedTileId = ttabs.addPanel(columnId);
    ttabs.updateTile(orphanedTileId, { parent: "non-existent-parent" });
    
    // This should trigger validation error
    ttabs.validateLayout();
  }
  
  // Reset to default layout
  function resetToDefault() {
    layoutStatus = "Resetting to default layout...";
    validationErrors = [];
    
    ttabs.resetToDefaultLayout();
    
    layoutStatus = "Reset to default layout";
  }
  
  // Clear validation errors
  function clearErrors() {
    validationErrors = [];
  }
</script>

<div class="container">
  <div class="header">
    <h1>ttabs Validation Example</h1>
    <div class="status">
      <strong>Layout Status:</strong> {layoutStatus}
    </div>
  </div>

  <div class="controls">
    <button onclick={() => createValidLayout()}>Create Valid Layout</button>
    <button onclick={() => createInvalidLayoutNoRows()}>Create Invalid Layout (No Rows)</button>
    <button onclick={() => createInvalidLayoutEmptyRow()}>Create Invalid Layout (Empty Row)</button>
    <button onclick={() => createInvalidLayoutOrphanedTiles()}>Create Invalid Layout (Orphaned Tiles)</button>
    <button onclick={() => resetToDefault()}>Reset to Default Layout</button>
    <button onclick={() => clearErrors()}>Clear Errors</button>
  </div>

  <div class="ttabs-container">
    <TtabsRoot {ttabs} />
  </div>

  {#if validationErrors.length > 0}
    <div class="errors">
      <h2>Validation Errors</h2>
      <ul>
        {#each validationErrors as error}
          <li>
            <strong>{error.code}:</strong> {error.message}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    padding: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .ttabs-container {
    flex: 1;
    border: 1px solid #ccc;
    margin-bottom: 1rem;
  }

  .errors {
    background-color: #fff0f0;
    border: 1px solid #ffcccc;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
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
