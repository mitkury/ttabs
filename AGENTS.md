This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://github.com/mitkury/airul) out of 4 sources. Edit .airul.json to change sources or enabled outputs. After any change to sources or .airul.json, run `airul gen` to regenerate the context.

# From README.md:

# TTabs - Tiling Tabs Like in VSCode

## Overview

TTabs is a layout system that allows users to create resizable and rearrangeable interfaces with tiling tabs. Like in VSCode.

### How it Works

You create an instance of TTabs, register your components (can be any Svelte component), create a layout, and add instances of your components to tabs and columns.

## API

### Installation

```bash
npm install ttabs-svelte
```

### Basic Usage

```javascript
import { createTtabs, TTabsRoot } from 'ttabs-svelte';

// Create a ttabs instance
const ttabs = createTtabs({
  // Optional: provide initial state
  tiles: savedData?.tiles,
  focusedTab: savedData?.focusedTab
});

<TTabsRoot {ttabs} />
```

TtabsRoot is the container component that renders your layout and manages the root grid.

### Creating Layouts

First, register your components:

```javascript
// Register components that will be used in tabs
import MyComponent from './MyComponent.svelte';
ttabs.registerComponent('my-component', MyComponent);
```

Then create your layout using method chaining:

```javascript
// Create a new grid and build the layout using method chaining
ttabs
  .newGrid()
  .newRow()
  .newColumn()
  .newPanel()
  .newTab("My Tab", true)
  .setComponent("my-component", { prop1: "value1" })
  .setFocused();
```

### Working with Components

Once you've registered components, you can add them to tabs in various ways:

```javascript
// Add component to a tab using method chaining
panel
  .newTab("Tab Name", true)
  .setComponent("my-component", {
    prop1: "value1"
  });

// Or set a component on an existing tab
const tab = ttabs.getTabObject(tabId);
tab.setComponent("my-component", { prop1: "value1" });
```

### Managing Tabs

```javascript
// Get the active panel
const activePanel = ttabs.getActivePanel();
const panel = ttabs.getPanelObject(activePanel);

// Create a new tab in a panel
panel
  .newTab("New Tab", true)
  .setFocused();

// Reset the entire layout
ttabs.resetTiles();

// Create a new layout from scratch
ttabs
  .newGrid()
  .newRow()
  .newColumn()
  .newPanel();
```

### Persisting State

```javascript
import { createTtabs, LocalStorageAdapter } from 'ttabs-svelte';
import { onMount } from 'svelte';

// Create a storage adapter with optional debounce time in ms
const storageAdapter = new LocalStorageAdapter("my-app-layout", 500);

// First, try to load saved state
const savedData = storageAdapter.load();

// Initialize ttabs with the loaded state
const ttabs = createTtabs({
  // Use saved tiles if available, otherwise use empty state
  tiles: savedData?.tiles,
  // Use saved focused tab if available
  focusedTab: savedData?.focusedTab,
});

// Connect the storage adapter to save changes
const unsubscribe = ttabs.subscribe((state) => {
  storageAdapter.save(state);
});

// Register cleanup on component destroy
onMount(() => {
  return () => {
    // Unsubscribe from state changes when component is destroyed
    unsubscribe();
  };
});
```

### Hierarchical Structure

```
TileGrid -> TileRow[] -> TileColumn[] -> TileContent | TilePanel | TileGrid

TilePanel -> TileTab[] -> TileContent
```

Each level follows strict containment rules:
- **TileGrid** contains only TileRows
- **TileRow** contains only TileColumns 
- **TileColumn** contains exactly one of: TileContent, TilePanel, or nested TileGrid
- **TilePanel** contains TileTabs
- **TileTab** contains TileContent
- **TileContent** contains reference to any content to be displayed in a tab or a column

## Technical Details

### Implementation

- Built with **Svelte 5**, leveraging its reactive runes (`$state`, `$effect`) for state management
- Each tile is a separate entity with a unique ID and parent-child relationships
- Handles tab operations (moving, reordering, splitting panels)
- Implements automatic cleanup of empty containers and redistribution of space when elements are removed
- Hierarchical simplification to prevent unnecessary nesting of grid elements
---

# From package.json:

