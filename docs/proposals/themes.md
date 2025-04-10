# Theming System for ttabs

## Overview

This proposal outlines a system for separating the presentation styling from the structural layout in ttabs. This separation allows users to implement different visual themes using any CSS framework (such as Tailwind CSS) while preserving the core layout functionality.

## Current Approach

Currently, ttabs components have styling directly embedded within each Svelte component:

1. CSS variables are used in some cases (e.g., `var(--ttabs-panel-bg, white)`)
2. Hard-coded colors and styles are used in others
3. Component structure and styling are tightly coupled

## Proposed Solution

### 1. CSS Variables Strategy

Expand the existing CSS variable approach to cover all styling aspects:

```css
/* Core variables (shipped with ttabs) */
--ttabs-panel-bg: white;
--ttabs-tab-bar-bg: #f5f5f5;
--ttabs-active-tab-bg: white;
--ttabs-active-tab-indicator: #4a6cf7;
--ttabs-grid-bg: #f0f0f0;
--ttabs-grid-border: 1px solid #ddd;
--ttabs-column-border: 1px solid #ddd;
--ttabs-error-bg: #fff5f5;
--ttabs-error-color: tomato;
--ttabs-error-border: 1px solid tomato;
--ttabs-empty-state-color: #666;
--ttabs-tab-header-padding: 0.5rem 1rem;
--ttabs-tab-header-border: 1px solid #ddd;
--ttabs-tab-header-font-size: 0.9rem;
--ttabs-tab-bar-border: 1px solid #ddd;
--ttabs-resizer-hover-color: rgba(74, 108, 247, 0.3);
--ttabs-drop-indicator-color: #4a6cf7;
--ttabs-drop-target-outline: 2px dashed rgba(74, 108, 247, 0.5);
--ttabs-split-indicator-color: rgba(74, 108, 247, 0.1);
```

### 2. Component Architecture Changes

#### Direct Theme Management in Ttabs Class

1. Add theme management to the Ttabs class:

```typescript
// Add to TtabsOptions interface in Ttabs.svelte.ts
export interface TtabsOptions {
  /**
   * Initial tiles state (optional)
   * If provided, the instance will be initialized with this state
   * If not provided, a default root grid will be created
   */
  initialState?: Record<string, Tile> | Tile[];

  /**
   * Auto-save storage key (optional)
   * If provided, layout will be auto-saved to localStorage
   */
  storageKey?: string;
  
  /**
   * Theme configuration (optional)
   */
  theme?: TtabsTheme;
}

// Theme type definition
export interface TtabsTheme {
  name: string;
  variables: Record<string, string>;
  classes?: Record<string, string>;
  components?: {
    tabHeader?: Component<any>;
    tabHeaderProps?: Record<string, any>;
    // Other component overrides could be added in the future
  };
}

// Add to Ttabs class
export class Ttabs {
  // Existing state...
  
  // Add theme state
  theme = $state<TtabsTheme | null>(null);
  
  constructor(options: TtabsOptions = {}) {
    // Initialize state
    if (options.initialState) {
      this.tiles = options.initialState;
      
      // Find the root grid in the initial state
      this.rootGridId = Object.values(options.initialState)
        .find(tile => tile.type === 'grid' && !tile.parent)?.id || null;
    } else {
      // Auto-create a root grid if no initial state is provided
      this.rootGridId = this.addGrid();
    }
    
    // Initialize theme
    this.theme = options.theme || DEFAULT_THEME;
    
    // Setup auto-save if requested
    // ... existing code ...
  }
  
  /**
   * Set or update the theme
   */
  setTheme(theme: TtabsTheme): void {
    this.theme = theme;
  }
  
  /**
   * Get a class name for a specific element from the theme
   */
  getThemeClass(elementType: string): string {
    return this.theme?.classes?.[elementType] || '';
  }
  
  /**
   * Get the root grid ID
   */
  getRootGridId(): string | null {
    // If root grid ID is already set, return it
    if (this.rootGridId) {
      return this.rootGridId;
    }
    
    // Find the grid without a parent
    const rootGrid = Object.values(this.getTiles())
      .find(tile => tile.type === 'grid' && !tile.parent);
    
    // Store it for future use
    if (rootGrid) {
      this.rootGridId = rootGrid.id;
    }
    
    return rootGrid?.id || null;
  }
  
  /**
   * Create a default empty layout
   * This can be called to create a standard layout if needed
   */
  createDefaultLayout(): string {
    // Create root grid if it doesn't exist
    if (!this.getRootGridId()) {
      this.rootGridId = this.addGrid();
    }
    
    const rootId = this.rootGridId as string;
    
    // Create a main row
    const mainRowId = this.addRow(rootId, 100);
    
    // Create a column
    const mainColumnId = this.addColumn(mainRowId, 100);
    
    // Create a panel
    const mainPanelId = this.addPanel(mainColumnId);
    
    // Create a default tab
    this.addTab(mainPanelId, 'New Tab');
    
    return rootId;
  }
}
```

