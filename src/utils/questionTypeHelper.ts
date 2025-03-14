
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
  
  // If it's an object with a value property (like from some form libraries or database)
  if (typeof questionType === "object") {
    console.log("Question type is an object:", questionType);
    
    // Database case - Object with _type and value properties containing "undefined" strings
    // This is a specific data pattern observed in the DB results
    if ((questionType.value === "undefined" || questionType._type === "undefined")) {
      // First try to check if there's a direct question_type property 
      if (questionType.question_type && typeof questionType.question_type === "string") {
        console.log("Found question_type property:", questionType.question_type);
        return standardizeQuestionType(questionType.question_type);
      }
      
      // If we're here, we need to look for other clues in the object
      // Get most likely type based on object properties
      if (questionType.options && Array.isArray(questionType.options) && questionType.options.length > 0 &&
          questionType.options[0] !== "undefined") {
        console.log("Inferring type from options array");
        return "multiple-choice";
      }
      
      if (questionType.rating_min && questionType.rating_max) {
        console.log("Inferring type from rating properties");
        return "rating";
      }
      
      if (questionType.grid_rows && questionType.grid_columns) {
        console.log("Inferring type from grid properties");
        return "grid";
      }
      
      // Default fallback for database objects with undefined type
      console.log("Object has undefined value - using default type");
      return "multiple-choice";
    }
    
    // Standard property checks for string values
    if (questionType.value && typeof questionType.value === "string" && 
        questionType.value !== "undefined") {
      return standardizeQuestionType(questionType.value);
    }
    
    if (questionType.type && typeof questionType.type === "string" && 
        questionType.type !== "undefined") {
      return standardizeQuestionType(questionType.type);
    }
    
    if (questionType._type && typeof questionType._type === "string" && 
        questionType._type !== "undefined") {
      return standardizeQuestionType(questionType._type);
    }
    
    // Check other common properties
    if (questionType.questionType && typeof questionType.questionType === "string") {
      return standardizeQuestionType(questionType.questionType);
    }
    
    // Check if any property contains a string value that might be a valid type
    for (const key in questionType) {
      if (typeof questionType[key] === "string" && 
          questionType[key] !== "undefined" &&
          isValidQuestionType(standardizeQuestionType(questionType[key]))) {
        return standardizeQuestionType(questionType[key]);
      }
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
  const validTypes = ["text", "multiple-choice", "checkbox", "grid", "rating"];
  return validTypes.includes(standardizedType);
}

/**
 * Returns the list of valid question types
 */
export function getValidQuestionTypes(): string[] {
  return ["text", "multiple-choice", "checkbox", "grid", "rating"];
}
