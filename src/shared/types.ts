export interface GraphemeData {
  text: string;
  codePoints: CodePointDetail[];
  index: number;
}

export interface CodePointDetail {
  value: number;
  hex: string;
  char: string;
  name: string;
  block: string;
  script: string;
  category: string;
  bidiClass: string;
  isInvisible: boolean;
}

export enum TabId {
  Overview = 'Overview',
  CodePoints = 'CodePoints',
  Properties = 'Properties',
  Encodings = 'Encodings',
  Normalize = 'Normalize',
  Security = 'Security'
}

export enum ModuleId {
  DataManager = 'Data Manager',
  LogAnalyzer = 'Log Analyzer',
  Other = 'Other'
}

export enum OtherSubModuleId {
  UnicodeInspector = 'Unicode Inspector'
}

export interface LogRow {
  [key: string]: string;
}

export interface Dataset {
  headers: string[];
  rows: LogRow[];
  name: string;
  sourceType: 'CSV' | 'TSV' | 'Clipboard';
  timestamp: number;
}

// --- Analysis Module Architecture ---

export type ModuleParameterType = 'string' | 'number' | 'boolean' | 'columnSelect' | 'select';

export interface ModuleParameterOption {
  value: string;
  label: string;
}

export interface ModuleParameter {
  name: string;
  label: string;
  type: ModuleParameterType;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  // For type='select': the available options. Ignored for other types.
  options?: ModuleParameterOption[];
}

export interface ModuleContext {
  dataset: Dataset;
  log: (message: string) => void;
}

// Structured Result Types
export type ResultSectionType = 'summary' | 'table' | 'text' | 'markdown';

export interface ResultSection {
  type: ResultSectionType;
  title: string;
  data: any; // key-value object for summary, array of objects for table, string for text
}

export interface ModuleResult {
  sections: ResultSection[];
  logs?: string[];
}

export interface ModuleDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'Built-in' | 'Custom';
  parameters?: ModuleParameter[];
  // The run function returns a Promise to allow for async operations
  run: (context: ModuleContext, params: Record<string, any>) => Promise<ModuleResult>;
  
  // Persistence fields
  sourceCode?: string; // The raw JS code for custom modules
  isCustom?: boolean;
}

// Deprecated types (safe to keep for now)
export type FindingLevel = 'info' | 'warning' | 'critical';
export interface AnalysisFinding {
  level: FindingLevel;
  message: string;
  rowId?: number;
  column?: string;
  suggestion?: string;
}