2. Define themes as simple objects:

```typescript
// Custom theme definition
const darkTheme: TtabsTheme = {
  name: 'dark',
  variables: {
    '--ttabs-panel-bg': '#1e293b',
    '--ttabs-tab-bar-bg': '#334155',
    // ...other variables
  },
  classes: {
    'panel': 'dark-panel',
    'tab-bar': 'dark-tab-bar',
    // ...other class overrides
  }
};
```

3. Create a TtabsRoot component to automatically find and render the root grid:

```svelte
<!-- TtabsRoot.svelte -->
<script lang="ts">
  import TileGrid from './TileGrid.svelte';
  
  export let ttabs;
  
  // Find the root grid ID
  $: rootGridId = ttabs.getRootGridId();
  
  // Generate CSS variable style string
  $: themeStyle = ttabs.theme?.variables ? 
    Object.entries(ttabs.theme.variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ') 
    : '';
</script>

<div 
  class="ttabs-root {ttabs.getThemeClass('root')}"
  style={themeStyle}
  data-theme={ttabs.theme?.name}
>
  {#if rootGridId}
    <TileGrid {ttabs} id={rootGridId} />
  {:else}
    <div class="ttabs-empty-state">
      <button on:click={() => ttabs.createDefaultLayout()}>
        Create Default Layout
      </button>
    </div>
  {/if}
</div>

<style>
  .ttabs-root {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    /* Default theme variables */
    --ttabs-panel-bg: white;
    --ttabs-tab-bar-bg: #f5f5f5;
    /* ...other defaults... */
  }
  
  .ttabs-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--ttabs-empty-state-color, #666);
    font-style: italic;
  }
  
  button {
    padding: 8px 16px;
    background-color: var(--ttabs-active-tab-indicator, #4a6cf7);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    opacity: 0.9;
  }
</style>
```

4. Simplified usage pattern with auto-created root grid:

```svelte
<script>
  import { Ttabs, TtabsRoot } from '$lib/ttabs';
  import { darkTheme } from './themes';
  
  // Create ttabs instance with theme
  // Root grid is automatically created since no initialState is provided
  const ttabs = new Ttabs({
    theme: darkTheme,
    storageKey: 'ttabs-layout'
  });
  
  // Optional: Customize the layout if needed
  function setupCustomLayout() {
    const rootId = ttabs.getRootGridId();
    if (!rootId) return;
    
    // Add custom layout elements...
    const mainRowId = ttabs.addRow(rootId, 100);
    // etc.
  }
</script>

<TtabsRoot {ttabs} />
```

5. Access theme in components:

```svelte
<!-- In TilePanel.svelte -->
<script lang="ts">
  // Existing imports...
  
  let { ttabs, id }: TtabsProps = $props();
  
  // Existing derived state...
  
  // Get theme classes
  $: panelClass = ttabs.getThemeClass('panel');
  $: tabBarClass = ttabs.getThemeClass('tab-bar');
  $: tabHeaderClass = ttabs.getThemeClass('tab-header');
  $: tabHeaderActiveClass = ttabs.getThemeClass('tab-header-active');
</script>

<div class="ttabs-panel {panelClass}" data-tile-id={id}>
  <div class="ttabs-tab-bar {tabBarClass}">
    {#each tabs as tabId}
      <div 
        class="ttabs-tab-header {tabId === activeTab ? 'active' : ''} {tabHeaderClass} {tabId === activeTab ? tabHeaderActiveClass : ''}"
        data-tab-id={tabId}
      >
        <!-- Tab content -->
      </div>
    {/each}
  </div>
  
  <!-- Rest of the component -->
</div>
```

