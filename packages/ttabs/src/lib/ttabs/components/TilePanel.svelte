<script lang="ts">
  import TileTab from "./TileTab.svelte";
  import type { TtabsProps } from "./props";
  import type { TilePanelState } from "../types/tile-types";
  import { onMount, onDestroy } from "svelte";
  import { BROWSER } from "esm-env";
  import type { Component } from "svelte";

  let { ttabs, id }: TtabsProps = $props();

  const CustomCloseButton: Component | undefined =
    ttabs.theme?.components?.closeButton;

  // Get panel data
  const panel = $derived(ttabs.getTile<TilePanelState>(id));

  // Get tabs and active tab
  const tabIds = $derived(panel?.type === "panel" ? panel.tabs : []);
  const activeTab = $derived(panel?.type === "panel" ? panel.activeTab : null);
  const focusedTab = $derived(ttabs.focusedActiveTab);

  // Get tab objects from ids
  const tabs = $derived(
    tabIds.map((id) => {
      return ttabs.getTab(id);
    })
  );

  // Drag state
  let draggedTabId: string | null = $state(null);
  let draggedPanelId: string | null = $state(null);
  let dragOverTabId: string | null = $state(null);
  let dragPosition: "before" | "after" | null = $state(null);
  let tabBarElement: HTMLElement | null = $state(null);
  let contentElement: HTMLElement | null = $state(null);
  let isDragging = $state(false);
  let dragTarget: { panelId: string; area: "tab-bar" | "content" } | null =
    $state(null);
  let splitDirection: "top" | "right" | "bottom" | "left" | "center" | null =
    $state(null);

  onMount(() => {
    if (BROWSER) {
      // Add mouseup event to reset visual indicators immediately
      document.addEventListener("mouseup", handleMouseUp);
      // Keep dragend as backup for when mouseup might not fire
      document.addEventListener("dragend", resetDragState);
    }
  });

  onDestroy(() => {
    if (BROWSER) {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("dragend", resetDragState);
    }
  });

  $effect(() => {
    if (activeTab) {
      setTimeout(() => scrollToTab(activeTab), 0);
    }
  });

  /**
   * Scrolls the tab bar to make the specified tab visible
   * @param tabId The ID of the tab to scroll into view
   */
  function scrollToTab(tabId: string) {
    if (!tabBarElement) return;

    const tabElement = tabBarElement.querySelector(
      `[data-tab-id="${tabId}"]`
    ) as HTMLElement;
    if (!tabElement) return;

    // Check if the tab is fully visible in the scroll view
    const tabRect = tabElement.getBoundingClientRect();
    const barRect = tabBarElement.getBoundingClientRect();

    const isTabFullyVisible =
      tabRect.left >= barRect.left && tabRect.right <= barRect.right;

    // Only scroll if the tab is not fully visible
    if (!isTabFullyVisible) {
      tabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }

  function handleMouseUp() {
    // Reset visual indicators immediately when mouse button is released
    // We'll just clear the visual indicators but keep the drag operation going
    // This way the drag can complete normally, but the visual indicators disappear immediately
    if (isDragging) {
      dragOverTabId = null;
      dragPosition = null;
      splitDirection = null;
    }
  }

  // Helper function to determine which area of the content we're hovering over
  function getQuadrant(
    e: DragEvent,
    element: HTMLElement
  ): "top" | "right" | "bottom" | "left" | "center" {
    if (!element) return "bottom"; // Default fallback

    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element
    const width = rect.width;
    const height = rect.height;

    // Calculate relative position (0-1)
    const relativeX = x / width;
    const relativeY = y / height;

    // Define the central area (60% of width and height)
    const centerMargin = 0.2; // (1 - 0.6) / 2 = 0.2 for 60% center area

    // Check if we're in the central area
    if (
      relativeX >= centerMargin &&
      relativeX <= 1 - centerMargin &&
      relativeY >= centerMargin &&
      relativeY <= 1 - centerMargin
    ) {
      return "center";
    }

    // If not in center, use the quadrant detection for the outer areas
    // We use a diamond-like area division rather than just rectangles
    // This creates more natural quadrants for splitting
    if (relativeY < relativeX) {
      // We're either in the top or right quadrant
      if (relativeY < 1 - relativeX) {
        return "top";
      } else {
        return "right";
      }
    } else {
      // We're either in the left or bottom quadrant
      if (relativeY < 1 - relativeX) {
        return "left";
      } else {
        return "bottom";
      }
    }
  }

  // Handle tab click
  function selectTab(tabId: string) {
    if (panel?.type === "panel") {
      // Get the tab to check if it's lazy
      try {
        const tab = ttabs.getTab(tabId);
        if (tab.isLazy === true) {
          // Convert lazy tab to non-lazy when clicked
          ttabs.updateTile(tabId, { isLazy: false });
        }
      } catch (e) {
        // Tab not found or invalid, ignore the error
      }

      ttabs.setActiveTab(tabId);
    }
  }

  // Drag handlers
  function onDragStart(e: DragEvent, tabId: string) {
    // Tab is already active due to mousedown event

    // Store the dragged tab ID and panel ID
    draggedTabId = tabId;
    draggedPanelId = id;
    isDragging = true;

    // Store the panel ID and tab ID in the dataTransfer
    if (e.dataTransfer) {
      const dragData = {
        tabId,
        panelId: id,
        action: "move", // Changed from 'reorder' to 'move' to indicate it can be moved between panels
      };
      e.dataTransfer.setData("application/json", JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = "move";
    }
  }

  function onDragOver(e: DragEvent) {
    // Prevent default to allow drop
    e.preventDefault();

    // Set the current drag target to tab bar of this panel
    dragTarget = { panelId: id, area: "tab-bar" };

    // Skip if no tab bar
    if (!tabBarElement) {
      return;
    }

    // Find the tab we're over based on mouse position
    const mouseX = e.clientX;
    const tabElements = Array.from(
      tabBarElement.querySelectorAll(".ttabs-tab-header")
    ) as HTMLElement[];

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
      const tabId = tabElement.getAttribute("data-tab-id");

      // Check if mouse is over this tab
      if (mouseX >= rect.left && mouseX <= rect.right) {
        // If we're over the dragged tab itself, don't set it as a drop target
        if (tabId === draggedTabId && id === draggedPanelId) {
          foundTab = true;
          dragOverTabId = null;
          dragPosition = null;
          break;
        }

        // Determine left/right position
        const midpoint = rect.left + rect.width / 2;
        const position = mouseX < midpoint ? "before" : "after";

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
        dragOverTabId = lastTab.getAttribute("data-tab-id");
        dragPosition = "after";
      } else {
        // We're not over any tab or after the last tab
        dragOverTabId = null;
        dragPosition = null;
      }
    }

    // Reset split direction when over tab bar
    splitDirection = null;
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    dragTarget = { panelId: id, area: "tab-bar" };
    splitDirection = null;
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    // Only clear if we're the current target
    if (dragTarget?.panelId === id && dragTarget?.area === "tab-bar") {
      dragTarget = null;
      dragOverTabId = null;
      dragPosition = null;
    }
  }

  // Content area drag handlers
  function onContentDragEnter(e: DragEvent) {
    e.preventDefault();
    dragTarget = { panelId: id, area: "content" };

    // Don't show split indicators if we're dragging the only tab of this panel
    if (draggedTabId && draggedPanelId === id && tabIds.length === 1) {
      splitDirection = null;
      return;
    }

    // Determine which quadrant we're in
    if (contentElement) {
      splitDirection = getQuadrant(e, contentElement);
    }
  }

  function onContentDragLeave(e: DragEvent) {
    e.preventDefault();
    // Only clear if we're the current target
    if (dragTarget?.panelId === id && dragTarget?.area === "content") {
      dragTarget = null;
      splitDirection = null;
    }
  }

  function onContentDragOver(e: DragEvent) {
    e.preventDefault();
    // Set the current drag target
    dragTarget = { panelId: id, area: "content" };

    // Don't show split indicators if we're dragging the only tab of this panel
    if (draggedTabId && draggedPanelId === id && tabIds.length === 1) {
      splitDirection = null;
      return;
    }

    // Update the split direction based on mouse position
    if (contentElement) {
      splitDirection = getQuadrant(e, contentElement);
    }
  }

  function onContentDrop(e: DragEvent) {
    e.preventDefault();

    try {
      // Get the drag data
      const dataText = e.dataTransfer?.getData("application/json");
      if (!dataText) return;

      const dragData = JSON.parse(dataText);

      // Check if we're dropping on the content area of a panel
      if (
        dragTarget?.panelId === id &&
        dragTarget?.area === "content" &&
        splitDirection
      ) {
        // Get the final split direction at the moment of drop
        const finalSplitDirection = contentElement
          ? getQuadrant(e, contentElement)
          : "bottom";

        // Check if we're trying to split a panel with its only tab
        if (dragData.panelId === id && tabIds.length === 1) {
          return;
        }

        // Handle the action based on the drop area
        if (dragData.action === "move" && dragData.tabId) {
          if (finalSplitDirection === "center") {
            // Skip if dropping in the center of its own panel
            if (dragData.panelId !== id) {
              // If dropping in center, move the tab to this panel
              ttabs.moveTab(dragData.tabId, id);
            }
          } else {
            // Otherwise split the panel
            ttabs.splitPanel(dragData.tabId, id, finalSplitDirection);
          }
        }
      }
    } catch (error) {
      console.error("Error processing content drop:", error);
    } finally {
      resetDragState();
    }
  }

  function onDrop(e: DragEvent) {
    // Prevent default browser handling
    e.preventDefault();

    try {
      // Get the drag data
      const dataText = e.dataTransfer?.getData("application/json");
      if (!dataText) return;

      const dragData = JSON.parse(dataText);

      // We can handle both reordering and moving between panels
      if (dragData.action === "move" && dragData.tabId) {
        const sourceTabId = dragData.tabId;
        const sourcePanelId = dragData.panelId;

        // Handle tab movement across panels
        if (sourcePanelId !== id) {
          // Moving tab from a different panel to this one
          // Determine the insertion index based on drop position
          let targetIndex;

          if (!dragOverTabId) {
            // If not hovering over a tab, append to the end
            targetIndex = tabIds.length;
          } else {
            // Calculate index based on the tab we're over
            targetIndex = tabIds.indexOf(dragOverTabId);
            if (dragPosition === "after" && targetIndex >= 0) {
              targetIndex += 1;
            }
          }

          // Move the tab between panels
          ttabs.moveTab(sourceTabId, id, targetIndex);
        } else {
          // Reordering tabs within the same panel
          const sourceIndex = tabIds.indexOf(sourceTabId);

          // Skip reordering if:
          // 1. Source tab doesn't exist in this panel
          // 2. We're dropping on the same tab that's being dragged
          // 3. We're dropping in an area without a target tab
          if (
            sourceIndex === -1 ||
            dragOverTabId === sourceTabId ||
            !dragOverTabId
          ) {
            return;
          }

          // Find the target tab index
          const targetIndex = tabIds.indexOf(dragOverTabId);
          if (targetIndex === -1) return;

          // Calculate the insertion index
          let insertIndex =
            dragPosition === "before" ? targetIndex : targetIndex + 1;

          // Skip if dropping in the same position
          if (
            sourceIndex === insertIndex ||
            (sourceIndex === insertIndex - 1 && dragPosition === "after")
          ) {
            return;
          }

          // Create a new array and move the tab
          const newTabs = [...tabIds];
          newTabs.splice(sourceIndex, 1);

          // Adjust insert index if needed
          if (sourceIndex < insertIndex) insertIndex--;

          newTabs.splice(insertIndex, 0, sourceTabId);
          ttabs.updateTile(id, { tabs: newTabs });
        }
      }
    } catch (error) {
      console.error("Error processing drop:", error);
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
    dragTarget = null;
    splitDirection = null;
    isDragging = false;
  }

  /**
   * Closes a tab and prevents event propagation
   * @param e The click event
   * @param tabId The ID of the tab to close
   */
  function closeTab(e: Event, tabId: string) {
    // Prevent event from propagating to parent elements
    e.preventDefault();
    e.stopPropagation();

    // Close the tab
    ttabs.closeTab(tabId);
  }
</script>

{#if panel?.type === "panel"}
  <div
    class="ttabs-panel {ttabs.theme?.classes?.panel || ''}"
    data-tile-id={id}
    class:drop-target={draggedTabId && draggedPanelId !== id}
    role="tabpanel"
  >
    <div
      class="ttabs-panel-bar"
      class:has-right-components={panel?.rightComponents?.length}
      class:has-left-components={panel?.leftComponents?.length}
    >
      <!-- Left panel UI components -->
      {#if panel?.leftComponents?.length}
        <div class="ttabs-panel-left">
          {#each panel.leftComponents as leftComp}
            {@const componentData = ttabs.getContentComponent(
              leftComp.componentId
            )}
            {#if componentData}
              {@const LeftComponent = componentData.component}
              {@const leftProps = {
                ...componentData.defaultProps,
                ...leftComp.props,
                ttabs,
                panelId: id,
              }}
              <LeftComponent {...leftProps} />
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Regular tab bar -->
      <div
        class="ttabs-tab-bar {ttabs.theme?.classes?.['tab-bar'] || ''}"
        bind:this={tabBarElement}
        ondragover={onDragOver}
        ondragenter={onDragEnter}
        ondragleave={onDragLeave}
        ondrop={onDrop}
        role="tablist"
        aria-label="Tabs"
        tabindex="0"
      >
        {#each tabs as tab (tab.id)}
          <!-- Default tab header implementation -->
          <div
            class="ttabs-tab-header {ttabs.theme?.classes?.['tab-header'] ||
              ''} {tab.id === activeTab
              ? `ttabs-tab-header-active ${ttabs.theme?.classes?.['tab-header-active'] || ''}`
              : ''} {tab.id === focusedTab
              ? `ttabs-tab-header-focused ${ttabs.theme?.classes?.['tab-header-focused'] || ''}`
              : ''}"
            class:active={tab.id === activeTab}
            class:focused={tab.id === focusedTab}
            class:is-dragging={tab.id === draggedTabId}
            class:drop-before={tab.id === dragOverTabId &&
              dragPosition === "before"}
            class:drop-after={tab.id === dragOverTabId &&
              dragPosition === "after"}
            data-tab-id={tab.id}
            draggable="true"
            onmousedown={(e) => {
              // Don't select the tab if the close button was clicked
              if (
                e.target instanceof HTMLElement &&
                (e.target.classList.contains("ttabs-tab-close") ||
                  e.target.closest(".ttabs-tab-close"))
              ) {
                return;
              }
              selectTab(tab.id);
            }}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTab(tab.id);
              }
            }}
            ondragstart={(e) => onDragStart(e, tab.id)}
            ondragend={onDragEnd}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls="{id}-content"
            tabindex="0"
          >
            <span class="ttabs-tab-title">
              <span class:ttabs-lazy-tab={tab.isLazy === true}>
                {tab.name || "Unnamed Tab"}
              </span>
            </span>

            {#if CustomCloseButton}
              <CustomCloseButton
                tabId={tab.id}
                {ttabs}
                onClose={(e: Event) => closeTab(e, tab.id)}
              />
            {:else}
              <button
                class="ttabs-tab-close {ttabs.theme?.classes?.[
                  'tab-close-button'
                ] || ''}"
                style="display: var(--ttabs-show-close-button, none)"
                onclick={(e) => closeTab(e, tab.id)}
              >defaultComponentIdForEmptyTiles
                ✕defaultComponentIdForEmptyTiles
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Right panel UI components -->
      {#if panel?.rightComponents?.length}
        <div class="ttabs-panel-right">
          {#each panel.rightComponents as rightComp}
            {@const componentData = ttabs.getContentComponent(
              rightComp.componentId
            )}
            {#if componentData}
              {@const RightComponent = componentData.component}
              {@const rightProps = {
                ...componentData.defaultProps,
                ...rightComp.props,
                ttabs,
                panelId: id,
              }}
              <RightComponent {...rightProps} />
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <div
      class="ttabs-tab-content selectable-text {ttabs.theme?.classes?.[
        'tab-content'
      ] || ''}"
      id="{id}-content"
      bind:this={contentElement}
      ondragenter={onContentDragEnter}
      ondragleave={onContentDragLeave}
      ondragover={onContentDragOver}
      ondrop={onContentDrop}
      role="tabpanel"
      tabindex="0"
      aria-labelledby={activeTab ? `${activeTab}` : undefined}
      class:split-indicator-top={splitDirection === "top"}
      class:split-indicator-right={splitDirection === "right"}
      class:split-indicator-bottom={splitDirection === "bottom"}
      class:split-indicator-left={splitDirection === "left"}
      class:split-indicator-center={splitDirection === "center"}
    >
      {#if activeTab}
        <TileTab {ttabs} id={activeTab} />
      {:else if ttabs.defaultComponentIdForEmptyTiles}
        {@const NoContent = ttabs.getContentComponent(
          ttabs.defaultComponentIdForEmptyTiles
        )?.component}
        {#if NoContent}
          <NoContent />
        {/if}
      {:else}
        <div
          class="ttabs-empty-state {ttabs.theme?.classes?.['empty-state'] ||
            ''}"
        >
          No active tab
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="ttabs-error {ttabs.theme?.classes?.error || ''}">
    Panel not found or invalid type
  </div>
{/if}

<style>
  :global {
    .ttabs-panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: var(--ttabs-panel-bg);
      color: var(--ttabs-text-color);
      border: var(--ttabs-border);
      border-radius: none;
    }

    .ttabs-panel-bar {
      display: flex;
      width: 100%;
      align-items: center;
      background-color: var(--ttabs-tab-bar-bg);
      border-bottom: var(--ttabs-tab-bar-border);
    }

    .ttabs-panel-left,
    .ttabs-panel-right {
      display: flex;
      align-items: center;
      padding: 0 var(--ttabs-panel-ui-padding, 7px);
    }

    .ttabs-panel.drop-target {
      outline: var(--ttabs-drop-target-outline);
      outline-offset: -2px;
    }

    .ttabs-tab-bar {
      display: flex;
      flex-direction: row;
      flex: 1;
      background-color: var(--ttabs-tab-bar-bg);
      border-bottom: var(--ttabs-tab-bar-border);
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }

    .ttabs-tab-header {
      padding: var(--ttabs-tab-header-padding);
      cursor: pointer;
      white-space: nowrap;
      font-size: var(--ttabs-tab-header-font-size);
      transition: background-color var(--ttabs-transition-duration)
        var(--ttabs-transition-timing);
      position: relative;
      display: flex;
      align-items: center;
      color: var(--ttabs-tab-text-color);
      border-top-left-radius: none;
      border-top-right-radius: none;
    }

    .ttabs-tab-title {
      flex-grow: 1;
    }

    .ttabs-tab-close {
      margin-left: var(--ttabs-tab-close-margin);
      background: none;
      border: none;
      font-size: 14px;
      cursor: pointer;
      padding: 0;
      width: var(--ttabs-tab-close-size);
      height: var(--ttabs-tab-close-size);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: none;
      color: var(--ttabs-close-button-color);
    }

    .ttabs-tab-close:hover {
      background-color: var(--ttabs-close-button-hover-bg);
      color: var(--ttabs-close-button-hover-color);
    }

    /* Active tab styling - default implementation */
    .ttabs-tab-header-active {
      background-color: var(--ttabs-active-tab-bg);
      color: var(--ttabs-tab-active-text-color);
    }

    /* Focused tab styling */
    .ttabs-tab-header-focused {
      border-bottom: none;
      box-shadow: inset 0 var(--ttabs-tab-indicator-size) 0
        var(--ttabs-active-tab-indicator);
    }

    .ttabs-tab-header.is-dragging {
      opacity: 0.7;
      background-color: var(--ttabs-active-tab-bg);
    }

    .ttabs-tab-header.drop-before::before {
      content: "";
      position: absolute;
      left: var(--ttabs-drop-indicator-offset);
      top: 0px;
      height: 100%;
      width: var(--ttabs-drop-indicator-width);
      background-color: var(--ttabs-drop-indicator-color);
    }

    .ttabs-tab-header.drop-after::after {
      content: "";
      position: absolute;
      right: var(--ttabs-drop-indicator-offset);
      top: 0;
      height: 100%;
      width: var(--ttabs-drop-indicator-width);
      background-color: var(--ttabs-drop-indicator-color);
    }

    .ttabs-tab-content {
      flex: 1;
      overflow: hidden;
      position: relative;
      background-color: var(--ttabs-content-bg);
    }

    /* Split indicators */
    .ttabs-tab-content.split-indicator-top::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 50%;
      background-color: var(--ttabs-split-indicator-color);
      z-index: 10;
      pointer-events: none;
    }

    .ttabs-tab-content.split-indicator-right::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 50%;
      height: 100%;
      background-color: var(--ttabs-split-indicator-color);
      z-index: 10;
      pointer-events: none;
    }

    .ttabs-tab-content.split-indicator-bottom::before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 50%;
      background-color: var(--ttabs-split-indicator-color);
      z-index: 10;
      pointer-events: none;
    }

    .ttabs-tab-content.split-indicator-left::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      background-color: var(--ttabs-split-indicator-color);
      z-index: 10;
      pointer-events: none;
    }

    .ttabs-tab-content.split-indicator-center::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--ttabs-split-indicator-color);
      z-index: 10;
      pointer-events: none;
      box-sizing: border-box;
    }

    .ttabs-empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--ttabs-empty-state-color);
      font-style: italic;
    }

    .ttabs-error {
      padding: var(--ttabs-error-padding);
      color: var(--ttabs-error-color);
      background-color: var(--ttabs-error-bg);
      border: var(--ttabs-error-border);
      border-radius: none;
    }

    /* Lazy tab styling */
    .ttabs-lazy-tab {
      font-style: italic;
    }
  }
</style>
