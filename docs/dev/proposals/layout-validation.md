# Layout Validation Middleware Proposal

## Overview

This proposal outlines a system for validating ttabs layouts during initialization and providing fallback mechanisms when validation fails. The system will consist of:

1. A default validation mechanism that ensures basic layout integrity
2. A middleware pattern that allows users to add custom validation rules
3. A default layout initialization mechanism that serves as a fallback

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

## Implementation Details

### 1. Validation Interface

```typescript
interface LayoutValidator {
  // Returns true if layout is valid, false otherwise
  validate(ttabs: Ttabs): boolean;
  
  // Optional error message explaining why validation failed
  errorMessage?: string;
}
```

### 2. Default Validator

A built-in validator that performs basic integrity checks:

```typescript
class DefaultValidator implements LayoutValidator {
  validate(ttabs: Ttabs): boolean {
    const tiles = ttabs.getTiles();
    
    // Check for root grid
    const rootGridId = ttabs.getRootGridId();
    if (!rootGridId || !tiles[rootGridId]) {
      this.errorMessage = "Missing root grid";
      return false;
    }
    
    // Check for orphaned tiles (tiles with non-existent parents)
    const orphanedTiles = Object.values(tiles).filter(tile => 
      tile.parent && !tiles[tile.parent]
    );
    
    if (orphanedTiles.length > 0) {
      this.errorMessage = `Found ${orphanedTiles.length} orphaned tiles`;
      return false;
    }
    
    // Check for basic structure (grid should have at least one row)
    const rootGrid = tiles[rootGridId] as TileGridState;
    if (!rootGrid.rows || rootGrid.rows.length === 0) {
      this.errorMessage = "Root grid has no rows";
      return false;
    }
    
    // Check that rows have columns
    const emptyRows = rootGrid.rows.filter(rowId => {
      const row = tiles[rowId] as TileRowState;
      return !row.columns || row.columns.length === 0;
    });
    
    if (emptyRows.length > 0) {
      this.errorMessage = `Found ${emptyRows.length} empty rows`;
      return false;
    }
    
    return true;
  }
  
  errorMessage?: string;
}
```

### 3. Validation Middleware System

```typescript
interface ValidationMiddleware {
  // Array of validators to run
  validators: LayoutValidator[];
  
  // Default layout creator function
  defaultLayoutCreator?: (ttabs: Ttabs) => void;
  
  // Run all validators
  validate(ttabs: Ttabs): boolean;
  
  // Reset to default layout
  resetToDefault(ttabs: Ttabs): void;
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
  defaultLayoutCreator?: (ttabs: Ttabs) => void;
  
  /**
   * Whether to automatically reset to default layout when validation fails
   * Default: false
   */
  autoResetOnValidationFailure?: boolean;
}

// In Ttabs class
class Ttabs {
  // ... existing properties
  
  private validationMiddleware: ValidationMiddleware;
  private autoResetOnValidationFailure: boolean;
  
  constructor(options: TtabsOptions = {}) {
    // ... existing initialization
    
    // Initialize validation middleware
    this.validationMiddleware = {
      validators: [new DefaultValidator(), ...(options.validators || [])],
      defaultLayoutCreator: options.defaultLayoutCreator,
      
      validate: (ttabs: Ttabs): boolean => {
        for (const validator of this.validationMiddleware.validators) {
          if (!validator.validate(ttabs)) {
            console.warn(`Layout validation failed: ${validator.errorMessage}`);
            return false;
          }
        }
        return true;
      },
      
      resetToDefault: (ttabs: Ttabs): void => {
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
      }
    };
    
    this.autoResetOnValidationFailure = options.autoResetOnValidationFailure || false;
    
    // Validate initial layout
    if (!this.validationMiddleware.validate(this) && this.autoResetOnValidationFailure) {
      console.warn('Initial layout validation failed, resetting to default layout');
      this.validationMiddleware.resetToDefault(this);
    }
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
  setDefaultLayoutCreator(creator: (ttabs: Ttabs) => void): void {
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
}
```

## Usage Examples

### Basic Usage with Auto-Reset

```typescript
// Create ttabs with auto-reset enabled
const ttabs = new Ttabs({
  autoResetOnValidationFailure: true
});

// If the layout is ever invalid, it will automatically reset to a default layout
```

### Custom Validator for Application-Specific Requirements

```typescript
// Create a custom validator that requires a sidebar
class SidebarValidator implements LayoutValidator {
  validate(ttabs: Ttabs): boolean {
    // Check if there's a column with the 'sidebar' class
    const tiles = ttabs.getTiles();
    const hasSidebar = Object.values(tiles).some(tile => 
      tile.type === 'column' && tile.className?.includes('sidebar')
    );
    
    if (!hasSidebar) {
      this.errorMessage = "Layout must include a sidebar";
      return false;
    }
    
    return true;
  }
  
  errorMessage?: string;
}

// Create ttabs with custom validator
const ttabs = new Ttabs({
  validators: [new SidebarValidator()],
  defaultLayoutCreator: (t) => {
    // Create a layout with a sidebar
    const rowId = t.addRow(t.getRootGridId());
    
    // Add sidebar column (20% width)
    const sidebarId = t.addColumn(rowId, { width: { value: 20, unit: '%' } });
    t.updateTile(sidebarId, { className: 'sidebar' });
    
    // Add main content column (80% width)
    const mainId = t.addColumn(rowId, { width: { value: 80, unit: '%' } });
    const panelId = t.addPanel(mainId);
    t.addTab(panelId, 'Main Content');
  }
});

// Manually validate and reset if needed
if (!ttabs.validateLayout()) {
  ttabs.resetToDefaultLayout();
}
```

### Persisting Valid Layouts

```typescript
import { LocalStorageAdapter } from 'ttabs-svelte';

// Create storage adapter
const storage = new LocalStorageAdapter('my-app-layout');

// Load saved layout
const savedData = storage.load();

// Create ttabs with validation
const ttabs = new Ttabs({
  tiles: savedData?.tiles,
  validators: [new MyCustomValidator()],
  defaultLayoutCreator: createDefaultAppLayout,
  autoResetOnValidationFailure: true
});

// Save layout when it changes, but only if valid
ttabs.subscribe((state) => {
  if (ttabs.validateLayout()) {
    storage.save({
      tiles: state,
      focusedTab: ttabs.focusedActiveTab
    });
  }
});
```

## Benefits

1. **Resilience**: Applications can recover from corrupted layouts automatically
2. **Customization**: Developers can enforce application-specific layout requirements
3. **Integrity**: Prevents runtime errors from invalid layouts
4. **Flexibility**: The middleware pattern allows for composable validation rules

## Compatibility

This proposal is backward compatible with existing ttabs implementations. Applications that don't need validation can ignore these features, while those that need them can opt-in.

## Implementation Plan

1. Add validation interfaces and default validator
2. Integrate validation middleware into Ttabs constructor
3. Add public methods for validation and reset
4. Update documentation and examples
5. Add tests for validation scenarios
