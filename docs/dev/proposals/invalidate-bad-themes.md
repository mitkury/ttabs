# Theme Validation Proposal

## Overview

This proposal outlines a system for validating themes in ttabs to ensure they meet accessibility standards and provide a good user experience. The primary focus is on detecting and preventing color contrast issues that could make the UI difficult or impossible to use.

## Problem Statement

Currently, ttabs allows any theme to be applied without validation. This can lead to several issues:

Note: This document is a proposal. The `TtabsTheme` snippets below illustrate concepts; in the current implementation import types from `ttabs-svelte` and use `setTheme` or assign `ttabs.theme` with a `TtabsTheme`.

1. Text colors that are too similar to background colors, making content unreadable
2. Active/inactive tab colors that are indistinguishable
3. Missing theme properties that cause visual inconsistencies
4. Insufficient contrast for users with visual impairments

## Proposed Solution

Implement a theme validation middleware similar to the layout validation middleware, which will:

1. Check color contrast ratios against WCAG accessibility standards
2. Validate the completeness of theme definitions
3. Provide warnings or errors for problematic themes
4. Optionally suggest fixes for identified issues

## Implementation Details

### 1. Color Contrast Ratio Calculation

```typescript
function calculateContrastRatio(foreground: string, background: string): number {
  // Convert hex colors to RGB
  const fgRGB = hexToRgb(foreground);
  const bgRGB = hexToRgb(background);
  
  // Calculate relative luminance
  const fgLuminance = calculateRelativeLuminance(fgRGB);
  const bgLuminance = calculateRelativeLuminance(bgRGB);
  
  // Calculate contrast ratio
  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  return ratio;
}
```

### 2. Theme Validator Class

```typescript
class ThemeValidator implements ThemeValidatorInterface {
  validate(theme: TtabsTheme): ThemeValidationResult {
    const results: ThemeValidationIssue[] = [];
    
    // Check text contrast
    this.validateTextContrast(theme, results);
    
    // Check tab contrast
    this.validateTabContrast(theme, results);
    
    // Check panel contrast
    this.validatePanelContrast(theme, results);
    
    // Check completeness
    this.validateCompleteness(theme, results);
    
    return {
      valid: results.length === 0,
      issues: results
    };
  }
  
  private validateTextContrast(theme: TtabsTheme, results: ThemeValidationIssue[]): void {
    const ratio = calculateContrastRatio(theme.textColor, theme.backgroundColor);
    if (ratio < 4.5) { // WCAG AA standard
      results.push({
        type: 'contrast',
        severity: 'error',
        message: `Text contrast ratio (${ratio.toFixed(2)}) is below the recommended 4.5:1`,
        suggestion: 'Consider using a darker text color or lighter background'
      });
    }
  }
  
  // Additional validation methods...
}
```

### 3. Integration with Ttabs Class

```typescript
class Ttabs {
  // Existing code...
  
  setTheme(theme: TtabsTheme): void {
    // Validate theme before applying
    const validator = new ThemeValidator();
    const result = validator.validate(theme);
    
    if (!result.valid) {
      // Log warnings
      result.issues.forEach(issue => {
        console.warn(`Theme validation: ${issue.message}`);
      });
      
      // Optionally prevent theme application for severe issues
      if (result.issues.some(issue => issue.severity === 'error')) {
        throw new ThemeValidationError('Theme contains critical accessibility issues');
      }
    }
    
    // Apply theme if valid or only has warnings
    this.theme = theme;
  }
}
```

### 4. Theme Fixing Utilities

```typescript
function suggestFixedTheme(theme: TtabsTheme, issues: ThemeValidationIssue[]): TtabsTheme {
  const fixedTheme = { ...theme };
  
  for (const issue of issues) {
    if (issue.type === 'contrast' && issue.affectedProperties) {
      const { foreground, background } = issue.affectedProperties;
      
      // Adjust colors to meet contrast requirements
      fixedTheme[foreground] = adjustColorForContrast(
        theme[foreground], 
        theme[background],
        4.5 // Target contrast ratio
      );
    }
  }
  
  return fixedTheme;
}
```

## Validation Criteria

The following aspects of themes will be validated:

1. **Text Contrast**: Ensure text is readable against its background
   - Normal text: 4.5:1 minimum contrast ratio (WCAG AA)
   - Large text: 3:1 minimum contrast ratio (WCAG AA)

2. **UI Element Distinction**: Ensure UI elements are visually distinguishable
   - Active vs. inactive tabs
   - Focused vs. unfocused elements
   - Draggable handles vs. backgrounds

3. **Theme Completeness**: Ensure all required theme properties are defined
   - Check for undefined or null values
   - Verify color format validity (hex, rgb, etc.)

## Benefits

1. **Improved Accessibility**: Ensures ttabs interfaces are usable by people with visual impairments
2. **Better User Experience**: Prevents unreadable or confusing interfaces
3. **Developer Guidance**: Provides immediate feedback on theme issues
4. **Consistency**: Ensures themes maintain a consistent visual language

## Implementation Phases

1. **Phase 1**: Basic contrast checking for text and backgrounds
2. **Phase 2**: Extended validation for all UI elements
3. **Phase 3**: Theme fixing suggestions and automatic corrections
4. **Phase 4**: Visual testing integration for complex scenarios

## Conclusion

Adding theme validation to ttabs will significantly improve the user experience and accessibility of the library. By preventing problematic themes from being applied, we ensure that all users can effectively interact with ttabs interfaces regardless of visual ability.

The implementation follows the same middleware pattern used for layout validation, making it consistent with the existing codebase and easy to integrate.
