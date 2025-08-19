<script lang="ts">
  // Props for the sidepanel component
  let { title = 'Side Panel', items = [], ttabs, contentId } = $props<{
    title: string;
    items: Array<{ id: string; label: string; icon?: string }>;
    ttabs: any;
    contentId: string;
  }>();

  // Track selected item
  let selectedItem = $state(items.length > 0 ? items[0].id : null);

  // Handle item selection
  function selectItem(id: string) {
    selectedItem = id;
  }
</script>

<div class="sidepanel">
  <div class="sidepanel-header">
    <h3>{title}</h3>
  </div>
  
  <div class="sidepanel-content">
    <ul class="sidepanel-items">
      {#each items as item}
        <li class="sidepanel-item">
          <button 
            type="button"
            class="sidepanel-button" 
            class:active={selectedItem === item.id}
            onclick={() => selectItem(item.id)}
            onkeydown={(e) => e.key === 'Enter' && selectItem(item.id)}
          >
            {#if item.icon}
              <span class="item-icon">{item.icon}</span>
            {/if}
            <span class="item-label">{item.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .sidepanel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f5f5f5;
    border-right: 1px solid #ddd;
  }
  
  .sidepanel-header {
    padding: 1rem;
    border-bottom: 1px solid #ddd;
  }
  
  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }
  
  .sidepanel-content {
    flex: 1;
    overflow: auto;
  }
  
  .sidepanel-items {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .sidepanel-item {
    padding: 0;
    border-bottom: 1px solid #eee;
  }
  
  .sidepanel-button {
    width: 100%;
    padding: 0.8rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
  }
  
  .sidepanel-button:hover {
    background-color: #eaeaea;
  }
  
  .sidepanel-button.active {
    background-color: #e0e0ff;
    font-weight: bold;
  }
  
  .item-icon {
    margin-right: 0.5rem;
    width: 1.5rem;
    text-align: center;
  }
  
  .item-label {
    flex: 1;
  }
</style> 