### 3. Class-based Customization

Access class names directly from the ttabs instance:

```svelte
<!-- Inside any component -->
<div class={`ttabs-panel ${ttabs.getThemeClass('panel')}`} data-tile-id={id}>
```

This allows for frameworks like Tailwind to be used:

```typescript
// Tailwind theme example
const tailwindTheme: TtabsTheme = {
  name: 'tailwind',
  variables: {}, // Empty variables to use defaults
  classes: {
    'root': 'bg-white dark:bg-slate-900',
    'panel': 'bg-white dark:bg-slate-800 shadow-sm rounded-md',
    'tab-bar': 'bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600',
    // ...other element classes
  }
};
```

### 4. Component-based Customization

For maximum flexibility, the theming system can be extended to allow custom component replacements. This enables applications to completely control the rendering of specific elements:

```typescript
export interface TtabsTheme {
  name: string;
  variables: Record<string, string>;
  classes?: Record<string, string>;
  components?: {
    tabHeader?: Component<any>;
    tabHeaderProps?: Record<string, any>;
    // Other component replacements could be added in future
  };
}
```

This allows users to provide their own implementation for tab headers while keeping the core functionality:

```typescript
// Custom theme with component replacement
const customTheme: TtabsTheme = {
  name: 'custom',
  variables: { /* CSS variables */ },
  classes: { /* Class overrides */ },
  components: {
    tabHeader: MyCustomTabHeader,
    tabHeaderProps: { 
      showCloseButton: true,
      closeIcon: CloseIcon, // Could be a string or a component
      confirmClose: false
    }
  }
};
```

The custom tab header component would follow a standard interface:

```svelte
<!-- MyCustomTabHeader.svelte -->
<script lang="ts">
  // Required props
  export let tabId: string;
  export let tabName: string;
  export let isActive: boolean;
  export let ttabs: Ttabs;
  export let onSelect: () => void;
  export let onClose: () => void;
  export let onDragStart: (event: DragEvent) => void;
  export let onDragEnd: (event: DragEvent) => void;
  
  // Optional props from theme
  export let showCloseButton = false;
  export let closeIcon = '×';
  export let confirmClose = false;
  
  function handleClose(event: MouseEvent) {
    event.stopPropagation();
    
    if (confirmClose) {
      if (confirm(`Close tab "${tabName}"?`)) {
        onClose();
      }
    } else {
      onClose();
    }
  }
</script>

<div class="my-custom-tab {isActive ? 'active' : ''}" 
     on:click={onSelect}
     draggable="true"
     on:dragstart={onDragStart}
     on:dragend={onDragEnd}>
  <!-- Custom icon could go here -->
  <span class="tab-name">{tabName}</span>
  
  {#if showCloseButton}
    <button class="close-btn" on:click={handleClose}>
      {typeof closeIcon === 'string' ? closeIcon : <svelte:component this={closeIcon} />}
    </button>
  {/if}
</div>

<style>
  /* Custom styling */
</style>
```

The TilePanel component would check for custom components in the theme:

```svelte
{#each tabs as tabId}
  {#if ttabs.theme?.components?.tabHeader}
    <!-- Custom tab header component -->
    <svelte:component 
      this={ttabs.theme.components.tabHeader}
      {tabId}
      tabName={ttabs.getTile(tabId)?.name || 'Unnamed Tab'}
      isActive={tabId === activeTab}
      {ttabs}
      onSelect={() => selectTab(tabId)}
      onClose={() => closeTab(tabId)}
      onDragStart={(e) => onDragStart(e, tabId)}
      onDragEnd={onDragEnd}
      {...(ttabs.theme.components.tabHeaderProps || {})}
    />
  {:else}
    <!-- Default tab header implementation -->
    <div class="ttabs-tab-header {ttabs.getThemeClass('tab-header')}" 
         class:active={tabId === activeTab}>
      <!-- Default implementation -->
    </div>
  {/if}
{/each}
```

Benefits of component-based customization:
1. **Complete control**: Applications can implement their own tab header design and behavior
2. **Custom functionality**: Add application-specific features like close confirmation or special indicators
3. **Framework compatibility**: Custom components can integrate with any UI framework
4. **Progressive enhancement**: Simpler use cases can still use variables and classes

