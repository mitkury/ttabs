# Ttabs Storage Separation Proposal

## Overview

This proposal suggests separating storage functionality from the Ttabs core implementation to enable more flexible storage options and better integration with existing applications.

## Current Implementation

Currently, storage functionality is built directly into the Ttabs class:

1. `storageKey` is a constructor parameter that specifies a localStorage key 
2. When a key is provided, the layout is auto-loaded from localStorage on initialization
3. An `$effect` registers to auto-save changes to localStorage
4. This approach works but is limited to localStorage only and is tightly coupled with the core

## Problems with Current Approach

1. **Tight coupling**: Storage is hardcoded into the core Ttabs class
2. **Limited storage options**: Only localStorage is supported
3. **No customization**: No way to modify serialization/deserialization process
4. **Integration issues**: Difficult to integrate with application-specific storage systems
5. **Performance concerns**: Every state change triggers saving which might be inefficient

## Proposed Solution

Decouple storage functionality by:

1. Remove `storageKey` parameter and related storage logic from Ttabs class
2. Create a subscription mechanism to observe state changes
3. Implement a separate storage adapter pattern
4. Provide default adapters for common use cases (localStorage)
5. Simplify initialization by using clearer parameter names

## Implementation Details

### 1. Update TtabsOptions Interface

```typescript
export interface TtabsOptions {
  /**
   * Initial tiles state (optional)
   * If provided, the instance will be initialized with these tiles
   * If not provided, a default root grid will be created
   */
  tiles?: Record<string, Tile> | Tile[];
  
  /**
   * Initially focused tab (optional)
   * If provided, this tab will be set as the focused active tab
   */
  focusedTab?: string;
  
  /**
   * Theme configuration (optional)
   * If not provided, the default theme will be used
   */
  theme?: TtabsTheme;
}
```

### 2. Subscribe method in Ttabs

```typescript
class Ttabs {
  // ...existing code...
  
  // Callback type for state changes
  type StateChangeCallback = (state: Record<string, Tile>) => void;
  
  // State change listeners
  private stateChangeListeners: StateChangeCallback[] = [];
  
  /**
   * Subscribe to state changes
   * @param callback Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(cb => cb !== callback);
    };
  }
  
  // Call this when state changes
  private notifyStateChange(): void {
    this.stateChangeListeners.forEach(callback => {
      callback(this.tiles);
    });
  }
  
  // Modify existing methods to call notifyStateChange
  // ...
}
```

### 3. Storage Adapter Interface

```typescript
interface TtabsStorageAdapter {
  /**
   * Save ttabs state
   * @param state The tiles state
   */
  save(state: Record<string, Tile>): Promise<void> | void;
  
  /**
   * Load ttabs state
   * @returns Promise resolving to state object or null if no state exists
   */
  load(): Promise<{ tiles: Record<string, Tile>, focusedTab?: string } | null> | { tiles: Record<string, Tile>, focusedTab?: string } | null;
}
```

### 4. LocalStorage Adapter

```typescript
class LocalStorageAdapter implements TtabsStorageAdapter {
  constructor(private storageKey: string) {}
  
  save(state: Record<string, Tile>): void {
    try {
      // Extract focused tab from state if needed
      const focusedTab = this.findFocusedTab(state);
      
      const serialized = JSON.stringify({
        tiles: Object.values(state),
        focusedTab
      });
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save ttabs state:', error);
    }
  }
  
  // Helper method to find focused tab from state
  private findFocusedTab(state: Record<string, Tile>): string | undefined {
    // Find panels with active tabs
    const panels = Object.values(state).filter(tile => 
      tile.type === 'panel' && tile.activeTab);
      
    // Find the active panel (could be based on other criteria)
    const activePanel = panels[0];
    
    return activePanel?.activeTab;
  }
  
  load(): { tiles: Record<string, Tile>, focusedTab?: string } | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.tiles)) return null;
      
      // Convert array to record
      const tiles: Record<string, Tile> = {};
      parsed.tiles.forEach((tile: Tile) => {
        tiles[tile.id] = tile;
      });
      
      return {
        tiles,
        focusedTab: parsed.focusedTab
      };
    } catch (error) {
      console.error('Failed to load ttabs state:', error);
      return null;
    }
  }
}
```

