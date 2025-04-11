# Focused Tab Proposal for Ttabs

## Overview

This proposal introduces a focused tab state to the Ttabs system. While the current implementation supports multiple panels each with their own active tab, this enhancement will introduce a single globally focused tab across the entire system.

## Terminology

We propose using `focusedActiveTab` as the terminology for the globally focused tab. This clearly communicates that:
1. It is a tab that has focus (distinguishing it from other active tabs)
2. It maintains the "active" terminology that is used throughout the system

## Implementation Details

### State Management

Add a new state variable to the `Ttabs` class, with controlled access:

```typescript
// In Ttabs class
private focusedActiveTabInternal = $state<string | null>(null);

// Public read-only derived value
focusedActiveTab = $derived(this.focusedActiveTabInternal);
```

### Core Invariant

As long as there are active tabs in the system, one of them must always be the focused tab. This invariant ensures there's always a clear indication of which tab has focus if any tabs are open.

### When to Update Focus

The focused tab should be updated in the following scenarios:

1. **User interaction**: When a user clicks on a tab, it should become both the active tab for its panel and the globally focused tab
2. **Content-initiated focus**: When content within a tab initiates a focus event (e.g., starting to edit content)
3. **Programmatic selection**: When code explicitly sets a tab as focused
4. **Tab closure**: When a focused tab is closed, focus should transfer to another active tab
5. **Panel switching**: When switching between panels, the active tab in the new panel becomes focused

### Public API Additions

```typescript
// Get the focused tab (exposed as a derived value)
// focusedActiveTab = $derived(this.focusedActiveTabInternal);

// Set a tab as the focused tab
setFocusedActiveTab(tabId: string): boolean;
```

### Integration with Existing Methods

Update `setActiveTab` method to also set the focused tab:

```typescript
setActiveTab(tabId: string): boolean {
  // Existing implementation...
  
  // Also set as focused tab
  this.focusedActiveTabInternal = tabId;
  return true;
}
```

Update tab closing and removal methods to maintain the focused tab invariant:

```typescript
closeTab(tabId: string): boolean {
  // If we're closing the focused tab, we need to find a new tab to focus
  if (this.focusedActiveTabInternal === tabId) {
    // Find another tab to focus (same panel first, then other panels)
    // ...
  }
  
  // Existing implementation...
}
```

### Serialization/Deserialization

The focused tab state should be included in the serialized layout to persist the user's focus when saving/loading layouts.

## UI Considerations

1. **Visual distinction**: The focused tab should have distinct styling from other active tabs
2. **Keyboard navigation**: Support for keyboard shortcuts to navigate between tabs
3. **Tab operations**: Operations like closing tabs should automatically maintain the focused state invariant

## Benefits

1. **Improved keyboard navigation**: Clear indication of which tab receives keyboard input
2. **Content targeting**: APIs can target the focused tab without needing to first identify its panel
3. **Visual clarity**: Users can easily identify which tab is currently in focus
4. **Cross-panel operations**: Enables operations that work across panels based on focus

## Implementation Plan

1. Add the `focusedActiveTab` state to the Ttabs class with private internal state
2. Update existing tab activation methods
3. Modify tab closing and removal methods to maintain the focus invariant
4. Update the serialization/deserialization logic
5. Create visual indicators in the UI components

## Backward Compatibility

This change maintains full backward compatibility as it only adds new functionality without modifying existing behavior. 