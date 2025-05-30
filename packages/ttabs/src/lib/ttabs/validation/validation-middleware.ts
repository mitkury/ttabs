import type { TTabs } from '../TTabs.svelte';
import { defaultValidator } from './default-validator';
import { LayoutValidationError, type LayoutValidator, type ValidationErrorHandler, type ValidationMiddleware } from './validation-types';

/**
 * Creates a validation middleware instance
 * @param ttabs The ttabs instance to validate
 * @param validators Custom validators to add
 * @param defaultLayoutCreator Function to create a default layout
 * @returns A validation middleware instance
 */
export function createValidationMiddleware(
  ttabs: TTabs,
  validators: LayoutValidator[] = [],
  defaultLayoutCreator?: (ttabs: TTabs) => void
): ValidationMiddleware {
  return {
    validators,
    defaultLayoutCreator,
    errorHandlers: [],
    
    validate(ttabs: TTabs): boolean {
      try {
        // Always run the default validator first
        defaultValidator(ttabs);
        
        // Then run custom validators
        for (const validator of this.validators) {
          validator(ttabs);
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
    
    resetToDefault(ttabs: TTabs): void {
      // Clear existing tiles
      ttabs.resetTiles();
      
      // Create a root grid first
      ttabs.addGrid();
      
      // Apply default layout if provided
      if (this.defaultLayoutCreator) {
        this.defaultLayoutCreator(ttabs);
      }
    },
    
    addErrorHandler(handler: ValidationErrorHandler): void {
      this.errorHandlers.push(handler);
    }
  };
}
