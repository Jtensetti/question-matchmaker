
import { useState } from "react";
import { Question } from "@/types/question";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface QuestionCardProps {
  question: Question;
  isTeacher?: boolean;
  onAnswerSubmit?: (answer: string) => void;
}

export const QuestionCard = ({
  question,
  isTeacher = false,
  onAnswerSubmit,
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please provide an answer",
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
            />
            <Button onClick={handleSubmit} className="w-full">
              Submit Answer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
