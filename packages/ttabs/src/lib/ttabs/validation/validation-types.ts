import type { Ttabs } from '../Ttabs.svelte';

/**
 * Custom error type for layout validation
 */
export class LayoutValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LayoutValidationError';
  }
}

/**
 * Function type for layout validators
 * @param ttabs The ttabs instance to validate
 * @returns true if layout is valid, throws LayoutValidationError otherwise
 */
export type LayoutValidator = (ttabs: Ttabs) => boolean;

/**
 * Type for validation error handlers
 */
export type ValidationErrorHandler = (error: LayoutValidationError) => void;

/**
 * Interface for the validation middleware
 */
export interface ValidationMiddleware {
  /**
   * Array of validator functions to run
   */
  validators: LayoutValidator[];
  
  /**
   * Default layout creator function
   */
  defaultLayoutCreator?: (ttabs: Ttabs) => void;
  
  /**
   * Error handlers
   */
  errorHandlers: ValidationErrorHandler[];
  
  /**
   * Run all validators
   * @param ttabs The ttabs instance to validate
   * @returns true if layout is valid, false otherwise
   */
  validate(ttabs: Ttabs): boolean;
  
  /**
   * Reset to default layout
   * @param ttabs The ttabs instance to reset
   */
  resetToDefault(ttabs: Ttabs): void;
  
  /**
   * Add error handler
   * @param handler The error handler to add
   */
  addErrorHandler(handler: ValidationErrorHandler): void;
}
