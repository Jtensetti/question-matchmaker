
import { supabase } from "@/integrations/supabase/client";

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
    // Validate inputs based on question type
    if ((questionType === 'multiple_choice' || questionType === 'multiple-choice' || questionType === 'checkboxes' || questionType === 'checkbox') && 
        (!options || options.length === 0)) {
      return { 
        success: false, 
        error: new Error("Options are required for multiple-choice or checkbox questions") 
      };
    }
    
    if (questionType === 'rating' && 
        (ratingMin === undefined || ratingMax === undefined || ratingMin >= ratingMax)) {
      return { 
        success: false, 
        error: new Error("Valid min and max rating values are required for rating questions") 
      };
    }
    
    if ((questionType === 'grid' || questionType === 'grid_matching') && 
        (!gridRows || !gridColumns || gridRows.length === 0 || gridColumns.length === 0)) {
      return { 
        success: false, 
        error: new Error("Grid rows and columns are required for grid questions") 
      };
    }
    
    // Normalize question types to ensure consistency
    let normalizedType = questionType;
    if (questionType === 'multiple_choice') normalizedType = 'multiple-choice';
    if (questionType === 'checkboxes') normalizedType = 'checkbox';
    if (questionType === 'grid_matching') normalizedType = 'grid';
    if (questionType === 'open_ended') normalizedType = 'text';
    if (questionType === 'fill_in_blank') normalizedType = 'fill-in-blank';
    
    const updateData: any = {
      question_type: normalizedType
    };
    
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
    
    console.log('Updating question type:', questionId, normalizedType, updateData);
    
    const { error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating question type:', error);
    return { 
      success: false, 
      error 
    };
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
    const { data, error } = await supabase
      .from('questions')
      .select('question_type, options, rating_min, rating_max, grid_rows, grid_columns')
      .eq('id', questionId)
      .single();
      
    if (error) throw error;
    
    return { 
      success: true, 
      data: {
        questionType: data.question_type || 'text',
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
