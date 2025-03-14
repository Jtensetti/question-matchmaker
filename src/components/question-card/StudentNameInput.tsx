
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StudentNameInputProps {
  studentName: string;
  setStudentName: (name: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const StudentNameInput: React.FC<StudentNameInputProps> = ({
  studentName,
  setStudentName,
  onCancel,
  onSave
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="studentName" className="text-sm font-medium">
        Ditt namn
      </label>
      <Input
        id="studentName"
        value={studentName}
        onChange={e => setStudentName(e.target.value)}
        placeholder="Ange ditt namn"
        className="mt-1"
      />
      <div className="flex space-x-2 mt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onCancel}
        >
          Avbryt
        </Button>
        <Button 
          size="sm"
          onClick={onSave}
        >
          Fortsätt
        </Button>
      </div>
    </div>
  );
};
