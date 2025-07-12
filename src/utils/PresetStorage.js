/**
 * Enhanced storage system for presets with multiple persistence strategies
 */
export class PresetStorage {
  constructor() {
    this.storageKey = 'particleLifePresets';
    this.metaKey = 'particleLifePresetsMeta';
    this.dbName = 'ParticleLifeDB';
    this.dbVersion = 1;
    this.db = null;
    this.dbReady = this.initIndexedDB();
  }

  async initIndexedDB() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = () => {
          console.error('Failed to open IndexedDB:', request.error);
          resolve(false);
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          console.log('IndexedDB initialized successfully');
          resolve(true);
        };
        
        request.onupgradeneeded = (event) => {
          console.log('IndexedDB upgrade needed');
          const db = event.target.result;
          
          // Create presets store
          if (!db.objectStoreNames.contains('presets')) {
            const presetsStore = db.createObjectStore('presets', { keyPath: 'key' });
            presetsStore.createIndex('name', 'name', { unique: false });
            presetsStore.createIndex('created', 'created', { unique: false });
            presetsStore.createIndex('modified', 'modified', { unique: false });
            console.log('Created presets store');
          }
          
          // Create metadata store
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
            console.log('Created metadata store');
          }
        };
      } catch (error) {
        console.error('IndexedDB initialization failed:', error);
        resolve(false);
      }
    });
  }

  // Save preset to all storage layers
  async savePreset(key, preset) {
    console.log('[PresetStorage] Saving preset:', key, preset);
    const enrichedPreset = {
      ...preset,
      key,
      created: preset.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      version: preset.version || '1.0'
    };
    
    // Save to localStorage (immediate, synchronous)
    this.saveToLocalStorage(key, enrichedPreset);
    
    // Wait for DB to be ready then save to IndexedDB
    await this.dbReady;
    await this.saveToIndexedDB(key, enrichedPreset);
    
    // Update metadata
    await this.updateMetadata();
    
    console.log('[PresetStorage] Preset saved successfully:', key);
    return enrichedPreset;
  }

  // Save to localStorage
  saveToLocalStorage(key, preset) {
    try {
      const allPresets = this.getAllFromLocalStorage();
      allPresets[key] = preset;
      localStorage.setItem(this.storageKey, JSON.stringify(allPresets));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldPresets();
      }
    }
  }

  // Save to IndexedDB
  async saveToIndexedDB(key, preset) {
    if (!this.db) {
      console.warn('[PresetStorage] IndexedDB not initialized');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['presets'], 'readwrite');
        const store = transaction.objectStore('presets');
        const request = store.put(preset);
        
        request.onsuccess = () => {
          console.log('[PresetStorage] Saved to IndexedDB:', key);
          resolve();
        };
        
        request.onerror = () => {
          console.error('[PresetStorage] IndexedDB save error:', request.error);
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          console.log('[PresetStorage] Transaction complete');
        };
        
        transaction.onerror = () => {
          console.error('[PresetStorage] Transaction error:', transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error('[PresetStorage] Failed to save to IndexedDB:', error);
        reject(error);
      }
    });
  }

  // Load preset from storage
  async loadPreset(key) {
    // Try IndexedDB first (most reliable)
    const dbPreset = await this.loadFromIndexedDB(key);
    if (dbPreset) return dbPreset;
    
    // Fallback to localStorage
    const localPreset = this.loadFromLocalStorage(key);
    if (localPreset) {
      // Migrate to IndexedDB
      await this.saveToIndexedDB(key, localPreset);
      return localPreset;
    }
    
    return null;
  }

  // Load from localStorage
  loadFromLocalStorage(key) {
    try {
      const allPresets = this.getAllFromLocalStorage();
      return allPresets[key] || null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  // Load from IndexedDB
  async loadFromIndexedDB(key) {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['presets'], 'readonly');
      const store = transaction.objectStore('presets');
      const request = store.get(key);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      return null;
    }
  }

  // Get all presets
  async getAllPresets() {
    const dbPresets = await this.getAllFromIndexedDB();
    const localPresets = this.getAllFromLocalStorage();
    
    // Merge presets, preferring IndexedDB versions
    const merged = { ...localPresets };
    for (const [key, preset] of Object.entries(dbPresets)) {
      merged[key] = preset;
    }
    
    return merged;
  }

  // Get all from localStorage
  getAllFromLocalStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse localStorage:', error);
      return {};
    }
  }

  // Get all from IndexedDB
  async getAllFromIndexedDB() {
    if (!this.db) return {};
    
    try {
      const transaction = this.db.transaction(['presets'], 'readonly');
      const store = transaction.objectStore('presets');
      const request = store.getAll();
      
      const presets = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      // Convert array to object
      const result = {};
      for (const preset of presets) {
        result[preset.key] = preset;
      }
      return result;
    } catch (error) {
      console.error('Failed to load all from IndexedDB:', error);
      return {};
    }
  }

  // Delete preset
  async deletePreset(key) {
    // Delete from localStorage
    const allPresets = this.getAllFromLocalStorage();
    delete allPresets[key];
    localStorage.setItem(this.storageKey, JSON.stringify(allPresets));
    
    // Delete from IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['presets'], 'readwrite');
        const store = transaction.objectStore('presets');
        await store.delete(key);
      } catch (error) {
        console.error('Failed to delete from IndexedDB:', error);
      }
    }
    
    await this.updateMetadata();
  }

  // Export single preset
  exportPreset(preset) {
    const dataStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Export all presets
  async exportAllPresets() {
    const allPresets = await this.getAllPresets();
    const exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      presets: allPresets
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `particle_life_presets_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Import presets
  async importPresets(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // Handle single preset
      if (data.name && data.species) {
        const key = this.generateUniqueKey(data.name);
        await this.savePreset(key, data);
        return { imported: 1, keys: [key] };
      }
      
      // Handle multiple presets
      if (data.presets) {
        const keys = [];
        for (const [key, preset] of Object.entries(data.presets)) {
          const newKey = this.generateUniqueKey(preset.name || key);
          await this.savePreset(newKey, preset);
          keys.push(newKey);
        }
        return { imported: keys.length, keys };
      }
      
      throw new Error('Invalid preset format');
    } catch (error) {
      throw new Error('Failed to import presets: ' + error.message);
    }
  }

  // Generate unique key
  generateUniqueKey(baseName) {
    const baseKey = baseName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let key = baseKey;
    let counter = 1;
    
    const allPresets = this.getAllFromLocalStorage();
    while (allPresets[key]) {
      key = `${baseKey}_${counter}`;
      counter++;
    }
    
    return key;
  }

  // Update metadata
  async updateMetadata() {
    const meta = {
      key: 'main',
      lastModified: new Date().toISOString(),
      presetCount: Object.keys(await this.getAllPresets()).length
    };
    
    localStorage.setItem(this.metaKey, JSON.stringify(meta));
    
    if (this.db) {
      try {
        const transaction = this.db.transaction(['metadata'], 'readwrite');
        const store = transaction.objectStore('metadata');
        await store.put(meta);
      } catch (error) {
        console.error('Failed to update metadata:', error);
      }
    }
  }

  // Cleanup old presets (when storage is full)
  cleanupOldPresets() {
    const allPresets = this.getAllFromLocalStorage();
    const sortedKeys = Object.keys(allPresets).sort((a, b) => {
      const dateA = new Date(allPresets[a].modified || 0);
      const dateB = new Date(allPresets[b].modified || 0);
      return dateA - dateB;
    });
    
    // Remove oldest 25% of custom presets
    const toRemove = Math.floor(sortedKeys.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const key = sortedKeys[i];
      if (!['predatorPrey', 'crystallization', 'vortex', 'symbiosis'].includes(key)) {
        delete allPresets[key];
      }
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(allPresets));
  }

  // Check storage health
  async checkStorageHealth() {
    const health = {
      localStorage: false,
      indexedDB: false,
      totalPresets: 0,
      storageUsed: 0
    };
    
    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      health.localStorage = true;
      
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        health.storageUsed = new Blob([stored]).size;
      }
    } catch (e) {
      console.error('localStorage not available:', e);
    }
    
    // Check IndexedDB
    health.indexedDB = !!this.db;
    
    // Count presets
    const allPresets = await this.getAllPresets();
    health.totalPresets = Object.keys(allPresets).length;
    
    return health;
  }
}