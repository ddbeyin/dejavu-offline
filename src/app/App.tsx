import React, { useState, useEffect, useRef } from 'react';
import { ModuleId, OtherSubModuleId } from '../shared/types';
import { UnicodeInspector } from '../features/other/unicode-inspector/UnicodeInspector';
import { DataImport } from '../features/data-import/DataImport';
import { LogAnalyzer } from '../features/log-analyzer/LogAnalyzer';
import { DataProvider, useData } from '../shared/DataContext';
import { PluginManager } from '../features/log-analyzer/PluginManager';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const localTime = time.toLocaleTimeString([], timeOptions);
  const utcTime = time.toLocaleTimeString([], { ...timeOptions, timeZone: 'UTC' });

  return (
    <span className="whitespace-nowrap">
      LOCAL: {localTime} | UTC: {utcTime}
    </span>
  );
};

const StatusBarContent: React.FC<{ status: string }> = ({ status }) => {
  const { dataset } = useData();

  return (
    <div className="status-bar">
      <p className="status-bar-field">{status}</p>
      <p className="status-bar-field">
        {dataset ? `Dataset: ${dataset.name} (${dataset.rows.length} rows)` : 'No dataset active'}
      </p>
      <p className="status-bar-field" style={{ minWidth: '240px', textAlign: 'center' }}>
        <Clock />
      </p>
    </div>
  );
};

const AboutDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={onClose}>
      <div className="window" style={{ width: '320px', height: 'auto', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div className="title-bar">
          <div className="title-bar-text">About dejavu offline</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 px-2">
             <div className="text-4xl select-none">💻</div>
             <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">dejavu offline</span>
                <span className="text-xs text-gray-600 mt-1">It's not a bug, it's the culture.</span>
             </div>
          </div>
          
          <fieldset className="px-3 py-2">
             <legend>Developer Info</legend>
             <div className="flex flex-col gap-1 text-xs">
                <div className="flex">
                   <span className="w-12 text-gray-500">Name:</span>
                   <span className="font-bold">Murat Can Ertanç</span>
                </div>
                 <div className="flex">
                   <span className="w-12 text-gray-500">Email:</span>
                   <a href="mailto:ddbeyin@gmail.com" className="text-blue-800 underline truncate">ddbeyin@gmail.com</a>
                </div>
                <div className="flex">
                   <span className="w-12 text-gray-500">GitHub:</span>
                   <a href="https://github.com/ddbeyin" target="_blank" rel="noreferrer" className="text-blue-800 underline truncate">
                     @ddbeyin
                   </a>
                </div>
             </div>
          </fieldset>

          <div className="flex justify-center">
            <button onClick={onClose} className="w-20">OK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.DataManager);
  const [activeOtherSubModule, setActiveOtherSubModule] = useState<OtherSubModuleId>(OtherSubModuleId.UnicodeInspector);
  const [status, setStatus] = useState<string>("Ready");
  
  // Menu State
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, menuName: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const renderOtherModule = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#c0c0c0] px-2 pt-2 border-b border-[#808080]">
          <menu role="tablist">
            {Object.values(OtherSubModuleId).map(subId => (
              <li key={subId} role="tab" aria-selected={activeOtherSubModule === subId}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveOtherSubModule(subId); }}>{subId}</a>
              </li>
            ))}
          </menu>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeOtherSubModule === OtherSubModuleId.UnicodeInspector && (
            <UnicodeInspector onStatusUpdate={setStatus} />
          )}
        </div>
      </div>
    );
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case ModuleId.DataManager:
        return <DataImport onStatusUpdate={setStatus} />;
      case ModuleId.LogAnalyzer:
        return <LogAnalyzer onStatusUpdate={setStatus} />;
      case ModuleId.Other:
        return renderOtherModule();
      default:
        return null;
    }
  };

  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">dejavu offline</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close" onClick={() => window.close()}></button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="menu-bar relative">
        <div className={`menu-item ${activeMenu === 'File' ? 'bg-[#000080] text-white' : ''}`} onClick={(e) => handleMenuClick(e, 'File')}>
          File
          {activeMenu === 'File' && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] shadow-md min-w-[150px] z-50 text-black flex flex-col py-1">
              <div className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer">New Window</div>
              <div className="h-[1px] bg-gray-400 my-1 mx-2"></div>
              <div className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => window.close()}>Exit</div>
            </div>
          )}
        </div>
        <div className={`menu-item ${activeMenu === 'Edit' ? 'bg-[#000080] text-white' : ''}`} onClick={(e) => handleMenuClick(e, 'Edit')}>
          Edit
          {activeMenu === 'Edit' && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] shadow-md min-w-[150px] z-50 text-black flex flex-col py-1">
              <div className="px-4 py-1 text-gray-500 cursor-default">Cut</div>
              <div className="px-4 py-1 text-gray-500 cursor-default">Copy</div>
              <div className="px-4 py-1 text-gray-500 cursor-default">Paste</div>
            </div>
          )}
        </div>
        <div className={`menu-item ${activeMenu === 'View' ? 'bg-[#000080] text-white' : ''}`} onClick={(e) => handleMenuClick(e, 'View')}>
          View
          {activeMenu === 'View' && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] shadow-md min-w-[150px] z-50 text-black flex flex-col py-1">
              <div className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setActiveModule(ModuleId.DataManager)}>Data Manager</div>
              <div className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setActiveModule(ModuleId.LogAnalyzer)}>Log Analyzer</div>
            </div>
          )}
        </div>
        <div className={`menu-item ${activeMenu === 'Settings' ? 'bg-[#000080] text-white' : ''}`} onClick={(e) => handleMenuClick(e, 'Settings')}>
          Settings
          {activeMenu === 'Settings' && (
            <div className="absolute top-full left-0 bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] shadow-md min-w-[150px] z-50 text-black flex flex-col py-1">
              <div 
                className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
                onClick={() => setShowPluginManager(true)}
              >
                Plugins...
              </div>
            </div>
          )}
        </div>
        <div className={`menu-item ${activeMenu === 'Help' ? 'bg-[#000080] text-white' : ''}`} onClick={(e) => handleMenuClick(e, 'Help')}>
          Help
          {activeMenu === 'Help' && (
            <div className="absolute top-full right-0 bg-[#c0c0c0] border-2 border-white border-r-[#808080] border-b-[#808080] shadow-md min-w-[150px] z-50 text-black flex flex-col py-1">
              <div className="px-4 py-1 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => setShowAbout(true)}>About</div>
            </div>
          )}
        </div>
      </div>

      <div className="window-body">
        <div className="module-nav">
          <menu role="tablist">
            {[ModuleId.DataManager, ModuleId.LogAnalyzer, ModuleId.Other].map(moduleId => (
              <li key={moduleId} role="tab" aria-selected={activeModule === moduleId}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveModule(moduleId); }}>{moduleId}</a>
              </li>
            ))}
          </menu>
        </div>

        <div className="flex-1 overflow-hidden bg-[#c0c0c0]">
          {renderActiveModule()}
        </div>

        <StatusBarContent status={status} />
      </div>

      {showPluginManager && (
        <PluginManager onClose={() => setShowPluginManager(false)} />
      )}
      
      {showAbout && (
        <AboutDialog onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;