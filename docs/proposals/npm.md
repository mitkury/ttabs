# Proposal: ttabs-svelte as an NPM Package

## Overview

This proposal outlines how to structure ttabs-svelte as an npm package specifically for Svelte applications while maintaining examples and development environment in the same repository, using a monorepo approach.

## Proposed Structure

```
ttabs/
├── packages/
│   └── ttabs-svelte/           # The actual npm package
│       ├── src/               # Source code
│       │   └── lib/           # The library code
│       │       └── ttabs/     # ttabs implementation
│       ├── package.json       # Package configuration
│       ├── tsconfig.json      # TypeScript configuration 
│       ├── README.md          # Package documentation
│       └── vite.config.ts     # Build configuration
│
├── examples/                  # Examples and demos
│   ├── basic/                 # Basic usage example
│   ├── advanced/              # Advanced features example
│   └── ...
│
├── docs/                      # Documentation 
├── README.md                  # Repository documentation
├── package.json               # Root package.json for development only
└── .gitignore                 # Git ignore file
```

## Implementation Plan

### 1. Package Configuration

The main package.json for ttabs-svelte should:
- Set `"private": false`
- Include proper package metadata
- Define entry points using the "exports" field
- Specify peer dependencies (svelte)
- Include appropriate npm keywords

### 2. Build Configuration

- Configure Vite/SvelteKit for library mode
- Ensure proper TypeScript declarations are generated
- Set up proper module formats (ESM, potentially UMD)

### 3. Package Exports

The package should export:
- Core components (TileGrid, TileRow, TileColumn, TilePanel, TileTab, TtabsRoot)
- Ttabs main class and factory function
- Types and interfaces
- Themes and utilities
- Storage adapters

### 4. Examples Structure

Each example should be a self-contained SvelteKit/Vite project that:
- Imports ttabs-svelte from the local package
- Demonstrates specific features or use cases
- Has its own package.json and configuration

### 5. Development Workflow

- Root package.json will provide scripts for development
- Each example can be run independently
- Changes to the ttabs-svelte package will be reflected in examples

## Using as a Git Submodule During Development

While ttabs-svelte is in active development, it can be used as a Git submodule before publishing to npm. This approach allows for rapid iteration and immediate testing within applications.

### Setting Up the Submodule

```bash
# In your main application repository
git submodule add https://github.com/mitkury/ttabs.git submodules/ttabs
git submodule update --init --recursive
```

### Referencing in Your Application

In your application's package.json:

```json
"dependencies": {
  "ttabs-svelte": "file:./submodules/ttabs/packages/ttabs-svelte"
}
```

### Working with the Submodule

Update the submodule to the latest version:
```bash
git submodule update --remote
```

Make changes to the submodule directly:
```bash
cd submodules/ttabs
# Make changes to the code
npm run build
# Changes are immediately reflected in your main application
```

Push changes back to the ttabs repository:
```bash
cd submodules/ttabs
git checkout -b my-feature
git add .
git commit -m "feat: add new feature"
git push origin my-feature
# Then create a PR to merge changes
```

This approach allows for tight integration during development while still maintaining the structure needed for eventual npm publication.

## Benefits

1. **Clean separation**: Clear distinction between package code and examples
2. **Better testing**: Examples serve as integration tests
3. **Publication ready**: Package can be published directly to npm
4. **Documentation**: Examples provide practical usage documentation
5. **Progressive disclosure**: Basic to advanced examples show different complexity levels

## Usage for Consumers

```javascript
// When published to npm, usage would look like:
import { Ttabs, TtabsRoot } from 'ttabs-svelte';
import { darkTheme } from 'ttabs-svelte/themes';

// Create a new ttabs instance
const ttabs = new Ttabs({
  theme: darkTheme,
  // other options
});

// In a Svelte component
<TtabsRoot {ttabs} />
```

## Publishing Considerations

### 1. Versioning

- Follow semantic versioning (semver)
- Use proper changelogs
- Consider using a tool like `release-it` for version management

### 2. Package Size

- Analyze bundle size and optimize where possible
- Consider tree-shaking friendly exports
- Potentially offer both full and core packages

### 3. Documentation

- Include JSDoc comments for better IDE integration
- Provide a comprehensive README with examples
- Create a documentation site for more detailed usage

### 4. Compatibility

- Clearly specify Svelte version compatibility (Svelte 5)
- Document any SvelteKit-specific features or requirements
- Consider future expansion to other frameworks

## Next Steps

1. Create initial monorepo structure
2. Move existing code to new structure
3. Configure build system
4. Create basic example
5. Test locally
6. Publish to npm 