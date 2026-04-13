import { ModuleDefinition, ModuleContext, ModuleResult, Dataset } from '../../shared/types';
import { BUILT_IN_MODULES } from './builtInModules';

const STORAGE_KEY = 'dejavu_plugins_v1';

interface PersistedPlugin {
  id: string;
  sourceCode: string;
  nameOverride?: string;
}

class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();
  private listeners: (() => void)[] = [];

  constructor() {
    // Register built-ins on init
    BUILT_IN_MODULES.forEach(mod => this.register(mod));
    // Load persisted plugins
    this.restoreFromStorage();
  }

  register(module: ModuleDefinition) {
    this.modules.set(module.id, module);
    this.notify();
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  deleteModule(id: string) {
    if (this.modules.has(id)) {
      this.modules.delete(id);
      this.saveToStorage();
      this.notify();
    }
  }

  updateModule(id: string, updates: Partial<ModuleDefinition>) {
    const mod = this.modules.get(id);
    if (mod) {
      Object.assign(mod, updates);
      this.saveToStorage();
      this.notify();
    }
  }

  // Parses a raw JS string expecting an Object or Function that returns a ModuleDefinition.
  async loadFromSource(sourceCode: string, isRestoring = false): Promise<ModuleDefinition> {
    try {
      const loader = new Function(sourceCode);
      const moduleDef = loader();

      if (!moduleDef || !moduleDef.id || !moduleDef.run) {
        throw new Error("Invalid module structure. Code must return an object with id and run().");
      }

      moduleDef.category = 'Custom';
      moduleDef.isCustom = true;
      moduleDef.sourceCode = sourceCode;
      
      this.register(moduleDef);
      
      if (!isRestoring) {
        this.saveToStorage();
      }
      
      return moduleDef;
    } catch (e: any) {
      throw new Error(`Failed to load module: ${e.message}`);
    }
  }

  async runModule(
    moduleId: string, 
    dataset: Dataset, 
    params: Record<string, any>
  ): Promise<ModuleResult> {
    const mod = this.get(moduleId);
    if (!mod) throw new Error(`Module ${moduleId} not found`);

    const logs: string[] = [];
    const context: ModuleContext = {
      dataset,
      log: (msg) => logs.push(msg)
    };

    try {
      const result = await mod.run(context, params);
      return {
        ...result,
        logs: [...logs, ...(result.logs || [])]
      };
    } catch (e: any) {
      console.error(e);
      return {
        sections: [
          {
            type: 'text',
            title: 'Critical Failure',
            data: `Module crashed: ${e.message}`
          }
        ],
        logs
      };
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Persistence ---

  private saveToStorage() {
    const customModules: PersistedPlugin[] = [];
    this.modules.forEach(mod => {
      if (mod.isCustom && mod.sourceCode) {
        customModules.push({
          id: mod.id,
          sourceCode: mod.sourceCode,
          nameOverride: mod.name // Store current name in case it was edited
        });
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customModules));
  }

  private restoreFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const items: PersistedPlugin[] = JSON.parse(raw);
      
      items.forEach(async (item) => {
        try {
          const mod = await this.loadFromSource(item.sourceCode, true);
          // Apply name override if it exists
          if (item.nameOverride) {
            mod.name = item.nameOverride;
          }
        } catch (e) {
          console.error(`Failed to restore plugin ${item.id}`, e);
        }
      });
    } catch (e) {
      console.error("Error restoring plugins", e);
    }
  }
}

export const registry = new ModuleRegistry();