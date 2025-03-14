import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageSquare, 
  ListChecks,
  Check, 
  Grid2X2, 
  FileText,
  AlignLeft,
  AlignRight
} from "lucide-react";

interface CreateQuestionFormProps {
  onSubmit: (
    question: string, 
    answer: string, 
    similarityThreshold: number, 
    semanticMatching: boolean,
    questionType: string,
    options?: string[],
    gridRows?: string[],
    gridColumns?: string[],
    ratingMin?: number,
    ratingMax?: number,
    ratingCorrect?: number
  ) => void;
}

export const CreateQuestionForm = ({ onSubmit }: CreateQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7); // Default 70%
  const [semanticMatching, setSemanticMatching] = useState(true); // Default to semantic matching
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [questionType, setQuestionType] = useState("open_ended");
  
  // Options for multiple choice and checkbox questions
  const [options, setOptions] = useState<string[]>(["", "", ""]);
  
  // For grid matching
  const [gridRows, setGridRows] = useState<string[]>(["", ""]);
  const [gridColumns, setGridColumns] = useState<string[]>(["", ""]);
  
  // For rating scale
  const [ratingMin, setRatingMin] = useState(0);
  const [ratingMax, setRatingMax] = useState(10);
  const [ratingCorrect, setRatingCorrect] = useState(5);

  const questionTypes = [
    { id: "open_ended", label: "Öppen fråga", icon: MessageSquare, allowSemantic: true },
    { id: "multiple_choice", label: "Flervalsfråga", icon: ListChecks, allowSemantic: false },
    { id: "rating", label: "Skattningsskala", icon: AlignLeft, allowSemantic: false },
    { id: "checkboxes", label: "Kryssrutor", icon: Check, allowSemantic: false },
    { id: "grid_matching", label: "Rutnätsmatchning", icon: Grid2X2, allowSemantic: false },
    { id: "fill_in_blank", label: "Fyll i luckor", icon: FileText, allowSemantic: true }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i frågan",
        variant: "destructive",
      });
      return;
    }
    
    // Validation for different question types
    if (questionType === "open_ended" && !answer.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i svaret",
        variant: "destructive",
      });
      return;
    }
    
    if (questionType === "multiple_choice" || questionType === "checkboxes") {
      // Filter out empty options
      const validOptions = options.filter(opt => opt.trim());
      
      if (validOptions.length < 2) {
        toast({
          title: "Fel",
          description: "Vänligen lägg till minst två alternativ",
          variant: "destructive",
        });
        return;
      }
      
      if (!answer.trim()) {
        toast({
          title: "Fel",
          description: "Vänligen välj rätt svar",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (questionType === "grid_matching") {
      const validRows = gridRows.filter(row => row.trim());
      const validColumns = gridColumns.filter(col => col.trim());
      
      if (validRows.length < 2 || validColumns.length < 2) {
        toast({
          title: "Fel",
          description: "Vänligen lägg till minst två rader och kolumner",
          variant: "destructive",
        });
        return;
      }
      
      // Answer should be in format: "row1:col1,row2:col2"
      if (!answer.includes(':') || !answer.trim()) {
        toast({
          title: "Fel",
          description: "Vänligen ange korrekt matchning mellan rader och kolumner",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (questionType === "fill_in_blank" && !question.includes('___')) {
      toast({
        title: "Fel",
        description: "Fyll-i-luckor-frågor måste innehålla luckor markerade med ___",
        variant: "destructive",
      });
      return;
    }
    
    if (questionType === "rating") {
      if (ratingMin >= ratingMax) {
        toast({
          title: "Fel",
          description: "Lägsta värdet måste vara mindre än högsta värdet",
          variant: "destructive",
        });
        return;
      }
      
      if (ratingCorrect < ratingMin || ratingCorrect > ratingMax) {
        toast({
          title: "Fel",
          description: "Korrekta värdet måste vara mellan lägsta och högsta värdet",
          variant: "destructive",
        });
        return;
      }
    }

    const filteredOptions = (questionType === "multiple_choice" || questionType === "checkboxes") 
      ? options.filter(opt => opt.trim())
      : undefined;

    const filteredGridRows = questionType === "grid_matching" 
      ? gridRows.filter(row => row.trim()) 
      : undefined;
    
    const filteredGridColumns = questionType === "grid_matching" 
      ? gridColumns.filter(col => col.trim()) 
      : undefined;

    // Only use semantic matching for open-ended and fill-in-blank questions
    const useSemanticMatching = 
      (questionType === "open_ended" || questionType === "fill_in_blank") && semanticMatching;
    
    // Create the answer string for rating questions
    const finalAnswer = questionType === "rating" 
      ? ratingCorrect.toString()
      : answer;
    
    // Ensure question type is saved as a string, not an object
    const normalizedQuestionType = String(questionType);
    console.log("Submitting question with type:", normalizedQuestionType);

    onSubmit(
      question, 
      finalAnswer, 
      similarityThreshold, 
      useSemanticMatching,
      normalizedQuestionType,
      filteredOptions,
      filteredGridRows,
      filteredGridColumns,
      questionType === "rating" ? ratingMin : undefined,
      questionType === "rating" ? ratingMax : undefined,
      questionType === "rating" ? ratingCorrect : undefined
    );
    
    // Reset form
    setQuestion("");
    setAnswer("");
    setSimilarityThreshold(0.7);
    setSemanticMatching(true);
    setOptions(["", "", ""]);
    setGridRows(["", ""]);
    setGridColumns(["", ""]);
    setRatingMin(0);
    setRatingMax(10);
    setRatingCorrect(5);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleGridRowChange = (index: number, value: string) => {
    const newRows = [...gridRows];
    newRows[index] = value;
    setGridRows(newRows);
  };

  const addGridRow = () => {
    setGridRows([...gridRows, ""]);
  };

  const removeGridRow = (index: number) => {
    if (gridRows.length > 2) {
      const newRows = [...gridRows];
      newRows.splice(index, 1);
      setGridRows(newRows);
    }
  };

  const handleGridColumnChange = (index: number, value: string) => {
    const newCols = [...gridColumns];
    newCols[index] = value;
    setGridColumns(newCols);
  };

  const addGridColumn = () => {
    setGridColumns([...gridColumns, ""]);
  };

  const removeGridColumn = (index: number) => {
    if (gridColumns.length > 2) {
      const newCols = [...gridColumns];
      newCols.splice(index, 1);
      setGridColumns(newCols);
    }
  };

  const currentQuestionType = questionTypes.find(type => type.id === questionType);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Skapa ny fråga</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Frågetyp</label>
            <div className="grid grid-cols-3 gap-2">
              {questionTypes.map(type => (
                <Button
                  key={type.id}
                  type="button"
                  variant={questionType === type.id ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 p-2 space-y-1"
                  onClick={() => {
                    setQuestionType(type.id);
                    if (!type.allowSemantic) {
                      setSemanticMatching(false);
                    }
                  }}
                >
                  <type.icon className="h-8 w-8" />
                  <span className="text-xs text-center">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div>
            <label htmlFor="question" className="text-sm font-medium">
              Fråga {questionType === "fill_in_blank" && "(Använd ___ för att markera luckor)"}
            </label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                questionType === "fill_in_blank" 
                ? "T.ex., Huvudstaden i Sverige är ___" 
                : "T.ex., Vad är huvudstaden i Sverige?"
              }
              className="mt-1"
            />
          </div>

          {/* Different Answer Types Based on Question Type */}
          {questionType === "open_ended" && (
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
          )}

          {questionType === "fill_in_blank" && (
            <div>
              <label htmlFor="answer" className="text-sm font-medium">
                Svar (för luckorna)
              </label>
              <Input
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="T.ex., Stockholm"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Om det finns flera luckor, separera svaren med kommatecken.
              </p>
            </div>
          )}

          {questionType === "multiple_choice" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Alternativ</label>
              {options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="correct-option"
                      className="h-4 w-4"
                      checked={answer === option}
                      onChange={() => setAnswer(option)}
                    />
                    <label htmlFor={`option-${index}`} className="text-sm">
                      Korrekt
                    </label>
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Alternativ ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      −
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                + Lägg till alternativ
              </Button>
            </div>
          )}

          {questionType === "checkboxes" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Alternativ (markera korrekta svar)</label>
              {options.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`checkbox-${index}`}
                      className="h-4 w-4"
                      checked={answer.split(',').includes(index.toString())}
                      onCheckedChange={(checked) => {
                        const currentAnswers = answer ? answer.split(',') : [];
                        const indexStr = index.toString();
                        
                        if (checked) {
                          if (!currentAnswers.includes(indexStr)) {
                            setAnswer([...currentAnswers, indexStr].join(','));
                          }
                        } else {
                          setAnswer(currentAnswers.filter(a => a !== indexStr).join(','));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`checkbox-${index}`}
                      className="text-sm"
                    >
                      Korrekt
                    </Label>
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Alternativ ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      −
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                + Lägg till alternativ
              </Button>
            </div>
          )}

          {questionType === "rating" && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <label htmlFor="rating-min" className="text-sm font-medium">
                    Lägsta värde
                  </label>
                  <Input
                    id="rating-min"
                    type="number"
                    value={ratingMin}
                    onChange={(e) => setRatingMin(parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="rating-max" className="text-sm font-medium">
                    Högsta värde
                  </label>
                  <Input
                    id="rating-max"
                    type="number"
                    value={ratingMax}
                    onChange={(e) => setRatingMax(parseInt(e.target.value) || 10)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="rating-correct" className="text-sm font-medium">
                    Korrekt värde
                  </label>
                  <Input
                    id="rating-correct"
                    type="number"
                    value={ratingCorrect}
                    onChange={(e) => setRatingCorrect(parseInt(e.target.value) || 5)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <AlignLeft className="h-5 w-5 mr-1" />
                      <span>{ratingMin}</span>
                    </div>
                    <div className="flex items-center">
                      <span>{ratingMax}</span>
                      <AlignRight className="h-5 w-5 ml-1" />
                    </div>
                  </div>
                  
                  <div className="relative pt-4">
                    <div className="h-2 bg-gray-300 rounded-full"></div>
                    <div 
                      className="absolute h-4 w-4 bg-primary rounded-full -mt-1 transform -translate-x-1/2"
                      style={{ 
                        left: `${(ratingCorrect - ratingMin) / (ratingMax - ratingMin) * 100}%`,
                        top: '0.5rem'
                      }}
                    ></div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Korrekta värdet: {ratingCorrect}
                  </div>
                </div>
              </div>
            </div>
          )}

          {questionType === "grid_matching" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Rader</label>
                {gridRows.map((row, index) => (
                  <div key={`row-${index}`} className="flex space-x-2">
                    <Input
                      value={row}
                      onChange={(e) => handleGridRowChange(index, e.target.value)}
                      placeholder={`Rad ${index + 1}`}
                      className="flex-1"
                    />
                    {gridRows.length > 2 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeGridRow(index)}
                      >
                        −
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGridRow}
                  className="w-full"
                >
                  + Lägg till rad
                </Button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Kolumner</label>
                {gridColumns.map((col, index) => (
                  <div key={`col-${index}`} className="flex space-x-2">
                    <Input
                      value={col}
                      onChange={(e) => handleGridColumnChange(index, e.target.value)}
                      placeholder={`Kolumn ${index + 1}`}
                      className="flex-1"
                    />
                    {gridColumns.length > 2 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeGridColumn(index)}
                      >
                        −
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGridColumn}
                  className="w-full"
                >
                  + Lägg till kolumn
                </Button>
              </div>

              <div>
                <label htmlFor="grid-answer" className="text-sm font-medium">
                  Matchningar (format: rad:kolumn,rad:kolumn)
                </label>
                <Input
                  id="grid-answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="T.ex., 0:1,1:0 (första raden matchar andra kolumnen, osv)"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ange matchningar mellan rader och kolumner som indexnummer (börjar från 0).
                </p>
              </div>
            </div>
          )}
          
          {/* Advanced Settings - Only show for applicable question types */}
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
              {/* Only show threshold for question types that need it */}
              {(questionType === "open_ended" || questionType === "fill_in_blank") && (
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
              )}
              
              {/* Only show semantic matching option for question types that support it */}
              {currentQuestionType?.allowSemantic && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="semantic-matching"
                        checked={semanticMatching}
                        onCheckedChange={setSemanticMatching}
                        disabled={!currentQuestionType.allowSemantic}
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
              )}
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
