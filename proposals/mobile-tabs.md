# Proposal: Mobile Tab Switcher Layout

## Summary
Introduce a mobile-friendly layout mode that replaces the desktop tab strip with a compact tab switcher button. When activated, it reveals a grid of tab “tiles” similar to mobile browsers. This keeps the UI usable on narrow screens while preserving existing desktop behavior.

## Goals
- Switch to a mobile layout automatically below a configurable breakpoint.
- Provide a lightweight, per-panel tab switcher button.
- Render tabs as tiles in an overlay for quick selection/closing.
- Keep the implementation simple and themeable.

## Non-Goals
- Rework drag-and-drop for touch.
- Add advanced gestures or tab previews.
- Redesign the entire layout system.

## Proposed UX
- **Desktop (default):** existing tab bar behavior.
- **Mobile:**
  - Replace the tab bar with a single “Tabs” button that shows the active tab name + tab count.
  - Tapping the button opens a full-panel overlay with tab tiles.
  - Each tile activates the tab; a close button is available on each tile.

## Implementation Plan
1. Add a `mobileBreakpoint` option to `TtabsOptions` (default: `720`).
2. In `TTabsRoot`, observe the root width and set `ttabs.isMobileLayout` accordingly.
3. In `TilePanel`, switch between the regular tab bar and the mobile toggle button based on `ttabs.isMobileLayout`.
4. Implement a simple overlay with tab tiles for mobile mode.
5. Add minimal theme variables/classes for styling the mobile UI.

## Open Questions
- Should the breakpoint be configured via theme variables as well?
- Should the overlay optionally show tab previews?
