
export const gridSelectionsToString = (gridSelections: Record<string, string>): string => {
  return Object.entries(gridSelections)
    .map(([row, col]) => `${row}:${col}`)
    .join(',');
};