### Supporting Tab Operations

To support component-based tab headers with close buttons, the Ttabs class needs a closeTab method:

```typescript
// Add to Ttabs class
/**
 * Close a tab and remove it
 * @param tabId The ID of the tab to close
 * @returns True if successful
 */
closeTab(tabId: string): boolean {
  try {
    const tab = this.getTile<TileTab>(tabId);
    if (!tab || tab.type !== 'tab') return false;
    
    const panelId = tab.parent;
    if (!panelId) return false;
    
    const panel = this.getTile<TilePanel>(panelId);
    if (!panel || panel.type !== 'panel') return false;
    
    // Find index of tab to remove
    const tabIndex = panel.tabs.indexOf(tabId);
    if (tabIndex === -1) return false;
    
    // Remove tab
    this.removeTile(tabId);
    
    // Update panel's tabs array
    const newTabs = [...panel.tabs];
    newTabs.splice(tabIndex, 1);
    
    // If closed tab was active, activate another tab
    let newActiveTab = panel.activeTab;
    if (panel.activeTab === tabId) {
      if (newTabs.length > 0) {
        // Activate either the tab at the same index, or the last tab
        const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveTab = newTabs[newActiveIndex];
      } else {
        newActiveTab = null;
      }
    }
    
    // Update panel
    this.updateTile(panelId, {
      tabs: newTabs,
      activeTab: newActiveTab
    });
    
    // Clean up empty containers
    this.cleanupContainers(panelId);
    
    return true;
  } catch (error) {
    console.error('Error closing tab:', error);
    return false;
  }
}
```

This method handles:
1. Removing the tab from the data structure
2. Updating the panel's tab list
3. Selecting a new active tab if needed
4. Cleaning up empty containers after tab removal

## UI Framework Integration

### Integrating with Skeleton UI

