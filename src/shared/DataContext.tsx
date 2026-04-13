import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dataset, LogRow } from './types';

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

    // Parse raw headers
    const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    
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
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
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
