# Mobile Tabs Root

## Overview

TTabs now ships with a dedicated mobile root component, `MobileTTabsRoot`, that renders a single active panel and exposes a floating tab switcher button in the bottom-right corner. This mirrors the original proposal’s goal of a simple, flexible mobile UX without tying layout decisions to the library internals.

Use the same `ttabs` instance for both the desktop and mobile roots to keep state consistent across layouts.

## Usage

```svelte
<script lang="ts">
  import { createTtabs, TTabsRoot, MobileTTabsRoot } from "ttabs-svelte";
  import { BROWSER } from "esm-env";

  const ttabs = createTtabs();
  const regularWidth = 720;
  let isMobile = $state(false);

  $effect(() => {
    if (!BROWSER) return;

    const updateLayout = () => {
      isMobile = window.innerWidth < regularWidth;
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);

    return () => window.removeEventListener("resize", updateLayout);
  });
</script>

{#if isMobile}
  <MobileTTabsRoot {ttabs} />
{:else}
  <TTabsRoot {ttabs} />
{/if}
```

## Behavior

- **Desktop (`TTabsRoot`)**: Full grid layout with splits and tab bars.
- **Mobile (`MobileTTabsRoot`)**:
  - Shows only the active panel content.
  - Floating tab switcher button (bottom-right).
  - Overlay grid of tab tiles for quick switching/closing.

> Note: The tab switcher button only appears when rendering `MobileTTabsRoot`. Use a responsive switch in your app to toggle between roots as needed.

## Theming

`MobileTTabsRoot` uses the same theme system as the desktop root. The following CSS variables are used by the mobile UI:

- `--ttabs-mobile-tabs-toggle-bg`
- `--ttabs-mobile-tabs-toggle-color`
- `--ttabs-mobile-tabs-toggle-border`
- `--ttabs-mobile-tabs-overlay-bg`
- `--ttabs-mobile-tabs-tile-bg`
- `--ttabs-mobile-tabs-tile-border`

Theme class hooks are also available:

- `mobile-tabs-toggle`
- `mobile-tabs-overlay`
- `mobile-tab-tile`
