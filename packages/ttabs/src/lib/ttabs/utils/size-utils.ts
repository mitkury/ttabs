import type { SizeInfo } from "../types/tile-types";

/**
 * Parses a size value string into a SizeInfo object
 * @param size String representation of size (e.g., "100%", "260px", "auto")
 * @returns Parsed SizeInfo object
 */
export function parseSizeValue(size: string): SizeInfo {
  // Default case
  if (!size || size === 'auto') {
    return { value: 0, unit: 'auto' as const };
  }
  
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
  
  throw new Error(`Invalid size format: ${size}. Expected format: "100%", "260px", or "auto"`);
}

/**
 * Calculates sizes for a set of elements in a container
 * @param containerSize Size of the container in pixels
 * @param elements Array of elements with their size information
 * @returns Array of calculated sizes with possible scale indicators
 */
export function calculateSizes(
  containerSize: number, 
  elements: Array<{id: string, size: SizeInfo}>
): Array<{id: string, computedSize: number, scaledDown: boolean}> {
  
  // Identify different types of elements
  let totalFixedSize = 0;
  let totalPercentage = 0;
  const fixedElements: Array<{id: string, size: number}> = [];
  const percentElements: Array<{id: string, percent: number}> = [];
  const autoElements: Array<string> = [];
  
  // First pass: categorize elements and calculate fixed totals
  elements.forEach(element => {
    if (element.size.unit === 'px') {
      totalFixedSize += element.size.value;
      fixedElements.push({id: element.id, size: element.size.value});
    } else if (element.size.unit === '%') {
      totalPercentage += element.size.value;
      percentElements.push({id: element.id, percent: element.size.value});
    } else if (element.size.unit === 'auto') {
      autoElements.push(element.id);
    }
  });
  
  // Check if fixed sizes need scaling
  const fixedScaleFactor = totalFixedSize > containerSize ? 
    containerSize / totalFixedSize : 1;
  
  // Adjusted total fixed size after scaling (if needed)
  const adjustedFixedSize = totalFixedSize * fixedScaleFactor;
  
  // Space calculations
  const remainingAfterFixed = Math.max(0, containerSize - adjustedFixedSize);
  
  // Determine if percentages need normalization
  const percentageScaleFactor = totalPercentage > 0 ? 
    (totalPercentage > 100 ? 100 / totalPercentage : 1) : 1;
  
  // Calculate space used by percentage elements
  let percentageSpace = 0;
  if (totalPercentage > 0) {
    // If percentages add up to more than 100%, normalize them
    percentageSpace = remainingAfterFixed * Math.min(totalPercentage * percentageScaleFactor, 100) / 100;
  }
  
  // Space for auto elements
  const remainingForAuto = Math.max(0, remainingAfterFixed - percentageSpace);
  const autoElementSize = autoElements.length > 0 ? remainingForAuto / autoElements.length : 0;
  
  // Results array
  const results: Array<{id: string, computedSize: number, scaledDown: boolean}> = [];
  
  // Process fixed elements - scale them down if needed
  fixedElements.forEach(element => {
    const scaledSize = element.size * fixedScaleFactor;
    results.push({
      id: element.id,
      computedSize: scaledSize,
      scaledDown: fixedScaleFactor < 1
    });
  });
  
  // Process percentage elements
  if (totalPercentage > 0) {
    percentElements.forEach(element => {
      // Normalize percentage if needed
      const adjustedPercent = element.percent * percentageScaleFactor;
      const computedSize = (remainingAfterFixed * adjustedPercent) / 100;
      
      results.push({
        id: element.id,
        computedSize,
        scaledDown: false
      });
    });
  }
  
  // Process auto elements
  autoElements.forEach(elementId => {
    results.push({
      id: elementId,
      computedSize: autoElementSize,
      scaledDown: false
    });
  });
  
  return results;
} 