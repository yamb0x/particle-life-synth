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
      description: 'Classic predator-prey dynamics with chase and hunt behaviors',
      
      // PARTICLES Section - NEW FORMAT
      particles: {
        particlesPerSpecies: 100,
        numSpecies: 5,
        startPattern: 'cluster'
      },
      
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.2, y: 0.2 }, radius: 0.1 }, glowSize: 1.0, glowIntensity: 0 },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.8, y: 0.2 }, radius: 0.1 }, glowSize: 1.0, glowIntensity: 0 },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.5, y: 0.8 }, radius: 0.1 }, glowSize: 1.0, glowIntensity: 0 },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.2, y: 0.8 }, radius: 0.1 }, glowSize: 1.0, glowIntensity: 0 },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'cluster', center: { x: 0.8, y: 0.8 }, radius: 0.1 }, glowSize: 1.0, glowIntensity: 0 }
        ]
      },
      
      // PHYSICS Section - NEW FORMAT
      physics: {
        friction: 0.05,
        wallDamping: 0.9,
        forceFactor: 0.5,
        // Store full matrices
        collisionRadius: Array(5).fill().map(() => Array(5).fill(15)),
        socialRadius: Array(5).fill().map(() => Array(5).fill(50)),
        // Store single values for UI compatibility
        collisionRadiusValue: 15,
        socialRadiusValue: 50
      },
      
      visual: {
        blur: 0.97,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      
      // EFFECTS Section - NEW FORMAT
      effects: {
        trailEnabled: true,
        trailLength: 0.97,
        haloEnabled: false,
        haloIntensity: 0.0,
        haloRadius: 1.0,
        speciesGlowEnabled: false,
        speciesGlowArrays: {
          sizes: [1.0, 1.0, 1.0, 1.0, 1.0],
          intensities: [0.0, 0.0, 0.0, 0.0, 0.0]
        }
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
      description: 'Symmetric clustering with glowing crystal-like formations',
      
      // PARTICLES Section - NEW FORMAT
      particles: {
        particlesPerSpecies: 100,
        numSpecies: 5,
        startPattern: 'ring'
      },
      
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 1.2, glowIntensity: 0.3 },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.25 }, glowSize: 1.2, glowIntensity: 0.3 },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.2 }, glowSize: 1.2, glowIntensity: 0.3 },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.15 }, glowSize: 1.2, glowIntensity: 0.3 },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.1 }, glowSize: 1.2, glowIntensity: 0.3 }
        ]
      },
      
      // PHYSICS Section - NEW FORMAT
      physics: {
        friction: 0.1,
        wallDamping: 0.95,
        forceFactor: 0.3,
        // Store full matrices
        collisionRadius: Array(5).fill().map(() => Array(5).fill(15)),
        socialRadius: Array(5).fill().map(() => Array(5).fill(80)),
        // Store single values for UI compatibility
        collisionRadiusValue: 15,
        socialRadiusValue: 80
      },
      
      visual: {
        blur: 0.95,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      
      // EFFECTS Section - NEW FORMAT
      effects: {
        trailEnabled: true,
        trailLength: 0.95,
        haloEnabled: false,
        haloIntensity: 0.0,
        haloRadius: 1.0,
        speciesGlowEnabled: true,
        speciesGlowArrays: {
          sizes: [1.2, 1.2, 1.2, 1.2, 1.2],
          intensities: [0.3, 0.3, 0.3, 0.3, 0.3]
        }
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
      description: 'Spinning vortex dynamics with enhanced glow effects',
      
      // PARTICLES Section - NEW FORMAT
      particles: {
        particlesPerSpecies: 100,
        numSpecies: 5,
        startPattern: 'grid'
      },
      
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 1.5, glowIntensity: 0.4 },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 1.5, glowIntensity: 0.4 },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 1.5, glowIntensity: 0.4 },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 1.5, glowIntensity: 0.4 },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'grid', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 1.5, glowIntensity: 0.4 }
        ]
      },
      
      // PHYSICS Section - NEW FORMAT
      physics: {
        friction: 0.02,
        wallDamping: 0.85,
        forceFactor: 0.6,
        // Store full matrices
        collisionRadius: Array(5).fill().map(() => Array(5).fill(15)),
        socialRadius: Array(5).fill().map(() => Array(5).fill(60)),
        // Store single values for UI compatibility
        collisionRadiusValue: 15,
        socialRadiusValue: 60
      },
      
      visual: {
        blur: 0.98,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      
      // EFFECTS Section - NEW FORMAT
      effects: {
        trailEnabled: true,
        trailLength: 0.98,
        haloEnabled: false,
        haloIntensity: 0.0,
        haloRadius: 1.0,
        speciesGlowEnabled: true,
        speciesGlowArrays: {
          sizes: [1.5, 1.5, 1.5, 1.5, 1.5],
          intensities: [0.4, 0.4, 0.4, 0.4, 0.4]
        }
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
      description: 'Cooperative mutual relationships with subtle glow effects',
      
      // PARTICLES Section - NEW FORMAT
      particles: {
        particlesPerSpecies: 100,
        numSpecies: 5,
        startPattern: 'random'
      },
      
      species: {
        count: 5,
        definitions: [
          { id: 0, name: 'Red', color: { r: 255, g: 100, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 }, glowSize: 1.3, glowIntensity: 0.2 },
          { id: 1, name: 'Green', color: { r: 100, g: 255, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 }, glowSize: 1.3, glowIntensity: 0.2 },
          { id: 2, name: 'Blue', color: { r: 100, g: 150, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 }, glowSize: 1.3, glowIntensity: 0.2 },
          { id: 3, name: 'Yellow', color: { r: 255, g: 200, b: 100 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 }, glowSize: 1.3, glowIntensity: 0.2 },
          { id: 4, name: 'Purple', color: { r: 255, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 }, glowSize: 1.3, glowIntensity: 0.2 }
        ]
      },
      
      // PHYSICS Section - NEW FORMAT
      physics: {
        friction: 0.05,
        wallDamping: 0.9,
        forceFactor: 0.4,
        // Store full matrices
        collisionRadius: Array(5).fill().map(() => Array(5).fill(15)),
        socialRadius: Array(5).fill().map(() => Array(5).fill(70)),
        // Store single values for UI compatibility
        collisionRadiusValue: 15,
        socialRadiusValue: 70
      },
      
      visual: {
        blur: 0.96,
        particleSize: 2,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      
      // EFFECTS Section - NEW FORMAT
      effects: {
        trailEnabled: true,
        trailLength: 0.96,
        haloEnabled: false,
        haloIntensity: 0.0,
        haloRadius: 1.0,
        speciesGlowEnabled: true,
        speciesGlowArrays: {
          sizes: [1.3, 1.3, 1.3, 1.3, 1.3],
          intensities: [0.2, 0.2, 0.2, 0.2, 0.2]
        }
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
      version: '1.0',
      description: 'Ethereal particles with glowing auras in a dream-like dance',
      
      // PARTICLES Section - NEW FORMAT
      particles: {
        particlesPerSpecies: 80,
        numSpecies: 4,
        startPattern: 'ring'
      },
      
      // SPECIES Section
      species: {
        count: 4,
        definitions: [
          { id: 0, name: 'Cyan', color: { r: 100, g: 255, b: 255 }, size: 4, opacity: 0.8, particleCount: 80, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.3 }, glowSize: 2.0, glowIntensity: 0.7 },
          { id: 1, name: 'Magenta', color: { r: 255, g: 100, b: 255 }, size: 3.5, opacity: 0.8, particleCount: 80, startPosition: { type: 'ring', center: { x: 0.5, y: 0.5 }, radius: 0.2 }, glowSize: 2.2, glowIntensity: 0.8 },
          { id: 2, name: 'Gold', color: { r: 255, g: 215, b: 100 }, size: 4.5, opacity: 0.7, particleCount: 60, startPosition: { type: 'cluster', center: { x: 0.5, y: 0.5 }, radius: 0.15 }, glowSize: 2.5, glowIntensity: 0.9 },
          { id: 3, name: 'Violet', color: { r: 150, g: 100, b: 255 }, size: 3, opacity: 0.9, particleCount: 100, startPosition: { type: 'random', center: { x: 0.5, y: 0.5 }, radius: 0.4 }, glowSize: 1.8, glowIntensity: 0.6 }
        ]
      },
      
      // PHYSICS Section - NEW FORMAT
      physics: {
        friction: 0.02,
        wallDamping: 0.95,
        forceFactor: 0.4,
        // Store full matrices
        collisionRadius: Array(4).fill().map(() => Array(4).fill(20)),
        socialRadius: Array(4).fill().map(() => Array(4).fill(80)),
        // Store single values for UI compatibility
        collisionRadiusValue: 20,
        socialRadiusValue: 80
      },
      
      // VISUAL Section
      visual: {
        blur: 0.98,
        particleSize: 4,
        trailEnabled: true,
        backgroundColor: '#000000'
      },
      
      // EFFECTS Section - NEW FORMAT
      effects: {
        // Trail Effect
        trailEnabled: true,
        trailLength: 0.98,
        
        // Halo Effect
        haloEnabled: true,
        haloIntensity: 0.8,
        haloRadius: 3.0,
        
        // Species Glow Effect
        speciesGlowEnabled: true,
        speciesGlowArrays: {
          sizes: [2.0, 2.2, 2.5, 1.8],
          intensities: [0.7, 0.8, 0.9, 0.6]
        }
      },
      
      // FORCES Section
      forces: {
        collision: Array(4).fill().map(() => Array(4).fill(-0.5)),
        social: [
          [0.0, 0.2, -0.3, 0.1],
          [0.2, 0.0, 0.1, -0.2],
          [-0.3, 0.1, 0.0, 0.3],
          [0.1, -0.2, 0.3, 0.0]
        ]
      },
      
      // RENDER MODE & GLOBAL SETTINGS
      renderMode: 'dreamtime',
      glowIntensity: 0.8,
      glowRadius: 3.0
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
  
  getUserPresets() {
    const userPresets = [];
    const builtInKeys = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'];
    
    for (const [key, preset] of this.presets.entries()) {
      if (!builtInKeys.includes(key)) {
        userPresets.push({
          key: key,
          name: preset.name || key,
          preset: preset
        });
      }
    }
    
    return userPresets;
  }
}