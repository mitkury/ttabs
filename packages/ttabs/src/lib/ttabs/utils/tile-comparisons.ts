import type { 
  Tile, 
  TileGrid, 
  TileRow, 
  TileColumn, 
  TilePanel, 
  TileTab, 
  TileContent,
  SizeInfo 
} from '../types/tile-types';

/**
 * Compare two SizeInfo objects for equality
 */
function areSizeInfoEqual(a: SizeInfo, b: SizeInfo): boolean {
  return a.value === b.value && a.unit === b.unit;
}

/**
 * Compare two arrays for equality
 */
function areArraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

/**
 * Compare two data objects for equality
 */
function areDataEqual(a?: Record<string, any>, b?: Record<string, any>): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => {
    if (!keysB.includes(key)) return false;
    
    const valA = a[key];
    const valB = b[key];
    
    if (typeof valA !== typeof valB) return false;
    
    if (valA === null || valB === null) return valA === valB;
    
    if (typeof valA === 'object') {
      if (Array.isArray(valA) && Array.isArray(valB)) {
        return areArraysEqual(valA, valB);
      }
      return areDataEqual(valA, valB);
    }
    
    return valA === valB;
  });
}

/**
 * Compare two tile objects for equality based on their properties
 * @param a First tile to compare
 * @param b Second tile to compare
 * @returns True if tiles have the same properties, false otherwise
 */
export function areTilesEqual(a: Tile | null | undefined, b: Tile | null | undefined): boolean {
  // Handle null/undefined cases
  if (a === b) return true;
  if (!a || !b) return false;
  
  // Compare base properties
  if (a.type !== b.type || a.parent !== b.parent) return false;
  
  // Type-specific comparisons
  switch (a.type) {
    case 'grid': {
      const gridA = a as TileGrid;
      const gridB = b as TileGrid;
      return areArraysEqual(gridA.rows, gridB.rows);
    }
    
    case 'row': {
      const rowA = a as TileRow;
      const rowB = b as TileRow;
      return areArraysEqual(rowA.columns, rowB.columns) && 
             areSizeInfoEqual(rowA.height, rowB.height) &&
             rowA.computedSize === rowB.computedSize &&
             rowA.originalHeight === rowB.originalHeight;
    }
    
    case 'column': {
      const colA = a as TileColumn;
      const colB = b as TileColumn;
      return colA.child === colB.child && 
             areSizeInfoEqual(colA.width, colB.width) &&
             colA.computedSize === colB.computedSize &&
             colA.originalWidth === colB.originalWidth;
    }
    
    case 'panel': {
      const panelA = a as TilePanel;
      const panelB = b as TilePanel;
      return areArraysEqual(panelA.tabs, panelB.tabs) && 
             panelA.activeTab === panelB.activeTab;
    }
    
    case 'tab': {
      const tabA = a as TileTab;
      const tabB = b as TileTab;
      return tabA.name === tabB.name && 
             tabA.content === tabB.content &&
             tabA.isLazy === tabB.isLazy;
    }
    
    case 'content': {
      const contentA = a as TileContent;
      const contentB = b as TileContent;
      return contentA.componentId === contentB.componentId &&
             areDataEqual(contentA.data, contentB.data);
    }
    
    default:
      return false;
  }
}

/**
 * Compare two arrays of tiles for equality
 * @param a First array of tiles to compare
 * @param b Second array of tiles to compare
 * @returns True if arrays contain tiles with the same properties in the same order, false otherwise
 */
export function areTileArraysEqual(
  a: Tile[] | null | undefined, 
  b: Tile[] | null | undefined
): boolean {
  // Handle null/undefined cases
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  
  // Compare each tile in the arrays
  return a.every((tileA, index) => areTilesEqual(tileA, b[index]));
}
