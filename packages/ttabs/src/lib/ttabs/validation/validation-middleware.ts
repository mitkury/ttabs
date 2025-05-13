import type { Ttabs } from '../Ttabs.svelte';
import { DefaultValidator } from './default-validator';
import { LayoutValidationError, type LayoutValidator, type ValidationErrorHandler, type ValidationMiddleware } from './validation-types';

/**
 * Creates a validation middleware instance
 * @param ttabs The ttabs instance to validate
 * @param validators Custom validators to add
 * @param defaultLayoutCreator Function to create a default layout
 * @returns A validation middleware instance
 */
export function createValidationMiddleware(
  ttabs: Ttabs,
  validators: LayoutValidator[] = [],
  defaultLayoutCreator?: (ttabs: Ttabs) => void
): ValidationMiddleware {
  return {
    validators,
    defaultLayoutCreator,
    errorHandlers: [],
    
    validate(ttabs: Ttabs): boolean {
      try {
        // Always run the default validator first
        const defaultValidator = new DefaultValidator();
        defaultValidator.validate(ttabs);
        
        // Then run custom validators
        for (const validator of this.validators) {
          validator.validate(ttabs);
        }
        return true;
      } catch (error) {
        if (error instanceof LayoutValidationError) {
          // Notify error handlers
          this.errorHandlers.forEach(handler => {
            handler(error);
          });
          
          console.warn(`Layout validation failed: ${error.message} (${error.code})`);
          
          // Reset to default layout
          this.resetToDefault(ttabs);
          return false;
        }
        // Re-throw other errors
        throw error;
      }
    },
    
    resetToDefault(ttabs: Ttabs): void {
      // Clear existing tiles
      ttabs.resetTiles();
      
      // Create a root grid first
      const gridId = ttabs.addGrid();
      
      // Apply default layout if provided
      if (this.defaultLayoutCreator) {
        this.defaultLayoutCreator(ttabs);
      } else {
        // Create a minimal valid layout
        const grid = ttabs.getGridObject(gridId);
        const row = grid.newRow();
        const column = row.newColumn();
        const panel = column.newPanel();
        panel.newTab("Default Tab");
      }
    },
    
    addErrorHandler(handler: ValidationErrorHandler): void {
      this.errorHandlers.push(handler);
    }
  };
}
