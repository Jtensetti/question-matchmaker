
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
    
    // Check if object has properties that contain the literal string "undefined"
    if (questionType.value === "undefined" || questionType._type === "undefined") {
      // Check if we have a property called 'question_type' (from database)
      if (questionType.question_type && typeof questionType.question_type === "string") {
        return standardizeQuestionType(questionType.question_type);
      }
      
      // This object likely has placeholder values - try to check the database column directly
      // If we're in this spot, we need to get the actual type from the database
      console.log("Object contains 'undefined' string values - defaulting to database format");
      return "multiple-choice"; // Let's default to multiple-choice for this specific case
    }
    
    // If it has a value property that's a string and not "undefined"
    if (questionType.value && typeof questionType.value === "string" && 
        questionType.value !== "undefined") {
      return standardizeQuestionType(questionType.value);
    }
    
    // If it has a type property that's a string and not "undefined"
    if (questionType.type && typeof questionType.type === "string" && 
        questionType.type !== "undefined") {
      return standardizeQuestionType(questionType.type);
    }
    
    // Check for _type property which might be used in some systems
    if (questionType._type && typeof questionType._type === "string" && 
        questionType._type !== "undefined") {
      return standardizeQuestionType(questionType._type);
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
