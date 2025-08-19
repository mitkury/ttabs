# Layout Validation Middleware Proposal

## Overview

This proposal outlines a system for validating ttabs layouts during initialization and providing fallback mechanisms when validation fails. The system will consist of:

1. A default validation mechanism that ensures basic layout integrity
2. A middleware pattern that allows users to add custom validation rules
3. A default layout initialization mechanism that serves as a fallback

Validation will run automatically when creating a ttabs instance with tiles (in the constructor) or when running the setup function.

Note: This document is a proposal. Some identifiers use conceptual names (like direct `new Ttabs()` construction and `getRootGridId`). In the current implementation, import from `ttabs-svelte` and prefer `createTtabs()`.

## Motivation

As ttabs is used in more complex applications, ensuring layout integrity becomes increasingly important. Invalid layouts can lead to:

- UI rendering errors
- Orphaned or inaccessible components
- Poor user experience
- Application crashes

By implementing a validation system with fallbacks, we can:

- Ensure layouts meet application-specific requirements
- Prevent runtime errors due to invalid layouts
- Provide graceful degradation when layouts are corrupted
- Allow applications to enforce their own layout constraints
- Expose validation errors to the UI for better user feedback

## Implementation Details

### 1. Validation Interface

```typescript
// Custom error type for layout validation
export class LayoutValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LayoutValidationError';
  }
}

interface LayoutValidator {
  // Returns true if layout is valid, throws LayoutValidationError otherwise
  validate(ttabs: TTabs): boolean;
}
```

### 2. Default Validator

A built-in validator that performs basic integrity checks:

```typescript
class DefaultValidator implements LayoutValidator {
  validate(ttabs: TTabs): boolean {
    const tiles = ttabs.getTiles();
    
    // Check for root grid
    const rootGridId = ttabs.getRootGridId();
    if (!rootGridId || !tiles[rootGridId]) {
      throw new LayoutValidationError("Missing root grid", "MISSING_ROOT_GRID");
    }
    
    // Check for orphaned tiles (tiles with non-existent parents)
    const orphanedTiles = Object.values(tiles).filter(tile => 
      tile.parent && !tiles[tile.parent]
    );
    
    if (orphanedTiles.length > 0) {
      throw new LayoutValidationError(
        `Found ${orphanedTiles.length} orphaned tiles`, 
        "ORPHANED_TILES"
      );
    }
    
    // Check for basic structure (grid should have at least one row)
    const rootGrid = tiles[rootGridId] as TileGridState;
    if (!rootGrid.rows || rootGrid.rows.length === 0) {
      throw new LayoutValidationError(
        "Root grid has no rows", 
        "EMPTY_ROOT_GRID"
      );
    }
    
    // Check that rows have columns
    const emptyRows = rootGrid.rows.filter(rowId => {
      const row = tiles[rowId] as TileRowState;
      return !row.columns || row.columns.length === 0;
    });
    
    if (emptyRows.length > 0) {
      throw new LayoutValidationError(
        `Found ${emptyRows.length} empty rows`, 
        "EMPTY_ROWS"
      );
    }
    
    return true;
  }
}
```

### 3. Validation Middleware System

```typescript
type ValidationErrorHandler = (error: LayoutValidationError) => void;

interface ValidationMiddleware {
  // Array of validators to run
  validators: LayoutValidator[];
  
  // Default layout creator function
  defaultLayoutCreator?: (ttabs: TTabs) => void;
  
  // Error handlers
  errorHandlers: ValidationErrorHandler[];
  
  // Run all validators
  validate(ttabs: TTabs): boolean;
  
  // Reset to default layout
  resetToDefault(ttabs: TTabs): void;
  
  // Add error handler
  addErrorHandler(handler: ValidationErrorHandler): void;
}
```

### 4. Integration with Ttabs Class

Add new properties and methods to the Ttabs class:

