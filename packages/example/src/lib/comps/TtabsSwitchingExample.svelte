<script lang="ts">
  import {
    createTtabs,
    TTabsRoot,
    DEFAULT_THEME,
  } from "ttabs-svelte";
  import SimpleTextComponent from "./SimpleTextComponent.svelte";

  // Create two different ttabs instances
  let ttabs1 = createTtabs({ theme: DEFAULT_THEME });
  let ttabs2 = createTtabs({ theme: DEFAULT_THEME });

  // Track which ttabs is currently active
  let currentTtabs = $state(ttabs1);
  let activeInstance = $state<'ttabs1' | 'ttabs2'>('ttabs1');

  // Setup the first ttabs instance
  function setupTtabs1() {
    ttabs1.resetTiles();
    ttabs1.registerComponent("text", SimpleTextComponent);

    const grid = ttabs1.newGrid();
    
    // Create two rows - 80% and 20%
    const row1 = grid.newRow("80%");
    const row2 = grid.newRow("20%");

    // First row: two columns with different widths - 30% and 70%
    const col1A = row1.newColumn("30%");
    const col1B = row1.newColumn("70%");
    
    const panel1A = col1A.newPanel();
    panel1A.newTab("Left").setComponent("text", { 
      content: "TTabs Instance 1\nRow 1 (80% height)\nLeft Column (30% width)" 
    });

    const panel1B = col1B.newPanel();
    panel1B.newTab("Right").setComponent("text", { 
      content: "TTabs Instance 1\nRow 1 (80% height)\nRight Column (70% width)" 
    });

    // Second row: two columns with same widths - 50% and 50%
    const col2A = row2.newColumn("50%");
    const col2B = row2.newColumn("50%");
    
    const panel2A = col2A.newPanel();
    panel2A.newTab("Bottom Left").setComponent("text", { 
      content: "TTabs Instance 1\nRow 2 (20% height)\nLeft Column (50% width)" 
    });

    const panel2B = col2B.newPanel();
    panel2B.newTab("Bottom Right").setComponent("text", { 
      content: "TTabs Instance 1\nRow 2 (20% height)\nRight Column (50% width)" 
    });

    panel1A.setActive();
  }

  // Setup the second ttabs instance
  function setupTtabs2() {
    ttabs2.resetTiles();
    ttabs2.registerComponent("text", SimpleTextComponent);

    const grid = ttabs2.newGrid();
    
    // Create two rows - 40% and 60% (reversed proportions)
    const row1 = grid.newRow("40%");
    const row2 = grid.newRow("60%");

    // First row: two columns with different widths - 70% and 30% (reversed)
    const col1A = row1.newColumn("70%");
    const col1B = row1.newColumn("30%");
    
    const panel1A = col1A.newPanel();
    panel1A.newTab("Left").setComponent("text", { 
      content: "TTabs Instance 2\nRow 1 (40% height)\nLeft Column (70% width)" 
    });

    const panel1B = col1B.newPanel();
    panel1B.newTab("Right").setComponent("text", { 
      content: "TTabs Instance 2\nRow 1 (40% height)\nRight Column (30% width)" 
    });

    // Second row: two columns with different widths - 25% and 75%
    const col2A = row2.newColumn("25%");
    const col2B = row2.newColumn("75%");
    
    const panel2A = col2A.newPanel();
    panel2A.newTab("Bottom Left").setComponent("text", { 
      content: "TTabs Instance 2\nRow 2 (60% height)\nLeft Column (25% width)" 
    });

    const panel2B = col2B.newPanel();
    panel2B.newTab("Bottom Right").setComponent("text", { 
      content: "TTabs Instance 2\nRow 2 (60% height)\nRight Column (75% width)" 
    });

    panel1A.setActive();
  }

  // Switch between ttabs instances
  function switchToTtabs1() {
    activeInstance = 'ttabs1';
    currentTtabs = ttabs1;
  }

  function switchToTtabs2() {
    activeInstance = 'ttabs2';
    currentTtabs = ttabs2;
  }

  // Initialize both instances on mount
  setupTtabs1();
  setupTtabs2();
</script>

<div class="switching-example">
  <div class="controls">
    <h3>TTabs Switching Test</h3>
    <p>This example demonstrates the issue where switching ttabs instances doesn't update row heights and column widths properly.</p>
    
    <div class="button-group">
      <button 
        class:active={activeInstance === 'ttabs1'}
        onclick={switchToTtabs1}
      >
        Switch to TTabs 1 (80%/20% rows, 30%/70% & 50%/50% cols)
      </button>
      
      <button 
        class:active={activeInstance === 'ttabs2'}
        onclick={switchToTtabs2}
      >
        Switch to TTabs 2 (40%/60% rows, 70%/30% & 25%/75% cols)
      </button>
    </div>

    <div class="info">
      <p><strong>Current Instance:</strong> {activeInstance}</p>
      <p><strong>Root Grid ID:</strong> {currentTtabs.rootGridId}</p>
      <p><strong>Expected Behavior:</strong> Row heights and column widths should immediately update when switching</p>
      <p><strong>Bug:</strong> Sizes may not update because sizedRows/sizedColumns don't recalculate when ttabs prop changes</p>
    </div>
  </div>
  
  <div class="ttabs-container">
    <TTabsRoot ttabs={currentTtabs} />
  </div>
</div>

<style>
  .switching-example {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: system-ui, sans-serif;
  }

  .controls {
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    flex-shrink: 0;
  }

  .controls h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .controls p {
    margin: 0 0 1rem 0;
    color: #666;
    font-size: 0.9rem;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  button:hover {
    background: #f0f0f0;
  }

  button.active {
    background: #007acc;
    color: white;
    border-color: #005a9e;
  }

  .info {
    background: #fff;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .info p {
    margin: 0.25rem 0;
  }

  .ttabs-container {
    flex: 1;
    overflow: hidden;
  }
</style> 