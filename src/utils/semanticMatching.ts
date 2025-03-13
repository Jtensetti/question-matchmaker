
import { compareTwoStrings } from "string-similarity";

// A simplified semantic matching approach 
export const checkSemanticMatch = (studentAnswer: string, correctAnswer: string): number => {
  // First, normalize both answers (lowercase, trim whitespace)
  const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();
  const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
  
  // Check if the student answer is a direct substring of the correct answer
  // This helps with cases where the student provides just "Madrid" vs "The capital of Spain is Madrid"
  if (normalizedCorrectAnswer.includes(normalizedStudentAnswer) && 
      normalizedStudentAnswer.length > 2 && // Avoid matching single characters
      // Make sure it's a complete word match, not partial
      (normalizedCorrectAnswer.includes(` ${normalizedStudentAnswer} `) || 
       normalizedCorrectAnswer.includes(` ${normalizedStudentAnswer}.`) ||
       normalizedCorrectAnswer.includes(`${normalizedStudentAnswer}.`) ||
       normalizedCorrectAnswer.endsWith(` ${normalizedStudentAnswer}`) ||
       normalizedCorrectAnswer === normalizedStudentAnswer)) {
    // It's a key part of the answer, so give it a high score
    return 0.9;
  }
  
  // For key facts or single word answers, check if they match directly
  const correctWords = normalizedCorrectAnswer.split(/\s+/);
  const studentWords = normalizedStudentAnswer.split(/\s+/);
  
  // If the student provided a single word and it's in the correct answer
  if (studentWords.length === 1 && correctWords.includes(studentWords[0]) && studentWords[0].length > 3) {
    return 0.85;
  }
  
  // For more complex comparisons, use string similarity
  return compareTwoStrings(normalizedStudentAnswer, normalizedCorrectAnswer);
};

// Helper function to determine if an answer is correct based on threshold
export const isAnswerCorrect = (
  studentAnswer: string, 
  correctAnswer: string, 
  similarityThreshold: number = 0.7,
  semanticMatching: boolean = true
): boolean => {
  if (semanticMatching) {
    return checkSemanticMatch(studentAnswer, correctAnswer) >= similarityThreshold;
  } else {
    // Fall back to regular string similarity
    return compareTwoStrings(
      studentAnswer.trim().toLowerCase(),
      correctAnswer.trim().toLowerCase()
    ) >= similarityThreshold;
  }
};
