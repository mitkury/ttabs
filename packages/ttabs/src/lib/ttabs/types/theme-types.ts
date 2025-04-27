import type { Component } from "svelte";

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
  '--ttabs-tab-text-color': string;
  '--ttabs-tab-active-text-color': string;
  
  // Content area
  '--ttabs-content-bg': string;
  '--ttabs-content-border': string;
  '--ttabs-content-text-color': string;
  '--ttabs-content-padding': string;
  
  // Tab headers
  '--ttabs-tab-header-padding': string;
  '--ttabs-tab-header-border': string;
  '--ttabs-tab-header-font-size': string;
  '--ttabs-tab-bar-border': string;
  '--ttabs-tab-indicator-size': string;
  '--ttabs-tab-indicator-offset': string;
  '--ttabs-transition-duration': string;
  '--ttabs-transition-timing': string;
  
  // Controls
  '--ttabs-show-close-button': string;
  '--ttabs-close-button-color': string;
  '--ttabs-close-button-hover-color': string;
  '--ttabs-close-button-hover-bg': string;
  '--ttabs-tab-close-margin': string;
  '--ttabs-tab-close-size': string;
  '--ttabs-tab-close-border-radius': string;
  
  // Error styling
  '--ttabs-error-bg': string;
  '--ttabs-error-color': string;
  '--ttabs-error-border': string;
  '--ttabs-error-padding': string;
  '--ttabs-error-border-radius': string;
  
  // Empty state
  '--ttabs-empty-state-color': string;
  
  // Utility elements
  '--ttabs-resizer-hover-color': string;
  '--ttabs-drop-indicator-color': string;
  '--ttabs-drop-target-outline': string;
  '--ttabs-split-indicator-color': string;
  '--ttabs-row-resizer-size': string;
  '--ttabs-row-resizer-offset': string;
  '--ttabs-column-resizer-size': string;
  '--ttabs-column-resizer-offset': string;
  '--ttabs-drop-indicator-width': string;
  '--ttabs-drop-indicator-offset': string;
  
  // Border radius
  '--ttabs-border-radius': string;
  '--ttabs-border-radius-sm': string;
}

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
  | 'tab-header-focused'
  | 'tab-title'
  | 'tab-close-button'
  | 'tab-content'
  
  // Content elements
  | 'content'
  | 'content-container'
  | 'direct-content'
  
  // Utility/state elements
  | 'empty-state'
  | 'error'
  | 'row-resizer'
  | 'column-resizer';

/**
 * Theme configuration for ttabs
 */
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
   * These will be applied as inline styles to the root element
   */
  variables: Partial<TtabsCssVariables>;
  
  /**
   * Optional CSS class overrides for different elements
   * These will be applied to the respective elements alongside the default classes
   */
  classes?: Partial<Record<TtabsElementType, string>>;

  /**
   * Custom component overrides
   * These will be used in place of the default components
   */
  components?: {
    /**
     * Custom close button component for tabs
     * Will receive standard props: tabId, ttabs, onClose
     */
    closeButton?: Component;
  };
}

/**
 * Default theme with standard styling
 */
export const DEFAULT_THEME: TtabsTheme = {
  name: 'default',
  variables: {
    // Base
    '--ttabs-panel-bg': 'white',
    '--ttabs-tab-bar-bg': '#f5f5f5',
    '--ttabs-active-tab-bg': 'white',
    '--ttabs-active-tab-indicator': '#4a6cf7',
    '--ttabs-grid-bg': '#f0f0f0',
    '--ttabs-grid-border': '1px solid #ddd',
    '--ttabs-column-border': '1px solid #ddd',
    
    // Error styling
    '--ttabs-error-bg': '#fff5f5',
    '--ttabs-error-color': 'tomato',
    '--ttabs-error-border': '1px solid tomato',
    '--ttabs-error-padding': '1rem',
    '--ttabs-error-border-radius': '0',
    
    // Empty state
    '--ttabs-empty-state-color': '#666',
    
    // Tab headers
    '--ttabs-tab-header-padding': '0.5rem 1rem',
    '--ttabs-tab-header-border': '1px solid #ddd',
    '--ttabs-tab-header-font-size': '0.9rem',
    '--ttabs-tab-bar-border': '1px solid #ddd',
    '--ttabs-tab-indicator-size': '3px',
    '--ttabs-tab-indicator-offset': '0',
    '--ttabs-transition-duration': '0.1s',
    '--ttabs-transition-timing': 'ease',
    
    // Text colors
    '--ttabs-tab-text-color': '#555',
    '--ttabs-tab-active-text-color': '#333',
    
    // Content area
    '--ttabs-content-bg': 'white',
    '--ttabs-content-border': '1px solid #ddd',
    '--ttabs-content-text-color': '#333',
    '--ttabs-content-padding': '1rem',
    
    // Utility elements
    '--ttabs-resizer-hover-color': 'rgba(74, 108, 247, 0.3)',
    '--ttabs-drop-indicator-color': '#4a6cf7',
    '--ttabs-drop-target-outline': '2px dashed rgba(74, 108, 247, 0.5)',
    '--ttabs-split-indicator-color': 'rgba(74, 108, 247, 0.1)',
    '--ttabs-row-resizer-size': '6px',
    '--ttabs-row-resizer-offset': '-3px',
    '--ttabs-column-resizer-size': '6px',
    '--ttabs-column-resizer-offset': '-3px',
    '--ttabs-drop-indicator-width': '4px',
    '--ttabs-drop-indicator-offset': '-2px',
    
    // Border radius
    '--ttabs-border-radius': '0',
    '--ttabs-border-radius-sm': '0',
    
    // Controls
    '--ttabs-show-close-button': 'flex', // Show close buttons by default
    '--ttabs-close-button-color': '#888',
    '--ttabs-close-button-hover-color': '#666',
    '--ttabs-close-button-hover-bg': 'rgba(0, 0, 0, 0.05)',
    '--ttabs-tab-close-margin': '8px',
    '--ttabs-tab-close-size': '16px',
    '--ttabs-tab-close-border-radius': '0'
  }
};

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
    } : baseTheme.classes,
    components: theme.components ? {
      ...(baseTheme.components || {}),
      ...theme.components
    } : baseTheme.components
  };
} 