
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Question, Test } from "@/types/question";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateTestFormProps {
  onSubmit: (test: Omit<Test, "id" | "createdAt">, selectedQuestionIds: string[]) => void;
  questions: Question[];
  onCancel?: () => void;
}

export const CreateTestForm = ({ onSubmit, questions, onCancel }: CreateTestFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Fel",
        description: "Ange en titel för testet",
        variant: "destructive",
      });
      return;
    }

    if (selectedQuestionIds.length === 0) {
      toast({
        title: "Fel",
        description: "Välj minst en fråga för testet",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const newTest: Omit<Test, "id" | "createdAt"> = {
      title: title.trim(),
      description: description.trim() || undefined,
    };

    onSubmit(newTest, selectedQuestionIds);
    
    // Reset form
    setTitle("");
    setDescription("");
    setSelectedQuestionIds([]);
    setIsSubmitting(false);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Skapa nytt test</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Testtitel
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Naturkunskap Quiz - Vecka 3"
              className="mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Beskrivning (valfri)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lägg till instruktioner eller detaljer om detta test"
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Välj frågor för detta test
            </label>
            
            {questions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                Inga frågor tillgängliga. Skapa några frågor först.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                {questions.map((question) => (
                  <div key={question.id} className="flex items-start space-x-2 p-2 hover:bg-muted rounded-md">
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={selectedQuestionIds.includes(question.id)}
                      onCheckedChange={() => toggleQuestionSelection(question.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor={`question-${question.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {question.text}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Svar: {question.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Avbryt
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skapar test...
                </>
              ) : (
                "Skapa test"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
