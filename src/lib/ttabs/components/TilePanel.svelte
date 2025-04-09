<script lang="ts">
  import TileTab from './TileTab.svelte';
  import type { TtabsProps } from './props';
  import type { TilePanel as TilePanelType, TileTab as TileTabType } from '../types/tile-types';
  
  let { ttabs, id }: TtabsProps = $props();
  
  // Get panel data
  const panel = $derived(ttabs.getTile<TilePanelType>(id));
  
  // Get tabs and active tab
  const tabs = $derived(panel?.type === 'panel' ? panel.tabs : []);
  const activeTab = $derived(panel?.type === 'panel' ? panel.activeTab : null);
  
  // Drag state
  let draggedTabId: string | null = $state(null);
  let draggedPanelId: string | null = $state(null);
  let dragOverTabId: string | null = $state(null);
  let dragPosition: 'before' | 'after' | null = $state(null);
  let tabBarElement: HTMLElement | null = $state(null);
  
  // Handle tab click
  function selectTab(tabId: string) {
    if (panel?.type === 'panel') {
      ttabs.setActiveTab(tabId);
    }
  }
  
  // Drag handlers
  function onDragStart(e: DragEvent, tabId: string) {
    // Store the dragged tab ID and panel ID
    draggedTabId = tabId;
    draggedPanelId = id;
    
    // Store the panel ID and tab ID in the dataTransfer
    if (e.dataTransfer) {
      const dragData = {
        tabId,
        panelId: id,
        action: 'move' // Changed from 'reorder' to 'move' to indicate it can be moved between panels
      };
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = 'move';
    }
  }
  
  function onDragOver(e: DragEvent) {
    // Prevent default to allow drop
    e.preventDefault();
    
    // Skip if no tab bar
    if (!tabBarElement) {
      return;
    }
    
    // Find the tab we're over based on mouse position
    const mouseX = e.clientX;
    const tabElements = Array.from(tabBarElement.querySelectorAll('.ttabs-tab-header')) as HTMLElement[];
    
    // If no tabs, reset state
    if (tabElements.length === 0) {
      dragOverTabId = null;
      dragPosition = null;
      return;
    }
    
    // Check each tab to see if we're over it
    let foundTab = false;
    
    for (const tabElement of tabElements) {
      const rect = tabElement.getBoundingClientRect();
      
      // Get the current tab ID
      const tabId = tabElement.getAttribute('data-tab-id');
      
      // If we're over the tab being dragged, mark it as found but don't set it as target
      // This prevents the tab from being moved when dropped on itself
      if (tabId === draggedTabId && id === draggedPanelId) {
        foundTab = true;
        dragOverTabId = null;
        dragPosition = null;
        break;
      }
      
      // Check if mouse is over this tab
      if (mouseX >= rect.left && mouseX <= rect.right) {
        // Determine left/right position
        const midpoint = rect.left + rect.width / 2;
        const position = mouseX < midpoint ? 'before' : 'after';
        
        // Update state
        dragOverTabId = tabId;
        dragPosition = position;
        foundTab = true;
        break;
      }
    }
    
    // If we're not over any tab, see if we should append to the end
    if (!foundTab) {
      // Check if we're after the last tab
      const lastTab = tabElements[tabElements.length - 1];
      if (lastTab && mouseX > lastTab.getBoundingClientRect().right) {
        dragOverTabId = lastTab.getAttribute('data-tab-id');
        dragPosition = 'after';
      } else {
        // We're not over any tab or after the last tab
        dragOverTabId = null;
        dragPosition = null;
      }
    }
  }
  
  function onDrop(e: DragEvent) {
    // Prevent default browser handling
    e.preventDefault();
    
    try {
      // Get the drag data
      const dataText = e.dataTransfer?.getData('application/json');
      if (!dataText) return;
      
      const dragData = JSON.parse(dataText);
      
      // We can handle both reordering and moving between panels
      if (dragData.action === 'move' && dragData.tabId) {
        const sourceTabId = dragData.tabId;
        const sourcePanelId = dragData.panelId;
        
        // Handle tab movement across panels
        if (sourcePanelId !== id) {
          // Moving tab from a different panel to this one
          // Determine the insertion index based on drop position
          let targetIndex;
          
          if (!dragOverTabId) {
            // If not hovering over a tab, append to the end
            targetIndex = tabs.length;
          } else {
            // Calculate index based on the tab we're over
            targetIndex = tabs.indexOf(dragOverTabId);
            if (dragPosition === 'after' && targetIndex >= 0) {
              targetIndex += 1;
            }
          }
          
          // Move the tab between panels
          ttabs.moveTab(sourceTabId, sourcePanelId, id, targetIndex);
        } else {
          // Reordering tabs within the same panel
          const sourceIndex = tabs.indexOf(sourceTabId);
          
          // If we're not over any tab and not dragging over self, append to the end if not already there
          if (!dragOverTabId) {
            // Check if we're not already at the end of the list
            if (sourceIndex !== -1 && sourceIndex !== tabs.length - 1) {
              const newTabs = [...tabs];
              newTabs.splice(sourceIndex, 1);
              newTabs.push(sourceTabId);
              ttabs.updateTile(id, { tabs: newTabs });
            }
            return;
          }
          
          // Find the target tab index
          const targetIndex = tabs.indexOf(dragOverTabId);
          
          // Exit if source index is invalid or target is invalid
          if (sourceIndex === -1 || targetIndex === -1) {
            return;
          }
          
          // Determine insert position based on drop position
          let insertIndex = dragPosition === 'before' ? targetIndex : targetIndex + 1;
          
          // Skip if trying to drop in the same position
          if (sourceIndex === insertIndex || 
              (sourceIndex === insertIndex - 1 && dragPosition === 'after')) {
            return;
          }
          
          // Create a new array of tabs
          const newTabs = [...tabs];
          
          // Remove the source tab
          newTabs.splice(sourceIndex, 1);
          
          // Adjust insert index if needed
          if (sourceIndex < insertIndex) {
            insertIndex--;
          }
          
          // Insert at the new position
          newTabs.splice(insertIndex, 0, sourceTabId);
          
          // Update the panel
          ttabs.updateTile(id, { tabs: newTabs });
        }
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    } finally {
      resetDragState();
    }
  }
  
  function onDragEnd() {
    resetDragState();
  }
  
  function resetDragState() {
    // Reset drag states
    draggedTabId = null;
    draggedPanelId = null;
    dragOverTabId = null;
    dragPosition = null;
  }
</script>

{#if panel?.type === 'panel'}
  <div 
    class="ttabs-panel" 
    data-tile-id={id}
    class:drop-target={draggedTabId && draggedPanelId !== id}
  >
    <div 
      class="ttabs-tab-bar" 
      bind:this={tabBarElement}
      on:dragover={onDragOver}
      on:dragenter|preventDefault
      on:drop={onDrop}
    >
      {#each tabs as tabId}
        <div 
          class="ttabs-tab-header" 
          class:active={tabId === activeTab}
          class:is-dragging={tabId === draggedTabId}
          class:drop-before={tabId === dragOverTabId && dragPosition === 'before'}
          class:drop-after={tabId === dragOverTabId && dragPosition === 'after'}
          data-tab-id={tabId}
          draggable="true"
          on:click={() => selectTab(tabId)}
          on:dragstart={(e) => onDragStart(e, tabId)}
          on:dragend={onDragEnd}
        >
          {#if ttabs.getTile<TileTabType>(tabId)?.type === 'tab'}
            {ttabs.getTile<TileTabType>(tabId)?.name || 'Unnamed Tab'}
          {/if}
        </div>
      {/each}
    </div>
    
    <div class="ttabs-tab-content">
      {#if activeTab}
        <TileTab ttabs={ttabs} id={activeTab} />
      {:else}
        <div class="ttabs-empty-state">
          No active tab
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="ttabs-error">
    Panel not found or invalid type
  </div>
{/if}

<style>
  .ttabs-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--ttabs-panel-bg, white);
  }
  
  .ttabs-panel.drop-target {
    outline: 2px dashed rgba(74, 108, 247, 0.5);
    outline-offset: -2px;
  }
  
  .ttabs-tab-bar {
    display: flex;
    flex-direction: row;
    background-color: var(--ttabs-tab-bar-bg, #f5f5f5);
    border-bottom: var(--ttabs-tab-bar-border, 1px solid #ddd);
    overflow-x: auto;
    overflow-y: hidden;
  }
  
  .ttabs-tab-header {
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-right: 1px solid #ddd;
    white-space: nowrap;
    font-size: 0.9rem;
    transition: background-color 0.1s ease;
    position: relative;
  }
  
  .ttabs-tab-header.active {
    background-color: var(--ttabs-active-tab-bg, white);
    border-bottom: 2px solid var(--ttabs-active-tab-indicator, #4a6cf7);
    font-weight: 500;
  }
  
  .ttabs-tab-header.is-dragging {
    opacity: 0.6;
    background-color: #e0e0e0;
  }
  
  .ttabs-tab-header.drop-before::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background-color: #4a6cf7;
  }
  
  .ttabs-tab-header.drop-after::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background-color: #4a6cf7;
  }
  
  .ttabs-tab-content {
    flex: 1;
    overflow: hidden;
  }
  
  .ttabs-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }
  
  .ttabs-error {
    padding: 1rem;
    color: tomato;
    background-color: #fff5f5;
    border: 1px solid tomato;
    border-radius: 4px;
  }
</style> 