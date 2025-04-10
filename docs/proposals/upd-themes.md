# Improved Theming System for ttabs

## Problem Statement

The current theming system in ttabs has several limitations:

1. Creating a new theme requires specifying all CSS variables, even if you only want to modify a few
2. Changes to the default theme may not propagate to custom themes if new variables are added
3. Theme creation has a high barrier to entry due to the need to specify all variables
4. Managing multiple themes with shared properties is repetitive and error-prone
5. Svelte's automatic class scoping can interfere with theme class overrides

## Proposed Solution: Partial Theme Overrides

Instead of requiring full theme specifications, we should enable users to create partial themes that only specify the properties they want to change from the default theme.

### Core Changes

1. Modify the `TtabsTheme` interface to include an optional `extends` property
2. Implement a theme merging system that combines the base theme with overrides
3. Use Svelte's `<style global>` for theme-specific styles to avoid class scoping issues
4. Keep all themes backward compatible

## Implementation Details

### 1. Updated Theme Interface

```typescript
export interface TtabsTheme {
  /**
   * Name of the theme
   */
  name: string;
  
  /**
   * Base theme to extend (optional)
   * If not provided, extends DEFAULT_THEME
   */
  extends?: TtabsTheme;
  
  /**
   * CSS variables for styling
   * Can be partial - only overriding specific variables
   */
  variables: Partial<Record<string, string>>;
  
  /**
   * Optional CSS class overrides for different elements
   */
  classes?: Partial<Record<string, string>>;
}
```

### 2. Theme Resolution Function

```typescript
/**
 * Resolve a theme by merging it with its base theme
 */
export function resolveTheme(theme: TtabsTheme): TtabsTheme {
  // Start with the base theme or DEFAULT_THEME
  const baseTheme = theme.extends ? resolveTheme(theme.extends) : DEFAULT_THEME;
  
  // Create a new theme object with merged properties
  return {
    name: theme.name,
    variables: {
      ...baseTheme.variables,
      ...theme.variables
    },
    classes: theme.classes ? {
      ...baseTheme.classes,
      ...theme.classes
    } : baseTheme.classes
  };
}
```

### 3. Handling Svelte Class Scoping

One challenge with theming in Svelte is that component styles are automatically scoped with unique identifiers (e.g., `.tab-header.s-T7lY3wG2PcQ1`), which can interfere with theme class overrides.

To address this, we'll use Svelte's `<style global>` feature for theme-specific styles:

```svelte
<!-- In theme components or a dedicated theme file -->
<style global>
  /* These styles will NOT be scoped by Svelte */
  .dark-theme .ttabs-panel {
    background-color: #1e293b;
    border-color: #334155;
  }
  
  .dark-theme .ttabs-tab-header {
    background-color: #0f172a;
    color: #cbd5e1;
  }
  
  .dark-theme .ttabs-tab-header.active {
    background-color: #1e293b;
    color: #f8fafc;
  }
</style>
```

This approach has several benefits:
- Theme classes work as expected without Svelte's scoping interference
- Users can target the standard ttabs classes in their own CSS
- Custom theme styles can be organized in a single file
- No need for complex workarounds like `:global()` selectors

### 4. Strongly Typed CSS Variables

To improve developer experience, we can create a TypeScript type for all allowed CSS variables:

```typescript
/**
 * All CSS variables available for theming
 */
export type TtabsCssVariables = {
  // Base
  '--ttabs-panel-bg': string;
  '--ttabs-tab-bar-bg': string;
  '--ttabs-active-tab-bg': string;
  '--ttabs-active-tab-indicator': string;
  '--ttabs-grid-bg': string;
  '--ttabs-grid-border': string;
  '--ttabs-column-border': string;
  
  // Text colors
  '--ttabs-text-color': string;
  '--ttabs-text-color-secondary': string;
  '--ttabs-tab-text-color': string;
  '--ttabs-tab-active-text-color': string;
  
  // Content area
  '--ttabs-content-bg': string;
  '--ttabs-content-border': string;
  '--ttabs-content-text-color': string;
  
  // Tab headers
  '--ttabs-tab-header-padding': string;
  '--ttabs-tab-header-border': string;
  '--ttabs-tab-header-font-size': string;
  '--ttabs-tab-bar-border': string;
  
  // Controls
  '--ttabs-show-close-button': string;
  '--ttabs-close-button-color': string;
  '--ttabs-close-button-hover-color': string;
  '--ttabs-close-button-hover-bg': string;
  
  // Error styling
  '--ttabs-error-bg': string;
  '--ttabs-error-color': string;
  '--ttabs-error-border': string;
  
  // Empty state
  '--ttabs-empty-state-color': string;
  
  // Utility elements
  '--ttabs-resizer-hover-color': string;
  '--ttabs-drop-indicator-color': string;
  '--ttabs-drop-target-outline': string;
  '--ttabs-split-indicator-color': string;
}
```

