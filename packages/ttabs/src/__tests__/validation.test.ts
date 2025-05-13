import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  Ttabs, 
  LayoutValidationError, 
  type LayoutValidator,
  type TileState, 
  type TileGridState, 
  type TileRowState, 
  type TileColumnState 
} from 'ttabs-svelte';

describe('Layout Validation', () => {
  // Mock console.warn to avoid cluttering test output
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Default Validator', () => {
    it('should validate a valid layout', () => {
      // Create a valid layout
      const ttabs = new Ttabs();
      const rowId = ttabs.addRow(ttabs.rootGridId);
      const columnId = ttabs.addColumn(rowId);
      const panelId = ttabs.addPanel(columnId);
      ttabs.addTab(panelId, 'Test Tab');
      
      // Should not throw when validating
      expect(() => ttabs.validateLayout()).not.toThrow();
    });

    it('should detect missing root grid', () => {
      // Create an invalid layout with no root grid
      const ttabs = new Ttabs();
      
      // Clear tiles to create an invalid state
      ttabs.resetTiles();
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false
      expect(ttabs.validateLayout()).toBe(false);
      
      // Error handler should be called with appropriate error
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_ROOT_GRID'
        })
      );
    });

    it('should detect orphaned tiles', () => {
      // Create a layout with orphaned tiles
      const ttabs = new Ttabs();
      const rowId = ttabs.addRow(ttabs.rootGridId);
      const columnId = ttabs.addColumn(rowId);
      
      // Create an orphaned tile by setting a non-existent parent
      ttabs.updateTile(columnId, { parent: 'non-existent-parent' });
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false
      expect(ttabs.validateLayout()).toBe(false);
      
      // Error handler should be called with appropriate error
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ORPHANED_TILES'
        })
      );
    });

    it('should detect empty root grid (no rows)', () => {
      // Create a layout with no rows in the root grid
      const ttabs = new Ttabs();
      
      // Remove all rows from the root grid
      const rootGrid = ttabs.tiles[ttabs.rootGridId] as TileGridState;
      ttabs.updateTile(ttabs.rootGridId, { rows: [] });
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false
      expect(ttabs.validateLayout()).toBe(false);
      
      // Error handler should be called with appropriate error
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'EMPTY_ROOT_GRID'
        })
      );
    });

    it('should detect empty rows (no columns)', () => {
      // Create a layout with an empty row
      const ttabs = new Ttabs();
      const rowId = ttabs.addRow(ttabs.rootGridId);
      
      // Don't add any columns to the row
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false
      expect(ttabs.validateLayout()).toBe(false);
      
      // Error handler should be called with appropriate error
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'EMPTY_ROWS'
        })
      );
    });
  });

  describe('Custom Validators', () => {
    it('should run custom validators', () => {
      // Create a custom validator that requires at least one panel
      const customValidator: LayoutValidator = {
        validate: (ttabs) => {
          const hasPanels = Object.values(ttabs.getTiles()).some(tile => tile.type === 'panel');
          if (!hasPanels) {
            throw new LayoutValidationError('Layout must have at least one panel', 'MISSING_PANEL');
          }
          return true;
        }
      };
      
      // Create a ttabs instance with the custom validator
      const ttabs = new Ttabs({
        validators: [customValidator]
      });
      
      // Create a layout without panels
      const rowId = ttabs.addRow(ttabs.rootGridId);
      ttabs.addColumn(rowId);
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false
      expect(ttabs.validateLayout()).toBe(false);
      
      // Error handler should be called with appropriate error
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_PANEL'
        })
      );
    });

    it('should add validators after initialization', () => {
      // Create a ttabs instance
      const ttabs = new Ttabs();
      
      // Create a layout without tabs
      const rowId = ttabs.addRow(ttabs.rootGridId);
      const columnId = ttabs.addColumn(rowId);
      ttabs.addPanel(columnId);
      
      // Add a custom validator that requires at least one tab
      const customValidator: LayoutValidator = {
        validate: (ttabs) => {
          const hasTabs = Object.values(ttabs.getTiles()).some(tile => tile.type === 'tab');
          if (!hasTabs) {
            throw new LayoutValidationError('Layout must have at least one tab', 'MISSING_TAB');
          }
          return true;
        }
      };
      
      ttabs.addValidator(customValidator);
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false
      expect(ttabs.validateLayout()).toBe(false);
      
      // Error handler should be called with appropriate error
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_TAB'
        })
      );
    });
  });

  describe('Default Layout Reset', () => {
    it('should reset to default layout when validation fails', () => {
      // Create a ttabs instance
      const ttabs = new Ttabs();
      
      // Create an invalid layout
      ttabs.resetTiles();
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Validate should return false and reset to default
      expect(ttabs.validateLayout()).toBe(false);
      
      // After validation, should have a valid layout
      expect(ttabs.rootGridId).toBeTruthy();
      expect(ttabs.tiles[ttabs.rootGridId]).toBeDefined();
      expect(ttabs.tiles[ttabs.rootGridId].type).toBe('grid');
      
      // Should have at least one row
      const rootGrid = ttabs.tiles[ttabs.rootGridId] as TileGridState;
      expect(rootGrid.rows?.length).toBeGreaterThan(0);
      
      // Row should have at least one column
      if (rootGrid.rows && rootGrid.rows.length > 0) {
        const rowId = rootGrid.rows[0];
        const row = ttabs.tiles[rowId] as TileRowState;
        expect(row.columns?.length).toBeGreaterThan(0);
      }
    });

    it('should use custom default layout creator', () => {
      // Create a flag to check if the creator was called
      let creatorCalled = false;
      
      // Create a ttabs instance with a custom default layout creator
      const ttabs = new Ttabs({
        defaultLayoutCreator: (t) => {
          creatorCalled = true;
          
          // Create a custom layout - note that rootGridId is already created by resetToDefault
          // before calling the defaultLayoutCreator
          const rowId = t.addRow(t.rootGridId);
          const columnId = t.addColumn(rowId);
          const panelId = t.addPanel(columnId);
          t.addTab(panelId, 'Custom Default Tab');
        }
      });
      
      // Create an invalid layout
      ttabs.resetTiles();
      
      // Validate should return false and reset to default using the custom creator
      expect(ttabs.validateLayout()).toBe(false);
      
      // Creator should have been called
      expect(creatorCalled).toBe(true);
      
      // Should have a tab with the custom name
      const hasTabs = Object.values(ttabs.getTiles()).some(
        tile => tile.type === 'tab' && (tile as any).name === 'Custom Default Tab'
      );
      expect(hasTabs).toBe(true);
    });
  });

  describe('Setup Validation', () => {
    it('should validate layout during setup', () => {
      // Create a ttabs instance
      const ttabs = new Ttabs();
      
      // Create an invalid layout (missing columns in row)
      const invalidTiles: TileState[] = [
        {
          id: 'grid1',
          type: 'grid',
          rows: ['row1'],
          parent: null
        } as unknown as TileGridState,
        {
          id: 'row1',
          type: 'row',
          columns: [], // Empty columns array - invalid
          parent: 'grid1',
          height: { value: 100, unit: '%' }
        } as unknown as TileRowState
      ];
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Setup should validate and reset to default
      ttabs.setup(invalidTiles);
      
      // Error handler should be called
      expect(errorHandler).toHaveBeenCalled();
      
      // Should have a valid layout after setup
      expect(ttabs.rootGridId).toBeTruthy();
      const rootGrid = ttabs.tiles[ttabs.rootGridId] as TileGridState;
      expect(rootGrid.rows.length).toBeGreaterThan(0);
    });

    it('should validate layout during setupWithRecord', () => {
      // Create a ttabs instance
      const ttabs = new Ttabs();
      
      // Create an invalid layout (orphaned tile)
      const invalidTiles: Record<string, TileState> = {
        'grid1': {
          id: 'grid1',
          type: 'grid',
          rows: ['row1'],
          parent: null
        } as unknown as TileGridState,
        'row1': {
          id: 'row1',
          type: 'row',
          columns: ['col1'],
          parent: 'grid1',
          height: { value: 100, unit: '%' }
        } as unknown as TileRowState,
        'col1': {
          id: 'col1',
          type: 'column',
          parent: 'non-existent', // Orphaned tile - invalid
          width: { value: 100, unit: '%' }
        } as unknown as TileColumnState
      };
      
      // Mock the error handler
      const errorHandler = vi.fn();
      ttabs.onValidationError(errorHandler);
      
      // Setup should validate and reset to default
      ttabs.setupWithRecord(invalidTiles);
      
      // Error handler should be called
      expect(errorHandler).toHaveBeenCalled();
      
      // Should have a valid layout after setup
      expect(ttabs.rootGridId).toBeTruthy();
    });
  });
});
