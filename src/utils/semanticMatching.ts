
import { compareTwoStrings } from "string-similarity";
import { supabase } from "@/integrations/supabase/client";

// A more robust semantic matching approach 
export const checkSemanticMatch = async (
  studentAnswer: string, 
  correctAnswer: string,
  strictness: number = 0.7
): Promise<number> => {
  try {
    // First try to use the Supabase Edge Function for more advanced matching
    const { data, error } = await supabase.functions.invoke("check-semantic-similarity", {
      body: {
        text1: studentAnswer,
        text2: correctAnswer,
        strictness
      }
    });

    if (error) {
      console.error("Error calling semantic similarity function:", error);
      // Fall back to local implementation
      throw new Error("Edge function failed");
    }

    return data.similarity;
  } catch (error) {
    console.warn("Using fallback local semantic matching due to error:", error);
    
    // Fallback to local implementation
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
  }
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

// Enhanced helper function to check for synonyms, translations, and spelling variants
function checkSynonymsAndTranslations(studentAnswer: string, correctAnswer: string): number {
  // Known translations and spelling variants of city names
  const knownTranslations: Record<string, string[]> = {
    'helsinki': ['helsingfors', 'helsinkki', 'helsinky'],
    'copenhagen': ['köpenhamn', 'kopenhamn', 'kobenhavn', 'kopenhagen', 'copenhague'],
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
    'madrid': ['madri', 'madryt', 'madriid', 'madird'],
    'berlin': ['berlín'],
    'budapest': ['budapeszt'],
    'bangkok': ['bangkok', 'krung thep', 'krungthep'],
    // Add more cities as needed
  };

  // Extract words to find potential city names
  const studentWords = studentAnswer.split(/\s+/);
  const correctWords = correctAnswer.split(/\s+/);
  
  // Check for each word in student answer
  for (const studentWord of studentWords) {
    // Skip very short words
    if (studentWord.length < 4) continue;
    
    // Check if this word is a known city name or translation
    for (const [canonical, translations] of Object.entries(knownTranslations)) {
      // If student used canonical name
      if (studentWord.includes(canonical)) {
        // Check if correct answer contains any translation
        for (const translation of translations) {
          if (correctAnswer.includes(translation)) {
            return 0.9; // High match for translation
          }
        }
        
        // Check if correct answer contains the canonical form
        if (correctAnswer.includes(canonical)) {
          return 1.0; // Perfect match
        }
      }
      
      // If student used a translation
      for (const translation of translations) {
        if (studentWord.includes(translation)) {
          // Check if correct answer contains canonical form
          if (correctAnswer.includes(canonical)) {
            return 0.9; // High match for translation
          }
          
          // Check if correct answer contains same or different translation
          for (const correctTranslation of translations) {
            if (correctAnswer.includes(correctTranslation)) {
              return 0.9; // High match for translation variants
            }
          }
        }
      }
    }
    
    // Check for typos using Levenshtein distance
    for (const correctWord of correctWords) {
      if (correctWord.length < 4) continue; // Skip very short words
      
      // If words are similar but not identical (potential typo)
      if (studentWord !== correctWord && 
          levenshteinDistance(studentWord, correctWord) <= 2 &&
          studentWord.length > 4 && correctWord.length > 4) {
        return 0.85; // Pretty good match for slight misspellings
      }
    }
  }
  
  // If no translation or typo match found
  return 0.0;
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create a matrix of size (m+1) x (n+1)
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Fill the first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // replacement
        );
      }
    }
  }
  
  return dp[m][n];
}

// Helper function to determine if an answer is correct based on threshold
export const isAnswerCorrect = async (
  studentAnswer: string, 
  correctAnswer: string, 
  similarityThreshold: number = 0.7,
  semanticMatching: boolean = true
): Promise<boolean> => {
  if (semanticMatching) {
    const similarity = await checkSemanticMatch(studentAnswer, correctAnswer, similarityThreshold);
    return similarity >= similarityThreshold;
  } else {
    // Fall back to regular string similarity
    return compareTwoStrings(
      studentAnswer.trim().toLowerCase(),
      correctAnswer.trim().toLowerCase()
    ) >= similarityThreshold;
  }
};
