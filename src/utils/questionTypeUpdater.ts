
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
    const updateData: any = {
      question_type: questionType
    };
    
    // Only include properties that are relevant to the question type
    if (questionType === 'multiple-choice' || questionType === 'checkbox') {
      updateData.options = options || [];
    }
    
    if (questionType === 'rating') {
      updateData.rating_min = ratingMin;
      updateData.rating_max = ratingMax;
    }
    
    if (questionType === 'grid') {
      updateData.grid_rows = gridRows || [];
      updateData.grid_columns = gridColumns || [];
    }
    
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
