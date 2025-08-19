# TTabs Examples

This directory contains examples demonstrating how to use the ttabs library with its latest API.

## Examples Overview

### 1. Simple Example (`SimpleExample.svelte`)
A basic example showing the fundamental ttabs functionality:
- Creating a simple layout with a single panel and tab
- Adding new tabs dynamically
- Using the object-oriented API
- Local storage persistence

### 2. Advanced Example (`Example.svelte`)
A more complex example demonstrating advanced features:
- Multi-row and multi-column layouts
- Sidebar with custom components
- Multiple panels with different content types
- Dynamic layout management
- Component registration and usage

### 3. Switching Example (`TtabsSwitchingExample.svelte`)
Demonstrates switching between different ttabs instances:
- Multiple ttabs instances with different layouts
- Dynamic switching between layouts
- Different row/column configurations
- Instance management

### 4. Theme Example (`ThemeExample.svelte`)
Showcases the theming system:
- Custom theme creation and application
- Dynamic theme switching
- CSS variable customization
- Theme inheritance

## Current API Usage

### Basic Setup

```typescript
import { createTtabs, TTabsRoot, LocalStorageAdapter } from "ttabs-svelte";

// Create a storage adapter for persistence
const storageAdapter = new LocalStorageAdapter("my-app", 500);

// Load saved state
const savedData = storageAdapter.load();

// Initialize ttabs
const ttabs = createTtabs({
  tiles: savedData?.tiles,
  focusedTab: savedData?.focusedTab,
  theme: DEFAULT_THEME,
});

// Register components
ttabs.registerComponent("my-component", MyComponent);

// Connect storage
const unsubscribe = ttabs.subscribe((state) => {
  storageAdapter.save(state);
});
```

### Object-Oriented API

The current API uses object-oriented patterns for creating layouts:

```typescript
// Create a new layout
ttabs.resetTiles();
const grid = ttabs.newGrid();
const row = grid.newRow("60%");
const column = row.newColumn("30%");
const panel = column.newPanel();
const tab = panel.newTab("My Tab", true);
tab.setComponent("my-component", { prop: "value" });
tab.setFocused();
```

### Layout Structure

```
Grid (root container)
├── Row (horizontal container)
│   ├── Column (vertical container)
│   │   ├── Panel (tab container)
│   │   │   ├── Tab (content container)
│   │   │   └── Tab
│   │   └── Direct Component
│   └── Column
└── Row
```

### Component Registration

```typescript
// Register a component with default props
ttabs.registerComponent("editor", EditorComponent, { 
  readOnly: false 
});

// Set component on a tab or column
tab.setComponent("editor", {
  content: "console.log('Hello World');",
  language: "javascript"
});
```

### Theming

```typescript
import { DEFAULT_THEME, type TtabsTheme } from "ttabs-svelte";

const customTheme: TtabsTheme = {
  name: 'custom',
  extends: DEFAULT_THEME,
  variables: {
    '--ttabs-panel-bg': '#1e1e1e',
    '--ttabs-tab-bar-bg': '#2d2d30',
    '--ttabs-active-tab-bg': '#1e1e1e',
    '--ttabs-active-tab-indicator': '#007acc',
    // ... more variables
  }
};

// Apply theme
ttabs.theme = customTheme;
```

### Storage

```typescript
import { LocalStorageAdapter } from "ttabs-svelte";

const storage = new LocalStorageAdapter("my-app", 500);

// Save layout
ttabs.subscribe((state) => {
  storage.save(state);
});

// Load layout
const savedData = storage.load();
```

## Key Features

### 1. Object-Oriented API
- Fluent interface for creating layouts
- Method chaining for complex operations
- Type-safe operations

### 2. Component System
- Register custom components
- Pass props to components
- Dynamic component switching

### 3. Theming System
- CSS variable-based theming
- Theme inheritance
- Dynamic theme switching
- Comprehensive styling control

### 4. Storage Integration
- Local storage adapter
- Automatic state persistence
- Custom storage adapters

### 5. Validation
- Layout validation
- Error handling
- Automatic layout recovery

## Running the Examples

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the examples

## Building

```bash
npm run build
npm run check  # Type checking
```

## API Reference

For the complete API reference, see the main ttabs documentation.

## Migration from Previous Versions

If you're migrating from an older version of ttabs:

1. **Object-Oriented API**: Use the new object-oriented API instead of direct method calls
2. **Component Registration**: Use `registerComponent` and `setComponent` methods
3. **Theming**: Use the new CSS variable-based theming system
4. **Storage**: Use the `LocalStorageAdapter` for persistence
5. **Event Handling**: Use `onclick` instead of `on:click` for better compatibility

## Examples Structure

```
src/lib/comps/
├── SimpleExample.svelte          # Basic functionality
├── Example.svelte                # Advanced features
├── TtabsSwitchingExample.svelte  # Instance switching
├── ThemeExample.svelte           # Theming system
├── ValidationExample.svelte      # Validation features
├── SimpleTextComponent.svelte    # Basic text component
├── EditorComponent.svelte        # Code editor component
├── DocumentComponent.svelte      # Document viewer component
└── SidePanelComponent.svelte     # Navigation component
```