### 5. Improved Usage Example

```typescript
// First load saved state (if any)
const storage = new LocalStorageAdapter('ttabs-layout');
const savedData = storage.load();

// Initialize Ttabs with the loaded state directly
const ttabs = createTtabs({
  // Use loaded tiles if available, otherwise start fresh
  tiles: savedData?.tiles,
  // Pass focused tab directly
  focusedTab: savedData?.focusedTab,
  // Other options...
  theme: DEFAULT_THEME
});

// Connect storage to save changes
ttabs.subscribe((state) => {
  storage.save(state);
});
```

### 6. Svelte Runes Integration

For Svelte applications, we can leverage runes for more efficient tracking:

```typescript
class SvelteRunesStorageAdapter implements TtabsStorageAdapter {
  constructor(private storageKey: string) {}
  
  connect(ttabs: Ttabs): void {
    // Use Svelte's $effect to create a reactive connection
    // This will automatically run whenever relevant state changes
    $effect(() => {
      const state = ttabs.getTiles();
      this.save(state);
    });
  }
  
  // Other methods same as LocalStorageAdapter
}

// Usage:
const storage = new SvelteRunesStorageAdapter('ttabs-layout');
const savedData = storage.load();

const ttabs = createTtabs({
  tiles: savedData?.tiles,
  focusedTab: savedData?.focusedTab,
  theme: DEFAULT_THEME
});

// Connect with runes
storage.connect(ttabs);
```

## Benefits

1. **Decoupling**: Clear separation of concerns between state management and persistence
2. **Flexibility**: Support for different storage backends (localStorage, IndexedDB, server, etc.)
3. **Integration**: Easier to integrate with application-specific storage systems
4. **Optimization**: Allow implementations to optimize when/how to save state
5. **Testability**: Easier to mock storage for testing
6. **Extensibility**: Possibility to add features like versioning, migration, etc.
7. **Simplicity**: More intuitive parameter naming with `tiles` and `focusedTab`
8. **Efficiency**: Better initialization flow without requiring resetState calls
9. **Streamlined API**: Removed unnecessary metadata abstraction for cleaner interfaces

## Migration Path

1. Remove built-in storage logic from Ttabs class
2. Update TtabsOptions interface for clearer parameter naming
3. Implement subscription mechanism
4. Create storage adapter implementations
5. Update documentation and examples
6. Provide migration guide for existing users

## Timeline

1. Implementation: 1 week
2. Testing: 2 days
3. Documentation: 1 day
4. Migration guide: 1 day

## Conclusion

This proposal aims to make the Ttabs library more flexible and maintainable by separating storage concerns from the core functionality. By implementing a subscription mechanism and adapter pattern, we enable users to customize storage behavior according to their specific needs while maintaining a clean and simple API. The improved parameter naming, initialization flow, and streamlined interfaces make the library more intuitive and easier to use. 

## Implementation Considerations and Gotchas

When implementing the storage adapter pattern, keep these important considerations in mind:

1. **Server-Side Rendering**: Always check for the existence of `window` and `localStorage` before using them:
   ```typescript
   if (typeof window !== 'undefined' && window.localStorage) {
     localStorage.getItem(...);
   }
   ```

2. **Proper Type Handling**: Ensure storage adapter interface and implementation match:
   ```typescript
   // In interface
   save(state: TtabsStorageData): void;
   
   // In implementation
   save(state: TtabsStorageData): void {
     // Implementation matches interface
   }
   ```

3. **Direct Property Access**: Use direct property access for reactive properties rather than getter methods:
   ```typescript
   // AVOID: Breaking reactivity with getter methods
   getTiles() { return this.tiles; }
   
   // PREFER: Direct property access for reactivity
   this.tiles // Access directly
   ```

4. **Debounce Storage Operations**: Add debounce to storage operations to avoid excessive writes:
   ```typescript
   private debounceTimer: ReturnType<typeof setTimeout> | null = null;
   
   save(state: TtabsStorageData): void {
     if (this.debounceTimer) clearTimeout(this.debounceTimer);
     this.debounceTimer = setTimeout(() => {
       // Actual save logic
     }, 500); // 500ms debounce
   }
   ``` 