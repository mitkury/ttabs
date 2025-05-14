import type { TileGridState, TileRowState } from '../types/tile-types';
import type { Ttabs } from '../Ttabs.svelte';
import { LayoutValidationError, type LayoutValidator } from './validation-types';

/**
 * Default validator that performs basic integrity checks on a ttabs layout
 * @param ttabs The ttabs instance to validate
 * @returns true if layout is valid, throws LayoutValidationError otherwise
 */
export const defaultValidator: LayoutValidator = (ttabs: Ttabs): boolean => {
  const tiles = ttabs.getTiles();
  
  // Check for root grid
  const rootGridId = ttabs.rootGridId;
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
