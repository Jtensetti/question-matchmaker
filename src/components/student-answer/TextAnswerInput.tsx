
import React from "react";
import { Input } from "@/components/ui/input";

interface TextAnswerInputProps {
  textAnswer: string;
  setTextAnswer: (text: string) => void;
  submitting: boolean;
}

export const TextAnswerInput: React.FC<TextAnswerInputProps> = ({
  textAnswer,
  setTextAnswer,
  submitting
}) => {
  return (
    <div>
      <label htmlFor="answer" className="block text-sm font-medium mb-1">
        Your Answer
      </label>
      <Input
        id="answer"
        placeholder="Type your answer here"
        value={textAnswer}
        onChange={(e) => setTextAnswer(e.target.value)}
        disabled={submitting}
      />
    </div>
  );
};
