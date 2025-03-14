
import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { gridSelectionsToString } from "@/components/question-card/gridUtils";

interface GridInputProps {
  gridRows: string[];
  gridColumns: string[];
  gridSelections: Record<string, string>;
  handleGridCellSelect: (row: string, col: string) => void;
}

export const GridInput: React.FC<GridInputProps> = ({
  gridRows,
  gridColumns,
  gridSelections,
  handleGridCellSelect
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Match items by selecting cells in the grid
      </label>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]"></TableHead>
              {gridColumns.map((col, colIndex) => (
                <TableHead key={colIndex} className="text-center">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {gridRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell className="font-medium">{row}</TableCell>
                {gridColumns?.map((col, colIndex) => (
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
      <div className="mt-2 text-sm text-muted-foreground">
        Your selections: {Object.entries(gridSelections).length > 0 ? 
          Object.entries(gridSelections)
            .map(([row, col]) => `${row} → ${col}`)
            .join(', ') : 
          "None"}
      </div>
    </div>
  );
};
