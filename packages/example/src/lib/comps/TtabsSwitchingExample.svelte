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
    const tab1A = panel1A.newTab("Left");
    tab1A.setComponent("text", { 
      text: "TTabs Instance 1\nRow 1 (80% height)\nLeft Column (30% width)" 
    });

    const panel1B = col1B.newPanel();
    const tab1B = panel1B.newTab("Right");
    tab1B.setComponent("text", { 
      text: "TTabs Instance 1\nRow 1 (80% height)\nRight Column (70% width)" 
    });

    // Second row: two columns with same widths - 50% and 50%
    const col2A = row2.newColumn("50%");
    const col2B = row2.newColumn("50%");
    
    const panel2A = col2A.newPanel();
    const tab2A = panel2A.newTab("Bottom Left");
    tab2A.setComponent("text", { 
      text: "TTabs Instance 1\nRow 2 (20% height)\nLeft Column (50% width)" 
    });

    const panel2B = col2B.newPanel();
    const tab2B = panel2B.newTab("Bottom Right");
    tab2B.setComponent("text", { 
      text: "TTabs Instance 1\nRow 2 (20% height)\nRight Column (50% width)" 
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
    const tab1A = panel1A.newTab("Left");
    tab1A.setComponent("text", { 
      text: "TTabs Instance 2\nRow 1 (40% height)\nLeft Column (70% width)" 
    });

    const panel1B = col1B.newPanel();
    const tab1B = panel1B.newTab("Right");
    tab1B.setComponent("text", { 
      text: "TTabs Instance 2\nRow 1 (40% height)\nRight Column (30% width)" 
    });

    // Second row: two columns with different widths - 25% and 75%
    const col2A = row2.newColumn("25%");
    const col2B = row2.newColumn("75%");
    
    const panel2A = col2A.newPanel();
    const tab2A = panel2A.newTab("Bottom Left");
    tab2A.setComponent("text", { 
      text: "TTabs Instance 2\nRow 2 (60% height)\nLeft Column (25% width)" 
    });

    const panel2B = col2B.newPanel();
    const tab2B = panel2B.newTab("Bottom Right");
    tab2B.setComponent("text", { 
      text: "TTabs Instance 2\nRow 2 (60% height)\nRight Column (75% width)" 
    });

    panel1A.setActive();
  }

  // Switch between ttabs instances
  function switchTtabs(instance: 'ttabs1' | 'ttabs2') {
    activeInstance = instance;
    currentTtabs = instance === 'ttabs1' ? ttabs1 : ttabs2;
  }

  // Initialize both instances
  setupTtabs1();
  setupTtabs2();
</script>

<div class="example-container">
  <header>
    <h1>ttabs switching example</h1>
    <div class="actions">
      <button 
        class:active={activeInstance === 'ttabs1'}
        onclick={() => switchTtabs('ttabs1')}
      >
        Instance 1
      </button>
      <button 
        class:active={activeInstance === 'ttabs2'}
        onclick={() => switchTtabs('ttabs2')}
      >
        Instance 2
      </button>
    </div>
  </header>

  <main>
    <TTabsRoot ttabs={currentTtabs} />
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
    background: #475569;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #64748b;
  }

  button.active {
    background: #4a6cf7;
  }

  main {
    flex: 1;
    overflow: hidden;
  }
</style> 