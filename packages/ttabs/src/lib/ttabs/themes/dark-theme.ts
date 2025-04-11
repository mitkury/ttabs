import type { TtabsTheme } from '../types/theme-types';

/**
 * Dark theme for ttabs
 */
export const DARK_THEME: TtabsTheme = {
  name: 'dark',
  variables: {
    // Base
    '--ttabs-panel-bg': '#1e293b',
    '--ttabs-tab-bar-bg': '#0f172a',
    '--ttabs-active-tab-bg': '#1e293b',
    '--ttabs-active-tab-indicator': '#3b82f6',
    '--ttabs-grid-bg': '#0f172a',
    '--ttabs-grid-border': '1px solid #334155',
    '--ttabs-column-border': '1px solid #334155',
    
    // Error styling
    '--ttabs-error-bg': '#450a0a',
    '--ttabs-error-color': '#f87171',
    '--ttabs-error-border': '1px solid #ef4444',
    
    // Empty state
    '--ttabs-empty-state-color': '#94a3b8',
    
    // Tab headers
    '--ttabs-tab-header-padding': '0.5rem 1rem',
    '--ttabs-tab-header-border': '1px solid #334155',
    '--ttabs-tab-header-font-size': '0.9rem',
    '--ttabs-tab-bar-border': '1px solid #334155',
    
    // Text colors
    '--ttabs-text-color': '#e2e8f0',
    '--ttabs-text-color-secondary': '#94a3b8',
    '--ttabs-tab-text-color': '#cbd5e1',
    '--ttabs-tab-active-text-color': '#f8fafc',
    
    // Content area
    '--ttabs-content-bg': '#1e293b',
    '--ttabs-content-border': '1px solid #334155',
    '--ttabs-content-text-color': '#e2e8f0',
    
    // Utility elements
    '--ttabs-resizer-hover-color': 'rgba(59, 130, 246, 0.3)',
    '--ttabs-drop-indicator-color': '#3b82f6',
    '--ttabs-drop-target-outline': '2px dashed rgba(59, 130, 246, 0.5)',
    '--ttabs-split-indicator-color': 'rgba(59, 130, 246, 0.2)',
    
    // Controls
    '--ttabs-show-close-button': 'flex', // Show close buttons in this theme
    '--ttabs-close-button-color': '#94a3b8',
    '--ttabs-close-button-hover-color': '#f87171',
    '--ttabs-close-button-hover-bg': 'rgba(255, 255, 255, 0.1)'
  },
  classes: {
    'root': 'dark-theme',
    'panel': 'dark-panel',
    'tab-bar': 'dark-tab-bar',
    'tab-header': 'dark-tab-header',
    'tab-header-active': 'dark-tab-header-active',
    'tab-close-button': 'dark-tab-close',
    'tab': 'dark-tab',
    'content': 'dark-content',
    'content-container': 'dark-content-container',
    'tab-content': 'dark-tab-content',
    'empty-state': 'dark-empty-state',
    'error': 'dark-error',
    'row': 'dark-row',
    'column': 'dark-column',
    'grid': 'dark-grid',
    'direct-content': 'dark-direct-content'
  }
}; 