
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Question } from "@/types/question";

interface RatingQuestionProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const RatingQuestion: React.FC<RatingQuestionProps> = ({ 
  question, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const min = question.ratingMin ?? 1;
  const max = question.ratingMax ?? 10;
  const currentValue = value ? parseInt(value) : min;
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-1">
        Select your rating
      </label>
      <div className="px-2">
        <Slider
          value={[currentValue]}
          min={min}
          max={max}
          step={1}
          onValueChange={(values) => onChange(values[0].toString())}
          disabled={disabled}
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{min}</span>
          <span>Current: {currentValue}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};
