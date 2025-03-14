
import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { Question } from "@/types/question";

interface AnswerResultsProps {
  question: Question;
  userAnswer: string;
  selectedRadioOption: string;
  ratingValue: number;
  gridSelections: Record<string, string>;
  isCorrect: boolean | null;
  similarity: number;
  onReset: () => void;
}

export const AnswerResults: React.FC<AnswerResultsProps> = ({
  question,
  userAnswer,
  selectedRadioOption,
  ratingValue,
  gridSelections,
  isCorrect,
  similarity,
  onReset
}) => {
  // Format the displayed answer based on question type
  const getDisplayedAnswer = () => {
    if (question.questionType === "multiple-choice") {
      return selectedRadioOption;
    } else if (question.questionType === "rating") {
      return ratingValue.toString();
    } else if (question.questionType === "grid") {
      return Object.entries(gridSelections)
        .map(([row, col]) => `${row} → ${col}`)
        .join(', ');
    } else {
      return userAnswer;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <p className="font-medium">Ditt svar:</p>
        <p className="text-muted-foreground">{getDisplayedAnswer()}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <p className="font-medium">Resultat:</p>
        {isCorrect ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-1" />
            <span>Rätt</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-1" />
            <span>Fel</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <p className="font-medium">Likhet:</p>
        <div className="flex items-center">
          <span className={similarity >= 0.5 ? "text-green-600" : "text-red-600"}>
            {Math.round(similarity * 100)}%
          </span>
        </div>
      </div>
      
      {!isCorrect && (
        <div className="flex items-center space-x-2">
          <p className="font-medium">Rätt svar:</p>
          <p className="text-muted-foreground">{question.answer}</p>
        </div>
      )}
      
      <Button 
        variant="outline" 
        onClick={onReset} 
        className="w-full"
      >
        Försök igen
      </Button>
    </div>
  );
};