```typescript
// In TtabsOptions interface
interface TtabsOptions {
  // ... existing options
  
  /**
   * Custom validators to add to the validation middleware
   */
  validators?: LayoutValidator[];
  
  /**
   * Function to create a default layout when validation fails
   */
  defaultLayoutCreator?: (ttabs: TTabs) => void;
}

// In Ttabs class
class Ttabs {
  // ... existing properties
  
  private validationMiddleware: ValidationMiddleware;
  
  constructor(options: TtabsOptions = {}) {
    // ... existing initialization
    
    // Initialize validation middleware
    this.validationMiddleware = {
      validators: [...(options.validators || [])],
      defaultLayoutCreator: options.defaultLayoutCreator,
      errorHandlers: [],
      
      validate: (ttabs: TTabs): boolean => {
        try {
          // Always run the default validator first
          this.runDefaultValidator();
          
          // Then run custom validators
          for (const validator of this.validationMiddleware.validators) {
            validator.validate(ttabs);
          }
          return true;
        } catch (error) {
          if (error instanceof LayoutValidationError) {
            // Notify error handlers
            this.validationMiddleware.errorHandlers.forEach(handler => {
              handler(error);
            });
            
            console.warn(`Layout validation failed: ${error.message} (${error.code})`);
            
            // Reset to default layout
            this.validationMiddleware.resetToDefault(this);
            return false;
          }
          // Re-throw other errors
          throw error;
        }
      },
      
      resetToDefault: (ttabs: TTabs): void => {
        // Clear existing tiles
        this.tiles = {};
        
        // Create new root grid
        this.rootGridId = this.addGrid();
        
        // Apply default layout if provided
        if (this.validationMiddleware.defaultLayoutCreator) {
          this.validationMiddleware.defaultLayoutCreator(this);
        } else {
          // Create a minimal valid layout
          const rowId = this.addRow(this.rootGridId);
          const columnId = this.addColumn(rowId);
          const panelId = this.addPanel(columnId);
          this.addTab(panelId, 'Default Tab');
        }
        
        // Notify state change
        this.notifyStateChange();
      },
      
      addErrorHandler: (handler: ValidationErrorHandler): void => {
        this.validationMiddleware.errorHandlers.push(handler);
      }
    };
    
    // Validate initial layout when created with tiles
    if (Object.keys(this.tiles).length > 0) {
      this.validateLayout();
    }
  }
  
  /**
   * Run the default validator
   * @private
   */
  private runDefaultValidator(): void {
    const defaultValidator = new DefaultValidator();
    defaultValidator.validate(this);
  }
  
  /**
   * Add a custom validator to the validation middleware
   * @param validator The validator to add
   */
  addValidator(validator: LayoutValidator): void {
    this.validationMiddleware.validators.push(validator);
  }
  
  /**
   * Set the default layout creator function
   * @param creator Function that creates a default layout
   */
  setDefaultLayoutCreator(creator: (ttabs: TTabs) => void): void {
    this.validationMiddleware.defaultLayoutCreator = creator;
  }
  
  /**
   * Validate the current layout
   * @returns True if layout is valid, false otherwise
   */
  validateLayout(): boolean {
    return this.validationMiddleware.validate(this);
  }
  
  /**
   * Reset to the default layout
   */
  resetToDefaultLayout(): void {
    this.validationMiddleware.resetToDefault(this);
  }
  
  /**
   * Setup the ttabs instance with the given tiles
   * This will validate the layout and reset to default if invalid
   * @param tiles The tiles to set up
   */
  setup(tiles: Record<string, TileState>): void {
    this.tiles = tiles;
    this.rootGridId = this.findRootGridId();
    this.validateLayout();
  }
  
  /**
   * Subscribe to layout validation errors
   * @param handler Function to call when validation errors occur
   * @returns Unsubscribe function
   */
  onValidationError(handler: ValidationErrorHandler): () => void {
    this.validationMiddleware.addErrorHandler(handler);
    
    // Return unsubscribe function
    return () => {
      this.validationMiddleware.errorHandlers = 
        this.validationMiddleware.errorHandlers.filter(h => h !== handler);
    };
  }
}
```

## Usage Examples

### Basic Usage

