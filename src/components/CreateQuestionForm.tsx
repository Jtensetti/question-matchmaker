
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface CreateQuestionFormProps {
  onSubmit: (question: string, answer: string) => void;
}

export const CreateQuestionForm = ({ onSubmit }: CreateQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive",
      });
      return;
    }
    onSubmit(question, answer);
    setQuestion("");
    setAnswer("");
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Create New Question</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="text-sm font-medium">
              Question
            </label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="E.g., What is the capital of Sweden?"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="answer" className="text-sm font-medium">
              Answer
            </label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="E.g., Stockholm"
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Create Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
