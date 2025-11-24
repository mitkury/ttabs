/**
 * Possible tile types
 */
export type TileType = 'grid' | 'row' | 'column' | 'panel' | 'tab' | 'content';

/**
 * Type for panel UI component
 */
export interface PanelUIComponent {
  componentId: string;
  props?: Record<string, any>;
  align?: 'left' | 'right';
}

/**
 * Base tile interface with common properties
 */
export interface TileBaseState {
  id: string;
  parent: string | null;
  type: TileType;
  dontClean?: boolean;
}

/**
 * Size information with unit
 */
export interface SizeInfo {
  value: number;
  unit: 'px' | '%';
}

/**
 * Grid tile that contains rows
 */
export interface TileGridState extends TileBaseState {
  type: 'grid';
  rows: string[];
}

/**
 * Row tile that contains columns
 */
export interface TileRowState extends TileBaseState {
  type: 'row';
  columns: string[];
  height: SizeInfo;
  computedSize?: number;
  originalHeight?: number; // Original height if scaled down
}

/**
 * Column tile that contains a single child (panel, grid, or content)
 */
export interface TileColumnState extends TileBaseState {
  type: 'column';
  child: string; // ID of a TilePanel, TileGrid, or direct TileContent
  width: SizeInfo;
  computedSize?: number;
  originalWidth?: number; // Original width if scaled down
}

/**
 * Panel tile that contains tabs
 */
export interface TilePanelState extends TileBaseState {
  type: 'panel';
  tabs: string[];
  activeTab: string | null;
  // UI components that can be placed on the left or right side of the panel
  leftComponents?: PanelUIComponent[];
  rightComponents?: PanelUIComponent[];
  // Components rendered inside the tab bar; align controls spacing relative to tabs
  tabBarComponents?: PanelUIComponent[];
}

/**
 * Tab tile that references content
 */
export interface TileTabState extends TileBaseState {
  type: 'tab';
  name: string;
  content: string; // ID of a content tile
  isLazy: boolean;
}

/**
 * Content tile that contains actual content
 * Can be extended with application-specific properties
 */
export interface TileContentState extends TileBaseState {
  type: 'content';
  componentId?: string;      // ID of the component to render this content
  data?: Record<string, any>; // Data payload as key-value pairs
}

/**
 * Union type of all possible tile types
 */
export type TileState = TileGridState | TileRowState | TileColumnState | TilePanelState | TileTabState | TileContentState;
