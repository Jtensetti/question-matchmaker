
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
  }
  
  // Default fallback to text
  console.log("Couldn't normalize question type, defaulting to 'text':", questionType);
  return "text";
}

/**
 * Checks if a question type is valid
 */
export function isValidQuestionType(type: string): boolean {
  const validTypes = ["text", "multiple-choice", "checkbox", "grid", "rating"];
  return validTypes.includes(type);
}

/**
 * Returns the list of valid question types
 */
export function getValidQuestionTypes(): string[] {
  return ["text", "multiple-choice", "checkbox", "grid", "rating"];
}
