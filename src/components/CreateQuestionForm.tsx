
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { QuestionType } from "@/types/question";

interface CreateQuestionFormProps {
  onSubmit: (
    question: string, 
    answer: string, 
    similarityThreshold: number, 
    semanticMatching: boolean,
    questionType: QuestionType,
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
  const [questionType, setQuestionType] = useState<QuestionType>("text");
  
  // Multiple choice options
  const [options, setOptions] = useState<string[]>(["", ""]);
  
  // Rating question settings
  const [ratingMin, setRatingMin] = useState(1);
  const [ratingMax, setRatingMax] = useState(5);
  
  // Grid question settings
  const [gridRows, setGridRows] = useState<string[]>(["", ""]);
  const [gridColumns, setGridColumns] = useState<string[]>(["", ""]);

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
    if (questionType === "multiple-choice") {
      const validOptions = options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        toast({
          title: "Fel",
          description: "Flervalsfrågor måste ha minst två alternativ",
          variant: "destructive",
        });
        return;
      }
      
      if (!answer.trim()) {
        toast({
          title: "Fel",
          description: "Vänligen ange rätt svar",
          variant: "destructive",
        });
        return;
      }
      
      // Check if answer is one of the options
      if (!options.some(opt => opt === answer)) {
        toast({
          title: "Fel",
          description: "Rätt svar måste vara ett av alternativen",
          variant: "destructive",
        });
        return;
      }
    } else if (questionType === "rating") {
      if (ratingMin >= ratingMax) {
        toast({
          title: "Fel",
          description: "Max-värdet måste vara större än min-värdet",
          variant: "destructive",
        });
        return;
      }
      
      const answerNum = Number(answer);
      if (isNaN(answerNum) || answerNum < ratingMin || answerNum > ratingMax) {
        toast({
          title: "Fel",
          description: `Svaret måste vara ett tal mellan ${ratingMin} och ${ratingMax}`,
          variant: "destructive",
        });
        return;
      }
    } else if (questionType === "grid") {
      const validRows = gridRows.filter(row => row.trim() !== "");
      const validCols = gridColumns.filter(col => col.trim() !== "");
      
      if (validRows.length < 1 || validCols.length < 1) {
        toast({
          title: "Fel",
          description: "Rutnätsfrågor måste ha minst en rad och en kolumn",
          variant: "destructive",
        });
        return;
      }
      
      // For grid, answer could be in format "row1:col2,row2:col1" indicating matches
      if (!answer.trim()) {
        toast({
          title: "Fel",
          description: "Vänligen ange matchningar i formatet 'rad1:kolumn2,rad2:kolumn1'",
          variant: "destructive",
        });
        return;
      }
    } else if (questionType === "text") {
      if (!answer.trim()) {
        toast({
          title: "Fel",
          description: "Vänligen fyll i svaret",
          variant: "destructive",
        });
        return;
      }
    }

    // Call the onSubmit function with the appropriate parameters based on question type
    onSubmit(
      question, 
      answer, 
      similarityThreshold, 
      semanticMatching,
      questionType,
      questionType === "multiple-choice" ? options.filter(opt => opt.trim() !== "") : undefined,
      questionType === "rating" ? ratingMin : undefined,
      questionType === "rating" ? ratingMax : undefined,
      questionType === "grid" ? gridRows.filter(row => row.trim() !== "") : undefined,
      questionType === "grid" ? gridColumns.filter(col => col.trim() !== "") : undefined
    );

