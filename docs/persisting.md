# Persisting ttabs Layouts

This guide explains how to save and load ttabs layouts using storage adapters.

## Basic Usage

### 1. Create a Storage Adapter

ttabs includes a `LocalStorageAdapter` by default, but you can create your own adapters for different storage systems.

```typescript
import { createTtabs, LocalStorageAdapter } from "$lib/ttabs";

// Create a localStorage adapter with a unique key and debounce time
const storageAdapter = new LocalStorageAdapter("my-app-layout", 500);
```

### 2. Load Initial State

```typescript
// Load saved state (if any)
const savedData = storageAdapter.load();

// Initialize ttabs with saved state
const ttabs = createTtabs({
  // Use saved tiles or start fresh
  tiles: savedData?.tiles,
  // Use saved focused tab
  focusedTab: savedData?.focusedTab
});
```

### 3. Subscribe to Changes

```typescript
// Connect the storage adapter to save changes
const unsubscribe = ttabs.subscribe((state) => {
  storageAdapter.save(state);
});

// Don't forget to unsubscribe when component is destroyed
onMount(() => {
  return () => {
    unsubscribe();
  };
});
```

## Creating Custom Adapters

You can create custom storage adapters by implementing the `TtabsStorageAdapter` interface:

```typescript
import { TtabsStorageAdapter, TtabsStorageData } from "$lib/ttabs";

class MyCustomAdapter implements TtabsStorageAdapter {
  // Save state to your storage
  save(state: Record<string, Tile>): void {
    // Your implementation here
  }
  
  // Load state from your storage
  load(): TtabsStorageData | null {
    // Your implementation here
  }
}
```

### Example: IndexedDB Adapter

```typescript
class IndexedDBAdapter implements TtabsStorageAdapter {
  private dbName: string;
  private storeName: string;
  private debounceTimer: number | null = null;
  
  constructor(dbName = "ttabs-db", storeName = "layouts", private debounceMs = 500) {
    this.dbName = dbName;
    this.storeName = storeName;
  }
  
  save(state: Record<string, Tile>): void {
    // Debounce to avoid excessive writes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this._saveToIndexedDB(state);
      this.debounceTimer = null;
    }, this.debounceMs);
  }
  
  async _saveToIndexedDB(state: Record<string, Tile>): Promise<void> {
    // IndexedDB implementation details...
  }
  
  async load(): Promise<TtabsStorageData | null> {
    // IndexedDB implementation details...
  }
}
```

## Best Practices

1. **Debounce Saves**: Always debounce save operations to avoid performance issues
2. **Error Handling**: Include proper error handling in your adapters
3. **Cleanup**: Unsubscribe when components are destroyed to prevent memory leaks
4. **Server Storage**: For server-side storage, consider implementing an adapter that makes API calls

## Complete Example

```typescript
import { createTtabs, TtabsRoot, LocalStorageAdapter } from "$lib/ttabs";
import { onMount } from "svelte";

// Create adapter and load saved data
const storageAdapter = new LocalStorageAdapter("my-app-layout");
const savedData = storageAdapter.load();

// Initialize with saved data
const ttabs = createTtabs({
  tiles: savedData?.tiles,
  focusedTab: savedData?.focusedTab
});

// Subscribe to changes
const unsubscribe = ttabs.subscribe(state => {
  storageAdapter.save(state);
});

// Cleanup on destroy
onMount(() => {
  return () => {
    unsubscribe();
  };
});
```

This pattern allows for flexible persistence of ttabs layouts across page reloads or application sessions. 