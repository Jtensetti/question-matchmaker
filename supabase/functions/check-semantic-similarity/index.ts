
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple implementation of string similarity for the Edge Function
function compareTwoStrings(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  
  // If the strings are identical, return 1
  if (s1 === s2) return 1;
  
  // Simple word overlap metric
  const words1 = new Set(s1.split(/\s+/).filter(Boolean));
  const words2 = new Set(s2.split(/\s+/).filter(Boolean));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let matchCount = 0;
  for (const word of words1) {
    if (words2.has(word)) matchCount++;
  }
  
  const overlapScore = (matchCount / Math.max(words1.size, words2.size));
  
  // Return a score between 0 and 1
  return overlapScore;
}

// Enhanced translation check including common misspellings
function checkTranslationsAndSpellings(text1: string, text2: string): boolean {
  // Map of city names to their translations and common misspellings
  const cityMappings: Record<string, string[]> = {
    'helsinki': ['helsingfors', 'helsinkki', 'helsinky', 'helsinki'],
    'copenhagen': ['köpenhamn', 'kopenhamn', 'kobenhavn', 'copenhagen', 'kopenhagen', 'copenhague'],
    'stockholm': ['tukholma', 'stockholm'],
    'london': ['londres', 'londra', 'london'],
    'paris': ['parigi', 'parijs', 'paris'],
    'rome': ['roma', 'rom', 'rome'],
    'moscow': ['moskva', 'moscou', 'moskau', 'moscow'],
    'vienna': ['wien', 'bécs', 'vienna'],
    'prague': ['praha', 'prag', 'prague'],
    'athens': ['athen', 'athina', 'ateny', 'athens'],
    'warsaw': ['warszawa', 'varsóvia', 'warsaw'],
    'lisbon': ['lisboa', 'lissabon', 'lisbon'],
    'dublin': ['baile átha cliath', 'dublin'],
    'amsterdam': ['amsterdã', 'amsterdam'],
    'brussels': ['bruxelles', 'brussel', 'brussels'],
    'bern': ['berne', 'berna', 'bern'],
    'oslo': ['oslo'],
    'madrid': ['madri', 'madryt', 'madrid', 'madriid', 'madird'],
    'berlin': ['berlín', 'berlin'],
    'budapest': ['budapeszt', 'budapest'],
    'bangkok': ['bangkok', 'krung thep', 'krungthep'],
    // Add more cities as needed
  };

  const t1 = text1.trim().toLowerCase();
  const t2 = text2.trim().toLowerCase();
  
  // First, check if either text directly contains any canonical city name
  for (const [canonical, variants] of Object.entries(cityMappings)) {
    // Check if canonical name is in either text
    const canonicalInText1 = t1.includes(canonical);
    const canonicalInText2 = t2.includes(canonical);
    
    // Check if any variant is in either text
    let variantInText1 = false;
    let variantInText2 = false;
    let matchedVariant = "";
    
    for (const variant of variants) {
      if (t1.includes(variant)) {
        variantInText1 = true;
        matchedVariant = variant;
        break;
      }
      
      if (t2.includes(variant)) {
        variantInText2 = true;
        matchedVariant = variant;
        break;
      }
    }
    
    // If canonical name in one text and variant in other, it's a match
    if ((canonicalInText1 && variantInText2) || (canonicalInText2 && variantInText1)) {
      console.log(`Found translation match: ${canonical} ↔ ${matchedVariant}`);
      return true;
    }
    
    // Also check variant-to-variant matches for broader coverage
    if (variantInText1 && variantInText2) {
      // Check if they're actually the same variant
      for (const variant1 of variants) {
        if (t1.includes(variant1)) {
          for (const variant2 of variants) {
            if (variant2 !== variant1 && t2.includes(variant2)) {
              console.log(`Found variant match: ${variant1} ↔ ${variant2} (both are variants of ${canonical})`);
              return true;
            }
          }
        }
      }
    }
  }
  
  // If we didn't find any translation matches, check for typo tolerance
  // This checks if one string is a slight misspelling of the other
  const words1 = t1.split(/\s+/).filter(Boolean);
  const words2 = t2.split(/\s+/).filter(Boolean);
  
  for (const word1 of words1) {
    if (word1.length < 4) continue; // Skip very short words
    
    for (const word2 of words2) {
      if (word2.length < 4) continue; // Skip very short words
      
      // If the words are almost the same (e.g., one typo)
      if (word1 !== word2 && levenshteinDistance(word1, word2) <= 2 && 
          word1.length > 4 && word2.length > 4) {
        console.log(`Found potential typo match: ${word1} ↔ ${word2} (Levenshtein distance: ${levenshteinDistance(word1, word2)})`);
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to get Levenshtein distance between two strings (measures edit distance)
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

// Check for too simple answers compared to expected answers
function isAnswerTooSimple(studentAnswer: string, correctAnswer: string): boolean {
  const studentWords = studentAnswer.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const correctWords = correctAnswer.trim().toLowerCase().split(/\s+/).filter(Boolean);
  
  // If student answer is very short compared to correct answer
  if (studentWords.length <= 2 && correctWords.length >= 5) {
    // Check if it's just a capital city name without context
    for (const word of studentWords) {
      if (word.length < 4) continue; // Skip very short words
      
      // If any word from the short answer is present in the correct answer
      if (correctWords.includes(word)) {
        // But the short answer lacks important context
        if (correctWords.some(w => ['capital', 'huvudstad', 'is', 'are', 'the'].includes(w))) {
          console.log(`Student answer "${studentAnswer}" might be too simple compared to "${correctAnswer}"`);
          return true;
        }
      }
    }
  }
  
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text1, text2, strictness = 0.7 } = await req.json();

    if (!text1 || !text2) {
      console.error('Missing required parameters:', { text1, text2 });
      throw new Error('Both text1 and text2 are required');
    }

    console.log('Comparing texts:', { text1, text2, strictness });

    // Enhanced strategy for semantic similarity
    let isCorrect = false;
    let similarityScore = 0;
    
    // 1. Check for exact match after normalization
    const normalizedText1 = text1.trim().toLowerCase();
    const normalizedText2 = text2.trim().toLowerCase();
    
    if (normalizedText1 === normalizedText2) {
      console.log('Exact match found');
      isCorrect = true;
      similarityScore = 1.0;
    } 
    // 2. Check for translation/spelling equivalence
    else if (checkTranslationsAndSpellings(text1, text2)) {
      console.log('Translation or spelling match found');
      // Even with translation matches, apply some strictness
      // For high strictness (e.g., > 0.8), we might want to reject translation matches
      similarityScore = Math.min(0.85, 1.0 - strictness + 0.5);
      isCorrect = similarityScore >= strictness;
    }
    // 3. Check if the answer is too simple
    else if (isAnswerTooSimple(text1, text2) || isAnswerTooSimple(text2, text1)) {
      console.log('Answer seems too simple compared to expected');
      // Penalize overly simple answers - they get at most 70% similarity
      similarityScore = Math.min(0.7, compareTwoStrings(text1, text2));
      isCorrect = similarityScore >= strictness;
    }
    // 4. Fall back to string similarity
    else {
      similarityScore = compareTwoStrings(text1, text2);
      isCorrect = similarityScore >= strictness;
    }

    console.log('Evaluation result:', { isCorrect, similarityScore, strictness });

    return new Response(JSON.stringify({ 
      isCorrect, 
      similarity: similarityScore 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-semantic-similarity function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
