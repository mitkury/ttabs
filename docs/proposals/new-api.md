# ttabs New API Proposal

## Overview

This proposal outlines a more object-oriented and chainable approach to the ttabs API, allowing for more intuitive creation and manipulation of layout elements.

## Current API

The current ttabs API uses a procedural approach where each tile creation requires referencing the ttabs instance and parent IDs:

```javascript
// Create a ttabs instance
const ttabs = createTtabs({ /* options */ });

// Create layout elements
const rootId = ttabs.rootGridId;
const rowId = ttabs.addRow(rootId);
const columnId = ttabs.addColumn(rowId);
const panelId = ttabs.addPanel(columnId);
const tabId = ttabs.addTab(panelId, 'My Tab');

// Set component for a tab
ttabs.setComponent(tabId, 'my-component', { prop1: 'value1' });
```

This approach has several limitations:
1. It requires tracking IDs manually
2. The relationship between parent and child elements is not immediately clear
3. It's difficult to chain operations
4. The code becomes verbose for complex layouts

## Proposed API

The proposed API takes an object-oriented approach where each tile returns an object that can be used to create child elements:

```javascript
// Create a ttabs instance
const ttabs = createTtabs({ /* options */ });

// Get the root grids
const grid = ttabs.newGrid();

// Create layout elements using method chaining
const row = grid.newRow();
const column = row.newColumn();
const panel = column.newPanel();
const tab = panel.newTab('My Tab');

// Set component for a tab
tab.setComponent('my-component', { prop1: 'value1' });
```

### Benefits

1. **Intuitive parent-child relationships**: Each element is created from its parent, making the hierarchy explicit
2. **No need to track IDs**: The API handles IDs internally
3. **Method chaining**: Allows for more concise code
4. **Better IDE support**: TypeScript can provide better type hints for each object type
5. **More discoverable API**: Methods on each object are specific to that object type

### Implementation Details

The new API would be implemented as a wrapper around the existing API. Each object would internally use the current ttabs methods, but provide a more object-oriented interface to the user:

```typescript
// Example implementation (simplified)
class TtabsGrid {
  constructor(private ttabs: Ttabs, private _id: string) {}
  
  // Uses existing ttabs.addRow internally
  newRow(size?: string): TtabsRow {
    const rowId = this.ttabs.addRow(this._id, size);
    return new TtabsRow(this.ttabs, rowId);
  }
  
  // Expose the ID as a getter for compatibility with existing API
  get id(): string {
    return this._id;
  }
}

class TtabsRow {
  constructor(private ttabs: Ttabs, private _id: string) {}
  
  // Uses existing ttabs.addColumn internally
  newColumn(size?: string): TtabsColumn {
    const columnId = this.ttabs.addColumn(this._id, size);
    return new TtabsColumn(this.ttabs, columnId);
  }
  
  get id(): string {
    return this._id;
  }
}

class TtabsColumn {
  constructor(private ttabs: Ttabs, private _id: string) {}
  
  // Uses existing ttabs.addPanel internally
  newPanel(): TtabsPanel {
    const panelId = this.ttabs.addPanel(this._id);
    return new TtabsPanel(this.ttabs, panelId);
  }
  
  get id(): string {
    return this._id;
  }
}

class TtabsPanel {
  constructor(private ttabs: Ttabs, private _id: string) {}
  
  // Uses existing ttabs.addTab internally
  newTab(name: string, active: boolean = false): TtabsTab {
    const tabId = this.ttabs.addTab(this._id, name, active);
    return new TtabsTab(this.ttabs, tabId);
  }
  
  get id(): string {
    return this._id;
  }
}

class TtabsTab {
  constructor(private ttabs: Ttabs, private _id: string) {}
  
  // Uses existing ttabs.setComponent internally
  setComponent(componentName: string, props?: Record<string, any>): this {
    this.ttabs.setComponent(this._id, componentName, props);
    return this;
  }
  
  get id(): string {
    return this._id;
  }
}
```

### Backward Compatibility

The existing API would be maintained for backward compatibility, with the new API provided as an alternative. This allows for gradual migration of existing code.

## Example Usage

### Creating a Complex Layout

```javascript
const ttabs = createTtabs({ /* options */ });
const grid = ttabs.newGrid();

// Create main layout
const mainRow = grid.newRow();
const leftColumn = mainRow.newColumn('260px');
const rightColumn = mainRow.newColumn();

// Add components to left column
leftColumn.newPanel()
  .newTab('Explorer')
  .setComponent('sidepanel', { view: 'explorer' });

// Create right column with split panels
const upperPanel = rightColumn.newPanel();
const editorTab = upperPanel.newTab('Editor', true)
  .setComponent('editor', { 
    content: 'function hello() {\n  console.log("Hello, world!");\n}',
    language: 'javascript'
  });

const documentTab = upperPanel.newTab('Document')
  .setComponent('document', {
    documentId: 'doc-12345',
    title: 'Getting Started',
    content: '# Getting Started\n\nWelcome to the documentation!'
  });

// Create a lower row with console
const lowerRow = rightColumn.newRow('30%');
const lowerPanel = lowerRow.newColumn().newPanel();

lowerPanel.newTab('Console')
  .setComponent('console', { autoScroll: true });
lowerPanel.newTab('Output');
lowerPanel.newTab('Debug');
```

## Additional Features

The new API could also include:

1. **Fluent configuration**: Allow setting properties in a chainable way
   ```javascript
   panel.configure({ tabPosition: 'bottom', closableTabs: true })
        .newTab('My Tab');
   ```

2. **Event handling**: Register event handlers directly on objects
   ```javascript
   tab.onClose(() => console.log('Tab closed'))
      .onFocus(() => console.log('Tab focused'));
   ```

3. **Batch operations**: Perform multiple operations at once
   ```javascript
   panel.addTabs([
     { name: 'Tab 1', component: 'editor', props: { content: '...' } },
     { name: 'Tab 2', component: 'document', props: { content: '...' } }
   ]);
   ```

## Migration Strategy

1. Implement the new API alongside the existing API
2. Update documentation with examples of both approaches
3. Provide migration guides for existing users
4. Consider the new API as the recommended approach for new code

## Conclusion

The proposed object-oriented API would make ttabs more intuitive and easier to use, especially for complex layouts. By maintaining backward compatibility, existing code can continue to work while new code can take advantage of the improved API.