{
  "name": "ttabs-monorepo",
  "private": true,
  "version": "0.0.0",
  "description": "ttabs monorepo for development",
  "type": "module",
  "scripts": {
    "build": "cd packages/ttabs && npm run build",
    "example": "npm run build && cd packages/example && npm run dev",
    "publish": "npm run build && cd packages/ttabs && npm publish",
    "patch-and-publish": "cd packages/ttabs && npm run build && npm version patch && git push --tags && npm publish",
    "test": "cd packages/ttabs && npm test",
    "test:watch": "cd packages/ttabs && npm run test:watch",
    "test:coverage": "cd packages/ttabs && npm run test:coverage",
    "clean": "rm -rf node_modules && rm -rf packages/*/node_modules",
    "preversion": "npm run typecheck && npm run lint && npm test",
    "version": "cd packages/ttabs && npm version ${npm_package_version} && cd ../.. && git add -A",
    "postversion": "git push && git push --tags"
  },
  "workspaces": [
    "packages/*"
  ],
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "author": "Dmitry Kury (d@dkury.com)",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mitkury/ttabs.git"
  },
  "bugs": {
    "url": "https://github.com/mitkury/ttabs/issues"
  },
  "homepage": "https://github.com/mitkury/ttabs#readme",
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
---

# From docs/for-ai/rules.md:

# Rules for AI

## Git commits
Use imperative mood and include type.
Examples:
feat(<scope>): <any improvements for a feature>
fix(<scope>): <any bug fix in a scope>
ux: <any UX improvement>
docs: <any changes in docs and comments>

## Publishing to npm
When publishing, run `npm run patch-and-publish` from the root
---

# From docs/for-ai/svelte-5.md:

New in SvelteKit 5:

# Runes

## Reactivity

Reactivity with `let x = "hello"` at component top-level is replaced with:

```js
let x: string = $state("hello")
```

This makes x reactive in the component, and also in any js functions that operate on it.

Don't use `$state<T>()` to pass the type. Always use `let x: Type =`. Variables declared with `let x = "hello"` are no longer reactive.

## Derived values

Old style:
```js
$: b = a + 1
```

New style:
```js
let b = $derived(a + 1)
```

Or for more complex use cases:
```js
let b = $derived.by(() => {
    // ... more complex logic
    return a + 1;
})
```

`$derived()` takes an expression. `$derived.by()` takes a function.

## Effect

```js
let a = $state(1);
let b = $state(2);
let c;

// This will run when the component is mounted, and for every updates to a and b.
$effect(() => {
    c = a + b;
});
```

Note: 
- Values read asynchronously (promises, setTimeout) inside `$effect` are not tracked.
- Values inside objects are not tracked directly inside `$effect`:

```js
// This will run once, because `state` is never reassigned (only mutated)
$effect(() => {
    state;
});

// This will run whenever `state.value` changes
$effect(() => {
    state.value;
});
```

An effect only depends on the values that it read the last time it ran.

```js
$effect(() => {
    if (a || b) {
        // ...
    }
});
```

If `a` was true, `b` was not read, and the effect won't run when `b` changes.

## Props

Old way to pass props to a component:
```js
export let a = "hello";
export let b;
```

New way:
```js
let {a = "hello", b, ...everythingElse} = $props()
```

`a` and `b` are reactive.

Types:
```js
let {a = "hello", b}: {a: string, b: number} = $props()
```

Note: Do NOT use this syntax for types:
```js
let { x = 42 } = $props<{ x?: string }>();  // ❌ Incorrect
```

# Slots and snippets

Instead of using `<slot />` in a component, you should now do:

```js
let { children } = $props()
// ...
{@render children()}  // This replaces <slot />
```

# Event Handling

In Svelte 5 the events do not use `on:event` syntax, they use `onevent` syntax.

In Svelte 5 `on:click` syntax is not allowed. Event handlers have been given a facelift in Svelte 5. Whereas in Svelte 4 we use the `on:` directive to attach an event listener to an element, in Svelte 5 they are properties like any other (in other words - remove the colon):

```svelte
<button onclick={() => count++}>
  clicks: {count}
</button>
```

`preventDefault` and `once` are removed in Svelte 5. Normal HTML event management is advised:

```svelte
<script>
  function once(fn) {
    return function(event) {
      if (fn) fn.call(this, event);
      fn = null;
    };
  }

  function preventDefault(fn) {
    return function(event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }
</script>

<button onclick={once(preventDefault(handler))}>...</button>
```