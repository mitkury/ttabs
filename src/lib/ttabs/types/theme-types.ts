/**
 * Theme configuration for ttabs
 */
export interface TtabsTheme {
  /**
   * Name of the theme
   */
  name: string;
  
  /**
   * CSS variables for styling
   * These will be applied as inline styles to the root element
   */
  variables: Record<string, string>;
  
  /**
   * Optional CSS class overrides for different elements
   * These will be applied to the respective elements alongside the default classes
   */
  classes?: Record<string, string>;
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
    
    // Empty state
    '--ttabs-empty-state-color': '#666',
    
    // Tab headers
    '--ttabs-tab-header-padding': '0.5rem 1rem',
    '--ttabs-tab-header-border': '1px solid #ddd',
    '--ttabs-tab-header-font-size': '0.9rem',
    '--ttabs-tab-bar-border': '1px solid #ddd',
    
    // Text colors
    '--ttabs-text-color': '#333',
    '--ttabs-text-color-secondary': '#666',
    '--ttabs-tab-text-color': '#555',
    '--ttabs-tab-active-text-color': '#333',
    
    // Content area
    '--ttabs-content-bg': 'white',
    '--ttabs-content-border': '1px solid #ddd',
    '--ttabs-content-text-color': '#333',
    
    // Utility elements
    '--ttabs-resizer-hover-color': 'rgba(74, 108, 247, 0.3)',
    '--ttabs-drop-indicator-color': '#4a6cf7',
    '--ttabs-drop-target-outline': '2px dashed rgba(74, 108, 247, 0.5)',
    '--ttabs-split-indicator-color': 'rgba(74, 108, 247, 0.1)',
    
    // Controls
    '--ttabs-show-close-button': 'flex', // Show close buttons by default
    '--ttabs-close-button-color': '#888',
    '--ttabs-close-button-hover-color': 'tomato',
    '--ttabs-close-button-hover-bg': 'rgba(0, 0, 0, 0.1)'
  }
}; 