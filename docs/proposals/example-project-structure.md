# Example Project Structure

This document shows how a basic example project would be structured in the monorepo.

## Basic Example Structure

```
examples/basic/
├── src/
│   ├── lib/
│   │   └── components/
│   │       └── BasicExample.svelte  # Example component using ttabs-svelte
│   ├── routes/
│   │   ├── +layout.svelte           # SvelteKit layout
│   │   └── +page.svelte             # Main page using BasicExample
│   └── app.html                     # HTML template
├── static/
│   └── favicon.png
├── package.json                     # Example project configuration
├── svelte.config.js                 # Svelte configuration 
├── tsconfig.json                    # TypeScript configuration
└── vite.config.ts                   # Vite configuration
```

## Example package.json

```json
{
  "name": "ttabs-svelte-basic-example",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^4.0.0",
    "@sveltejs/kit": "^2.16.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.2.5"
  },
  "dependencies": {
    "ttabs-svelte": "file:../../packages/ttabs-svelte"
  }
}
```

## Example BasicExample.svelte

```svelte
<script>
  import { Ttabs, TtabsRoot, darkTheme } from 'ttabs-svelte';
  
  // Create a ttabs instance
  const ttabs = new Ttabs({
    theme: darkTheme,
    // Other options as needed
  });

  // Optional: Initialize with some content
  ttabs.createDefaultLayout();
</script>

<div class="container">
  <h1>Basic ttabs Example</h1>
  
  <div class="ttabs-container">
    <TtabsRoot {ttabs} />
  </div>
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .ttabs-container {
    flex: 1;
    min-height: 0;
    border: 1px solid #ccc;
  }
</style>
```

## Example +page.svelte

```svelte
<script>
  import BasicExample from '$lib/components/BasicExample.svelte';
</script>

<svelte:head>
  <title>ttabs-svelte Basic Example</title>
</svelte:head>

<BasicExample />
```

This example demonstrates:
1. How to import ttabs-svelte from the package
2. Basic setup of a ttabs instance
3. Rendering ttabs in a Svelte component
4. Simple styling to ensure proper layout

With this structure, you can run the example with:
```
cd examples/basic
npm run dev
```

During development, you can use npm link to connect the example to your local ttabs-svelte package:
```
cd packages/ttabs-svelte
npm run build
npm link
cd ../../examples/basic
npm link ttabs-svelte
``` 