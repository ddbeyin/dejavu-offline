import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dataset, LogRow } from './types';
import { parseCsvLine } from './utils';

interface DataContextType {
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;
  loadFromText: (text: string, name: string, delimiter: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<Dataset | null>(null);

  const loadFromText = (text: string, name: string, delimiter: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 1) return;

    // Parse raw headers (quote-aware so a comma inside a quoted header does
    // not split it -- though headers themselves rarely need quoting).
    const rawHeaders = parseCsvLine(lines[0], delimiter).map(h => h.trim());
    
    // Deduplicate headers to ensure uniqueness.
    // Duplicate headers may cause data overwrites in the row object and React key collisions in the UI.
    const headers: string[] = [];
    const seenHeaders = new Set<string>();

    rawHeaders.forEach((h, i) => {
      let headerName = h || `Column ${i + 1}`; // Fallback for empty headers
      let counter = 1;
      const baseName = headerName;

      while (seenHeaders.has(headerName)) {
        headerName = `${baseName} (${counter})`;
        counter++;
      }
      
      seenHeaders.add(headerName);
      headers.push(headerName);
    });

    const rows: LogRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      // Quote-aware split: a comma inside a quoted field (e.g. `"iPhone14,3"`
      // in model_name) must not shift every subsequent column by one.
      const values = parseCsvLine(lines[i], delimiter).map(v => v.trim());
      const row: LogRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    setDataset({
      headers,
      rows,
      name,
      sourceType: delimiter === '\t' ? 'TSV' : 'CSV',
      timestamp: Date.now()
    });
  };

  return (
    <DataContext.Provider value={{ dataset, setDataset, loadFromText }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
