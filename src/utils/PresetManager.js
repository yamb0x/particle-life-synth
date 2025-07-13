import { PresetStorage } from './PresetStorage.js';

export class PresetManager {
  constructor() {
    this.presets = new Map();
    this.storage = new PresetStorage();
    this.loadBuiltInPresets();
    this.initializeAsync();
  }
  
  async initializeAsync() {
    // Load custom presets from storage
    await this.loadFromStorage();
  }

  loadBuiltInPresets() {
    this.presets.set('predatorPrey', {
      name: 'Predator-Prey',
      version: '1.0',
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.2, y: 0.2 }, radius: 0.1 } },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.8, y: 0.2 }, radius: 0.1 } },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.5, y: 0.8 }, radius: 0.1 } },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.2, y: 0.8 }, radius: 0.1 } },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.8, y: 0.8 }, radius: 0.1 } }
        ]
      },
      physics: {
        friction: 0.05,
        wallDamping: 0.9,
        forceFactor: 0.5,
        collisionRadius: 15,
        socialRadius: 50
      },
      visual: {
        blur: 0.97,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      forces: {
        collision: Array(5).fill().map(() => Array(5).fill(-1)),
        social: [
          [0, 0.5, -0.3, 0.2, -0.1],
          [-0.5, 0, 0.3, -0.2, 0.1],
          [0.3, -0.3, 0, 0.5, -0.2],
          [-0.2, 0.2, -0.5, 0, 0.3],
          [0.1, -0.1, 0.2, -0.3, 0]
        ]
      }
    });

    this.presets.set('crystallization', {
      name: 'Crystallization',
      version: '1.0',
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.3 } },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.25 } },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.2 } },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.15 } },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.1 } }
        ]
      },
      physics: {
        friction: 0.1,
        wallDamping: 0.95,
        forceFactor: 0.3,
        collisionRadius: 15,
        socialRadius: 80
      },
      visual: {
        blur: 0.95,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      forces: {
        collision: Array(5).fill().map(() => Array(5).fill(-1)),
        social: [
          [0.5, 0.2, 0.2, 0.2, 0.2],
          [0.2, 0.5, 0.2, 0.2, 0.2],
          [0.2, 0.2, 0.5, 0.2, 0.2],
          [0.2, 0.2, 0.2, 0.5, 0.2],
          [0.2, 0.2, 0.2, 0.2, 0.5]
        ]
      }
    });

    this.presets.set('vortex', {
      name: 'Vortex',
      version: '1.0',
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 } },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 } },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 } },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 } },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 } }
        ]
      },
      physics: {
        friction: 0.02,
        wallDamping: 0.85,
        forceFactor: 0.6,
        collisionRadius: 15,
        socialRadius: 60
      },
      visual: {
        blur: 0.98,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      forces: {
        collision: Array(5).fill().map(() => Array(5).fill(-1)),
        social: [
          [0, 0.3, -0.2, -0.3, 0.2],
          [-0.3, 0, 0.3, -0.2, -0.3],
          [0.2, -0.3, 0, 0.3, -0.2],
          [0.3, 0.2, -0.3, 0, 0.3],
          [-0.2, 0.3, 0.2, -0.3, 0]
        ]
      }
    });

    this.presets.set('symbiosis', {
      name: 'Symbiosis',
      version: '1.0',
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 } },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 } },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 } },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 } },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 } }
        ]
      },
      physics: {
        friction: 0.05,
        wallDamping: 0.9,
        forceFactor: 0.4,
        collisionRadius: 15,
        socialRadius: 70
      },
      visual: {
        blur: 0.96,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      forces: {
        collision: Array(5).fill().map(() => Array(5).fill(-1)),
        social: [
          [0.3, 0.4, -0.1, -0.2, 0.1],
          [0.4, 0.3, 0.2, -0.1, -0.2],
          [-0.1, 0.2, 0.3, 0.4, -0.3],
          [-0.2, -0.1, 0.4, 0.3, 0.2],
          [0.1, -0.2, -0.3, 0.2, 0.3]
        ]
      }
    });

    // Dreamtime preset with ethereal glow effect
    this.presets.set('dreamtime', {
      name: 'Dreamtime',
      description: 'Ethereal particles with glowing auras in a dream-like dance',
      renderMode: 'dreamtime',
      glowIntensity: 0.8,
      glowRadius: 3.0,
      species: {
        count: 4,
        definitions: [
          { id: 0, name: 'Cyan', color: { r: 100, g: 255, b: 255 }, size: 4, opacity: 0.8, particleCount: 80, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.3 } },
          { id: 1, name: 'Magenta', color: { r: 255, g: 100, b: 255 }, size: 3.5, opacity: 0.8, particleCount: 80, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.2 } },
          { id: 2, name: 'Gold', color: { r: 255, g: 215, b: 100 }, size: 4.5, opacity: 0.7, particleCount: 60, startPosition: { type: 'cluster', center: { x: 0.5, y: 0.5 }, radius: 0.15 } },
          { id: 3, name: 'Violet', color: { r: 150, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 } }
        ]
      },
      physics: {
        friction: 0.02,
        wallDamping: 0.95,
        forceFactor: 0.4,
        collisionRadius: 20,
        socialRadius: 80
      },
      visual: {
        blur: 0.98,
        particleSize: 4,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      forces: {
        collision: Array(4).fill().map(() => Array(4).fill(-0.5)),
        social: [
          [0.0, 0.2, -0.3, 0.1],
          [0.2, 0.0, 0.1, -0.2],
          [-0.3, 0.1, 0.0, 0.3],
          [0.1, -0.2, 0.3, 0.0]
        ]
      }
    });
  }

  getPreset(name) {
    return this.presets.get(name);
  }

  getAllPresets() {
    return Array.from(this.presets.entries()).map(([key, preset]) => ({
      key,
      name: preset.name
    }));
  }

  async savePreset(key, preset) {
    this.presets.set(key, preset);
    await this.storage.savePreset(key, preset);
    this.saveToLocalStorage(); // Keep for backward compatibility
  }

  async deletePreset(key) {
    // Allow deletion of all presets (including built-in)
    this.presets.delete(key);
    await this.storage.deletePreset(key);
    this.saveToLocalStorage(); // Keep for backward compatibility
  }

  exportPreset(key) {
    const preset = this.presets.get(key);
    if (!preset) throw new Error('Preset not found');
    return JSON.stringify(preset, null, 2);
  }

  importPreset(jsonString) {
    try {
      const preset = JSON.parse(jsonString);
      this.validatePreset(preset);
      const key = this.generateUniqueKey(preset.name);
      this.savePreset(key, preset);
      return key;
    } catch (error) {
      throw new Error('Invalid preset format: ' + error.message);
    }
  }

  validatePreset(preset) {
    if (!preset.name || !preset.version) {
      throw new Error('Preset must have name and version');
    }
    if (!preset.species || !preset.species.count || !preset.species.definitions) {
      throw new Error('Invalid species configuration');
    }
    if (!preset.physics || !preset.visual || !preset.forces) {
      throw new Error('Missing required configuration sections');
    }
    if (preset.species.definitions.length !== preset.species.count) {
      throw new Error('Species count mismatch');
    }
  }

  generateUniqueKey(baseName) {
    let key = baseName.toLowerCase().replace(/\s+/g, '_');
    let counter = 1;
    while (this.presets.has(key)) {
      key = `${baseName.toLowerCase().replace(/\s+/g, '_')}_${counter}`;
      counter++;
    }
    return key;
  }

  saveToLocalStorage() {
    const customPresets = {};
    for (const [key, preset] of this.presets.entries()) {
      if (!['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'].includes(key)) {
        customPresets[key] = preset;
      }
    }
    localStorage.setItem('particleLifePresets', JSON.stringify(customPresets));
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('particleLifePresets');
      if (stored) {
        const customPresets = JSON.parse(stored);
        for (const [key, preset] of Object.entries(customPresets)) {
          this.presets.set(key, preset);
        }
      }
    } catch (error) {
      console.error('Failed to load presets from localStorage:', error);
    }
  }
  
  async loadFromStorage() {
    try {
      const allPresets = await this.storage.getAllPresets();
      for (const [key, preset] of Object.entries(allPresets)) {
        if (!['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'].includes(key)) {
          this.presets.set(key, preset);
        }
      }
    } catch (error) {
      console.error('Failed to load presets from storage:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
    }
  }

  createDefaultPreset() {
    return {
      name: 'New Preset',
      version: '1.0',
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.2, y: 0.2 }, radius: 0.1 } },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.8, y: 0.2 }, radius: 0.1 } },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.5, y: 0.8 }, radius: 0.1 } },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.2, y: 0.8 }, radius: 0.1 } },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.8, y: 0.8 }, radius: 0.1 } }
        ]
      },
      physics: {
        friction: 0.05,
        wallDamping: 0.9,
        forceFactor: 0.5,
        collisionRadius: 15,
        socialRadius: 50
      },
      visual: {
        blur: 0.97,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      forces: {
        collision: Array(5).fill().map(() => Array(5).fill(-1)),
        social: Array(5).fill().map(() => Array(5).fill(0))
      }
    };
  }
}