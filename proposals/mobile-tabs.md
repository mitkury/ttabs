# Proposal: Mobile Tab Switcher Layout

## Summary
Introduce a mobile-friendly root component that replaces the desktop tab strip with a compact tab switcher button. When activated, it reveals a grid of tab “tiles” similar to mobile browsers. This keeps the UI usable on narrow screens while preserving existing desktop behavior.

## Goals
- Allow apps to explicitly choose between desktop and mobile roots.
- Provide a lightweight tab switcher button anchored to the bottom-right.
- Render tabs as tiles in an overlay for quick selection/closing.
- Keep the implementation simple and themeable.

## Non-Goals
- Rework drag-and-drop for touch.
- Add advanced gestures or tab previews.
- Redesign the entire layout system.

## Proposed UX
- **Desktop (default):** existing `TTabsRoot` with tab bars and splits.
- **Mobile (`MobileTTabsRoot`):**
  - Render only the active panel content (no splits).
  - Show a bottom-right “Tabs” button with active tab name + count.
  - Tapping the button opens a full overlay with tab tiles.
  - Each tile activates the tab; a close button is available on each tile.

## Implementation Plan
1. Add a new `MobileTTabsRoot` component that renders only one panel.
2. Keep `TTabsRoot` unchanged for desktop layouts.
3. Implement a floating tabs button + overlay in `MobileTTabsRoot`.
4. Add minimal theme variables/classes for styling the mobile UI.

## Open Questions
- Should we export a helper for responsive root switching?
- Should the overlay optionally show tab previews?
