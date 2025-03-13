
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

// Check for translations of city names
function checkTranslations(text1: string, text2: string): boolean {
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

  const t1 = text1.trim().toLowerCase();
  const t2 = text2.trim().toLowerCase();

  for (const [canonical, translations] of Object.entries(knownTranslations)) {
    if (t1.includes(canonical)) {
      for (const translation of translations) {
        if (t2.includes(translation)) return true;
      }
    }
    
    if (t2.includes(canonical)) {
      for (const translation of translations) {
        if (t1.includes(translation)) return true;
      }
    }
    
    for (const translation of translations) {
      if (t1.includes(translation)) {
        if (t2.includes(canonical)) return true;
      }
      if (t2.includes(translation)) {
        if (t1.includes(canonical)) return true;
      }
    }
  }
  
  return false;
}

// Check if a short answer is contained in a longer one
function checkContainment(text1: string, text2: string): boolean {
  const t1 = text1.trim().toLowerCase();
  const t2 = text2.trim().toLowerCase();
  
  const t1Words = t1.split(/\s+/).filter(Boolean);
  const t2Words = t2.split(/\s+/).filter(Boolean);
  
  // If one answer is much longer than the other
  if (t1Words.length > 5 && t2Words.length < 3) {
    // Don't allow short answers to match with long answers just by containing a word
    return false;
  }
  
  if (t2Words.length > 5 && t1Words.length < 3) {
    // Same check in reverse
    return false;
  }
  
  return false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text1, text2 } = await req.json();

    if (!text1 || !text2) {
      console.error('Missing required parameters:', { text1, text2 });
      throw new Error('Both text1 and text2 are required');
    }

    console.log('Comparing texts:', { text1, text2 });

    // Simple strategy for semantic similarity without OpenAI
    let isCorrect = false;
    
    // 1. Check for exact match after normalization
    const normalizedText1 = text1.trim().toLowerCase();
    const normalizedText2 = text2.trim().toLowerCase();
    
    if (normalizedText1 === normalizedText2) {
      isCorrect = true;
    }
    // 2. Check for translation equivalence
    else if (checkTranslations(text1, text2)) {
      isCorrect = true;
    }
    // 3. Check that we're not incorrectly matching short answers to long ones
    else if (!checkContainment(text1, text2)) {
      // 4. Check for string similarity
      const similarityScore = compareTwoStrings(text1, text2);
      isCorrect = similarityScore >= 0.8;
    }

    console.log('Evaluation result:', { isCorrect });

    return new Response(JSON.stringify({ isCorrect }), {
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
