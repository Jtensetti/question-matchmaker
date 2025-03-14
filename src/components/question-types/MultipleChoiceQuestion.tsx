
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Question, MultipleChoiceAnswer } from "@/types/question";
import { Label } from "@/components/ui/label";

interface MultipleChoiceQuestionProps {
  question: Question;
  value: MultipleChoiceAnswer; 
  onChange: (value: MultipleChoiceAnswer) => void;
  disabled?: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({ 
  question, 
  value, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-1">
        Choose your answer
      </label>
      <RadioGroup 
        value={value} 
        onValueChange={onChange}
        className="space-y-2"
        disabled={disabled}
      >
        {question.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
