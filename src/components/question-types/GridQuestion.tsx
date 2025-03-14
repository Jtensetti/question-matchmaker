
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question, GridAnswer } from "@/types/question";

interface GridQuestionProps {
  question: Question;
  value: GridAnswer;
  onChange: (value: GridAnswer) => void;
  disabled?: boolean;
}

export const GridQuestion: React.FC<GridQuestionProps> = ({ 
  question, 
  value, 
  onChange, 
  disabled = false 
}) => {
  const rows = question.gridRows || [];
  const columns = question.gridColumns || [];
  
  // Ensure we have a valid GridAnswer object
  const selectedCell = value || { row: "", column: "" };
  
  const handleRowChange = (row: string) => {
    const newSelection = { ...selectedCell, row };
    onChange(newSelection);
  };
  
  const handleColumnChange = (column: string) => {
    const newSelection = { ...selectedCell, column };
    onChange(newSelection);
  };
  
  // Function to handle direct cell selection from the grid
  const handleCellClick = (row: string, column: string) => {
    if (disabled) return;
    
    const newSelection = { row, column };
    onChange(newSelection);
  };
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-1">
        Select grid cell
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Row</label>
          <Select 
            value={selectedCell.row} 
            onValueChange={handleRowChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select row" />
            </SelectTrigger>
            <SelectContent>
              {rows.map((row, index) => (
                <SelectItem key={index} value={row}>
                  {row}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Column</label>
          <Select 
            value={selectedCell.column} 
            onValueChange={handleColumnChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column, index) => (
                <SelectItem key={index} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {rows.length > 0 && columns.length > 0 && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2 bg-muted text-left">&nbsp;</th>
                {columns.map((column, i) => (
                  <th key={i} className="p-2 bg-muted text-center">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 ? "bg-muted/20" : ""}>
                  <td className="p-2 font-medium">{row}</td>
                  {columns.map((column, j) => (
                    <td 
                      key={j} 
                      className="p-2 text-center"
                      onClick={() => handleCellClick(row, column)}
                    >
                      <div 
                        className={`w-4 h-4 mx-auto rounded-full cursor-pointer ${
                          selectedCell.row === row && selectedCell.column === column
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
