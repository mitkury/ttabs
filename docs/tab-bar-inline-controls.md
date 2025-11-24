# Proposal: Inline Tab Bar Controls

Goal: allow panels to host arbitrary tab-bar controls (icons, buttons, menus) on both the left (after tabs) and the right edge, similar to VS Code. Keep the API small and component-driven.

## Data shape
- Extend `TilePanelState` with `tabBarComponents?: Array<{ componentId: string; props?: Record<string, any>; align?: 'left' | 'right'; id?: string }>`; `align` defaults to `left`.
- `id` is optional but useful for keyed rendering.

## Rendering
- In `TilePanel.svelte`, split `tabBarComponents` into left/right buckets.
- Render left bucket immediately after the tabs.
- Render right bucket inside a flex child with `margin-left: auto` to anchor to the right.
- Resolve each entry via `ttabs.getContentComponent(componentId)` and pass `{ ttabs, panelId, ...props }`.

## Consumer usage
```ts
ttabs.registerComponent('tab-add', AddTabButton);
ttabs.registerComponent('tab-split', SplitButton);

panel.tabBarComponents = [
  { componentId: 'tab-add' },                   // left by default
  { componentId: 'tab-split', align: 'right' }, // right side
  { componentId: 'tab-more', align: 'right', props: { menu: [...] } }
];
```
- Components control their own visuals (icon/text) and actions (create tab, open menu, toggle view).

## Styling
- Core provides minimal wrappers (`inline-flex`, small gap, `margin-left: auto` for right group).
- Themes can override via classes/vars; components can add their own styles as needed.

## Rationale
- Single, small API; no special casing per control.
- Ordering is explicit per side; multiple controls supported naturally.
- Mirrors VS Code’s left/right affordances while keeping implementation straightforward.
