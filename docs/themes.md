# Theming in ttabs

ttabs provides a flexible theming system that allows you to customize the appearance of your interface without modifying core components.

## Theme Basics

A theme in ttabs is simply an object with a name, CSS variables, and optional class overrides:

```typescript
import { type TtabsTheme } from 'ttabs';

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
import { createTtabs } from 'ttabs';
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

For more complex styling, you can use global CSS with the `ThemeStyles` component:

```svelte
<script>
  import { ThemeStyles } from 'ttabs';
</script>

<ThemeStyles />

<!-- Add your own global theme styles -->
<style global>
  /* Add custom theme variants */
  .ttabs-root.variant-primary .ttabs-tab-header.active {
    border-color: var(--color-primary-500);
  }
</style>
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