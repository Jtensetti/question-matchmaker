
import React from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Question } from "@/types/question";

interface QuestionInputProps {
  question: Question;
  userAnswer: string;
  setUserAnswer: (value: string) => void;
  selectedRadioOption: string;
  setSelectedRadioOption: (value: string) => void;
  ratingValue: number;
  setRatingValue: (value: number) => void;
  gridSelections: Record<string, string>;
  handleGridCellSelect: (row: string, col: string) => void;
  onSubmit: () => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ 
  question, 
  userAnswer, 
  setUserAnswer, 
  selectedRadioOption, 
  setSelectedRadioOption,
  ratingValue,
  setRatingValue,
  gridSelections,
  handleGridCellSelect,
  onSubmit
}) => {
  switch (question.questionType) {
    case "multiple-choice":
      return (
        <RadioGroup 
          value={selectedRadioOption} 
          onValueChange={setSelectedRadioOption}
          className="space-y-2"
        >
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    
    case "rating":
      const min = question.ratingMin !== undefined ? question.ratingMin : 1;
      const max = question.ratingMax !== undefined ? question.ratingMax : 5;
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{min}</span>
            <span>{max}</span>
          </div>
          <Slider
            value={[ratingValue]}
            min={min}
            max={max}
            step={1}
            onValueChange={(values) => setRatingValue(values[0])}
          />
          <div className="text-center font-medium mt-2">
            Valt värde: {ratingValue}
          </div>
        </div>
      );
    
    case "grid":
      if (!question.gridRows?.length || !question.gridColumns?.length) {
        return <p className="text-muted-foreground">Rutnätsmatchning saknar data</p>;
      }
      
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]"></TableHead>
                {question.gridColumns.map((col, colIndex) => (
                  <TableHead key={colIndex} className="text-center">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {question.gridRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="font-medium">{row}</TableCell>
                  {question.gridColumns?.map((col, colIndex) => (
                    <TableCell key={colIndex} className="text-center p-2">
                      <div 
                        className={`h-6 w-6 rounded-full mx-auto cursor-pointer border ${
                          gridSelections[row] === col 
                            ? 'bg-primary border-primary' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleGridCellSelect(row, col)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
      
    case "text":
    default:
      return (
        <Input
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          placeholder="Ditt svar..."
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      );
  }
};
