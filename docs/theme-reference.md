# Theme Reference

This document provides a comprehensive list of all CSS variables available for theming in ttabs.

## Base Variables

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-panel-bg` | Panel background color | `white` |
| `--ttabs-tab-bar-bg` | Tab bar background color | `#f5f5f5` |
| `--ttabs-active-tab-bg` | Active tab background | `white` |
| `--ttabs-active-tab-indicator` | Active tab indicator color | `#4a6cf7` |
| `--ttabs-grid-bg` | Grid background color | `#f0f0f0` |
| `--ttabs-grid-border` | Grid border style | `1px solid #ddd` |
| `--ttabs-column-border` | Column border style | `1px solid #ddd` |

## Text Colors

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-text-color` | Main text color | `#333` |
| `--ttabs-text-color-secondary` | Secondary text color | `#666` |
| `--ttabs-tab-text-color` | Tab text color | `#555` |
| `--ttabs-tab-active-text-color` | Active tab text color | `#333` |

## Content Area

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-content-bg` | Content background color | `white` |
| `--ttabs-content-border` | Content border style | `1px solid #ddd` |
| `--ttabs-content-text-color` | Content text color | `#333` |

## Tab Headers

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-tab-header-padding` | Tab header padding | `0.5rem 1rem` |
| `--ttabs-tab-header-font-size` | Tab header font size | `0.9rem` |
| `--ttabs-tab-bar-border` | Tab bar border style | `1px solid #ddd` |

## Controls

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-show-close-button` | Close button display | `flex` |
| `--ttabs-close-button-color` | Close button color | `#888` |
| `--ttabs-close-button-hover-color` | Close button hover color | `tomato` |
| `--ttabs-close-button-hover-bg` | Close button hover background | `rgba(0, 0, 0, 0.1)` |

## Error Styling

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-error-bg` | Error background color | `#fff5f5` |
| `--ttabs-error-color` | Error text color | `tomato` |
| `--ttabs-error-border` | Error border style | `1px solid tomato` |

## Empty State

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-empty-state-color` | Empty state text color | `#666` |

## Utility Elements

| Variable | Description | Default Value |
| --- | --- | --- |
| `--ttabs-resizer-hover-color` | Resizer hover color | `rgba(74, 108, 247, 0.3)` |
| `--ttabs-drop-indicator-color` | Drop indicator color | `#4a6cf7` |
| `--ttabs-drop-target-outline` | Drop target outline style | `2px dashed rgba(74, 108, 247, 0.5)` |
| `--ttabs-split-indicator-color` | Split indicator color | `rgba(74, 108, 247, 0.1)` |

## Element Classes

You can also customize CSS classes for different elements using the `classes` property in your theme:

| Element Type | Description |
| --- | --- |
| `'root'` | Root container element |
| `'panel'` | Panel container |
| `'grid'` | Grid container |
| `'row'` | Row container |
| `'column'` | Column container |
| `'tab'` | Tab content container |
| `'tab-bar'` | Tab bar containing tab headers |
| `'tab-header'` | Individual tab header |
| `'tab-header-active'` | Active tab header |
| `'tab-close-button'` | Tab close button |
| `'tab-content'` | Tab content area |
| `'content'` | Generic content container |
| `'content-container'` | Content wrapper |
| `'direct-content'` | Direct content without tabs |
| `'empty-state'` | Empty state placeholder |
| `'error'` | Error display | 