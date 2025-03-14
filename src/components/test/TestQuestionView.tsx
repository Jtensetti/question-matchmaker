
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { Question, Test } from "@/types/question";

interface TestQuestionViewProps {
  test: Test;
  studentName: string;
  currentQuestionIndex: number;
  testQuestions: Question[];
  answer: string;
  setAnswer: (answer: string) => void;
  submitting: boolean;
  handleAnswerSubmit: () => void;
}

export const TestQuestionView: React.FC<TestQuestionViewProps> = ({
  test,
  studentName,
  currentQuestionIndex,
  testQuestions,
  answer,
  setAnswer,
  submitting,
  handleAnswerSubmit,
}) => {
  const currentQuestion = testQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {testQuestions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-md">
              <h2 className="text-xl font-semibold mb-2">{currentQuestion.text}</h2>
            </div>
            
            <QuestionRenderer 
              question={currentQuestion}
              value={answer}
              onChange={setAnswer}
              disabled={submitting}
            />
              
            <Button 
              onClick={handleAnswerSubmit} 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestionIndex < testQuestions.length - 1 ? (
                "Next Question"
              ) : (
                "Complete Test"
              )}
            </Button>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center text-sm text-muted-foreground">
              Taking test as: <span className="font-medium">{studentName}</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