[Skeleton](https://www.skeleton.dev/) is a perfect example of a UI framework built on Tailwind that ttabs can integrate with. Here's how we can leverage Skeleton's theming approach:

#### 1. Theme Variable Mapping

Map ttabs CSS variables to Skeleton's theme variables:

```typescript
// skeleton-theme.ts
export const skeletonTheme: TtabsTheme = {
  name: 'skeleton',
  variables: {
    // Map to Skeleton's color system
    '--ttabs-panel-bg': 'var(--color-surface-100)',
    '--ttabs-tab-bar-bg': 'var(--color-surface-200)',
    '--ttabs-active-tab-indicator': 'var(--color-primary-500)',
    // Other mappings
  }
};
```

#### 2. Class-based Integration

Use Skeleton's utility classes and components:

```typescript
export const skeletonClassTheme: TtabsTheme = {
  name: 'skeleton-classes',
  variables: {}, // Use Skeleton's CSS variables
  classes: {
    'panel': 'card p-4',
    'tab-bar': 'tab-group',
    'tab-header': 'tab',
    'tab-header-active': 'tab-active',
    // Other class mappings
  }
};
```

#### 3. Component Composition

Combine ttabs components with Skeleton components:

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  import { skeletonTheme } from './themes/skeleton';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  import { SkeletonTabHeader } from './components/SkeletonTabHeader.svelte';
  
  // Create a Skeleton-compatible theme with custom tab header
  const theme = {
    ...skeletonTheme,
    components: {
      tabHeader: SkeletonTabHeader,
      tabHeaderProps: {
        showCloseButton: true,
        buttonVariant: 'ghost', // Using Skeleton's button variants
        buttonSize: 'sm'
      }
    }
  };
  
  // Create ttabs with Skeleton theme
  const ttabs = createTtabs({ theme });
</script>

<AppShell>
  <AppBar slot="header">My App</AppBar>
  
  <TtabsRoot {ttabs} />
</AppShell>
```

#### 4. Dark Mode Support

Leverage Skeleton's light/dark mode with ttabs:

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  import { skeletonLightTheme, skeletonDarkTheme } from './themes/skeleton';
  import { AppShell } from '@skeletonlabs/skeleton';
  
  // Create ttabs instance
  // Root grid is automatically created
  const ttabs = createTtabs();
  
  // Listen to Skeleton's theme changes
  $effect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    ttabs.setTheme(isDark ? skeletonDarkTheme : skeletonLightTheme);
  });
</script>

<AppShell>
  <TtabsRoot {ttabs} />
</AppShell>
```

### Framework-Agnostic Approach

To support multiple UI frameworks:

1. **Theme Helpers**: Create helper functions for popular frameworks:

```typescript
// themes/helpers.ts
export function createSkeletonTheme(options = {}) {
  // Generate a theme object compatible with Skeleton UI
  return {
    name: 'skeleton',
    variables: {
      '--ttabs-panel-bg': 'var(--color-surface-100)',
      // ... other variables
    },
    classes: {
      // ... class mappings
      ...options.classes
    }
  };
}
```

2. **Auto-detection**: Offer utility to detect which framework is in use:

```typescript
// Utility function to detect framework and create appropriate theme
import { detectFramework } from 'ttabs/utils';
import { createTtabs } from 'ttabs';

// Auto-detect framework and use appropriate theme
const framework = detectFramework(); // Returns 'skeleton', 'tailwind', etc.
const ttabs = createTtabs({
  theme: framework === 'skeleton' ? skeletonTheme : defaultTheme
});
```

## Implementation Benefits

Using this theming approach has several advantages:

1. **Centralized State Management**: Theme state lives alongside other state in the Ttabs class
2. **No Additional Reactivity**: Leverages Svelte's reactive system without adding complexity
3. **Consistent API**: Maintains the pattern of accessing functionality through the ttabs instance
4. **Easy Migration**: Minimal changes to existing components required
5. **Performance**: CSS variables are applied once at the root level
6. **Instance Isolation**: Each ttabs instance can have a different theme
7. **Automatic Root Creation**: Root grid is automatically created when no initial state is provided
8. **Zero-configuration**: Users can create a complete layout with just `new Ttabs()`

## Theme Migration Path

1. Extend the Ttabs class with theme management
2. Create theme helpers for popular UI libraries
3. Refactor all component styles to use CSS variables and the getThemeClass method
4. Document theming API for users

## Implementation Details

### Structure

```
/src/lib/ttabs/
  /themes/
    index.ts         # Theme types and theme helpers
    default.ts       # Default theme definition
    tailwind.ts      # Tailwind theme helpers
    skeleton.ts      # Skeleton UI theme helpers
  /utils/
    detector.ts      # Framework detection utilities
```

### Required Component Changes

1. Replace all hard-coded colors and styles with CSS variables
2. Add theme class application to all component containers using ttabs.getThemeClass()
3. Ensure all DOM elements have appropriate class names for targeting

## Examples

### Basic Usage

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  
  // Create ttabs with default theme
  const ttabs = createTtabs();
</script>

<TtabsRoot {ttabs} />
```

### Tailwind Integration

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  import { tailwindTheme } from './my-tailwind-theme';
  
  // Create ttabs with Tailwind theme
  const ttabs = createTtabs({
    theme: tailwindTheme
  });
</script>

<TtabsRoot {ttabs} />
```

### Skeleton UI Integration

```svelte
<script>
  import { createTtabs, TtabsRoot } from 'ttabs';
  import { skeletonTheme } from './themes/skeleton';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  import { SkeletonTabHeader } from './components/SkeletonTabHeader.svelte';
  
  // Create a Skeleton-compatible theme with custom tab header
  const theme = {
    ...skeletonTheme,
    components: {
      tabHeader: SkeletonTabHeader,
      tabHeaderProps: {
        showCloseButton: true,
        buttonVariant: 'ghost', // Using Skeleton's button variants
        buttonSize: 'sm'
      }
    }
  };
  
  // Create ttabs with Skeleton theme
  const ttabs = createTtabs({ theme });
</script>

<AppShell>
  <AppBar slot="header">My App</AppBar>
  
  <TtabsRoot {ttabs} />
</AppShell>
```

## Next Steps

1. Inventory all existing styles and create a comprehensive variable list
2. Extend the Ttabs class with theme management
3. Develop theme helpers for popular UI frameworks (Skeleton, shadcn, etc.)
4. Refactor existing components to use the theming system
5. Create example themes for common CSS frameworks and libraries