
import React from "react";
import { Input } from "@/components/ui/input";
import { Question, TextAnswer } from "@/types/question";

interface TextQuestionProps {
  question: Question;
  value: TextAnswer;
  onChange: (value: TextAnswer) => void;
  disabled?: boolean;
}

export const TextQuestion: React.FC<TextQuestionProps> = ({ 
  question, 
  value, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="answer" className="block text-sm font-medium mb-1">
        Your Answer
      </label>
      <Input
        id="answer"
        placeholder="Type your answer here"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};