```typescript
// Create ttabs with default validation
const ttabs = createTtabs();

// Validation happens automatically when tiles are provided in constructor
const ttabsWithTiles = createTtabs({
  tiles: existingTiles
});

// Or when using the setup function
ttabs.setup(loadedTiles);

// In both cases, if the layout is invalid, it will reset to a default layout
```

### Custom Validator for Application-Specific Requirements

```typescript
// Create a custom validator that requires a sidebar
class SidebarValidator implements LayoutValidator {
  validate(ttabs: TTabs): boolean {
    // Check if there's a column with a specific width that serves as a sidebar
    const tiles = ttabs.getTiles();
    const rootGridId = ttabs.getRootGridId();
    const rootGrid = tiles[rootGridId] as TileGridState;
    
    if (!rootGrid || !rootGrid.rows || rootGrid.rows.length === 0) {
      throw new LayoutValidationError(
        "Invalid root grid structure", 
        "INVALID_GRID_STRUCTURE"
      );
    }
    
    // Get the first row
    const mainRowId = rootGrid.rows[0];
    const mainRow = tiles[mainRowId] as TileRowState;
    
    if (!mainRow || !mainRow.columns || mainRow.columns.length < 2) {
      throw new LayoutValidationError(
        "Layout must include at least two columns in the main row", 
        "MISSING_COLUMNS"
      );
    }
    
    // Check if the first column has the expected width for a sidebar
    const leftColumnId = mainRow.columns[0];
    const leftColumn = tiles[leftColumnId] as TileColumnState;
    
    if (!leftColumn || leftColumn.width.unit !== 'px' || 
        (leftColumn.width.value !== 260 && leftColumn.width.value !== 0)) {
      throw new LayoutValidationError(
        "Layout must include a sidebar column with width 260px or 0px", 
        "INVALID_SIDEBAR"
      );
    }
    
    return true;
  }
}

// Create ttabs with custom validator
const ttabs = createTtabs({
  validators: [new SidebarValidator()],
  defaultLayoutCreator: (t) => {
    // Create a layout with a sidebar
    const rowId = t.addRow(t.getRootGridId());
    
    // Add sidebar column (260px width)
    const leftColumn = t.addColumn(rowId, { width: { value: 260, unit: 'px' } });
    
    // Add main content column (percentage-based)
    const mainId = t.addColumn(rowId, { width: { value: 100, unit: '%' } });
    const panelId = t.addPanel(mainId);
    t.addTab(panelId, 'Main Content');
    
    // Add component to sidebar
    t.setComponent(leftColumn, 'sidepanel', {
      title: "Navigation",
      items: [
        { id: "files", label: "Files", icon: "📁" },
        { id: "search", label: "Search", icon: "🔍" },
      ]
    });
  }
});
```

### Persisting Valid Layouts and Handling Errors

```typescript
import { LocalStorageAdapter } from 'ttabs-svelte';

// Create storage adapter
const storage = new LocalStorageAdapter('my-app-layout');

// Load saved layout
const savedData = storage.load();

// Create ttabs with validation
const ttabs = createTtabs({
  tiles: savedData?.tiles,
  validators: [new MyCustomValidator()],
  defaultLayoutCreator: createDefaultAppLayout
});

// Subscribe to validation errors and show them in UI
ttabs.onValidationError((error) => {
  showErrorNotification(`Layout validation failed: ${error.message}`);
  console.error(`Validation error: ${error.code} - ${error.message}`);
});

// Save layout when it changes
ttabs.subscribe((state) => {
  storage.save({
    tiles: state,
    focusedTab: ttabs.focusedActiveTab
  });
});
```

## Benefits

1. **Resilience**: Applications can recover from corrupted layouts automatically
2. **Customization**: Developers can enforce application-specific layout requirements
3. **Integrity**: Prevents runtime errors from invalid layouts
4. **Flexibility**: The middleware pattern allows for composable validation rules
5. **Error Handling**: Provides a way to display validation errors in the UI

## Implementation Plan

1. Add validation interfaces and default validator
2. Integrate validation middleware into Ttabs constructor
3. Add public methods for validation and reset
4. Implement error subscription mechanism
5. Update documentation and examples
6. Add tests for validation scenarios