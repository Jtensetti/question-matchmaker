
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MultipleChoiceInputProps {
  options: string[];
  selectedOption: string;
  setSelectedOption: (option: string) => void;
}

export const MultipleChoiceInput: React.FC<MultipleChoiceInputProps> = ({
  options,
  selectedOption,
  setSelectedOption
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Choose an answer
      </label>
      <RadioGroup 
        value={selectedOption} 
        onValueChange={setSelectedOption}
        className="space-y-2"
      >
        {options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
