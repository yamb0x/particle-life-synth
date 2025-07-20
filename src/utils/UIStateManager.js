export class UIStateManager extends EventTarget {
    constructor() {
        super();
        this.state = {
            species: {
                count: 5,
                glowSettings: new Map(),
                colors: new Map()
            },
            visual: {
                blur: 0.95,
                trailEnabled: true,
                particleSize: 2,
                backgroundColor: '#000000'
            },
            physics: {
                friction: 0.05,
                wallDamping: 0.8,
                forceFactor: 1.0,
                collisionRadius: 15,
                socialRadius: 50
            },
            ui: {
                selectedSpecies: 0,
                activeTab: 'species',
                isConfigModalOpen: false
            }
        };
        this.isUpdating = false;
    }
    
    updateParameter(key, value, category = null) {
        if (this.isUpdating) return; // Prevent circular updates
        
        try {
            this.isUpdating = true;
            
            if (category) {
                this.state[category][key] = value;
            } else {
                // Auto-detect category or use direct key path
                const keyPath = key.split('.');
                if (keyPath.length === 2) {
                    this.state[keyPath[0]][keyPath[1]] = value;
                } else {
                    // Find which category contains this key
                    for (const cat in this.state) {
                        if (this.state[cat].hasOwnProperty(key)) {
                            this.state[cat][key] = value;
                            category = cat;
                            break;
                        }
                    }
                }
            }
            
            this.dispatchEvent(new CustomEvent('parameterChanged', { 
                detail: { key, value, category } 
            }));
        } finally {
            this.isUpdating = false;
        }
    }
    
    getParameter(key, category = null) {
        if (category) {
            return this.state[category][key];
        }
        
        // Auto-detect category
        const keyPath = key.split('.');
        if (keyPath.length === 2) {
            return this.state[keyPath[0]][keyPath[1]];
        }
        
        // Search all categories
        for (const cat in this.state) {
            if (this.state[cat].hasOwnProperty(key)) {
                return this.state[cat][key];
            }
        }
        
        return undefined;
    }
    
    updateSpeciesCount(count) {
        this.state.species.count = count;
        this.dispatchEvent(new CustomEvent('speciesCountChanged', { 
            detail: { count } 
        }));
    }
    
    setSpeciesGlow(speciesId, settings) {
        this.state.species.glowSettings.set(speciesId, settings);
        this.dispatchEvent(new CustomEvent('speciesGlowChanged', { 
            detail: { speciesId, settings } 
        }));
    }
    
    getSpeciesGlow(speciesId) {
        return this.state.species.glowSettings.get(speciesId) || { intensity: 0, size: 1.0 };
    }
    
    setSpeciesColor(speciesId, color) {
        this.state.species.colors.set(speciesId, color);
        this.dispatchEvent(new CustomEvent('speciesColorChanged', { 
            detail: { speciesId, color } 
        }));
    }
    
    getSpeciesColor(speciesId) {
        return this.state.species.colors.get(speciesId);
    }
    
    selectSpecies(speciesId) {
        this.state.ui.selectedSpecies = speciesId;
        this.dispatchEvent(new CustomEvent('speciesSelected', { 
            detail: { speciesId } 
        }));
    }
    
    getSelectedSpecies() {
        return this.state.ui.selectedSpecies;
    }
    
    setConfigModalState(isOpen) {
        this.state.ui.isConfigModalOpen = isOpen;
        this.dispatchEvent(new CustomEvent('configModalStateChanged', { 
            detail: { isOpen } 
        }));
    }
    
    isConfigModalOpen() {
        return this.state.ui.isConfigModalOpen;
    }
    
    syncFromParticleSystem(particleSystem) {
        // Update state from particle system without triggering events
        this.isUpdating = true;
        
        try {
            this.state.species.count = particleSystem.numSpecies;
            this.state.visual.blur = particleSystem.blur;
            this.state.visual.trailEnabled = particleSystem.trailEnabled;
            this.state.visual.particleSize = particleSystem.particleSize;
            this.state.visual.backgroundColor = particleSystem.backgroundColor;
            this.state.physics.friction = particleSystem.friction;
            this.state.physics.wallDamping = particleSystem.wallDamping;
            this.state.physics.forceFactor = particleSystem.forceFactor;
            
            // Sync species colors
            this.state.species.colors.clear();
            if (particleSystem.species) {
                particleSystem.species.forEach((species, index) => {
                    this.state.species.colors.set(index, species.color);
                });
            }
            
            // Sync glow settings
            this.state.species.glowSettings.clear();
            if (particleSystem.speciesGlowIntensity && particleSystem.speciesGlowSize) {
                for (let i = 0; i < particleSystem.numSpecies; i++) {
                    this.state.species.glowSettings.set(i, {
                        intensity: particleSystem.speciesGlowIntensity[i] || 0,
                        size: particleSystem.speciesGlowSize[i] || 1.0
                    });
                }
            }
        } finally {
            this.isUpdating = false;
        }
    }
    
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    setState(newState, merge = true) {
        if (merge) {
            this.state = { ...this.state, ...newState };
        } else {
            this.state = newState;
        }
        
        this.dispatchEvent(new CustomEvent('stateChanged', { 
            detail: { state: this.getState() } 
        }));
    }
    
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
    
    removeEventListener(type, listener, options) {
        super.removeEventListener(type, listener, options);
    }
    
    // Debugging helper
    logState() {
        console.log('[UIStateManager] Current state:', this.getState());
    }
}