We can also type the element classes that can be customized:

```typescript
/**
 * All element types that can have custom CSS classes
 */
export type TtabsElementType = 
  // Containers
  | 'root'
  | 'panel'
  | 'grid'
  | 'row'
  | 'column'
  
  // Tab elements
  | 'tab'
  | 'tab-bar'
  | 'tab-header'
  | 'tab-header-active'
  | 'tab-close-button'
  | 'tab-content'
  
  // Content elements
  | 'content'
  | 'content-container'
  | 'direct-content'
  
  // Utility/state elements
  | 'empty-state'
  | 'error';
```

Then we update the `TtabsTheme` interface to use these types:

```typescript
export interface TtabsTheme {
  /**
   * Name of the theme
   */
  name: string;
  
  /**
   * Base theme to extend (optional)
   * If not provided, extends DEFAULT_THEME
   */
  extends?: TtabsTheme;
  
  /**
   * CSS variables for styling
   * Can be partial - only overriding specific variables
   */
  variables: Partial<TtabsCssVariables>;
  
  /**
   * Optional CSS class overrides for different elements
   */
  classes?: Partial<Record<TtabsElementType, string>>;
}
```

This provides several benefits:
- TypeScript auto-completion for variable names and element types
- Type checking to prevent invalid variable names or element references
- Documentation of all available variables and customizable elements
- Clear indicator when new variables or elements are added to the system

With this approach, creating a theme becomes more intuitive:

```typescript
const myTheme: TtabsTheme = {
  name: 'custom',
  variables: {
    // TypeScript will show all available variable options here
    '--ttabs-active-tab-indicator': '#ff0000',
  },
  classes: {
    // TypeScript will show all available element types here
    'tab-header': 'my-custom-tab',
    'panel': 'my-custom-panel',
    // Invalid element types will cause errors
    // 'invalid-element': 'some-class' // Error: Type ... does not allow 'invalid-element'
  }
};
```

### 5. Usage Examples

#### Simple Color Override

```typescript
// Create a blue theme by just changing a few variables
const blueTheme: TtabsTheme = {
  name: 'blue',
  variables: {
    '--ttabs-active-tab-indicator': '#2563eb',
    '--ttabs-drop-indicator-color': '#2563eb',
    '--ttabs-resizer-hover-color': 'rgba(37, 99, 235, 0.3)'
  }
};

// The theme will inherit all other variables from DEFAULT_THEME
```

#### Extending an Existing Theme

```typescript
// Create a high contrast version of the dark theme
const highContrastDarkTheme: TtabsTheme = {
  name: 'high-contrast-dark',
  extends: DARK_THEME,
  variables: {
    '--ttabs-text-color': '#ffffff',
    '--ttabs-text-color-secondary': '#e2e8f0',
    '--ttabs-active-tab-indicator': '#f59e0b',
    '--ttabs-drop-indicator-color': '#f59e0b'
  }
};
```

#### Creating Seasonal Themes

```typescript
// Holiday theme with red accent
const holidayTheme: TtabsTheme = {
  name: 'holiday',
  variables: {
    '--ttabs-active-tab-indicator': '#e63946', // Festive red
    '--ttabs-drop-indicator-color': '#e63946',
    '--ttabs-resizer-hover-color': 'rgba(230, 57, 70, 0.3)'
  }
};

// Summer theme with blue accent
const summerTheme: TtabsTheme = {
  name: 'summer',
  variables: {
    '--ttabs-active-tab-indicator': '#00b4d8', // Ocean blue
    '--ttabs-drop-indicator-color': '#00b4d8',
    '--ttabs-resizer-hover-color': 'rgba(0, 180, 216, 0.3)'
  }
};
```

## User Customization Options

With this system, users have three powerful ways to style ttabs:

1. **Partial Themes**: Override just the variables they want to change
   ```typescript
   const myTheme = {
     name: 'custom',
     variables: {
       '--ttabs-active-tab-indicator': '#ff0000' // Just change what you need
     }
   };
   ```

2. **External CSS**: Target ttabs classes directly in their own stylesheets
   ```css
   /* In user's CSS file */
   .ttabs-tab-header {
     border-radius: 8px 8px 0 0;
   }
   
   .ttabs-panel {
     box-shadow: 0 4px 6px rgba(0,0,0,0.1);
   }
   ```

3. **Theme Classes**: Apply custom classes through the theme system
   ```typescript
   const customTheme = {
     name: 'custom',
     classes: {
       'tab-header': 'my-fancy-tabs'
     }
   };
   ```
   
   ```css
   /* In global styles */
   .my-fancy-tabs {
     font-weight: bold;
     text-transform: uppercase;
   }
   ```

## Integration with Ttabs

In the Ttabs class constructor, we'll need to resolve the theme:

