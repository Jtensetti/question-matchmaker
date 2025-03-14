
import React from "react";
import { Slider } from "@/components/ui/slider";

interface RatingInputProps {
  min: number;
  max: number;
  ratingValue: number;
  setRatingValue: (value: number) => void;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  min,
  max,
  ratingValue,
  setRatingValue
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Your rating (from {min} to {max})
      </label>
      <div className="space-y-4">
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
          Selected value: {ratingValue}
        </div>
      </div>
    </div>
  );
};
