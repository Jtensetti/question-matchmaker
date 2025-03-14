
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question } from "@/types/question";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash } from "lucide-react";

interface CreateQuestionFormProps {
  onSubmit: (
    question: string, 
    answer: string, 
    similarityThreshold: number, 
    semanticMatching: boolean,
    questionType: string,
    options?: string[],
    ratingMin?: number,
    ratingMax?: number,
    gridRows?: string[],
    gridColumns?: string[]
  ) => void;
}

export const CreateQuestionForm = ({ onSubmit }: CreateQuestionFormProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [semanticMatching, setSemanticMatching] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [questionType, setQuestionType] = useState<string>("text");
  
  // Multiple choice options
  const [options, setOptions] = useState<string[]>([""]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  
  // Rating options
  const [ratingMin, setRatingMin] = useState<number>(1);
  const [ratingMax, setRatingMax] = useState<number>(10);
  
  // Grid options
  const [gridRows, setGridRows] = useState<string[]>([""]);
  const [gridColumns, setGridColumns] = useState<string[]>([""]);
  const [selectedGridRow, setSelectedGridRow] = useState<string>("");
  const [selectedGridColumn, setSelectedGridColumn] = useState<string>("");

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
      
      // If removing the selected option, reset selection
      if (selectedOptionIndex === index) {
        setSelectedOptionIndex(0);
      } else if (selectedOptionIndex > index) {
        setSelectedOptionIndex(selectedOptionIndex - 1);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddGridRow = () => {
    setGridRows([...gridRows, ""]);
  };

  const handleRemoveGridRow = (index: number) => {
    if (gridRows.length > 1) {
      const newRows = [...gridRows];
      newRows.splice(index, 1);
      setGridRows(newRows);
      
      // Reset selected row if needed
      if (selectedGridRow === gridRows[index]) {
        setSelectedGridRow("");
      }
    }
  };

  const handleGridRowChange = (index: number, value: string) => {
    const newRows = [...gridRows];
    newRows[index] = value;
    setGridRows(newRows);
  };

  const handleAddGridColumn = () => {
    setGridColumns([...gridColumns, ""]);
  };

  const handleRemoveGridColumn = (index: number) => {
    if (gridColumns.length > 1) {
      const newColumns = [...gridColumns];
      newColumns.splice(index, 1);
      setGridColumns(newColumns);
      
      // Reset selected column if needed
      if (selectedGridColumn === gridColumns[index]) {
        setSelectedGridColumn("");
      }
    }
  };

  const handleGridColumnChange = (index: number, value: string) => {
    const newColumns = [...gridColumns];
    newColumns[index] = value;
    setGridColumns(newColumns);
  };

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
    
    // Validate based on question type
    if (questionType === "text") {
      if (!answer.trim()) {
        toast({
          title: "Fel",
          description: "Vänligen fyll i svaret",
          variant: "destructive",
        });
        return;
      }
    } else if (questionType === "multiple-choice") {
      // Check if there are valid options
      const validOptions = options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        toast({
          title: "Fel",
          description: "Vänligen lägg till minst två alternativ",
          variant: "destructive",
        });
        return;
      }
      
      // Use the selected option as answer
      const selectedOption = options[selectedOptionIndex];
      if (!selectedOption || selectedOption.trim() === "") {
        toast({
          title: "Fel",
          description: "Vänligen välj ett korrekt svar",
          variant: "destructive",
        });
        return;
      }
    } else if (questionType === "rating") {
      if (ratingMin >= ratingMax) {
        toast({
          title: "Fel",
          description: "Minimivärdet måste vara mindre än maximivärdet",
          variant: "destructive",
        });
        return;
      }
      
      // For rating questions, we'll use the answer as the expected rating
      if (!answer.trim() || isNaN(Number(answer)) || Number(answer) < ratingMin || Number(answer) > ratingMax) {
        toast({
          title: "Fel",
          description: `Vänligen ange ett rätt svar mellan ${ratingMin} och ${ratingMax}`,
          variant: "destructive",
        });
        return;
      }
    } else if (questionType === "grid") {
      // Check if there are valid rows and columns
      const validRows = gridRows.filter(row => row.trim() !== "");
      const validColumns = gridColumns.filter(col => col.trim() !== "");
      
      if (validRows.length < 1 || validColumns.length < 1) {
        toast({
          title: "Fel",
          description: "Vänligen lägg till minst en rad och en kolumn",
          variant: "destructive",
        });
        return;
      }
      
      // Check if a cell has been selected
      if (!selectedGridRow || !selectedGridColumn) {
        toast({
          title: "Fel",
          description: "Vänligen välj rätt svar (rad och kolumn)",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Filter empty options, rows and columns
    const cleanOptions = options.filter(opt => opt.trim() !== "");
    const cleanRows = gridRows.filter(row => row.trim() !== "");
    const cleanColumns = gridColumns.filter(col => col.trim() !== "");
    
    // Prepare the answer based on question type
    let finalAnswer = answer;
    
    if (questionType === "multiple-choice") {
      finalAnswer = options[selectedOptionIndex];
    } else if (questionType === "grid") {
      finalAnswer = JSON.stringify({
        row: selectedGridRow,
        column: selectedGridColumn
      });
    }
    
    onSubmit(
      question, 
      finalAnswer, 
      similarityThreshold, 
      semanticMatching && (questionType === "text"), // Only apply semantic matching for text questions
      questionType,
      questionType === "multiple-choice" ? cleanOptions : undefined,
      questionType === "rating" ? ratingMin : undefined,
      questionType === "rating" ? ratingMax : undefined,
      questionType === "grid" ? cleanRows : undefined,
      questionType === "grid" ? cleanColumns : undefined
    );
    
    // Reset form
    setQuestion("");
    setAnswer("");
    setSimilarityThreshold(0.7);
    setSemanticMatching(true);
    setOptions([""]);
    setSelectedOptionIndex(0);
    setRatingMin(1);
    setRatingMax(10);
    setGridRows([""]);
    setGridColumns([""]);
    setSelectedGridRow("");
    setSelectedGridColumn("");
  };

  const renderQuestionTypeFields = () => {
    switch (questionType) {
      case "multiple-choice":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Alternativ</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4 mr-1" /> Lägg till alternativ
              </Button>
            </div>
            <RadioGroup 
              value={selectedOptionIndex.toString()} 
              onValueChange={(val) => setSelectedOptionIndex(parseInt(val))}
              className="space-y-3"
            >
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <div className="flex-1">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Alternativ ${index + 1}`}
                    />
                  </div>
                  {options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Trash className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Välj det alternativ som ska räknas som korrekt svar.
            </p>
          </div>
        );
        
      case "rating":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ratingMin" className="text-sm font-medium">
                  Minimivärde
                </Label>
                <Input
                  id="ratingMin"
                  type="number"
                  value={ratingMin}
                  onChange={(e) => setRatingMin(parseInt(e.target.value))}
                  min={0}
                  max={ratingMax - 1}
                />
              </div>
              <div>
                <Label htmlFor="ratingMax" className="text-sm font-medium">
                  Maximivärde
                </Label>
                <Input
                  id="ratingMax"
                  type="number"
                  value={ratingMax}
                  onChange={(e) => setRatingMax(parseInt(e.target.value))}
                  min={ratingMin + 1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="correctRating" className="text-sm font-medium">
                Rätt svar (vald värde)
              </Label>
              <Input
                id="correctRating"
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                min={ratingMin}
                max={ratingMax}
                placeholder="T.ex., 7"
              />
            </div>
            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">
                Förhandsvisning
              </Label>
              <Slider
                disabled
                value={[answer ? parseInt(answer) : ratingMin]}
                min={ratingMin}
                max={ratingMax}
                step={1}
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{ratingMin}</span>
                <span>{ratingMax}</span>
              </div>
            </div>
          </div>
        );
        
      case "grid":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Rader</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddGridRow}
                >
                  <Plus className="h-4 w-4 mr-1" /> Lägg till rad
                </Button>
              </div>
              <div className="space-y-2">
                {gridRows.map((row, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input
                        value={row}
                        onChange={(e) => handleGridRowChange(index, e.target.value)}
                        placeholder={`Rad ${index + 1}`}
                      />
                    </div>
                    {gridRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGridRow(index)}
                      >
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Kolumner</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddGridColumn}
                >
                  <Plus className="h-4 w-4 mr-1" /> Lägg till kolumn
                </Button>
              </div>
              <div className="space-y-2">
                {gridColumns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Input
                        value={column}
                        onChange={(e) => handleGridColumnChange(index, e.target.value)}
                        placeholder={`Kolumn ${index + 1}`}
                      />
                    </div>
                    {gridColumns.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGridColumn(index)}
                      >
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">
                Välj rätt svar (cell)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gridRow" className="text-xs text-muted-foreground mb-1 block">
                    Rad
                  </Label>
                  <Select 
                    value={selectedGridRow} 
                    onValueChange={setSelectedGridRow}
                  >
                    <SelectTrigger id="gridRow">
                      <SelectValue placeholder="Välj rad" />
                    </SelectTrigger>
                    <SelectContent>
                      {gridRows.map((row, index) => (
                        row.trim() !== "" && (
                          <SelectItem key={index} value={row}>
                            {row}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gridColumn" className="text-xs text-muted-foreground mb-1 block">
                    Kolumn
                  </Label>
                  <Select 
                    value={selectedGridColumn} 
                    onValueChange={setSelectedGridColumn}
                  >
                    <SelectTrigger id="gridColumn">
                      <SelectValue placeholder="Välj kolumn" />
                    </SelectTrigger>
                    <SelectContent>
                      {gridColumns.map((column, index) => (
                        column.trim() !== "" && (
                          <SelectItem key={index} value={column}>
                            {column}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Grid preview */}
            {gridRows.filter(r => r.trim() !== "").length > 0 && 
             gridColumns.filter(c => c.trim() !== "").length > 0 && (
              <div className="pt-2">
                <Label className="text-sm font-medium mb-2 block">
                  Förhandsvisning
                </Label>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="p-2 bg-muted text-left">&nbsp;</th>
                        {gridColumns.map((column, i) => (
                          column.trim() !== "" && (
                            <th key={i} className="p-2 bg-muted text-center">{column}</th>
                          )
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gridRows.map((row, i) => (
                        row.trim() !== "" && (
                          <tr key={i} className={i % 2 ? "bg-muted/20" : ""}>
                            <td className="p-2 font-medium">{row}</td>
                            {gridColumns.filter(c => c.trim() !== "").map((column, j) => (
                              <td key={j} className="p-2 text-center">
                                <div 
                                  className={`w-4 h-4 mx-auto rounded-full ${
                                    selectedGridRow === row && selectedGridColumn === column
                                      ? "bg-primary"
                                      : "bg-muted"
                                  }`}
                                />
                              </td>
                            ))}
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
        
      case "text":
      default:
        return (
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
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Skapa ny fråga</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="questionType" className="text-sm font-medium">
              Frågetyp
            </Label>
            <Select
              value={questionType}
              onValueChange={setQuestionType}
            >
              <SelectTrigger id="questionType">
                <SelectValue placeholder="Välj typ av fråga" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text (fritextsvar)</SelectItem>
                <SelectItem value="multiple-choice">Flervalsalternativ</SelectItem>
                <SelectItem value="rating">Gradering (slider)</SelectItem>
                <SelectItem value="grid">Rutnät (grid)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
          
          {renderQuestionTypeFields()}
          
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
          
          {showAdvanced && questionType === "text" && (
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
