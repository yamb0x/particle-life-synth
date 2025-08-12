export class ModulationManager {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.modulations = new Map();
        this.nextId = 1;
        this.originalValues = new Map();
        this.lastUpdateTime = 0;
        this.updateInterval = 16; // ~60fps update rate
    }

    // Parameter categories and their properties
    getParameterCategories() {
        const categories = {
            'Species Properties': {},
            'Physics': {},
            'Effects': {},
            'Boundaries': {},
            'Mouse': {},
            'Visual': {}
        };

        const speciesCount = this.particleSystem.numSpecies || 6;
        for (let i = 0; i < speciesCount; i++) {
            const speciesName = this.particleSystem.speciesNames?.[i] || `Species ${i + 1}`;
            categories['Species Properties'][`species_${i}_color`] = {
                name: `${speciesName} Color`,
                type: 'color',
                getter: () => {
                    const color = this.particleSystem.species[i]?.color;
                    if (color && typeof color === 'object') {
                        return this.rgbToHex(color.r, color.g, color.b);
                    }
                    return '#ffffff';
                },
                setter: (val) => {
                    if (this.particleSystem.species[i]) {
                        const rgb = this.hexToRgb(val);
                        this.particleSystem.species[i].color = rgb;
                    }
                },
                current: () => {
                    const color = this.particleSystem.species[i]?.color;
                    if (color && typeof color === 'object') {
                        return this.rgbToHex(color.r, color.g, color.b);
                    }
                    return '#ffffff';
                }
            };
            categories['Species Properties'][`species_${i}_size`] = {
                name: `${speciesName} Size`,
                type: 'float',
                min: 0.5,
                max: 30.0,
                getter: () => this.particleSystem.getSpeciesSize(i),
                setter: (val) => this.particleSystem.setSpeciesSize(i, val),
                current: () => this.particleSystem.getSpeciesSize(i)
            };
            categories['Species Properties'][`species_${i}_halo_intensity`] = {
                name: `${speciesName} Halo Intensity`,
                type: 'float',
                min: 0.0,
                max: 1.0,
                getter: () => this.particleSystem.getSpeciesHaloIntensity?.(i) || 0,
                setter: (val) => this.particleSystem.setSpeciesHaloIntensity?.(i, val),
                current: () => this.particleSystem.getSpeciesHaloIntensity?.(i) || 0
            };
            categories['Species Properties'][`species_${i}_halo_radius`] = {
                name: `${speciesName} Halo Radius`,
                type: 'float',
                min: 0.0,
                max: 50.0,
                getter: () => this.particleSystem.getSpeciesHaloRadius?.(i) || 0,
                setter: (val) => this.particleSystem.setSpeciesHaloRadius?.(i, val),
                current: () => this.particleSystem.getSpeciesHaloRadius?.(i) || 0
            };
            categories['Species Properties'][`species_${i}_glow_size`] = {
                name: `${speciesName} Glow Size`,
                type: 'float',
                min: 0.0,
                max: 50.0,
                getter: () => this.particleSystem.getSpeciesGlowSize?.(i) || 0,
                setter: (val) => this.particleSystem.setSpeciesGlowSize?.(i, val),
                current: () => this.particleSystem.getSpeciesGlowSize?.(i) || 0
            };
            categories['Species Properties'][`species_${i}_glow_intensity`] = {
                name: `${speciesName} Glow Intensity`,
                type: 'float',
                min: 0.0,
                max: 1.0,
                getter: () => this.particleSystem.getSpeciesGlowIntensity?.(i) || 0,
                setter: (val) => this.particleSystem.setSpeciesGlowIntensity?.(i, val),
                current: () => this.particleSystem.getSpeciesGlowIntensity?.(i) || 0
            };
            
            // Add per-species collision offset
        }

        // Physics parameters
        categories['Physics']['force_strength'] = {
            name: 'Force Strength',
            type: 'float',
            min: 0.0,
            max: 5.0,
            getter: () => this.particleSystem.forceScale,
            setter: (val) => this.particleSystem.forceScale = val,
            current: () => this.particleSystem.forceScale
        };
        categories['Physics']['friction'] = {
            name: 'Friction',
            type: 'float',
            min: 0.8,
            max: 1.0,
            getter: () => this.particleSystem.friction,
            setter: (val) => this.particleSystem.friction = val,
            current: () => this.particleSystem.friction
        };
        categories['Physics']['collision_strength'] = {
            name: 'Collision Strength',
            type: 'float',
            min: 0.0,
            max: 2.0,
            getter: () => this.particleSystem.collisionMultiplier,
            setter: (val) => this.particleSystem.collisionMultiplier = val,
            current: () => this.particleSystem.collisionMultiplier
        };
        categories['Physics']['collision_offset'] = {
            name: 'Collision Offset',
            type: 'float',
            min: 0.0,
            max: 10.0,
            getter: () => this.particleSystem.collisionOffset,
            setter: (val) => this.particleSystem.collisionOffset = val,
            current: () => this.particleSystem.collisionOffset
        };
        categories['Physics']['social_radius'] = {
            name: 'Social Radius',
            type: 'float',
            min: 0.0,
            max: 300.0,
            getter: () => this.particleSystem.rMax,
            setter: (val) => this.particleSystem.rMax = val,
            current: () => this.particleSystem.rMax
        };
        categories['Physics']['environmental_pressure'] = {
            name: 'Environmental Pressure',
            type: 'float',
            min: -0.05,
            max: 0.05,
            getter: () => this.particleSystem.environmentalPressure,
            setter: (val) => this.particleSystem.environmentalPressure = val,
            current: () => this.particleSystem.environmentalPressure
        };

        // Effects parameters
        categories['Effects']['trail_length'] = {
            name: 'Trail Length',
            type: 'float',
            min: 0.5,
            max: 0.99,
            getter: () => this.particleSystem.blur,
            setter: (val) => this.particleSystem.blur = val,
            current: () => this.particleSystem.blur
        };

        // Boundary parameters
        categories['Boundaries']['wall_bounce'] = {
            name: 'Wall Bounce',
            type: 'float',
            min: 0.0,
            max: 1.0,
            getter: () => this.particleSystem.wallBounce,
            setter: (val) => this.particleSystem.wallBounce = val,
            current: () => this.particleSystem.wallBounce
        };
        categories['Boundaries']['repulsive_force'] = {
            name: 'Repulsive Force',
            type: 'float',
            min: 0.0,
            max: 1.0,
            getter: () => this.particleSystem.repulsiveForce,
            setter: (val) => this.particleSystem.repulsiveForce = val,
            current: () => this.particleSystem.repulsiveForce
        };

        // Mouse parameters
        categories['Mouse']['mouse_strength'] = {
            name: 'Mouse Strength',
            type: 'float',
            min: 0.0,
            max: 100.0,
            getter: () => this.particleSystem.mouseForce,
            setter: (val) => this.particleSystem.mouseForce = val,
            current: () => this.particleSystem.mouseForce
        };
        categories['Mouse']['mouse_radius'] = {
            name: 'Mouse Radius',
            type: 'float',
            min: 0.0,
            max: 500.0,
            getter: () => this.particleSystem.mouseRadius,
            setter: (val) => this.particleSystem.mouseRadius = val,
            current: () => this.particleSystem.mouseRadius
        };

        // Visual parameters
        categories['Visual']['background_color'] = {
            name: 'Background Color',
            type: 'color',
            getter: () => this.particleSystem.backgroundColor,
            setter: (val) => this.particleSystem.backgroundColor = val,
            current: () => this.particleSystem.backgroundColor
        };

        // Force matrix parameters
        for (let i = 0; i < speciesCount; i++) {
            for (let j = 0; j < speciesCount; j++) {
                const fromName = this.particleSystem.speciesNames?.[i] || `Species ${i + 1}`;
                const toName = this.particleSystem.speciesNames?.[j] || `Species ${j + 1}`;
                categories['Physics'][`force_${i}_${j}`] = {
                    name: `Force: ${fromName} → ${toName}`,
                    type: 'float',
                    min: -1.0,
                    max: 1.0,
                    getter: () => this.particleSystem.socialForce[i]?.[j] || 0,
                    setter: (val) => {
                        if (!this.particleSystem.socialForce[i]) {
                            this.particleSystem.socialForce[i] = [];
                        }
                        this.particleSystem.socialForce[i][j] = val;
                    },
                    current: () => this.particleSystem.socialForce[i]?.[j] || 0
                };
            }
        }

        return categories;
    }

    addModulation(parameterId, minValue, maxValue, duration, parameterConfig, waveType = 'sine') {
        const id = `mod_${this.nextId++}`;
        
        if (!this.originalValues.has(parameterId)) {
            const originalValue = parameterConfig.current();
            this.originalValues.set(parameterId, originalValue);
        }

        const modulation = {
            id,
            parameterId,
            minValue,
            maxValue,
            duration: duration * 1000,
            startTime: performance.now(),
            type: parameterConfig.type,
            waveType: waveType,
            getter: parameterConfig.getter,
            setter: parameterConfig.setter,
            parameterName: parameterConfig.name
        };

        this.modulations.set(id, modulation);
        return id;
    }

    removeModulation(id) {
        const modulation = this.modulations.get(id);
        if (modulation) {
            // Restore original value
            if (this.originalValues.has(modulation.parameterId)) {
                modulation.setter(this.originalValues.get(modulation.parameterId));
                
                // Check if no other modulations use this parameter
                const hasOtherModulations = Array.from(this.modulations.values())
                    .some(m => m.id !== id && m.parameterId === modulation.parameterId);
                
                if (!hasOtherModulations) {
                    this.originalValues.delete(modulation.parameterId);
                }
            }
            this.modulations.delete(id);
        }
    }
    
    updateModulation(id, newMinValue, newMaxValue, newDuration, newWaveType) {
        const modulation = this.modulations.get(id);
        if (!modulation) return false;
        
        modulation.minValue = newMinValue;
        modulation.maxValue = newMaxValue;
        modulation.duration = newDuration * 1000;
        if (newWaveType) modulation.waveType = newWaveType;
        modulation.startTime = performance.now();
        
        return true;
    }
    
    // Preview a modulation without adding it
    previewModulation(parameterId, minValue, maxValue, duration, waveType, parameterConfig) {
        // Remove any existing preview
        this.stopPreview();
        
        // Create a temporary modulation with a special preview ID
        const previewId = 'preview_modulation';
        
        // Store original value if not already stored
        if (!this.originalValues.has('preview_' + parameterId)) {
            const originalValue = parameterConfig.current();
            this.originalValues.set('preview_' + parameterId, originalValue);
        }
        
        const modulation = {
            id: previewId,
            parameterId,
            minValue,
            maxValue,
            duration: duration * 1000,
            startTime: performance.now(),
            type: parameterConfig.type,
            waveType: waveType || 'sine',
            getter: parameterConfig.getter,
            setter: parameterConfig.setter,
            parameterName: parameterConfig.name,
            isPreview: true
        };
        
        this.modulations.set(previewId, modulation);
        return previewId;
    }
    
    stopPreview() {
        const previewMod = this.modulations.get('preview_modulation');
        if (previewMod) {
            // Restore original value
            const previewKey = 'preview_' + previewMod.parameterId;
            if (this.originalValues.has(previewKey)) {
                previewMod.setter(this.originalValues.get(previewKey));
                this.originalValues.delete(previewKey);
            }
            this.modulations.delete('preview_modulation');
        }
    }
    
    refreshParameterReferences() {
        const categories = this.getParameterCategories();
        
        for (const [id, modulation] of this.modulations) {
            let paramConfig = null;
            for (const category of Object.values(categories)) {
                if (category[modulation.parameterId]) {
                    paramConfig = category[modulation.parameterId];
                    break;
                }
            }
            
            if (paramConfig) {
                modulation.getter = paramConfig.getter;
                modulation.setter = paramConfig.setter;
                modulation.parameterName = paramConfig.name;
                
                if (this.originalValues.has(modulation.parameterId)) {
                    this.originalValues.set(modulation.parameterId, paramConfig.current());
                }
            }
        }
    }

    getWaveValue(phase, waveType) {
        switch (waveType) {
            case 'sine':
                return (Math.sin(phase * Math.PI * 2) + 1) / 2;
            
            case 'triangle':
                if (phase < 0.5) return phase * 2;
                return 2 - phase * 2;
            
            case 'sawtooth':
                return phase;
            
            case 'square':
                return phase < 0.5 ? 0 : 1;
            
            case 'smooth-square':
                const t = (Math.sin(phase * Math.PI * 2) + 1) / 2;
                return Math.pow(t, 0.3);
            
            case 'exponential':
                return Math.pow(phase, 2);
            
            case 'logarithmic':
                return Math.log10(phase * 9 + 1);
            
            case 'elastic':
                if (phase === 0 || phase === 1) return phase;
                const p = 0.3;
                const s = p / 4;
                const postFix = Math.pow(2, -10 * phase);
                return postFix * Math.sin((phase - s) * (2 * Math.PI) / p) + 1;
            
            case 'bounce':
                const n1 = 7.5625;
                const d1 = 2.75;
                if (phase < 1 / d1) {
                    return n1 * phase * phase;
                } else if (phase < 2 / d1) {
                    const t = phase - 1.5 / d1;
                    return n1 * t * t + 0.75;
                } else if (phase < 2.5 / d1) {
                    const t = phase - 2.25 / d1;
                    return n1 * t * t + 0.9375;
                } else {
                    const t = phase - 2.625 / d1;
                    return n1 * t * t + 0.984375;
                }
            
            case 'random':
                return Math.random();
            
            default:
                return (Math.sin(phase * Math.PI * 2) + 1) / 2;
        }
    }

    update() {
        const currentTime = performance.now();
        
        // Throttle updates for better performance
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;

        for (const [id, modulation] of this.modulations) {
            const elapsed = currentTime - modulation.startTime;
            const phase = (elapsed % modulation.duration) / modulation.duration;
            
            // Cache wave value for smooth transitions
            const waveValue = this.getWaveValue(phase, modulation.waveType || 'sine');
            
            // Apply smoothing for more fluid motion (except for square and random waves)
            let smoothedValue = waveValue;
            if (modulation.waveType !== 'square' && modulation.waveType !== 'random') {
                if (modulation.lastValue !== undefined) {
                    smoothedValue = modulation.lastValue * 0.7 + waveValue * 0.3;
                }
                modulation.lastValue = smoothedValue;
            }

            if (modulation.type === 'color') {
                const color1 = this.hexToRgb(modulation.minValue);
                const color2 = this.hexToRgb(modulation.maxValue);
                
                const r = Math.round(color1.r + (color2.r - color1.r) * smoothedValue);
                const g = Math.round(color1.g + (color2.g - color1.g) * smoothedValue);
                const b = Math.round(color1.b + (color2.b - color1.b) * smoothedValue);
                
                modulation.setter(this.rgbToHex(r, g, b));
            } else {
                const value = modulation.minValue + (modulation.maxValue - modulation.minValue) * smoothedValue;
                modulation.setter(value);
            }
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    clearAll() {
        for (const [parameterId, originalValue] of this.originalValues) {
            const modulation = Array.from(this.modulations.values())
                .find(m => m.parameterId === parameterId);
            if (modulation) {
                modulation.setter(originalValue);
            }
        }
        
        this.modulations.clear();
        this.originalValues.clear();
    }

    getActiveModulations() {
        return Array.from(this.modulations.values()).filter(mod => !mod.isPreview);
    }

    exportConfig() {
        return Array.from(this.modulations.values())
            .filter(mod => !mod.isPreview)
            .map(mod => ({
                parameterId: mod.parameterId,
                minValue: mod.minValue,
                maxValue: mod.maxValue,
                duration: mod.duration / 1000,
                type: mod.type,
                waveType: mod.waveType || 'sine',
                parameterName: mod.parameterName
            }));
    }

    importConfig(config) {
        this.clearAll();
        const categories = this.getParameterCategories();
        
        for (const modConfig of config) {
            let parameterConfig = null;
            for (const category of Object.values(categories)) {
                if (category[modConfig.parameterId]) {
                    parameterConfig = category[modConfig.parameterId];
                    break;
                }
            }
            
            if (parameterConfig) {
                this.addModulation(
                    modConfig.parameterId,
                    modConfig.minValue,
                    modConfig.maxValue,
                    modConfig.duration,
                    parameterConfig,
                    modConfig.waveType || 'sine'
                );
            }
        }
    }
}