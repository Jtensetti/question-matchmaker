
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Question, Test } from "@/types/question";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface CreateTestFormProps {
  onSubmit: (test: Omit<Test, "id" | "createdAt">, selectedQuestionIds: string[]) => void;
  questions: Question[];
  onCancel?: () => void;
  onQuestionCreated?: (question: Question) => void;
}

export const CreateTestForm = ({ 
  onSubmit, 
  questions, 
  onCancel, 
  onQuestionCreated 
}: CreateTestFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // För att skapa nya frågor
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [semanticMatching, setSemanticMatching] = useState(true);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("existing");

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

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim() || !answerText.trim()) {
      toast({
        title: "Fel",
        description: "Både fråga och svar måste fyllas i",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingQuestion(true);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([
          { 
            text: questionText.trim(), 
            answer: answerText.trim(),
            similarity_threshold: similarityThreshold,
            semantic_matching: semanticMatching
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newQuestion: Question = {
          id: data.id,
          text: data.text,
          answer: data.answer,
          createdAt: new Date(data.created_at),
          similarityThreshold: data.similarity_threshold,
          semanticMatching: data.semantic_matching
        };
        
        // Lägg till den nya frågan i selectedQuestionIds
        setSelectedQuestionIds(prev => [...prev, newQuestion.id]);
        
        // Notifiera föräldrakomponenten
        if (onQuestionCreated) {
          onQuestionCreated(newQuestion);
        }
        
        // Återställ formuläret
        setQuestionText("");
        setAnswerText("");
        setSimilarityThreshold(0.7);
        setSemanticMatching(true);
        
        // Byt tillbaka till flikken med befintliga frågor
        setActiveTab("existing");
        
        toast({
          title: "Framgång",
          description: "Frågan har skapats och valts för detta test",
        });
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Fel",
        description: "Det gick inte att skapa frågan. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQuestion(false);
    }
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
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Befintliga frågor</TabsTrigger>
                <TabsTrigger value="new">Skapa ny fråga</TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing" className="mt-4">
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
              </TabsContent>
              
              <TabsContent value="new" className="mt-4">
                {/* Fix: We're using a div instead of a form here to avoid nesting forms, which was causing the issue */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="questionText" className="text-sm font-medium">
                      Fråga
                    </label>
                    <Input
                      id="questionText"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="T.ex. Vad är huvudstaden i Sverige?"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="answerText" className="text-sm font-medium">
                      Svar
                    </label>
                    <Input
                      id="answerText"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="T.ex. Stockholm"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="similarity" className="text-sm font-medium">
                          Svarsprecision: {Math.round(similarityThreshold * 100)}%
                        </label>
                        <div className="text-xs text-muted-foreground">
                          {similarityThreshold < 0.4 ? "Mycket tillåtande" : 
                          similarityThreshold < 0.6 ? "Tillåtande" : 
                          similarityThreshold < 0.8 ? "Moderat" : 
                          similarityThreshold < 0.9 ? "Strikt" : "Mycket strikt"}
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
                        <span className="font-medium">Låg:</span> Mer flexibel med svar
                        <br />
                        <span className="font-medium">Hög:</span> Kräver högre precision
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="semantic-matching"
                            checked={semanticMatching}
                            onCheckedChange={setSemanticMatching}
                          />
                          <label htmlFor="semantic-matching" className="text-sm font-medium cursor-pointer">
                            Använd semantisk matchning
                          </label>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1">
                        <span className="font-medium">PÅ:</span> Matcha baserat på betydelse (t.ex. "Madrid" matchar "Spaniens huvudstad är Madrid")
                        <br />
                        <span className="font-medium">AV:</span> Matcha endast baserat på stavning/tecken
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    className="w-full"
                    disabled={isCreatingQuestion}
                    onClick={handleCreateQuestion}
                  >
                    {isCreatingQuestion ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Skapar fråga...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Skapa och lägg till i testet
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
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
