
import { useState } from "react";
import { Question } from "@/types/question";
import { QuestionCard } from "@/components/QuestionCard";
import { CreateQuestionForm } from "@/components/CreateQuestionForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isTeacher, setIsTeacher] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  const handleCreateQuestion = (questionText: string, answerText: string) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: questionText,
      answer: answerText,
      createdAt: new Date(),
    };
    setQuestions((prev) => [...prev, newQuestion]);
    toast({
      title: "Success",
      description: "Question created successfully",
    });
  };

  const handleAnswerSubmit = (questionId: string, studentAnswer: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    // Case-insensitive comparison with trimmed whitespace
    const isCorrect = 
      studentAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();

    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect
        ? "Great job! Your answer matches perfectly!"
        : "Try again. Your answer doesn't match the expected answer.",
      variant: isCorrect ? "default" : "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Question Matchmaker</h1>
          <p className="text-lg text-muted-foreground">
            {isTeacher 
              ? "Create and manage your questions" 
              : "Answer questions and test your knowledge"}
          </p>
          <Button 
            variant="outline" 
            onClick={() => setIsTeacher(!isTeacher)}
            className="animate-fadeIn"
          >
            Switch to {isTeacher ? "Student" : "Teacher"} Mode
          </Button>
        </header>

        <main className="max-w-2xl mx-auto space-y-6">
          {isTeacher ? (
            <>
              <CreateQuestionForm onSubmit={handleCreateQuestion} />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Created Questions</h2>
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    isTeacher={true}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No questions available yet. Wait for your teacher to add some!
                </div>
              ) : (
                questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onAnswerSubmit={(answer) => handleAnswerSubmit(question.id, answer)}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
