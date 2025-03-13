
import { compareTwoStrings } from "string-similarity";

// A more robust semantic matching approach 
export const checkSemanticMatch = (studentAnswer: string, correctAnswer: string): number => {
  // First, normalize both answers (lowercase, trim whitespace)
  const normalizedStudentAnswer = studentAnswer.trim().toLowerCase();
  const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
  
  // Check if the student answer is exactly the same as the correct answer
  if (normalizedStudentAnswer === normalizedCorrectAnswer) {
    return 1.0;
  }
  
  // Check for direct substring matching (for key terms)
  // This helps with cases where the student provides just "Madrid" vs "The capital of Spain is Madrid"
  // but we now also check for word boundaries to avoid matching substrings of words
  if (isKeyPartOfAnswer(normalizedStudentAnswer, normalizedCorrectAnswer)) {
    return 0.9;
  }
  
  // For key facts or single word answers, check if they match directly
  const correctWords = normalizedCorrectAnswer.split(/\s+/);
  const studentWords = normalizedStudentAnswer.split(/\s+/);
  
  // If the student provided a single word and it's in the correct answer
  if (studentWords.length === 1 && correctWords.includes(studentWords[0]) && studentWords[0].length > 3) {
    return 0.85;
  }
  
  // Check synonyms and translations for names of places
  // For example, "Helsingfors" and "Helsinki" are the same city in different languages
  // or if other synonyms are provided
  const synonymMatch = checkSynonymsAndTranslations(normalizedStudentAnswer, normalizedCorrectAnswer);
  if (synonymMatch > 0.8) {
    return synonymMatch;
  }
  
  // Check if the student's answer is too simple compared to a complex correct answer
  // This helps catch cases where a student says "Denmark" when the answer is more complex
  if (correctWords.length > 5 && studentWords.length < 3) {
    // If the correct answer is a full sentence and student answer is very short
    // Lower the similarity score significantly
    return Math.min(0.5, compareTwoStrings(normalizedStudentAnswer, normalizedCorrectAnswer));
  }
  
  // For more complex comparisons, use string similarity
  return compareTwoStrings(normalizedStudentAnswer, normalizedCorrectAnswer);
};

// Helper function to check if answer is a key part of the expected answer
function isKeyPartOfAnswer(studentAnswer: string, correctAnswer: string): boolean {
  if (studentAnswer.length < 3) return false; // Too short to be meaningful
  
  // Check if the correct answer contains the student answer as a whole word
  const regex = new RegExp(`\\b${escapeRegExp(studentAnswer)}\\b`, 'i');
  if (regex.test(correctAnswer)) {
    // The student answer is a whole word in the correct answer

    // Don't match if the student answer is just a common word like "the", "a", "is", etc.
    const commonWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
                         'i', 'you', 'he', 'she', 'it', 'we', 'they', 'and', 'or', 'for', 
                         'in', 'on', 'at', 'by', 'to', 'of', 'with', 'about'];
    
    if (commonWords.includes(studentAnswer)) {
      return false;
    }
    
    // Check if it's a significant part of the answer, not just a trivial word
    // For city names, country names, etc. - these are important
    return true;
  }
  
  return false;
}

// Helper to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to check for synonyms and translations
// This would ideally use an external API but for demonstration we'll use
// a simple list of known synonyms for common capitals and other answers
function checkSynonymsAndTranslations(studentAnswer: string, correctAnswer: string): number {
  // Known translations of city names
  const knownTranslations: Record<string, string[]> = {
    'helsinki': ['helsingfors'],
    'copenhagen': ['köpenhamn', 'kopenhamn', 'kobenhavn'],
    'stockholm': ['tukholma'],
    'london': ['londres', 'londra'],
    'paris': ['parigi', 'parijs'],
    'rome': ['roma', 'rom'],
    'moscow': ['moskva', 'moscou', 'moskau'],
    'vienna': ['wien', 'bécs'],
    'prague': ['praha', 'prag'],
    'athens': ['athen', 'athina', 'ateny'],
    'warsaw': ['warszawa', 'varsóvia'],
    'lisbon': ['lisboa', 'lissabon'],
    'dublin': ['baile átha cliath'],
    'amsterdam': ['amsterdã'],
    'brussels': ['bruxelles', 'brussel'],
    'bern': ['berne', 'berna'],
    'oslo': ['oslo'],
    'madrid': ['madri', 'madryt'],
    'berlin': ['berlín'],
    'budapest': ['budapeszt']
  };

  // Try to find exact matches in known translations
  for (const [canonical, translations] of Object.entries(knownTranslations)) {
    if (studentAnswer === canonical || correctAnswer === canonical) {
      if (translations.includes(studentAnswer) || translations.includes(correctAnswer)) {
        return 1.0; // Perfect match through translation
      }
    }
    
    for (const translation of translations) {
      if (studentAnswer === translation || correctAnswer === translation) {
        if (canonical === correctAnswer || canonical === studentAnswer) {
          return 1.0; // Perfect match through translation
        }
      }
    }
  }
  
  // If no translation match, fall back to string comparison
  return compareTwoStrings(studentAnswer, correctAnswer);
}

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
