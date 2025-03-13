
import { useState } from "react";
import { Question } from "@/types/question";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { compareTwoStrings } from "string-similarity";

interface QuestionCardProps {
  question: Question;
  isTeacher?: boolean;
  isLoading?: boolean;
  onAnswerSubmit?: (answer: string) => void;
}

export const QuestionCard = ({
  question,
  isTeacher = false,
  isLoading = false,
  onAnswerSubmit,
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    if (isRateLimited) {
      toast({
        title: "Please wait",
        description: "Please wait a few seconds before trying again.",
        variant: "destructive",
      });
      return;
    }

    // If we have the correct answer (teacher mode), we can check it locally
    if (question.answer) {
      setChecking(true);
      
      // Simulate a small delay to make the checking feel natural
      setTimeout(() => {
        // Calculate similarity between student answer and correct answer
        const similarity = compareTwoStrings(
          answer.trim().toLowerCase(),
          question.answer.trim().toLowerCase()
        );
        
        // Consider it correct if similarity is above 0.7 (70%)
        const isCorrect = similarity > 0.7;
        
        toast({
          title: isCorrect ? "Correct!" : "Incorrect",
          description: isCorrect
            ? "Great job! Your answer is semantically correct!"
            : "Try again. Your answer doesn't match the expected meaning.",
          variant: isCorrect ? "default" : "destructive",
        });
        
        setChecking(false);
        setAnswer("");
      }, 1000);
    } else {
      // If we don't have the correct answer (old behavior), use the callback
      onAnswerSubmit?.(answer);
      setAnswer("");
    }
  };

  return (
    <Card className="w-full animate-fadeIn">
      <CardHeader>
        <h3 className="text-lg font-semibold">{question.text}</h3>
      </CardHeader>
      <CardContent>
        {isTeacher ? (
          <div className="pt-2">
            <p className="text-sm font-medium text-muted-foreground">Answer:</p>
            <p className="mt-1">{question.answer}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full"
              disabled={isLoading || isRateLimited || checking}
            />
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isLoading || isRateLimited || checking}
            >
              {isLoading || checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Answer
                </>
              ) : isRateLimited ? (
                "Please wait..."
              ) : (
                "Submit Answer"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
