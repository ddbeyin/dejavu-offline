import React, { useState } from 'react';
import { useData } from '../../shared/DataContext';
import { DataTable } from '../../shared/DataTable';
import { detectDelimiter } from '../../shared/utils';

export const DataImport: React.FC<{ onStatusUpdate: (s: string) => void }> = ({ onStatusUpdate }) => {
  const { dataset, setDataset, loadFromText } = useData();
  const [pasteBuffer, setPasteBuffer] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const delimiter = detectDelimiter(text, file.name);
      loadFromText(text, file.name, delimiter);
      onStatusUpdate(`Imported ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!pasteBuffer.trim()) return;
    const delimiter = detectDelimiter(pasteBuffer);
    loadFromText(pasteBuffer, "Pasted Data", delimiter);
    setPasteBuffer("");
    onStatusUpdate("Data loaded from clipboard");
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full overflow-hidden">
      <div className="grid grid-cols-2 gap-4">
        <fieldset>
          <legend>File Import</legend>
          <div className="flex flex-col gap-2">
            <p className="text-xs">Select a .csv or .tsv log file from your local machine.</p>
            <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} />
          </div>
        </fieldset>

        <fieldset>
          <legend>Clipboard Import</legend>
          <div className="flex flex-col gap-2">
            <textarea 
              rows={3} 
              placeholder="Paste TSV/CSV data here..." 
              value={pasteBuffer}
              onChange={(e) => setPasteBuffer(e.target.value)}
              className="text-xs font-mono"
            />
            <button onClick={handlePaste} disabled={!pasteBuffer.trim()}>Import Paste</button>
          </div>
        </fieldset>
      </div>

      <fieldset className="flex-1 flex flex-col overflow-hidden min-w-0">
        <legend>Current Dataset: {dataset?.name || "None"}</legend>
        {!dataset ? (
          <div className="flex-1 flex items-center justify-center italic text-gray-500 text-center leading-tight">
            No data loaded. The console blinks patiently.
            <br />
            For now, you hear only the hum of idle machinery, waiting for instructions.
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex justify-between items-center text-xs">
              <span>Rows: {dataset.rows.length} | Columns: {dataset.headers.length}</span>
              <button onClick={() => setDataset(null)}>Clear Dataset</button>
            </div>
            <DataTable headers={dataset.headers} rows={dataset.rows} maxDisplay={100} />
          </div>
        )}
      </fieldset>
    </div>
  );
};