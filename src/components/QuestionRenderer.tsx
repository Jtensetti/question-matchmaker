
import React from "react";
import { Question, QuestionAnswer, GridAnswer, RatingAnswer } from "@/types/question";
import { TextQuestion } from "./question-types/TextQuestion";
import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { RatingQuestion } from "./question-types/RatingQuestion";
import { GridQuestion } from "./question-types/GridQuestion";

interface QuestionRendererProps {
  question: Question;
  value: QuestionAnswer;
  onChange: (value: QuestionAnswer) => void;
  disabled?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  disabled
}) => {
  // Default to text if question type is not specified
  const questionType = question.questionType || "text";

  // Parse value based on question type
  const getTypedValue = (): QuestionAnswer => {
    switch (questionType) {
      case "rating":
        // Convert to number for rating questions
        return typeof value === 'number' ? value : 
               typeof value === 'string' && value !== '' ? Number(value) : 
               (question.ratingMin ?? 1);
        
      case "grid":
        // Parse JSON string to GridAnswer object if needed
        if (typeof value === 'string' && value.startsWith('{')) {
          try {
            return JSON.parse(value) as GridAnswer;
          } catch (e) {
            return { row: "", column: "" };
          }
        }
        return (typeof value === 'object' && value !== null) ? 
          value as GridAnswer : { row: "", column: "" };
        
      case "multiple-choice":
        return typeof value === 'string' ? value : '';
        
      case "text":
      default:
        return typeof value === 'string' ? value : '';
    }
  };

  const typedValue = getTypedValue();

  switch (questionType) {
    case "multiple-choice":
      return (
        <MultipleChoiceQuestion 
          question={question} 
          value={typedValue as string} 
          onChange={(newValue) => onChange(newValue)} 
          disabled={disabled} 
        />
      );
    case "rating":
      return (
        <RatingQuestion 
          question={question} 
          value={typedValue as RatingAnswer} 
          onChange={(newValue) => onChange(newValue)} 
          disabled={disabled} 
        />
      );
    case "grid":
      return (
        <GridQuestion 
          question={question} 
          value={typedValue as GridAnswer} 
          onChange={(newValue) => onChange(newValue)} 
          disabled={disabled} 
        />
      );
    case "text":
    default:
      return (
        <TextQuestion 
          question={question} 
          value={typedValue as string} 
          onChange={(newValue) => onChange(newValue)} 
          disabled={disabled} 
        />
      );
  }
};
