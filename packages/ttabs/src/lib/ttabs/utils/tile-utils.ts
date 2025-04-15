/**
 * Utility functions for ttabs
 */

import type { TileType } from '../types/tile-types';

/**
 * Generate a unique ID for a tile
 * Uses the browser's crypto API for random UUID generation
 * @param type Optional tile type to prefix the ID
 * @returns A unique ID string
 */
export function generateId(type?: TileType): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${type ? `${type}-` : ''}${crypto.randomUUID()}`;
  }
  
  // Fallback implementation using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return `${type ? `${type}-` : ''}${generateUuidWithRandomValues()}`;
  }
  
  // Last resort fallback for environments without crypto
  return `${type ? `${type}-` : ''}${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
}

/**
 * Generate a UUID using crypto.getRandomValues
 * This is a fallback for browsers that don't support crypto.randomUUID
 */
function generateUuidWithRandomValues(): string {
  // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  
  // Set version (4) and variant bits
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;
  
  // Convert to hex string
  let uuid = '';
  for (let i = 0; i < 16; i++) {
    uuid += randomValues[i].toString(16).padStart(2, '0');
    if (i === 3 || i === 5 || i === 7 || i === 9) {
      uuid += '-';
    }
  }
  
  return uuid;
}