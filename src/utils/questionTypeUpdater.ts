import { supabase } from "@/integrations/supabase/client";
import { normalizeQuestionType, isValidQuestionType } from "@/utils/questionTypeHelper";

/**
 * Updates a question's type and related properties in the database
 */
export const updateQuestionType = async (
  questionId: string, 
  questionType: string,
  options?: string[],
  ratingMin?: number,
  ratingMax?: number,
  gridRows?: string[],
  gridColumns?: string[]
) => {
  try {
    // Normalize the question type to ensure consistency
    const normalizedType = normalizeQuestionType(questionType);
    
    console.log("Updating question type:", {
      original: questionType,
      normalized: normalizedType
    });
    
    // Validate the normalized type
    if (!isValidQuestionType(normalizedType)) {
      return { 
        success: false, 
        error: new Error(`Invalid question type: ${normalizedType}`) 
      };
    }
    
    // Validate inputs based on question type
    if ((normalizedType === 'multiple-choice' || normalizedType === 'checkbox') && 
        (!options || options.length === 0)) {
      return { 
        success: false, 
        error: new Error("Options are required for multiple-choice or checkbox questions") 
      };
    }
    
    if (normalizedType === 'rating' && 
        (ratingMin === undefined || ratingMax === undefined || ratingMin >= ratingMax)) {
      return { 
        success: false, 
        error: new Error("Valid min and max rating values are required for rating questions") 
      };
    }
    
    if (normalizedType === 'grid' && 
        (!gridRows || !gridColumns || gridRows.length === 0 || gridColumns.length === 0)) {
      return { 
        success: false, 
        error: new Error("Grid rows and columns are required for grid questions") 
      };
    }
    
    // Prepare update data
    const updateData: any = { question_type: normalizedType };
    
    // Only include properties that are relevant to the question type
    if (normalizedType === 'multiple-choice' || normalizedType === 'checkbox') {
      updateData.options = options || [];
    }
    
    if (normalizedType === 'rating') {
      updateData.rating_min = ratingMin;
      updateData.rating_max = ratingMax;
    }
    
    if (normalizedType === 'grid') {
      updateData.grid_rows = gridRows || [];
      updateData.grid_columns = gridColumns || [];
    }
    
    // Update the question in the database
    const { error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating question type:', error);
    return { success: false, error };
  }
};

/**
 * Converts a text question to a multiple-choice question
 */
export const convertToMultipleChoice = async (
  questionId: string,
  options: string[]
) => {
  return updateQuestionType(questionId, 'multiple-choice', options);
};

/**
 * Converts a text question to a checkbox (multiple answer) question
 */
export const convertToCheckbox = async (
  questionId: string,
  options: string[]
) => {
  return updateQuestionType(questionId, 'checkbox', options);
};

/**
 * Converts a text question to a rating scale question
 */
export const convertToRating = async (
  questionId: string,
  min: number = 1,
  max: number = 5
) => {
  return updateQuestionType(questionId, 'rating', undefined, min, max);
};

/**
 * Converts a text question to a grid question
 */
export const convertToGrid = async (
  questionId: string,
  rows: string[],
  columns: string[]
) => {
  return updateQuestionType(questionId, 'grid', undefined, undefined, undefined, rows, columns);
};

/**
 * Converts a question back to a simple text question
 */
export const convertToText = async (questionId: string) => {
  return updateQuestionType(questionId, 'text');
};

/**
 * Fetches a question's current type from the database
 */
export const getQuestionType = async (questionId: string) => {
  try {
    console.log('Fetching question type for id:', questionId);
    
    const { data, error } = await supabase
      .from('questions')
      .select('question_type, options, rating_min, rating_max, grid_rows, grid_columns')
      .eq('id', questionId)
      .single();
      
    if (error) throw error;
    
    // Examine the raw response before any processing
    console.log('Raw database response:', JSON.stringify(data));
    
    // Check what's coming directly from the database before normalizing
    console.log('Raw question type from database:', {
      id: questionId,
      rawType: data.question_type,
      typeOfRaw: typeof data.question_type,
      rawStructure: data.question_type ? 
        (typeof data.question_type === 'object' ? 
          'Object with properties: ' + Object.keys(data.question_type).join(', ') : 
          'Not an object') : 
        'Null or undefined'
    });
    
    // Normalize the question type from the database
    const normalizedType = normalizeQuestionType(data.question_type);
    
    console.log('Retrieved question type after normalization:', {
      id: questionId,
      rawType: data.question_type,
      normalizedType: normalizedType
    });
    
    return { 
      success: true, 
      data: {
        questionType: normalizedType,
        options: data.options || [],
        ratingMin: data.rating_min,
        ratingMax: data.rating_max,
        gridRows: data.grid_rows || [],
        gridColumns: data.grid_columns || []
      }
    };
  } catch (error) {
    console.error('Error fetching question type:', error);
    return { 
      success: false, 
      error 
    };
  }
};
