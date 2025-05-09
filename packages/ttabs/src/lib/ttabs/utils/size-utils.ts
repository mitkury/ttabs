import type { SizeInfo } from "../types/tile-types";

/**
 * Represents the computed size information for an element
 */
export type ComputedSizeInfo = {
  /** Unique identifier of the element */
  id: string;
  /** Calculated size in pixels */
  computedSize: number;
  /** Indicates whether the element was scaled down to fit in the container */
  scaledDown: boolean;
};

/**
 * Parses a size value string into a SizeInfo object
 * @param size String representation of size (e.g., "100%", "260px")
 * @returns Parsed SizeInfo object
 */
export function parseSizeValue(size: string): SizeInfo {  
  // Parse percentage values
  if (size.endsWith('%')) {
    const percentValue = parseFloat(size);
    if (isNaN(percentValue)) {
      throw new Error(`Invalid percentage format: ${size}`);
    }
    return { value: percentValue, unit: '%' as const };
  }
  
  // Parse pixel values
  if (size.endsWith('px')) {
    const pixelValue = parseFloat(size);
    if (isNaN(pixelValue)) {
      throw new Error(`Invalid pixel format: ${size}`);
    }
    return { value: pixelValue, unit: 'px' as const };
  }
  
  // Try to parse as a number and assume it's a percentage (for backward compatibility)
  const numericValue = parseFloat(size);
  if (!isNaN(numericValue)) {
    return { value: numericValue, unit: '%' as const };
  }
  
  throw new Error(`Invalid size format: ${size}. Expected format: "100%" or "260px"`);
}

/**
 * Calculates sizes for a set of elements in a container
 * @param containerSize Size of the container in pixels
 * @param elements Array of elements with their size information
 * @returns Array of calculated sizes in pixels with possible scale indicators
 */
export function calculateSizes(
  containerSize: number, 
  elements: Array<{id: string, size: SizeInfo}>
): Array<ComputedSizeInfo> {
  if (elements.length === 0) return [];
  
  // Identify different types of elements
  let totalFixedSize = 0;
  let totalPercentage = 0;
  const fixedElements: Array<{id: string, size: number}> = [];
  const percentElements: Array<{id: string, percent: number}> = [];
  
  // First pass: categorize elements and calculate fixed totals
  elements.forEach(element => {
    if (element.size.unit === 'px') {
      totalFixedSize += element.size.value;
      fixedElements.push({id: element.id, size: element.size.value});
    } else if (element.size.unit === '%') {
      totalPercentage += element.size.value;
      percentElements.push({id: element.id, percent: element.size.value});
    }
  });
  
  // Results array
  const results: Array<{id: string, computedSize: number, scaledDown: boolean}> = [];
  
  // Handle case where all elements are fixed
  if (percentElements.length === 0 && fixedElements.length > 0) {
    // Scale fixed elements if they exceed container size
    const fixedScaleFactor = totalFixedSize > containerSize ? containerSize / totalFixedSize : 1;
    
    fixedElements.forEach(element => {
      results.push({
        id: element.id,
        computedSize: element.size * fixedScaleFactor,
        scaledDown: fixedScaleFactor < 1
      });
    });
    
    return results;
  }
  
  // Handle case where all elements are percentage-based
  if (fixedElements.length === 0 && percentElements.length > 0) {
    // Normalize percentages to 100% if they don't add up to 100%
    const percentScaleFactor = totalPercentage !== 100 ? 100 / totalPercentage : 1;
    
    percentElements.forEach(element => {
      const adjustedPercent = element.percent * percentScaleFactor;
      results.push({
        id: element.id,
        computedSize: (containerSize * adjustedPercent) / 100,
        scaledDown: false
      });
    });
    
    return results;
  }
  
  // Handle mixed case (both fixed and percentage elements)
  // First, handle fixed elements (scale them if needed)
  const availableForFixed = containerSize;
  const fixedScaleFactor = totalFixedSize > availableForFixed ? availableForFixed / totalFixedSize : 1;
  const actualFixedSize = totalFixedSize * fixedScaleFactor;
  
  fixedElements.forEach(element => {
    results.push({
      id: element.id,
      computedSize: element.size * fixedScaleFactor,
      scaledDown: fixedScaleFactor < 1
    });
  });
  
  // Calculate remaining space for percentage elements
  const remainingSpace = Math.max(0, containerSize - actualFixedSize);
  
  // Always normalize percentages to 100% in mixed layouts
  // This ensures percentage elements fill exactly the remaining space
  const percentScaleFactor = 100 / totalPercentage;
  
  percentElements.forEach(element => {
    const adjustedPercent = element.percent * percentScaleFactor;
    results.push({
      id: element.id,
      computedSize: (remainingSpace * adjustedPercent) / 100,
      scaledDown: false
    });
  });
  
  return results;
} 