
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface CreateQuestionFormProps {
  onSubmit: (question: string, answer: string, similarityThreshold: number) => void;
}

export const CreateQuestionForm = ({ onSubmit }: CreateQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7); // Default 70%
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    onSubmit(question, answer, similarityThreshold);
    setQuestion("");
    setAnswer("");
    setSimilarityThreshold(0.7);
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
          
          <div className="flex items-center space-x-2">
            <Switch
              id="advanced-mode"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <label htmlFor="advanced-mode" className="text-sm font-medium cursor-pointer">
              Show advanced settings
            </label>
          </div>
          
          {showAdvanced && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-md">
              <div className="flex justify-between items-center">
                <label htmlFor="similarity" className="text-sm font-medium">
                  Answer strictness: {Math.round(similarityThreshold * 100)}%
                </label>
                <div className="text-xs text-muted-foreground">
                  {similarityThreshold < 0.4 ? "Very lenient" : 
                   similarityThreshold < 0.6 ? "Lenient" : 
                   similarityThreshold < 0.8 ? "Moderate" : 
                   similarityThreshold < 0.9 ? "Strict" : "Very strict"}
                </div>
              </div>
              <Slider
                id="similarity"
                value={[similarityThreshold]}
                min={0.3}
                max={0.95}
                step={0.05}
                onValueChange={(values) => setSimilarityThreshold(values[0])}
              />
              <div className="text-xs text-muted-foreground pt-1">
                <span className="font-medium">Low:</span> Accepts answers with different wording
                <br />
                <span className="font-medium">High:</span> Requires precise spelling and wording
              </div>
            </div>
          )}
          
          <Button type="submit" className="w-full">
            Create Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
