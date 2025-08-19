# Theming in ttabs

ttabs provides a flexible theming system that allows you to customize the appearance of your interface without modifying core components.

## Theme Basics

A theme in ttabs is simply an object with a name, CSS variables, and optional class overrides:

```typescript
import { type TtabsTheme } from 'ttabs-svelte';

const myTheme: TtabsTheme = {
  name: 'my-theme',
  variables: {
    '--ttabs-panel-bg': '#ffffff',
    '--ttabs-active-tab-indicator': '#3b82f6',
    // ...more variables
  },
  classes: {
    'tab-header': 'my-custom-tab-header',
    'panel': 'my-custom-panel'
  }
};
```

## Applying Themes

Apply a theme when creating your ttabs instance:

```typescript
import { createTtabs } from 'ttabs-svelte';
import { myTheme } from './themes/my-theme';

const ttabs = createTtabs({
  theme: myTheme
});
```

Or change it dynamically:

```typescript
ttabs.setTheme(myTheme);
```

## Partial Themes

You don't need to specify all theme variables - just override what you need:

```typescript
const blueAccentTheme: TtabsTheme = {
  name: 'blue-accent',
  variables: {
    '--ttabs-active-tab-indicator': '#2563eb',
    '--ttabs-drop-indicator-color': '#2563eb'
  }
};
```

Missing variables will use the default theme values.

## Theme Inheritance

Themes can extend other themes using the `extends` property:

```typescript
const highContrastTheme: TtabsTheme = {
  name: 'high-contrast',
  extends: darkTheme, // Inherit from dark theme
  variables: {
    '--ttabs-text-color': '#ffffff',
    '--ttabs-active-tab-indicator': '#f59e0b'
  }
};
```

## Integration with CSS Frameworks

### Skeleton UI Example

ttabs works beautifully with CSS frameworks that use variables. Here's how to integrate with [Skeleton UI](https://www.skeleton.dev/):

```typescript
// Create a theme that uses Skeleton's variables
const skeletonTheme: TtabsTheme = {
  name: 'skeleton',
  variables: {
    // Map ttabs variables to Skeleton variables
    '--ttabs-panel-bg': 'var(--color-surface-100)',
    '--ttabs-tab-bar-bg': 'var(--color-surface-200)',
    '--ttabs-active-tab-indicator': 'var(--color-primary-500)',
    '--ttabs-text-color': 'var(--color-text-base)',
    '--ttabs-error-color': 'var(--color-error-500)',
    // ...more mappings
  }
};
```

With this approach, your ttabs components will automatically adapt when Skeleton's theme changes (like toggling dark mode) without any additional code!

## Global Styles

To add global styling, target ttabs classes or your own `classes` from the theme in your app's global CSS. For example:

```css
.ttabs-root.variant-primary .ttabs-tab-header.active {
  border-color: var(--color-primary-500);
}
```

## Available Variables

Here are the most commonly used variables that you can override in your theme:

| Variable | Description | Default |
| --- | --- | --- |
| `--ttabs-panel-bg` | Panel background color | `white` |
| `--ttabs-tab-bar-bg` | Tab bar background color | `#f5f5f5` |
| `--ttabs-active-tab-bg` | Active tab background | `white` |
| `--ttabs-active-tab-indicator` | Active tab indicator color | `#4a6cf7` |
| `--ttabs-text-color` | Main text color | `#333` |
| `--ttabs-tab-text-color` | Tab text color | `#555` |

See the [theme reference](./theme-reference.md) for a complete list of available variables.

## Component Customization

For maximum flexibility, ttabs allows you to replace entire components with your own implementations:

```typescript
import { type TtabsTheme } from 'ttabs-svelte';
import CloseButton from './CloseButton.svelte';

const customTheme: TtabsTheme = {
  name: 'custom',
  variables: {
    '--ttabs-active-tab-indicator': '#3b82f6',
  },
  components: {
    closeButton: CloseButton
  }
};
```

This approach lets you replace the default close button while keeping core layout behavior intact.

## Active Tab Styling

ttabs provides multiple ways to customize the active tab appearance:

### Using CSS Variables

The simplest approach is to modify the CSS variables that control the active tab appearance:

```typescript
const theme: TtabsTheme = {
  name: 'custom-active',
  variables: {
    '--ttabs-active-tab-bg': '#f0f9ff',
    '--ttabs-active-tab-indicator': '#0ea5e9',
    '--ttabs-tab-active-text-color': '#0369a1'
  }
};
```

### Using Custom Classes

For complete control over the active tab styling, provide a custom class in the `classes` property:

```typescript
const theme: TtabsTheme = {
  name: 'custom-active-class',
  classes: {
    'tab-header-active': 'my-custom-active-tab'
  }
};
```

Then in your CSS:

```css
.my-custom-active-tab {
  /* Your completely custom active tab styling */
  background: linear-gradient(to bottom, #e0f2fe, #f0f9ff);
  border-top: 2px solid #0ea5e9;
  border-bottom: none;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}
```

This approach lets you completely redefine how active tabs look, allowing for any styling from subtle indicators to dramatic visual changes.

### Using Custom Close Buttons

ttabs also allows you to replace the default close button with your own component:

```typescript
import CloseButton from './CloseButton.svelte';

const theme: TtabsTheme = {
  name: 'custom-close',
  components: {
    closeButton: CloseButton
  }
};
```

Your custom close button would implement a standard interface:

```svelte
<!-- CloseButton.svelte -->
<script lang="ts">
  // Required props that ttabs will pass to your component
  export let tabId: string;
  export let ttabs: Ttabs;
  export let onClose: () => void;
</script>

<button class="my-close-button" on:click={onClose}>
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" />
  </svg>
</button>

<style>
  .my-close-button {
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    transition: background 0.2s, color 0.2s;
  }
  
  .my-close-button:hover {
    background: rgba(255, 0, 0, 0.1);
    color: #f43f5e;
  }
</style>
``` 