```typescript
constructor(options: TtabsOptions = {}) {
  // Initialize theme
  if (options.theme) {
    // Resolve theme by merging with base themes
    this.theme = resolveTheme(options.theme);
  } else {
    this.theme = DEFAULT_THEME;
  }
  
  // Rest of constructor...
}
```

## Integration with CSS Frameworks

The theme system is designed to work well with CSS frameworks that also use CSS variables, such as Skeleton UI. This allows you to create themes that match your application's overall design system.

### Skeleton UI Integration

[Skeleton UI](https://www.skeleton.dev/) provides a comprehensive set of CSS variables for theming. You can reference these variables in your ttabs theme:

```typescript
// Create a theme that uses Skeleton's variables
const skeletonTheme: TtabsTheme = {
  name: 'skeleton',
  variables: {
    // Map ttabs variables to Skeleton variables
    '--ttabs-panel-bg': 'var(--color-surface-100)',
    '--ttabs-tab-bar-bg': 'var(--color-surface-200)',
    '--ttabs-active-tab-bg': 'var(--color-surface-100)',
    '--ttabs-active-tab-indicator': 'var(--color-primary-500)',
    '--ttabs-grid-bg': 'var(--color-surface-200)',
    '--ttabs-grid-border': '1px solid var(--color-surface-300)',
    '--ttabs-column-border': '1px solid var(--color-surface-300)',
    
    // Text colors
    '--ttabs-text-color': 'var(--color-text-base)',
    '--ttabs-text-color-secondary': 'var(--color-text-muted)',
    '--ttabs-tab-text-color': 'var(--color-text-muted)',
    '--ttabs-tab-active-text-color': 'var(--color-text-base)',
    
    // Error styling
    '--ttabs-error-bg': 'var(--color-error-100)',
    '--ttabs-error-color': 'var(--color-error-500)',
    '--ttabs-error-border': '1px solid var(--color-error-500)',
    
    // Controls
    '--ttabs-close-button-color': 'var(--color-text-muted)',
    '--ttabs-close-button-hover-color': 'var(--color-error-500)',
  }
};

// Create a dark version by extending the base theme
const skeletonDarkTheme: TtabsTheme = {
  name: 'skeleton-dark',
  extends: skeletonTheme,
  variables: {
    // Only override what's different in dark mode
    '--ttabs-panel-bg': 'var(--color-surface-800)',
    '--ttabs-tab-bar-bg': 'var(--color-surface-900)',
    '--ttabs-active-tab-bg': 'var(--color-surface-800)',
    '--ttabs-grid-bg': 'var(--color-surface-900)',
  }
};
```

### Using Theme Variants

Skeleton UI and similar frameworks often use CSS variants for theming (like `variant="primary"` or `theme="dark"`). You can leverage this in ttabs by:

1. Using the same CSS variables in your themes
2. Creating theme-specific class variants in the `<style global>` section
3. Using the `data-theme` attribute on the root element to trigger theme-specific styles

```svelte
<!-- In your global styles -->
<style global>
  /* These styles apply based on the data-theme attribute */
  [data-theme="skeleton-dark"] .ttabs-panel {
    /* Dark theme specific overrides */
    background-color: var(--color-surface-800);
  }
  
  /* You can also use Skeleton's theme variant approach */
  .ttabs-root.variant-primary .ttabs-tab-header.active {
    border-color: var(--color-primary-500);
  }
  
  .ttabs-root.variant-warning .ttabs-tab-header.active {
    border-color: var(--color-warning-500);
  }
</style>
```

This approach ensures that your ttabs components maintain visual coherence with the rest of your Skeleton UI application, while still allowing for the flexibility of the theme inheritance system.

## Implementation Plan

1. Update the `TtabsTheme` interface in `theme-types.ts`
2. Implement the `resolveTheme` function
3. Modify the `Ttabs` class to use the resolved theme
4. Create a global style file for theme styling
5. Update documentation with examples of the new theming approach

## Backward Compatibility

This approach maintains backward compatibility:

1. Existing themes without the `extends` property will work as before
2. The `DEFAULT_THEME` remains unchanged
3. Themes created with the current system can be gradually migrated to use the extension mechanism

## Benefits

1. **Simpler Theme Creation**: Users can create new themes by specifying only what they want to change
2. **Better Maintainability**: Updates to the default theme will propagate to extended themes
3. **Theme Inheritance**: Themes can extend other themes, creating a hierarchy of customizations
4. **Reduced Duplication**: Common theme properties don't need to be repeated
5. **Future-Proof**: New CSS variables can be added to the default theme without breaking custom themes
6. **No Scoping Issues**: Using `<style global>` avoids Svelte's class scoping interference

## Conclusion

By implementing a theme inheritance system and using Svelte's global styles for themes, we can significantly improve the user experience of creating and customizing themes in ttabs. This will lower the barrier to entry for theme creation while maintaining the flexibility and power of the current system. 