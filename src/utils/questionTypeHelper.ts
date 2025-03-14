
/**
 * Utility functions for handling question types
 */

// The list of supported question types
const VALID_QUESTION_TYPES = ["text", "multiple-choice", "checkbox", "grid", "rating"];

/**
 * Normalizes a question type value from various possible formats
 * into a consistent string value
 */
export function normalizeQuestionType(questionType: any): string {
  console.log("Normalizing question type:", questionType);
  
  // If it's undefined or null, return the default "text"
  if (questionType === undefined || questionType === null) {
    return "text";
  }
  
  // If it's a string, standardize it
  if (typeof questionType === "string") {
    return standardizeQuestionType(questionType);
  }
  
  // Handle database objects with various structures
  if (typeof questionType === "object") {
    // First check for a straightforward type property
    if (questionType.type && typeof questionType.type === "string") {
      return standardizeQuestionType(questionType.type);
    }
    
    if (questionType.question_type && typeof questionType.question_type === "string") {
      return standardizeQuestionType(questionType.question_type);
    }
    
    // Check for properties that indicate the question type
    if (questionType.options && Array.isArray(questionType.options) && questionType.options.length > 0) {
      // If there are options, it's either multiple-choice or checkbox
      // Default to multiple-choice
      return "multiple-choice";
    }
    
    if (questionType.rating_min !== undefined && questionType.rating_max !== undefined) {
      return "rating";
    }
    
    if (questionType.grid_rows && questionType.grid_columns) {
      return "grid";
    }
  }
  
  // Default fallback
  return "text";
}

/**
 * Standardize question type strings to a consistent format
 */
function standardizeQuestionType(type: string): string {
  if (!type) return "text";
  
  // Convert to lowercase for consistency
  const lowerType = type.toLowerCase();
  
  // Map of inconsistent formats to standardized format
  const typeMap: Record<string, string> = {
    "multiple_choice": "multiple-choice",
    "multiplechoice": "multiple-choice",
    "multiple": "multiple-choice",
    "checkboxes": "checkbox",
    "check": "checkbox",
    "grid_matching": "grid",
    "matching": "grid",
    "open_ended": "text",
    "open": "text",
    "fill_in_blank": "text",
    "fill": "text",
    "scale": "rating"
  };
  
  return typeMap[lowerType] || lowerType;
}

/**
 * Checks if a question type is valid
 */
export function isValidQuestionType(type: string): boolean {
  const standardizedType = standardizeQuestionType(type);
  return VALID_QUESTION_TYPES.includes(standardizedType);
}

/**
 * Returns the list of valid question types
 */
export function getValidQuestionTypes(): string[] {
  return [...VALID_QUESTION_TYPES];
}
