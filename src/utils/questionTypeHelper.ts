
/**
 * Utility functions for handling question types
 */

/**
 * Normalizes a question type value from various possible formats
 * into a consistent string value
 */
export function normalizeQuestionType(questionType: any): string {
  // If it's undefined or null, return the default "text"
  if (questionType === undefined || questionType === null) {
    console.log("Question type is null or undefined, defaulting to 'text'");
    return "text";
  }
  
  // Log for debugging
  console.log("normalizeQuestionType received:", {
    value: questionType,
    type: typeof questionType
  });
  
  // If it's already a string, standardize the format
  if (typeof questionType === "string") {
    return standardizeQuestionType(questionType);
  }
  
  // If it's an object with a value property (like from some form libraries)
  if (typeof questionType === "object") {
    console.log("Question type is an object:", questionType);
    
    // If it has a value property that's a string, use that
    if (questionType.value && typeof questionType.value === "string") {
      return standardizeQuestionType(questionType.value);
    }
    
    // If it has a type property that's a string, use that
    if (questionType.type && typeof questionType.type === "string") {
      return standardizeQuestionType(questionType.type);
    }
    
    // Check for _type property which might be used in some systems
    if (questionType._type && typeof questionType._type === "string") {
      return standardizeQuestionType(questionType._type);
    }
    
    // Try to use JSON.stringify to get more information
    try {
      const stringified = JSON.stringify(questionType);
      console.log("Stringified question type:", stringified);
      
      // If it's a simple string wrapped in quotes in the JSON, extract it
      if (stringified && stringified.startsWith('"') && stringified.endsWith('"')) {
        return standardizeQuestionType(stringified.substring(1, stringified.length - 1));
      }
    } catch (e) {
      console.error("Error stringifying question type:", e);
    }
  }
  
  // Default fallback to text
  console.log("Couldn't normalize question type, defaulting to 'text':", questionType);
  return "text";
}

/**
 * Standardize question type strings to a consistent format
 * This handles variations like "multiple_choice" vs "multiple-choice"
 */
function standardizeQuestionType(type: string): string {
  if (!type) return "text";
  
  // Convert to lowercase for consistency
  const lowerType = type.toLowerCase();
  
  // Map of inconsistent formats to standardized format
  const typeMap: Record<string, string> = {
    "multiple_choice": "multiple-choice",
    "checkboxes": "checkbox",
    "grid_matching": "grid",
    "open_ended": "text",
    "fill_in_blank": "text"
  };
  
  return typeMap[lowerType] || lowerType;
}

/**
 * Checks if a question type is valid
 */
export function isValidQuestionType(type: string): boolean {
  const standardizedType = standardizeQuestionType(type);
  const validTypes = ["text", "multiple-choice", "checkbox", "grid", "rating"];
  return validTypes.includes(standardizedType);
}

/**
 * Returns the list of valid question types
 */
export function getValidQuestionTypes(): string[] {
  return ["text", "multiple-choice", "checkbox", "grid", "rating"];
}