    // Reset form
    setQuestion("");
    setAnswer("");
    setSimilarityThreshold(0.7);
    setSemanticMatching(true);
    setOptions(["", ""]);
    setRatingMin(1);
    setRatingMax(5);
    setGridRows(["", ""]);
    setGridColumns(["", ""]);
  };

  // Add a new option field for multiple choice questions
  const addOption = () => {
    setOptions([...options, ""]);
  };

  // Remove an option from multiple choice questions
  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  // Update a specific option
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Add a new row to the grid
  const addGridRow = () => {
    setGridRows([...gridRows, ""]);
  };

  // Remove a row from the grid
  const removeGridRow = (index: number) => {
    const newRows = [...gridRows];
    newRows.splice(index, 1);
    setGridRows(newRows);
  };

  // Update a specific grid row
  const updateGridRow = (index: number, value: string) => {
    const newRows = [...gridRows];
    newRows[index] = value;
    setGridRows(newRows);
  };

  // Add a new column to the grid
  const addGridColumn = () => {
    setGridColumns([...gridColumns, ""]);
  };

  // Remove a column from the grid
  const removeGridColumn = (index: number) => {
    const newColumns = [...gridColumns];
    newColumns.splice(index, 1);
    setGridColumns(newColumns);
  };

  // Update a specific grid column
  const updateGridColumn = (index: number, value: string) => {
    const newColumns = [...gridColumns];
    newColumns[index] = value;
    setGridColumns(newColumns);
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Skapa ny fråga</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Frågetyp</label>
              <RadioGroup
                value={questionType}
                onValueChange={(value) => setQuestionType(value as QuestionType)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <Label htmlFor="text">Textfråga</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple-choice" id="multiple-choice" />
                  <Label htmlFor="multiple-choice">Flervalsfråga</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rating" id="rating" />
                  <Label htmlFor="rating">Betygsättning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grid" id="grid" />
                  <Label htmlFor="grid">Rutnätsmatchning</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question type specific fields */}
            {questionType === "text" && (
              <div>
                <label htmlFor="text-answer" className="text-sm font-medium">
                  Svar
                </label>
                <Input
                  id="text-answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="T.ex., Stockholm"
                  className="mt-1"
                />
              </div>
            )}

            {questionType === "multiple-choice" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Alternativ</label>
                  <div className="space-y-2 mt-1">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Alternativ ${index + 1}`}
                          className="flex-1"
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Lägg till alternativ
                    </Button>
                  </div>
                </div>
                <div>
                  <label htmlFor="mc-answer" className="text-sm font-medium">
                    Rätt svar
                  </label>
                  <select
                    id="mc-answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="">Välj rätt svar</option>
                    {options.map((option, index) => (
                      option.trim() !== "" && (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      )
                    ))}
                  </select>
                </div>
              </div>
            )}

            {questionType === "rating" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rating-min" className="text-sm font-medium">
                      Lägsta värde
                    </label>
                    <Input
                      id="rating-min"
                      type="number"
                      value={ratingMin}
                      onChange={(e) => setRatingMin(Number(e.target.value))}
                      min={0}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="rating-max" className="text-sm font-medium">
                      Högsta värde
                    </label>
                    <Input
                      id="rating-max"
                      type="number"
                      value={ratingMax}
                      onChange={(e) => setRatingMax(Number(e.target.value))}
                      min={ratingMin + 1}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="rating-answer" className="text-sm font-medium">
                    Rätt svar
                  </label>
                  <Input
                    id="rating-answer"
                    type="number"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    min={ratingMin}
                    max={ratingMax}
                    className="mt-1"
                  />
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">Förhandsvisning:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{ratingMin}</span>
                      <span>{ratingMax}</span>
                    </div>
                    <Slider
                      value={[Number(answer) || ratingMin]}
                      min={ratingMin}
                      max={ratingMax}
                      step={1}
                      onValueChange={(values) => setAnswer(values[0].toString())}
                    />
                  </div>
                </div>
              </div>
            )}

            {questionType === "grid" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rader</label>
                  <div className="space-y-2 mt-1">
                    {gridRows.map((row, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={row}
                          onChange={(e) => updateGridRow(index, e.target.value)}
                          placeholder={`Rad ${index + 1}`}
                          className="flex-1"
                        />
                        {gridRows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGridRow(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addGridRow}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Lägg till rad
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Kolumner</label>
                  <div className="space-y-2 mt-1">
                    {gridColumns.map((col, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={col}
                          onChange={(e) => updateGridColumn(index, e.target.value)}
                          placeholder={`Kolumn ${index + 1}`}
                          className="flex-1"
                        />
                        {gridColumns.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGridColumn(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addGridColumn}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Lägg till kolumn
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="grid-answer" className="text-sm font-medium">
                    Korrekta matchningar (format: rad1:kolumn2,rad2:kolumn1)
                  </label>
                  <Input
                    id="grid-answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="T.ex., Rad1:Kolumn2,Rad2:Kolumn1"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ange matchningar mellan rader och kolumner. Exempel: "Sverige:Stockholm,Norge:Oslo"
                  </p>
                </div>
                
                {gridRows.some(r => r.trim() !== "") && gridColumns.some(c => c.trim() !== "") && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Förhandsvisning av rutnät:</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="p-2"></th>
                            {gridColumns.map((col, colIndex) => (
                              col.trim() !== "" && (
                                <th key={colIndex} className="p-2 font-medium text-center">
                                  {col}
                                </th>
                              )
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {gridRows.map((row, rowIndex) => (
                            row.trim() !== "" && (
                              <tr key={rowIndex}>
                                <td className="p-2 font-medium">{row}</td>
                                {gridColumns.map((col, colIndex) => (
                                  col.trim() !== "" && (
                                    <td key={colIndex} className="p-2 text-center">
                                      <div className="h-6 w-6 border border-gray-300 rounded-md mx-auto"></div>
                                    </td>
                                  )
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
            )}

            {(questionType === "text") && (
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
            )}
            
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
