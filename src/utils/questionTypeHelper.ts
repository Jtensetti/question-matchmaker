
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
  
  // Log what's actually being received
  console.log("normalizeQuestionType received:", {
    value: questionType,
    type: typeof questionType,
    isObject: typeof questionType === 'object',
    stringified: JSON.stringify(questionType)
  });
  
  // If it's already a string, return it
  if (typeof questionType === "string") {
    return questionType;
  }
  
  // If it's an object with a value property (like from some form libraries)
  if (typeof questionType === "object") {
    console.log("Question type is an object:", questionType);
    
    // If it has a value property that's a string, use that
    if (questionType.value && typeof questionType.value === "string" && 
        questionType.value !== "undefined") {
      return questionType.value;
    }
    
    // If it has a type property that's a string, use that
    if (questionType.type && typeof questionType.type === "string" && 
        questionType.type !== "undefined") {
      return questionType.type;
    }
    
    // Check for _type property which might be used in some systems
    if (questionType._type && typeof questionType._type === "string" && 
        questionType._type !== "undefined") {
      return questionType._type;
    }
    
    // Try to use JSON.stringify to get more information
    try {
      const stringified = JSON.stringify(questionType);
      console.log("Stringified question type:", stringified);
      
      // If it's a simple string wrapped in quotes in the JSON, extract it
      if (stringified && stringified.startsWith('"') && stringified.endsWith('"')) {
        const extracted = stringified.substring(1, stringified.length - 1);
        if (isValidQuestionType(extracted)) {
          return extracted;
        }
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
 * Checks if a question type is valid
 */
export function isValidQuestionType(type: string): boolean {
  const validTypes = ["text", "multiple-choice", "checkbox", "grid", "rating", 
                     "open_ended", "multiple_choice", "checkboxes", "grid_matching", 
                     "rating", "fill_in_blank"];
  return validTypes.includes(type);
}

/**
 * Returns the list of valid question types
 */
export function getValidQuestionTypes(): string[] {
  return ["text", "multiple-choice", "checkbox", "grid", "rating"];
}
