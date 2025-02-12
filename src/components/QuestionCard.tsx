
import { useState } from "react";
import { Question } from "@/types/question";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

    onAnswerSubmit?.(answer);
    setAnswer("");
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
              disabled={isLoading || isRateLimited}
            />
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isLoading || isRateLimited}
            >
              {isLoading ? (
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
