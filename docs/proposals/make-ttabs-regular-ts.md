# Proposal: Making Ttabs a Regular TypeScript Class

## Overview

This proposal suggests separating the core functionality of Ttabs from its Svelte-specific implementation. The goal is to create a more modular and potentially reusable codebase by:

1. Creating a framework-agnostic core `Ttabs.ts` class
2. Implementing a Svelte-specific wrapper `Ttabs.svelte.ts` using Svelte 5 runes

## Motivation

- **Separation of Concerns**: Separate business logic from UI framework specifics
- **Testability**: Core logic can be tested without framework dependencies
- **Reusability**: The core could be used with different UI frameworks
- **Maintainability**: Easier to update framework-specific code without affecting core logic
- **Clarity**: More explicit reactivity handling

## Implementation Approach

### File Structure

```
/ttabs
  Ttabs.ts           # Core, framework-agnostic implementation
  Ttabs.svelte.ts    # Svelte-specific wrapper using runes
  types/             # Shared types between implementations
```

### Core Class (`Ttabs.ts`)

The core class will:
- Contain all business logic without any Svelte dependencies
- Manage the tile hierarchy, operations, and state
- Implement a subscription mechanism for state changes
- Expose methods like `addTab()`, `moveTab()`, `splitPanel()`, etc.

```typescript
// Core Ttabs class (pseudo-code)
export class Ttabs {
  // Base properties
  protected tiles: Record<string, Tile> = {};
  protected activePanel: string | null = null;
  protected focusedActiveTab: string | null = null;
  
  // Subscribers for state changes
  private stateChangeListeners: Array<(state: TtabsState) => void> = [];
  
  // Methods with implementation
  addTab(panelId: string, name: string): string {
    // Implementation...
    this.notifyStateChange();
    return tabId;
  }
  
  // Subscription mechanism
  subscribe(callback: (state: TtabsState) => void): () => void {
    this.stateChangeListeners.push(callback);
    callback(this.getState());
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(cb => cb !== callback);
    };
  }
  
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeListeners.forEach(callback => callback(state));
  }
  
  private getState(): TtabsState {
    return {
      tiles: this.tiles,
      activePanel: this.activePanel,
      focusedActiveTab: this.focusedActiveTab,
      // other relevant state...
    };
  }
}
```

### Svelte Wrapper (`Ttabs.svelte.ts`)

The Svelte wrapper will:
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactivity
- Subscribe to the core class state changes
- Update rune state when changes occur
- Delegate method calls to the core instance

```typescript
// Svelte wrapper (pseudo-code)
export class SvelteTtabs {
  // Core instance
  private ttabs: Ttabs;
  
  // Reactive state using Svelte 5 runes
  tiles = $state<Record<string, Tile>>({});
  activePanel = $state<string | null>(null);
  focusedActiveTabInternal = $state<string | null>(null);
  
  // Derived values
  focusedActiveTab = $derived(this.focusedActiveTabInternal);
  
  constructor(options: TtabsOptions = {}) {
    // Create core instance
    this.ttabs = new Ttabs(options);
    
    // Subscribe to state changes
    this.ttabs.subscribe((state) => {
      // Update rune states directly
      this.tiles = state.tiles;
      this.activePanel = state.activePanel;
      this.focusedActiveTabInternal = state.focusedActiveTab;
    });
  }
  
  // Delegate methods to core instance
  addTab(panelId: string, name: string): string {
    return this.ttabs.addTab(panelId, name);
  }
  
  // ... delegate all other methods to ttabs
}
```

## Usage in Components

In Svelte components, the usage would be simple:

```svelte
<script>
  import { SvelteTtabs } from './Ttabs.svelte';
  
  const ttabs = new SvelteTtabs();
</script>

<div>
  {#each Object.values(ttabs.tiles).filter(t => t.type === 'tab') as tab}
    <TabComponent tab={tab} />
  {/each}
</div>
```

## Benefits

1. **Clear Separation**: Core logic is entirely separate from framework specifics
2. **Simple Delegation Pattern**: No complex inheritance, just method delegation
3. **Direct State Updates**: Reactive state updated directly from subscriptions
4. **No Duplicate Logic**: State management logic exists in only one place
5. **Minimal Boilerplate**: No need to override methods for reactivity
6. **Extensibility**: Could easily create wrappers for other frameworks

## Migration Plan

1. Create `Ttabs.ts` by refactoring the current `Ttabs.svelte.ts`:
   - Remove all Svelte-specific code (`$state`, `$derived`, `$effect`)
   - Implement subscription mechanism
   - Ensure all methods notify subscribers when state changes

2. Create/update `Ttabs.svelte.ts`:
   - Use Svelte 5 runes for state management
   - Subscribe to core Ttabs state changes
   - Delegate method calls to core instance

3. Update imports in components to use `Ttabs.svelte.ts` instead of the previous implementation

## Future Considerations

- Consider creating wrappers for other frameworks (React, Vue, etc.)
- Explore performance optimizations for state updates
- Consider more granular subscriptions for specific state changes 