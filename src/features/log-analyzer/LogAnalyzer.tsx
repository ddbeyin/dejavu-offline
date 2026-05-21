import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../shared/DataContext';
import { DataTable } from '../../shared/DataTable';
import { registry } from './ModuleRegistry';
import { ModuleDefinition, ModuleResult, ResultSection } from '../../shared/types';

// --- Subcomponents for Results Rendering ---

const SummarySection: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <div className="grid grid-cols-2 gap-2 bg-white p-2 border-inset text-xs">
    {Object.entries(data).map(([k, v]) => (
      <div key={k} className="flex justify-between border-b border-gray-200">
        <span className="font-bold text-gray-700">{k}:</span>
        <span className="font-mono">{String(v)}</span>
      </div>
    ))}
  </div>
);

const ResultTableSection: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div>No data</div>;
  const headers = Object.keys(data[0]);
  return (
    <div className="max-h-60 overflow-auto border-inset">
      <table className="win98 w-full">
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map(h => <td key={h}>{String(row[h])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ResultRenderer: React.FC<{ result: ModuleResult | null }> = ({ result }) => {
  if (!result) return <div className="p-4 italic text-gray-500">Run a module to see results here.</div>;

  return (
    <div className="flex flex-col gap-4 p-2">
      {result.sections.map((section, idx) => (
        <fieldset key={idx}>
          <legend>{section.title} ({section.type})</legend>
          {section.type === 'summary' && <SummarySection data={section.data} />}
          {section.type === 'table' && <ResultTableSection data={section.data} />}
          {section.type === 'text' && <pre className="bg-white p-2 border-inset overflow-auto text-xs">{section.data}</pre>}
          {section.type === 'markdown' && <div className="bg-white p-2 border-inset text-xs">{section.data}</div>}
        </fieldset>
      ))}
      {result.logs && result.logs.length > 0 && (
        <fieldset>
          <legend>Execution Log</legend>
          <div className="h-24 overflow-auto bg-black text-green-400 font-mono text-[10px] p-2">
            {result.logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </fieldset>
      )}
    </div>
  );
};

// --- Main Workbench Component ---

export const LogAnalyzer: React.FC<{ onStatusUpdate: (s: string) => void }> = ({ onStatusUpdate }) => {
  const { dataset } = useData();
  const [modules, setModules] = useState<ModuleDefinition[]>(registry.getAll());
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ModuleResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Subscribe to registry changes
  useEffect(() => {
    return registry.subscribe(() => setModules(registry.getAll()));
  }, []);

  // Reset state when module selection changes, applying any defaultValue
  // declared by the module's parameters so 'select' dropdowns start on a
  // sensible value instead of blank.
  useEffect(() => {
    const mod = modules.find(m => m.id === selectedModuleId);
    const initial: Record<string, any> = {};
    if (mod?.parameters) {
      for (const p of mod.parameters) {
        if (p.defaultValue !== undefined) initial[p.name] = p.defaultValue;
      }
    }
    setParams(initial);
    setResult(null);
  }, [selectedModuleId, modules]);

  const handleRun = async () => {
    if (!selectedModuleId || !dataset) return;
    
    // Validate required params
    const mod = modules.find(m => m.id === selectedModuleId);
    if (mod?.parameters) {
      for (const p of mod.parameters) {
        if (p.required && (params[p.name] === undefined || params[p.name] === '')) {
          alert(`Parameter "${p.label}" is required.`);
          return;
        }
      }
    }

    setIsRunning(true);
    onStatusUpdate(`Running ${mod?.name}...`);
    try {
      const res = await registry.runModule(selectedModuleId, dataset, params);
      setResult(res);
      onStatusUpdate("Analysis complete.");
    } catch (e: any) {
      alert("Error running module: " + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  if (!dataset) {
    return (
      <div className="placeholder-panel">
        <div className="placeholder-card">
          <h3 className="font-bold">Workbench Empty</h3>
          <p className="text-sm mt-2">Import data via Data Manager to start analyzing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-2 p-2 overflow-hidden">
      {/* LEFT: Dataset Overview */}
      <div className="w-48 shrink-0 flex flex-col gap-2">
        <fieldset className="flex-1 flex flex-col overflow-hidden bg-[#c0c0c0] min-w-0">
          <legend>Dataset</legend>
          <div className="text-xs mb-2">
            <div><strong>Name:</strong> {dataset.name}</div>
            <div><strong>Rows:</strong> {dataset.rows.length}</div>
            <div><strong>Cols:</strong> {dataset.headers.length}</div>
          </div>
          <div className="flex-1 overflow-hidden bg-white border-inset">
            <DataTable headers={dataset.headers} rows={dataset.rows} maxDisplay={50} />
          </div>
        </fieldset>
      </div>

      {/* MIDDLE: Module Browser */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <fieldset className="flex-1 flex flex-col overflow-hidden min-w-0">
          <legend>Module Browser</legend>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">{modules.length} modules</span>
            <div className="text-[10px] italic text-gray-500">Manage via Settings</div>
          </div>
          <div className="tree-view flex-1 bg-white">
            {modules.map(mod => (
              <div 
                key={mod.id}
                className={`tree-item ${selectedModuleId === mod.id ? 'selected' : ''}`}
                onClick={() => setSelectedModuleId(mod.id)}
              >
                <span className={mod.category === 'Custom' ? 'text-blue-800 font-bold' : ''}>
                  {mod.name}
                </span>
              </div>
            ))}
          </div>
          {selectedModule && (
            <div className="mt-2 p-2 border-inset bg-gray-50 text-xs">
              <p className="font-bold">{selectedModule.name} <span className="font-normal text-gray-500">v{selectedModule.version}</span></p>
              <p className="mt-1">{selectedModule.description}</p>
            </div>
          )}
        </fieldset>
      </div>

      {/* RIGHT: Workbench (Params & Results) */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">
        <fieldset className="flex-none min-w-0">
          <legend>Configuration</legend>
          {!selectedModule ? (
            <div className="text-gray-500 text-xs italic">Select a module...</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-4">
                {selectedModule.parameters?.map(p => (
                  <div key={p.name} className="field-row-stacked">
                    <label>{p.label}: {p.required && '*'}</label>
                    {p.type === 'columnSelect' ? (
                      <select
                        value={params[p.name] || ''}
                        onChange={e => setParams({...params, [p.name]: e.target.value})}
                      >
                        <option value="">-- Select Column --</option>
                        {dataset.headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    ) : p.type === 'select' ? (
                      <select
                        value={params[p.name] ?? p.defaultValue ?? ''}
                        onChange={e => setParams({...params, [p.name]: e.target.value})}
                      >
                        {p.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <input
                        type={p.type === 'number' ? 'number' : 'text'}
                        value={params[p.name] || ''}
                        onChange={e => setParams({...params, [p.name]: e.target.value})}
                      />
                    )}
                    {p.description && <span className="text-[10px] text-gray-500">{p.description}</span>}
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button 
                  className="font-bold px-4 py-1"
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  {isRunning ? 'Running...' : 'Run Module'}
                </button>
              </div>
            </div>
          )}
        </fieldset>

        <div className="flex-1 overflow-auto border-inset bg-[#d4d4d4]">
          <ResultRenderer result={result} />
        </div>
      </div>
    </div>
  );
};