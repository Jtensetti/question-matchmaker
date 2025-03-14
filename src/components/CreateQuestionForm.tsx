
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface CreateQuestionFormProps {
  onSubmit: (question: string, answer: string, similarityThreshold: number, semanticMatching: boolean) => void;
}

export const CreateQuestionForm = ({ onSubmit }: CreateQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7); // Default 70%
  const [semanticMatching, setSemanticMatching] = useState(true); // Default to semantic matching
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i både fråga och svar",
        variant: "destructive",
      });
      return;
    }
    onSubmit(question, answer, similarityThreshold, semanticMatching);
    setQuestion("");
    setAnswer("");
    setSimilarityThreshold(0.7);
    setSemanticMatching(true);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Skapa ny fråga</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="text-sm font-medium">
              Fråga
            </label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="T.ex., Vad är huvudstaden i Sverige?"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="answer" className="text-sm font-medium">
              Svar
            </label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="T.ex., Stockholm"
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
              Visa avancerade inställningar
            </label>
          </div>
          
          {showAdvanced && (
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
                  <span className="font-medium">Hög:</span> Kräver mer precision
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
          )}
          
          <Button type="submit" className="w-full">
            Skapa fråga
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
