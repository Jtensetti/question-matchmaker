
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  // Check if multiple selections are allowed
  const allowMultiple = question.allowMultipleSelections === true;
  
  // Parse value if it's JSON string for multiple selections
  const selectedValues = allowMultiple ? 
    (typeof value === 'string' && value.startsWith('[') ? 
      JSON.parse(value) : 
      Array.isArray(value) ? value : []) : 
    null;
  
  // Handle checkbox change for multiple selections
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (!selectedValues) return;
    
    const newSelection = checked
      ? [...selectedValues, option]
      : selectedValues.filter(item => item !== option);
    
    onChange(newSelection);
  };
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-1">
        Choose your answer{allowMultiple ? ' (select all that apply)' : ''}
      </label>
      
      {allowMultiple ? (
        // Multiple selection with checkboxes
        <div className="space-y-2">
          {question.options?.map((option, index) => {
            const isSelected = selectedValues?.includes(option);
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox 
                  id={`option-${index}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(option, checked === true)
                  }
                  disabled={disabled}
                />
                <label 
                  htmlFor={`option-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option}
                </label>
              </div>
            );
          })}
        </div>
      ) : (
        // Single selection with radio buttons
        <RadioGroup 
          value={typeof value === 'string' ? value : ''}
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
      )}
    </div>
  );
};
