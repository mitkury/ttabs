/**
 * Possible tile types
 */
export type TileType = 'grid' | 'row' | 'column' | 'panel' | 'tab' | 'content';

/**
 * Base tile interface with common properties
 */
export interface TileBase {
  id: string;
  parent: string | null;
  type: TileType;
  dontClean?: boolean;
}

/**
 * Grid tile that contains rows
 */
export interface TileGrid extends TileBase {
  type: 'grid';
  rows: string[];
}

/**
 * Row tile that contains columns
 */
export interface TileRow extends TileBase {
  type: 'row';
  columns: string[];
  height: number;
}

/**
 * Column tile that contains a single child (panel, grid, or content)
 */
export interface TileColumn extends TileBase {
  type: 'column';
  child: string; // ID of a TilePanel, TileGrid, or direct TileContent
  width: number;
}

/**
 * Panel tile that contains tabs
 */
export interface TilePanel extends TileBase {
  type: 'panel';
  tabs: string[];
  activeTab: string | null;
}

/**
 * Tab tile that references content
 */
export interface TileTab extends TileBase {
  type: 'tab';
  name: string;
  content: string; // ID of a content tile
  isLazy: boolean;
}

/**
 * Content tile that contains actual content
 * Can be extended with application-specific properties
 */
export interface TileContent extends TileBase {
  type: 'content';
  componentId?: string;      // ID of the component to render this content
  data?: Record<string, any>; // Data payload as key-value pairs
}

/**
 * Union type of all possible tile types
 */
export type Tile = TileGrid | TileRow | TileColumn | TilePanel | TileTab | TileContent;