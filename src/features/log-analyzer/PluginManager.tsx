import React, { useState, useEffect } from 'react';
import { registry } from './ModuleRegistry';
import { ModuleDefinition } from '../../shared/types';

interface PluginManagerProps {
  onClose: () => void;
}

export const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const [modules, setModules] = useState<ModuleDefinition[]>(registry.getAll());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    return registry.subscribe(() => setModules(registry.getAll()));
  }, []);

  useEffect(() => {
    if (selectedId) {
      const mod = modules.find(m => m.id === selectedId);
      if (mod) setEditName(mod.name);
    }
  }, [selectedId, modules]);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const confirmMsg = `SECURITY WARNING:\n\nYou are about to import a code module: "${file.name}".\n\nThis code will run with full permissions in your browser session.\n\nOnly import modules from trusted sources.`;
      if (!window.confirm(confirmMsg)) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const code = ev.target?.result as string;
          await registry.loadFromSource(code);
          alert(`Successfully imported ${file.name}`);
        } catch (err: any) {
          alert(`Error loading module: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (window.confirm("Are you sure you want to delete this plugin? This cannot be undone.")) {
      registry.deleteModule(selectedId);
      setSelectedId(null);
    }
  };

  const handleSaveRename = () => {
    if (!selectedId) return;
    registry.updateModule(selectedId, { name: editName });
    setIsEditing(false);
  };

  const customModules = modules.filter(m => m.isCustom);
  const selectedModule = modules.find(m => m.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
      <div className="window" style={{ width: '500px', height: '400px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
        <div className="title-bar">
          <div className="title-bar-text">Plugin Manager</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body p-4 flex flex-col gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-sm">Manage your installed analysis modules.</p>
            
            <div className="flex-1 bg-white border-inset overflow-auto">
              <table className="win98 w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {customModules.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center italic text-gray-500 p-4">
                        No custom plugins installed.
                      </td>
                    </tr>
                  ) : (
                    customModules.map(m => (
                      <tr 
                        key={m.id} 
                        className={selectedId === m.id ? 'bg-[#000080] text-white' : ''}
                        onClick={() => { setSelectedId(m.id); setIsEditing(false); }}
                      >
                        <td>{m.name}</td>
                        <td className="font-mono text-[10px]">{m.id}</td>
                        <td>{m.version}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Plugin Details / Edit Area */}
            <fieldset disabled={!selectedId} className="h-24">
              <legend>Plugin Details</legend>
              {selectedModule ? (
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex gap-2 items-center">
                    <label className="w-16">Name:</label>
                    {isEditing ? (
                      <div className="flex gap-1 flex-1">
                        <input 
                          type="text" 
                          className="flex-1"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                        <button onClick={handleSaveRename}>Save</button>
                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 flex-1">
                        <input type="text" readOnly className="flex-1 bg-gray-100" value={selectedModule.name} />
                        <button onClick={() => setIsEditing(true)}>Rename</button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="w-16">Desc:</label>
                    <span className="truncate flex-1">{selectedModule.description}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic text-xs">Select a plugin to view details.</div>
              )}
            </fieldset>
          </div>

          <div className="flex justify-between mt-2">
            <div className="flex gap-2">
              <button onClick={handleImport} className="font-bold">Import</button>
              <button onClick={handleDelete} disabled={!selectedId}>Remove</button>
            </div>
            <button onClick={onClose} className="w-20">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};
