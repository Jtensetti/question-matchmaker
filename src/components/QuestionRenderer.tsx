
import React from "react";
import { Question } from "@/types/question";
import { TextQuestion } from "./question-types/TextQuestion";
import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { RatingQuestion } from "./question-types/RatingQuestion";
import { GridQuestion } from "./question-types/GridQuestion";

interface QuestionRendererProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
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

  switch (questionType) {
    case "multiple-choice":
      return (
        <MultipleChoiceQuestion 
          question={question} 
          value={value} 
          onChange={onChange} 
          disabled={disabled} 
        />
      );
    case "rating":
      return (
        <RatingQuestion 
          question={question} 
          value={value} 
          onChange={onChange} 
          disabled={disabled} 
        />
      );
    case "grid":
      return (
        <GridQuestion 
          question={question} 
          value={value} 
          onChange={onChange} 
          disabled={disabled} 
        />
      );
    case "text":
    default:
      return (
        <TextQuestion 
          question={question} 
          value={value} 
          onChange={onChange} 
          disabled={disabled} 
        />
      );
  }
};
