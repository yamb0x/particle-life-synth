import { XYGraph } from './XYGraph.js';
import { DistributionDrawer } from './DistributionDrawer.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';
import { ModulationManager } from '../utils/ModulationManager.js';

export class MainUI {
    constructor(particleSystem, presetManager, autoSaveCallback = null, presetModal = null, aspectRatioManager = null) {
        this.particleSystem = particleSystem;
        this.presetManager = presetManager;
        this.autoSaveCallback = autoSaveCallback;
        // PresetModal parameter kept for backwards compatibility but not used
        this.aspectRatioManager = aspectRatioManager;
        this.isVisible = true;
        this.container = null;
        this.forceGraph = null;
        this.distributionDrawer = null;
        this.copiedSettings = null;
        this.currentEditingPreset = null;
        this.forceDistribution = 0.5; // 0 = uniform, 1 = edges
        this.selectedSpeciesForSize = 0; // Track selected species for size control
        this.patternParameterStates = {}; // Store parameter values for each pattern
        this.cachedPresetOrder = []; // Cache preset order for stable navigation
        this.modulationManager = new ModulationManager(particleSystem);
        
        // Ensure new wall properties are initialized
        if (this.particleSystem.repulsiveForce === undefined) {
            this.particleSystem.repulsiveForce = 0.3;
        }
        if (this.particleSystem.wrapAroundWalls === undefined) {
            this.particleSystem.wrapAroundWalls = false;
        }
        
        this.init();
        this.setupKeyboardShortcuts();
    }
    
    
    validateUIElements() {
        // List of all expected UI element IDs
        const expectedIds = [
            // Preset controls
            'minimize-btn', 'preset-selector', 'preset-name-input', 'save-preset-btn', 'firebase-status', 'connection-status', 'preset-count',
            // Particle controls
            'particles-per-species', 'particles-per-species-value', 'species-count', 'species-count-value',
            'distribution-canvas', 'distribution-brush', 'distribution-brush-slider', 'distribution-brush-value', 'distribution-clear',
            // Physics controls
            'force-strength', 'force-strength-value', 'friction', 'friction-value',
            'collision-strength', 'collision-strength-value', 'collision-offset', 'collision-offset-value', 'link-all-sizes',
            'social-radius', 'social-radius-value',
            // Advanced Physics controls
            'environmental-pressure', 'environmental-pressure-value',
            // Shockwave controls
            'shockwave-enabled', 'shockwave-controls', 'shockwave-strength', 'shockwave-strength-value',
            'shockwave-size', 'shockwave-size-value', 'shockwave-falloff', 'shockwave-falloff-value',
            // Walls controls
            'wall-bounce', 'wall-bounce-value', 'repulsive-force', 'repulsive-force-value', 'wrap-around-walls',
            // Force controls
            'from-species', 'to-species', 'force-graph-container', 'clear-forces-btn',
            // Effects controls
            'trails-enabled', 'trail-controls', 'trail-length', 'trail-length-value',
            // Trail mode controls
            'link-all-species-trails', 'trail-exclusion-container', 'trail-exclusion-enabled',
            'trail-species-selector-container', 'trail-species-selector',
            // Per-species halo controls
            'per-species-halo-enabled', 'per-species-halo-controls', 'per-species-halo-intensity-control',
            'per-species-halo-radius-control', 'halo-species-selector', 'per-species-halo-intensity',
            'per-species-halo-intensity-value', 'per-species-halo-radius', 'per-species-halo-radius-value',
            'species-glow-enabled', 'species-glow-controls', 'species-glow-size-control', 
            'species-glow-intensity-control', 'glow-species-selector', 'species-glow-size',
            'species-glow-size-value', 'species-glow-intensity', 'species-glow-intensity-value',
            // Visual controls
            'background-mode', 'background-color', 'background-color1', 'background-color2', 
            'background-cycle-time', 'background-cycle-time-value', 
            'selected-species-name', 'species-size', 'species-size-value',
            'species-colors-container',
            // Action buttons
            'randomize-forces-btn', 'reset-defaults-btn', 'force-distribution', 'force-distribution-value', 'force-pattern-selector'
        ];
        
        const missingIds = [];
        expectedIds.forEach(id => {
            if (!document.getElementById(id)) {
                missingIds.push(id);
            }
        });
        
        if (missingIds.length > 0) {
            console.error('Missing UI elements:', missingIds);
        } else {
            // UI elements validated
        }
        
        return missingIds.length === 0;
    }
    
    // Helper method for safe property access in templates
    safeValue(value, defaultValue = 0) {
        return (value !== undefined && value !== null) ? value : defaultValue;
    }
    
    safeFixed(value, digits = 1, defaultValue = '0.0') {
        if (value !== undefined && value !== null && typeof value === 'number') {
            return value.toFixed(digits);
        }
        return defaultValue;
    }
    
    init() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'main-ui-container';
        this.container.innerHTML = `
            <!-- Header Panel -->
            <div class="panel main-ui-header">
                <div class="panel-header">
                    <h3 class="panel-title">Particle Life Synth</h3>
                    <button class="btn btn-ghost btn-icon" id="minimize-btn" title="Hide panel (C)">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 8h8v1H4z"/>
                        </svg>
                    </button>
                </div>
            </div>
                
            
            <!-- 1. PARTICLES Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Particles</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            Amount Scale
                            <span class="value-display" id="particles-per-species-value">${this.safeValue(this.particleSystem.particlesPerSpecies, 100)}</span>
                        </label>
                        <input type="range" class="range-slider" id="particles-per-species" 
                               min="0" max="1000" step="10" value="${this.safeValue(this.particleSystem.particlesPerSpecies, 100)}">
                    </div>
                    <div class="control-group">
                        <label>
                            Species Count
                            <span class="value-display" id="species-count-value">${this.safeValue(this.particleSystem.numSpecies, 4)}</span>
                        </label>
                        <input type="range" class="range-slider" id="species-count" 
                               min="1" max="20" step="1" value="${this.safeValue(this.particleSystem.numSpecies, 4)}">
                    </div>
                    <div class="control-group">
                        <label>Initial Distribution</label>
                        <div class="distribution-drawer-container">
                            <canvas class="distribution-drawer" id="distribution-canvas"></canvas>
                            <div class="mode-indicator" id="mode-indicator">Draw Mode</div>
                            <div class="circle-indicator" id="circle-indicator">Click to set center</div>
                            <div class="distribution-controls">
                                <div class="control-row species-selector-row">
                                    <div class="species-buttons" id="species-buttons-container">
                                        <!-- Species buttons will be populated dynamically -->
                                    </div>
                                    <span class="value-display" id="distribution-brush-value">20</span>
                                </div>
                                <div class="control-row">
                                    <input type="range" class="range-slider" id="distribution-brush-slider" min="5" max="50" value="20">
                                    <input type="number" class="input input-sm" id="distribution-brush" value="20" min="5" max="50">
                                </div>
                                <div class="mode-and-clear-row">
                                    <div class="mode-buttons">
                                        <button class="mode-btn active" data-mode="draw" title="Draw Mode">✏️</button>
                                        <button class="mode-btn" data-mode="circles" title="Precision Circles">⭕</button>
                                        <button class="mode-btn" data-mode="random" title="Species AI Patterns">🎲</button>
                                        <button class="mode-btn" data-mode="glitch" title="Sci-Fi Glitch">⚡</button>
                                        <button class="mode-btn" data-mode="erase" title="Erase Mode">🧽</button>
                                    </div>
                                    <button class="util-btn clear-btn" id="distribution-clear" title="Clear All">🗑️</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Per-Species Size Controls -->
                    <div class="control-group">
                        <label>Per-Species Size</label>
                        <div class="species-size-display">
                            <span id="selected-species-name">Select a species above</span>
                            <span class="value-display" id="species-size-value">-</span>
                        </div>
                        <input type="range" class="range-slider" id="species-size" 
                               min="0.5" max="30" step="0.5" value="3.0" disabled>
                    </div>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="link-all-sizes">
                            Link All Sizes
                        </label>
                    </div>
                    
                    <!-- Collision Settings -->
                    <div class="control-group">
                        <label>
                            Collision Strength
                            <span class="value-display" id="collision-strength-value">1.0</span>
                        </label>
                        <input type="range" class="range-slider" id="collision-strength" 
                               min="0.5" max="5.0" step="0.1" value="1.0">
                        <span class="info-text">1.0 = particles touch when colliding, >1.0 = maintain distance</span>
                    </div>
                    <div class="control-group">
                        <label>
                            Collision Offset
                            <span class="value-display" id="collision-offset-value">0.0</span>
                        </label>
                        <input type="range" class="range-slider" id="collision-offset" 
                               min="0" max="10" step="0.5" value="0.0">
                        <span class="info-text">Extra spacing between particles (independent of size)</span>
                    </div>
                </div>
            </div>
            
            <!-- 2. PHYSICS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Physics</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            Force Strength
                            <span class="value-display" id="force-strength-value">${this.safeFixed(this.particleSystem.forceFactor, 1, '1.0')}</span>
                        </label>
                        <input type="range" class="range-slider" id="force-strength" 
                               min="0.1" max="10" step="0.1" value="${this.safeValue(this.particleSystem.forceFactor, 1)}">
                    </div>
                    <div class="control-group">
                        <label>
                            Friction
                            <span class="value-display" id="friction-value">${this.safeFixed((1.0 - this.safeValue(this.particleSystem.friction, 0.95)), 2, '0.05')}</span>
                        </label>
                        <input type="range" class="range-slider" id="friction" 
                               min="0" max="0.5" step="0.01" value="${1.0 - this.safeValue(this.particleSystem.friction, 0.95)}">
                    </div>
                    <div class="control-group">
                        <label>
                            Social Radius
                            <span class="value-display" id="social-radius-value">${this.safeValue(this.particleSystem.socialRadius?.[0]?.[0], 50)}</span>
                        </label>
                        <input type="range" class="range-slider" id="social-radius" 
                               min="20" max="300" step="5" value="${this.safeValue(this.particleSystem.socialRadius?.[0]?.[0], 50)}">
                    </div>
                    
                    <!-- Advanced Physics Controls -->
                    <div class="control-group">
                        <label>
                            Environmental Pressure
                            <span class="value-display" id="environmental-pressure-value">0.0</span>
                        </label>
                        <input type="range" class="range-slider" id="environmental-pressure" 
                               min="-0.8" max="0.8" step="0.05" value="0.0">
                        <div class="slider-labels">
                            <span class="slider-label-left">Repel</span>
                            <span class="slider-label-right">Attract</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 3. NOISE Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Noise Patterns</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="noise-enabled" ${this.particleSystem.noiseEnabled ? 'checked' : ''}>
                            Enable Noise
                        </label>
                        <span class="info-text">Adds organic movement patterns to particles</span>
                    </div>
                    
                    <div id="noise-controls" style="${!this.particleSystem.noiseEnabled ? 'display: none;' : ''}">
                        <div class="control-group">
                            <label>Pattern</label>
                            <select id="noise-pattern" class="styled-select">
                                <option value="perlin" ${this.particleSystem.noisePattern === 'perlin' ? 'selected' : ''}>Perlin - Smooth organic flow</option>
                                <option value="simplex" ${this.particleSystem.noisePattern === 'simplex' ? 'selected' : ''}>Simplex - Natural turbulence</option>
                                <option value="curl" ${this.particleSystem.noisePattern === 'curl' ? 'selected' : ''}>Curl - Divergence-free swirls</option>
                                <option value="fbm" ${this.particleSystem.noisePattern === 'fbm' ? 'selected' : ''}>FBM - Fractal layers</option>
                                <option value="ridged" ${this.particleSystem.noisePattern === 'ridged' ? 'selected' : ''}>Ridged - Sharp valleys</option>
                                <option value="worley" ${this.particleSystem.noisePattern === 'worley' ? 'selected' : ''}>Worley - Cell regions</option>
                                <option value="voronoi" ${this.particleSystem.noisePattern === 'voronoi' ? 'selected' : ''}>Voronoi - Organic cells</option>
                                <option value="flow" ${this.particleSystem.noisePattern === 'flow' ? 'selected' : ''}>Flow Field - Directional streams</option>
                                <option value="turbulence" ${this.particleSystem.noisePattern === 'turbulence' ? 'selected' : ''}>Turbulence - Chaotic flow</option>
                                <option value="waves" ${this.particleSystem.noisePattern === 'waves' ? 'selected' : ''}>Waves - Interference patterns</option>
                                <option value="cubic" ${this.particleSystem.noisePattern === 'cubic' ? 'selected' : ''}>Cubic - Smooth interpolation</option>
                                <option value="cellular" ${this.particleSystem.noisePattern === 'cellular' ? 'selected' : ''}>Cellular - Discrete regions</option>
                            </select>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Amplitude
                                <span class="value-display" id="noise-amplitude-value">${(this.particleSystem.noiseGenerator?.globalAmplitude || 0).toFixed(2)}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-amplitude" 
                                   min="0" max="2" step="0.01" value="${this.particleSystem.noiseGenerator?.globalAmplitude || 0}">
                            <span class="info-text">Strength of noise influence on particles</span>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Scale
                                <span class="value-display" id="noise-scale-value">${(this.particleSystem.noiseGenerator?.globalScale || 1.0).toFixed(2)}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-scale" 
                                   min="0.1" max="5.0" step="0.05" value="${this.particleSystem.noiseGenerator?.globalScale || 1.0}">
                            <span class="info-text">Pattern size (lower = larger patterns)</span>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Time Scale
                                <span class="value-display" id="noise-time-scale-value">${(this.particleSystem.noiseGenerator?.globalTimeScale || 1.0).toFixed(3)}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-time-scale" 
                                   min="0" max="2.0" step="0.01" value="${this.particleSystem.noiseGenerator?.globalTimeScale || 1.0}">
                            <span class="info-text">Pattern evolution speed</span>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Contrast
                                <span class="value-display" id="noise-contrast-value">${(this.particleSystem.noiseGenerator?.contrast || 1.0).toFixed(2)}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-contrast" 
                                   min="0.1" max="3.0" step="0.05" value="${this.particleSystem.noiseGenerator?.contrast || 1.0}">
                            <span class="info-text">Pattern sharpness (higher = more defined)</span>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Animation Speed
                                <span class="value-display" id="noise-animation-value">${(this.particleSystem.noiseGenerator?.timeIncrement || 0.01).toFixed(3)}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-animation" 
                                   min="0" max="0.05" step="0.001" value="${this.particleSystem.noiseGenerator?.timeIncrement || 0.01}">
                            <span class="info-text">Time increment per frame (0 = frozen)</span>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Octaves
                                <span class="value-display" id="noise-octaves-value">${this.particleSystem.noiseGenerator?.globalOctaves || 3}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-octaves" 
                                   min="1" max="8" step="1" value="${this.particleSystem.noiseGenerator?.globalOctaves || 3}">
                            <span class="info-text">Number of noise layers (more = finer detail)</span>
                        </div>
                        
                        <div class="control-group">
                            <label>
                                Seed
                                <span class="value-display" id="noise-seed-value">${this.particleSystem.noiseGenerator?.seed || 0}</span>
                            </label>
                            <div class="input-group">
                                <input type="number" class="number-input" id="noise-seed" 
                                       min="0" max="2147483647" 
                                       value="${this.particleSystem.noiseGenerator?.seed || 0}">
                                <button id="noise-seed-random" class="action-button small">Random</button>
                            </div>
                            <span class="info-text">Pattern seed for consistent noise</span>
                        </div>
                        
                        <div class="control-group" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px;">
                            <label>
                                <input type="checkbox" id="noise-vector-enabled" ${(this.particleSystem.noiseVectorEnabled || false) ? 'checked' : ''}>
                                Show Noise Vector Field
                            </label>
                            <span class="info-text">Visualize noise forces as directional vectors</span>
                        </div>
                        
                        <div class="control-group" id="noise-vector-controls" style="${(this.particleSystem.noiseVectorEnabled || false) ? '' : 'display: none;'}">
                            <label>
                                Vector Scale
                                <span class="value-display" id="noise-vector-scale-value">${(this.particleSystem.noiseVectorScale || 1.0).toFixed(2)}</span>
                            </label>
                            <input type="range" class="range-slider" id="noise-vector-scale" 
                                   min="0.1" max="3.0" step="0.1" value="${this.particleSystem.noiseVectorScale || 1.0}">
                            <span class="info-text">Size of vector arrows</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 4. BOUNDARY Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Boundary Behavior</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="wrap-around-walls" ${(this.particleSystem.wrapAroundWalls || false) ? 'checked' : ''}>
                            Toroidal Space (Wrap-Around)
                        </label>
                        <span class="info-text">When enabled, particles wrap seamlessly from one edge to the opposite</span>
                    </div>
                    <div class="control-group" id="wall-controls" style="${(this.particleSystem.wrapAroundWalls || false) ? 'display: none;' : ''}">
                        <label>
                            Wall Bounce Damping
                            <span class="value-display" id="wall-bounce-value">${this.particleSystem.wallDamping.toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="wall-bounce" 
                               min="-1.0" max="3.0" step="0.05" value="${this.particleSystem.wallDamping}">
                        <span class="info-text">Controls energy loss when particles hit walls</span>
                    </div>
                    <div class="control-group" id="repulsive-control" style="${(this.particleSystem.wrapAroundWalls || false) ? 'display: none;' : ''}">
                        <label>
                            Boundary Repulsion
                            <span class="value-display" id="repulsive-force-value">${(this.particleSystem.repulsiveForce || 0.3).toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="repulsive-force" 
                               min="0" max="1.0" step="0.05" value="${this.particleSystem.repulsiveForce || 0.3}">
                        <span class="info-text">Pushes particles away from walls to prevent clustering at boundaries</span>
                    </div>
                </div>
            </div>
            
            <!-- 5. MOUSE INTERACTIONS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Mouse Interactions</h4>
                </div>
                <div class="panel-content">
                    <!-- Shockwave Controls -->
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="shockwave-enabled" ${this.particleSystem.shockwaveEnabled ? 'checked' : ''}>
                            Enable Shockwave on Click
                        </label>
                        <span class="info-text">Click on canvas to create particle-repelling shockwaves</span>
                    </div>
                    <div class="control-group" id="shockwave-controls" ${!this.particleSystem.shockwaveEnabled ? 'style="display: none;"' : ''}>
                        <div class="control-group">
                            <label>
                                Shockwave Strength
                                <span class="value-display" id="shockwave-strength-value">${this.particleSystem.shockwaveStrength}</span>
                            </label>
                            <input type="range" class="range-slider" id="shockwave-strength" 
                                   min="10" max="200" step="5" value="${this.particleSystem.shockwaveStrength}">
                        </div>
                        <div class="control-group">
                            <label>
                                Shockwave Size (radius)
                                <span class="value-display" id="shockwave-size-value">${this.particleSystem.shockwaveSize}</span>
                            </label>
                            <input type="range" class="range-slider" id="shockwave-size" 
                                   min="40" max="600" step="10" value="${this.particleSystem.shockwaveSize}">
                        </div>
                        <div class="control-group">
                            <label>
                                Shockwave Falloff
                                <span class="value-display" id="shockwave-falloff-value">${this.particleSystem.shockwaveFalloff.toFixed(1)}</span>
                            </label>
                            <input type="range" class="range-slider" id="shockwave-falloff" 
                                   min="0.5" max="5.0" step="0.1" value="${this.particleSystem.shockwaveFalloff}">
                            <span class="info-text">Higher values = sharper falloff</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 6. FORCE RELATIONSHIPS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Force Relationships</h4>
                </div>
                <div class="panel-content">
                    <!-- Force Pattern Controls -->
                    <div class="control-group">
                        <div class="randomize-buttons-row">
                            <button class="btn btn-secondary btn-sm" id="randomize-forces-btn">
                                Randomize Forces
                            </button>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Force Distribution
                            <span class="value-display" id="force-distribution-value">0.5</span>
                        </label>
                        <input type="range" class="range-slider" id="force-distribution" 
                               min="0" max="1" step="0.1" value="0.5">
                        <div class="slider-labels">
                            <span class="slider-label-left">Uniform</span>
                            <span class="slider-label-right">Edges</span>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>Force Pattern</label>
                        <select class="select" id="force-pattern-selector">
                            <option value="clusters">Clusters</option>
                            <option value="random">Random</option>
                            <option value="predator-prey">Predator-Prey</option>
                            <option value="territorial">Territorial</option>
                            <option value="symbiotic">Symbiotic</option>
                            <option value="cyclic">Cyclic</option>
                        </select>
                    </div>
                    
                    <!-- Dynamic Pattern Parameters Panel (Task 5) -->
                    <div id="pattern-parameters-panel" class="pattern-parameters-panel">
                        <!-- Dynamic parameters will be inserted here -->
                    </div>
                    
                    <!-- Manual Force Adjustment -->
                    <div class="species-selectors">
                        <div class="selector-group">
                            <label>From</label>
                            <select class="select select-sm" id="from-species">
                                <option value="0">Red</option>
                                <option value="1">Green</option>
                                <option value="2">Blue</option>
                                <option value="3">Yellow</option>
                                <option value="4">Purple</option>
                            </select>
                        </div>
                        <div class="selector-group">
                            <label>To</label>
                            <select class="select select-sm" id="to-species">
                                <option value="0">Red</option>
                                <option value="1" selected>Green</option>
                                <option value="2">Blue</option>
                                <option value="3">Yellow</option>
                                <option value="4">Purple</option>
                            </select>
                        </div>
                    </div>
                    <div id="force-graph-container"></div>
                    <button class="btn btn-secondary btn-sm" id="clear-forces-btn" style="width: 100%;">Clear All Forces</button>
                </div>
            </div>
            
            <!-- 7. EFFECTS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Effects</h4>
                </div>
                <div class="panel-content">
                        
                        <!-- Trail Effect -->
                    <div class="effect-group">
                        <div class="control-group">
                            <label>
                                <input type="checkbox" id="trails-enabled" ${this.particleSystem.trailEnabled ? 'checked' : ''}>
                                Enable Trails
                            </label>
                        </div>
                        <div class="control-group" id="trail-controls" style="${!this.particleSystem.trailEnabled ? 'display: none;' : ''}">
                            <div class="control-group">
                                <label>
                                    <input type="checkbox" id="link-all-species-trails" ${this.particleSystem.linkAllSpeciesTrails ? 'checked' : ''}>
                                    Link All Species
                                </label>
                                <span class="info-text">When unchecked, enable exclusion mode</span>
                            </div>
                            
                            <div class="control-group" id="trail-exclusion-container" style="${this.particleSystem.linkAllSpeciesTrails ? 'display: none;' : ''}">
                                <label>
                                    <input type="checkbox" id="trail-exclusion-enabled" ${this.particleSystem.trailExclusionEnabled ? 'checked' : ''}>
                                    Exclude One Species
                                </label>
                                <span class="info-text">Give one species a different trail than all others</span>
                            </div>
                            
                            <div class="control-group" id="trail-species-selector-container" style="${!this.particleSystem.trailExclusionEnabled || this.particleSystem.linkAllSpeciesTrails ? 'display: none;' : ''}">
                                <label>Excluded Species</label>
                                <select class="select select-sm" id="trail-species-selector">
                                    <option value="-1">None</option>
                                    <option value="0" ${this.particleSystem.excludedSpeciesId === 0 ? 'selected' : ''}>Red</option>
                                    <option value="1" ${this.particleSystem.excludedSpeciesId === 1 ? 'selected' : ''}>Green</option>
                                    <option value="2" ${this.particleSystem.excludedSpeciesId === 2 ? 'selected' : ''}>Blue</option>
                                    <option value="3" ${this.particleSystem.excludedSpeciesId === 3 ? 'selected' : ''}>Yellow</option>
                                    <option value="4" ${this.particleSystem.excludedSpeciesId === 4 ? 'selected' : ''}>Purple</option>
                                </select>
                            </div>
                            
                            <div class="control-group">
                                <label>
                                    <span id="trail-length-label">${this.particleSystem.linkAllSpeciesTrails ? 'Trail Length (All Species)' : this.particleSystem.trailExclusionEnabled ? 'Trail Length (Excluded Species Only)' : 'Trail Length (Selected Species)'}</span>
                                    <span class="value-display" id="trail-length-value">${this.particleSystem.blur.toFixed(3)}</span>
                                </label>
                                <input type="range" class="range-slider" id="trail-length" 
                                       min="0" max="100" step="1" value="${this.reverseMapTrailValue(this.particleSystem.blur)}">
                                <span class="info-text">Lower = longer trails</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Per-Species Halo Effect -->
                    <div class="effect-group">
                        <div class="control-group">
                            <label>
                                <input type="checkbox" id="per-species-halo-enabled">
                                Per-Species Halo
                            </label>
                        </div>
                        <div class="control-group" id="per-species-halo-controls" style="display: none;">
                            <label>Halo Species</label>
                            <select class="select select-sm" id="halo-species-selector">
                                <option value="0">Red</option>
                                <option value="1">Green</option>
                                <option value="2">Blue</option>
                                <option value="3">Yellow</option>
                                <option value="4">Purple</option>
                            </select>
                        </div>
                        <div class="control-group" id="per-species-halo-intensity-control" style="display: none;">
                            <label>
                                Halo Intensity
                                <span class="value-display" id="per-species-halo-intensity-value">0.000</span>
                            </label>
                            <input type="range" class="range-slider" id="per-species-halo-intensity" 
                                   min="0.000" max="0.200" step="0.001" value="0.000">
                        </div>
                        <div class="control-group" id="per-species-halo-radius-control" style="display: none;">
                            <label>
                                Halo Radius
                                <span class="value-display" id="per-species-halo-radius-value">1.0</span>
                            </label>
                            <input type="range" class="range-slider" id="per-species-halo-radius" 
                                   min="0.5" max="5.0" step="0.1" value="1.0">
                        </div>
                    </div>
                    
                    <!-- Species Glow Effect -->
                    <div class="effect-group">
                        <div class="control-group">
                            <label>
                                <input type="checkbox" id="species-glow-enabled">
                                Species Glow
                            </label>
                        </div>
                        <div class="control-group" id="species-glow-controls" style="display: none;">
                            <label>Glow Species</label>
                            <select class="select select-sm" id="glow-species-selector">
                                <option value="0">Red</option>
                                <option value="1">Green</option>
                                <option value="2">Blue</option>
                                <option value="3">Yellow</option>
                                <option value="4">Purple</option>
                            </select>
                        </div>
                        <div class="control-group" id="species-glow-size-control" style="display: none;">
                            <label>
                                Glow Size
                                <span class="value-display" id="species-glow-size-value">1.0</span>
                            </label>
                            <input type="range" class="range-slider" id="species-glow-size" 
                                   min="0.5" max="3.0" step="0.1" value="1.0">
                        </div>
                        <div class="control-group" id="species-glow-intensity-control" style="display: none;">
                            <label>
                                Glow Intensity
                                <span class="value-display" id="species-glow-intensity-value">0.0</span>
                            </label>
                            <input type="range" class="range-slider" id="species-glow-intensity" 
                                   min="0.0" max="1.0" step="0.05" value="0.0">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 8. COLORS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Colors</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>Background Mode</label>
                        <select id="background-mode">
                            <option value="solid">Solid Color</option>
                            <option value="sinusoidal">Sinusoidal</option>
                        </select>
                    </div>
                    <div class="control-group" id="solid-background-group">
                        <label>Background Color</label>
                        <input type="color" id="background-color" value="#000000">
                    </div>
                    <div class="control-group" id="sinusoidal-background-group" style="display: none;">
                        <label>First Color</label>
                        <input type="color" id="background-color1" value="#000000">
                        <label>Second Color</label>
                        <input type="color" id="background-color2" value="#001133">
                        <label>Cycle Time (seconds)
                            <span class="value-display" id="background-cycle-time-value">5.0</span>
                        </label>
                        <input type="range" class="range-slider" id="background-cycle-time" 
                               min="0.5" max="30" step="0.1" value="5.0">
                    </div>
                    <div class="control-group">
                        <label>Species Colors</label>
                        <div id="species-colors-container">
                            <!-- Dynamically generated color pickers based on species count -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 9. MODULATIONS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Modulations</h4>
                </div>
                <div class="panel-content">
                    <div class="modulation-add-section">
                        <div class="control-group">
                            <label>Parameter</label>
                            <select id="modulation-parameter" class="select select-sm" style="width: 100%;">
                                <option value="">Select parameter...</option>
                            </select>
                        </div>
                        
                        <div class="control-group" id="modulation-range-controls" style="display: none;">
                            <label>
                                <span id="modulation-range-label">Range</span>
                                <div class="value-display-row">
                                    <span id="modulation-min-value">0.0</span>
                                    <span id="modulation-max-value">1.0</span>
                                </div>
                            </label>
                            <div class="modulation-dual-range" id="modulation-numeric-range" style="position: relative; height: 24px; margin: 8px 0;">
                                <div class="modulation-track" style="position: absolute; top: 11px; left: 0; right: 0; height: 2px; background: var(--bg-primary); border-radius: 1px;"></div>
                                <div class="modulation-fill" id="modulation-range-fill" style="position: absolute; top: 11px; height: 2px; background: var(--accent-primary); border-radius: 1px;"></div>
                                <input type="range" id="modulation-min" class="modulation-slider modulation-slider-min" min="0" max="1" step="0.01" value="0" style="position: absolute; width: 100%; background: transparent; -webkit-appearance: none;">
                                <input type="range" id="modulation-max" class="modulation-slider modulation-slider-max" min="0" max="1" step="0.01" value="1" style="position: absolute; width: 100%; background: transparent; -webkit-appearance: none;">
                            </div>
                            <div id="modulation-color-range" style="display: none;">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input type="color" id="modulation-color-min" style="width: 50px; height: 30px;">
                                    <span style="color: var(--text-tertiary);">→</span>
                                    <input type="color" id="modulation-color-max" style="width: 50px; height: 30px;">
                                </div>
                            </div>
                        </div>
                        
                        <div class="control-group" id="modulation-wave-controls" style="display: none;">
                            <label>Wave Type</label>
                            <select id="modulation-wave-type" class="select select-sm" style="width: 100%;">
                                <option value="sine">Sine (Smooth)</option>
                                <option value="triangle">Triangle (Linear)</option>
                                <option value="sawtooth">Sawtooth (Ramp Up)</option>
                                <option value="square">Square (On/Off)</option>
                                <option value="smooth-square">Smooth Square</option>
                                <option value="exponential">Exponential</option>
                                <option value="logarithmic">Logarithmic</option>
                                <option value="elastic">Elastic</option>
                                <option value="bounce">Bounce</option>
                                <option value="random">Random</option>
                            </select>
                        </div>
                        
                        <div class="control-group" id="modulation-time-controls" style="display: none;">
                            <label>
                                Duration
                                <span class="value-display" id="modulation-time-value">3.0s</span>
                            </label>
                            <input type="range" class="range-slider" id="modulation-time" 
                                   min="0.5" max="20.0" step="0.5" value="3.0">
                        </div>
                        
                        <button class="btn btn-primary" id="add-modulation-btn" style="width: 100%; display: none;">
                            Add Modulation
                        </button>
                    </div>
                    
                    <div class="modulation-list" id="modulation-list" style="margin-top: 15px;">
                        <!-- Active modulations will be listed here -->
                    </div>
                </div>
            </div>
            
            <!-- 10. ASPECT RATIO Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Aspect Ratio</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="aspect-ratio-enabled">
                            Enable Aspect Ratio
                        </label>
                    </div>
                    
                    <div id="aspect-ratio-controls" style="display: none;">
                        <div class="control-group">
                            <label>
                                <input type="checkbox" id="aspect-ratio-stroke">
                                Show Border
                            </label>
                        </div>
                        
                        <div class="control-group">
                            <label>Common Ratios</label>
                            <div class="aspect-ratio-buttons">
                                <button class="ratio-btn" data-ratio="16:9">16:9</button>
                                <button class="ratio-btn" data-ratio="4:3">4:3</button>
                                <button class="ratio-btn" data-ratio="1:1">1:1</button>
                                <button class="ratio-btn" data-ratio="21:9">21:9</button>
                                <button class="ratio-btn" data-ratio="9:16">9:16</button>
                                <button class="ratio-btn" data-ratio="custom">Custom</button>
                            </div>
                        </div>
                        
                        <div class="control-group" id="custom-ratio-controls" style="display: none;">
                            <label>Custom Ratio</label>
                            <div class="custom-ratio-input">
                                <input type="number" id="custom-width" value="16" min="1" max="100" class="input input-sm" style="width: 60px;">
                                <span style="color: var(--text-tertiary);">:</span>
                                <input type="number" id="custom-height" value="9" min="1" max="100" class="input input-sm" style="width: 60px;">
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <label>Canvas Size</label>
                            <select id="canvas-size" class="select select-sm" style="width: 100%;">
                                <option value="fit">Fit to Window</option>
                                <option value="720p">720p (1280×720)</option>
                                <option value="1080p">1080p (1920×1080)</option>
                                <option value="custom-size">Custom Size</option>
                            </select>
                        </div>
                        
                        <div class="control-group" id="custom-size-controls" style="display: none;">
                            <label>Custom Size (pixels)</label>
                            <div class="custom-ratio-input">
                                <input type="number" id="custom-canvas-width" value="1280" min="100" max="4000" class="input input-sm" style="width: 80px;">
                                <span style="color: var(--text-tertiary);">×</span>
                                <input type="number" id="custom-canvas-height" value="720" min="100" max="4000" class="input input-sm" style="width: 80px;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 11. PRESETS & ACTIONS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Presets & Actions</h4>
                </div>
                <div class="panel-content">
                    <!-- Firebase Status -->
                    <div id="firebase-status" style="margin-bottom: var(--space-md); padding: var(--space-sm); background: var(--bg-primary); border-radius: var(--radius-sm); font-size: var(--font-size-xs); text-align: center; color: var(--text-secondary);">
                        <span id="connection-status">Connecting...</span>
                        <span id="preset-count" style="margin-left: var(--space-sm);"></span>
                    </div>
                    
                    <!-- Preset Selector -->
                    <div class="control-group" style="margin-bottom: var(--space-md);">
                        <label>Load Preset</label>
                        <select class="select" id="preset-selector" style="width: 100%;">
                            <option value="">Custom</option>
                        </select>
                    </div>
                    
                    <!-- Preset Name Input -->
                    <div class="control-group" style="margin-bottom: var(--space-md);">
                        <label>Preset Name</label>
                        <input type="text" class="input" id="preset-name-input" placeholder="Enter new preset name" style="width: 100%;">
                    </div>
                    
                    <!-- Save/Update Button -->
                    <button class="btn btn-primary" id="save-preset-btn" style="width: 100%; margin-bottom: var(--space-sm);">
                        Update Preset
                    </button>
                    
                    <!-- Reset Button -->
                    <button class="btn btn-secondary" id="reset-defaults-btn" style="width: 100%;">
                        Reset to Defaults
                    </button>
                    
                    <!-- Status Message -->
                    <div id="preset-save-status" style="margin-top: var(--space-sm); font-size: var(--font-size-xs); color: var(--text-secondary); text-align: center;"></div>
                </div>
            </div>
        `;
        
        // Add enhanced styles
        const style = document.createElement('style');
        style.textContent = `
            /* Aspect ratio specific styles */
            .aspect-ratio-buttons {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
                margin-top: 10px;
            }
            
            .ratio-btn {
                padding: 8px;
                background: var(--bg-elevated);
                border: 1px solid var(--border-default);
                color: var(--text-secondary);
                cursor: pointer;
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                text-align: center;
                transition: all 0.2s;
                border-radius: var(--radius-sm);
            }
            
            .ratio-btn:hover {
                background: var(--bg-interactive-hover);
                color: var(--text-primary);
                border-color: var(--border-subtle);
            }
            
            .ratio-btn.active {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-primary);
            }
            
            .custom-ratio-input {
                display: flex;
                gap: 5px;
                margin-top: 10px;
                align-items: center;
            }
            
            .main-ui-container {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 320px;
                height: auto;
                min-height: calc(100vh - 20px);
                overflow: visible;
                z-index: var(--z-sticky);
                transition: transform var(--transition-normal), opacity var(--transition-normal);
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
            }
            
            body {
                overflow-y: auto;
            }
            
            .main-ui-container.hidden {
                transform: translateX(340px);
                opacity: 0;
            }
            
            /* Panel styling for separated sections */
            .panel {
                background-color: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                padding: 0;
                margin: 0;
            }
            
            .panel-header {
                padding: var(--space-md) var(--space-xl);
                border-bottom: 1px solid var(--border-subtle);
            }
            
            .panel-content {
                padding: var(--space-xl);
            }
            
            /* Legacy section styling (for compatibility) */
            .ui-section,
            .section {
                background-color: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                padding: 0;
                margin: 0;
            }
            
            /* Section titles */
            .section-title {
                font-size: var(--font-size-sm);
                font-weight: 300;
                color: var(--text-primary);
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.03em;
            }
            
            /* Section titles in panel headers should not have extra styling */
            .panel-header .section-title {
                padding: 0;
                border: none;
                background: none;
                border-radius: 0;
            }
            
            /* Legacy section titles (without panel structure) */
            .section > .section-title {
                padding: var(--space-md) var(--space-xl);
                border-bottom: 1px solid var(--border-subtle);
                background: var(--bg-elevated);
                border-radius: var(--radius-md) var(--radius-md) 0 0;
            }
            
            /* Content area for sections */
            .section > .control-group:first-of-type,
            .section > .effect-group:first-of-type,
            .section > .species-selectors:first-of-type,
            .section > button:first-of-type {
                margin-top: var(--space-xl);
            }
            
            .section > * {
                margin-left: var(--space-xl);
                margin-right: var(--space-xl);
            }
            
            
            .section > *:last-child {
                margin-bottom: var(--space-xl);
            }
            
            .panel-title {
                margin: 0;
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-medium);
                color: var(--text-primary);
            }
            
            /* Main header panel styling */
            .main-ui-header {
                background-color: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            
            .main-ui-header .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-md) var(--space-xl);
            }
            
            
            
            .species-selectors {
                display: flex;
                gap: var(--space-md);
                margin-bottom: var(--space-md);
            }
            
            .selector-group {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .selector-group label {
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
            }
            
            .randomize-buttons-row {
                display: flex;
                gap: var(--space-sm);
                width: 100%;
            }
            
            .randomize-buttons-row .btn {
                flex: 1;
            }
            
            .quick-actions-row {
                margin-top: var(--space-md);
                display: flex;
                gap: var(--space-sm);
                justify-content: center;
            }
            
            .quick-actions-row .btn {
                flex: 1;
                max-width: 180px;
            }
            
            .effect-group {
                padding-bottom: var(--space-lg);
                margin-bottom: var(--space-lg);
                border-bottom: 1px solid var(--border-subtle);
            }
            
            .effect-group:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            
            
            .species-color-row {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                margin-bottom: var(--space-xs);
            }
            
            .species-label {
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
                width: 80px;
            }
            
            .species-color {
                width: 32px;
                height: 20px;
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                cursor: pointer;
                background: none;
                padding: 0;
            }
            
            .species-amount {
                flex: 1;
                padding: var(--space-xs);
                font-size: var(--font-size-xs);
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                text-align: center;
            }
            
            .distribution-drawer-container {
                margin-top: var(--space-sm);
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 320px;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .distribution-drawer {
                width: 100% !important;
                height: 213px !important;
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                background: var(--bg-primary);
                cursor: crosshair;
                display: block;
                transition: border-color var(--transition-fast);
                margin-bottom: var(--space-md);
            }
            
            .distribution-drawer:hover {
                border-color: var(--border-strong);
            }
            
            .distribution-controls {
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
            }
            
            .control-row {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                justify-content: space-between;
            }
            
            /* Enhanced species selector - exact match to test page */
            .species-selector-row {
                align-items: center;
                justify-content: center;
            }
            
            .species-buttons {
                display: flex;
                gap: var(--space-xs);
                align-items: center;
                flex: 1;
            }
            
            .species-btn {
                width: 24px;
                height: 20px;
                border-radius: var(--radius-sm);
                border: 1px solid var(--border-default);
                cursor: pointer;
                transition: all var(--transition-fast);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--font-size-xs);
                font-weight: 500;
                color: var(--text-primary);
                background: var(--bg-secondary);
            }
            
            .species-btn:hover {
                border-color: var(--border-strong);
                background: var(--bg-elevated);
            }
            
            .species-btn.active {
                border-color: var(--border-strong);
                background: var(--bg-elevated);
            }
            
            /* Mode indicators */
            .mode-indicator {
                position: absolute;
                top: var(--space-sm);
                left: var(--space-sm);
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 2px var(--space-sm);
                border-radius: var(--radius-sm);
                font-size: var(--font-size-xs);
                pointer-events: none;
            }

            .circle-indicator {
                position: absolute;
                bottom: var(--space-sm);
                right: var(--space-sm);
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 2px var(--space-sm);
                border-radius: var(--radius-sm);
                font-size: var(--font-size-xs);
                pointer-events: none;
                display: none;
            }

            .circle-indicator.visible {
                display: block;
            }
            
            /* Mode and clear button row */
            .mode-and-clear-row {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                justify-content: space-between;
                width: 100%;
            }
            
            /* Enhanced mode buttons - improved visual hierarchy */
            .mode-buttons {
                display: flex;
                gap: var(--space-xs);
                flex-wrap: wrap;
                flex: 1;
            }
            
            .mode-btn {
                padding: var(--space-sm) var(--space-md);
                min-width: 32px;
                height: 24px;
                font-size: var(--font-size-xs);
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                cursor: pointer;
                transition: all var(--transition-fast);
                outline: none;
            }
            
            .mode-btn:hover {
                border-color: var(--border-strong);
                color: var(--text-primary);
            }
            
            .mode-btn.active {
                background: var(--bg-elevated);
                border-color: var(--border-strong);
                color: var(--text-primary);
            }
            
            
            .util-btn {
                padding: var(--space-sm);
                min-width: 24px;
                height: 24px;
                font-size: var(--font-size-xs);
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .util-btn:hover {
                border-color: var(--border-strong);
                color: var(--text-primary);
            }
            
            .clear-btn {
                background: var(--bg-tertiary);
                border-color: var(--border-subtle);
                color: var(--text-tertiary);
            }
            
            .clear-btn:hover {
                border-color: var(--border-strong);
                color: var(--text-primary);
            }
            
            
            .input-sm {
                padding: 3px 6px;
                font-size: var(--font-size-xs);
                height: 24px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                width: 45px;
                text-align: center;
            }
            
            .input-sm:focus {
                outline: none;
                border-color: var(--accent-primary);
                background: var(--bg-primary);
            }
            
            .clear-btn {
                background: var(--accent-danger) !important;
                border-color: var(--accent-danger) !important;
                color: white !important;
            }
            
            
            .range-slider {
                flex: 1;
                margin: 0;
                width: 100%;
            }
            
            .slider-labels {
                display: flex;
                justify-content: space-between;
                margin-top: var(--space-xs);
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
                opacity: 0.6;
            }
            
            /* Override control group label font size to make it smaller */
            .control-group label,
            .panel-content .control-group label {
                font-size: var(--font-size-xs) !important;
                color: var(--text-primary);
            }
            
            .slider-label-left,
            .slider-label-right {
                font-size: var(--font-size-xs);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--text-secondary);
            }
            
            .info-text {
                font-size: var(--font-size-xs);
                color: var(--text-secondary) !important;
                font-style: italic;
            }
            
            /* Pattern Parameters Panel Styles */
            .pattern-parameters-panel {
                display: none;
                background: var(--bg-primary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
                padding: var(--space-md);
                margin-top: var(--space-md);
                margin-bottom: var(--space-md);
            }
            
            .pattern-parameters-header {
                margin-bottom: var(--space-md);
                padding-bottom: var(--space-sm);
                border-bottom: 1px solid var(--border-default);
            }
            
            .pattern-parameters-header h5 {
                margin: 0;
                font-size: var(--font-size-md);
                font-weight: var(--font-weight-medium);
                color: var(--text-primary);
            }
            
            .pattern-parameters-panel .control-group {
                margin-bottom: var(--space-md);
            }
            
            .pattern-parameters-panel .control-group:last-child {
                margin-bottom: 0;
            }
            
            .pattern-parameters-panel .range-slider {
                margin-top: var(--space-xs);
            }
            
            .pattern-parameters-panel .select {
                width: 100%;
                margin-top: var(--space-xs);
            }
            
            /* Pattern Parameter Tooltips and Documentation */
            .pattern-description {
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
                margin: var(--space-xs) 0 var(--space-md) 0;
                font-style: italic;
            }
            
            .tooltip-icon {
                color: var(--text-tertiary);
                font-size: var(--font-size-xs);
                margin-left: var(--space-xs);
                cursor: help;
                opacity: 0.7;
                transition: opacity 0.2s ease;
                font-weight: normal;
            }
            
            .tooltip-icon:hover {
                opacity: 1;
                color: var(--accent-primary);
            }
            
            .slider-labels {
                display: flex;
                justify-content: space-between;
                margin-top: var(--space-xs);
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
            }
            
            .slider-label-left,
            .slider-label-right {
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
            }
            
            /* Pattern Preset Buttons */
            .preset-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-xs);
                margin-top: var(--space-xs);
            }
            
            .preset-btn {
                font-size: var(--font-size-xs);
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }
            
            .preset-btn:hover {
                background: var(--bg-tertiary);
                border-color: var(--accent-primary);
                color: var(--accent-primary);
            }
            
            .preset-btn:active {
                transform: translateY(1px);
                background: var(--accent-primary);
                color: var(--text-on-accent);
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.container);
        
        // Initialize XY Graph
        this.forceGraph = new XYGraph('force-graph-container', {
            width: 288,
            height: 120,
            minX: -5,
            maxX: 5,
            labelX: 'Force',
            gradientColors: ['#cc6666', '#999999', '#66cc66'],
            gridLines: 5,
            showTooltip: true,
            onChange: (value) => {
                const fromSpecies = parseInt(document.getElementById('from-species').value);
                const toSpecies = parseInt(document.getElementById('to-species').value);
                this.particleSystem.setSocialForce(fromSpecies, toSpecies, value);
                this.updateGraphInfo();
                this.triggerAutoSave();
            }
        });
        
        // Initialize Distribution Drawer
        const distributionCanvas = document.getElementById('distribution-canvas');
        
        // Set canvas size to match simulation aspect ratio for accurate preview
        this.setupDistributionCanvasSize(distributionCanvas);
        
        this.distributionDrawer = new DistributionDrawer(distributionCanvas, this.particleSystem, {
            compact: true,
            onChange: (distribution) => {
                this.applyDistributionToParticleSystem();
                this.triggerAutoSave();
            }
        });
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Handle window resize to update distribution canvas
        window.addEventListener('resize', () => {
            // Wait a bit for canvas resize to complete
            setTimeout(() => {
                if (this.distributionDrawer) {
                    const distributionCanvas = document.getElementById('distribution-canvas');
                    this.setupDistributionCanvasSize(distributionCanvas);
                    this.distributionDrawer.resize();
                }
            }, 100);
        });
        
        // Set initial values
        this.updateUIFromParticleSystem();
        this.updateSpeciesColors(this.particleSystem.numSpecies);
        this.updateGraph();
        
        // Initialize pattern parameters panel with default pattern
        const initialPattern = document.getElementById('force-pattern-selector').value;
        this.updatePatternParametersPanel(initialPattern);
        
        // Restore UI state from UI state manager if available
        this.restoreUIState();
        
        // Validate all UI elements are properly created
        this.validateUIElements();
        
        // Test parameter system after short delay to ensure DOM is ready
        setTimeout(() => {
            // Parameter system ready
        }, 2000); // Give more time for initialization
    }
    
    triggerAutoSave() {
        // Update pending modulations on particle system for persistence
        if (this.modulationManager && this.particleSystem) {
            const modConfig = this.modulationManager.exportConfig();
            if (modConfig && modConfig.length > 0) {
                this.particleSystem.pendingModulations = modConfig;
            } else {
                this.particleSystem.pendingModulations = [];
            }
        }
        
        if (this.autoSaveCallback) {
            this.autoSaveCallback();
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip shortcuts if an input field is focused
            if (document.activeElement && 
                (document.activeElement.tagName === 'INPUT' || 
                 document.activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            // Handle Shift+Plus and Shift+Minus for preset navigation
            if (e.shiftKey) {
                // Plus key can be '=' with shift or '+' depending on keyboard
                // Minus key is usually '-' even with shift
                if (e.key === '+' || e.key === '=' || e.code === 'Equal') {
                    this.loadNextPreset();
                    e.preventDefault();
                    return;
                } else if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
                    this.loadPreviousPreset();
                    e.preventDefault();
                    return;
                }
            }
            
            // Skip shortcuts if other modifier keys are pressed
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            
            switch(e.key.toLowerCase()) {
                case 'c':
                    // Toggle controls
                    this.toggleVisibility();
                    e.preventDefault();
                    break;
                case 'r':
                    this.randomizeForces();
                    this.triggerAutoSave();
                    e.preventDefault();
                    break;
                case 'v':
                    this.randomizeValues();
                    this.triggerAutoSave();
                    e.preventDefault();
                    break;
                case 'm':
                    this.toggleMute();
                    e.preventDefault();
                    break;
            }
        });
    }
    
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
        
        // Also toggle combined overlay visibility (shortcuts + performance)
        const combinedOverlay = document.getElementById('combined-overlay');
        if (combinedOverlay) {
            combinedOverlay.style.display = this.isVisible ? 'flex' : 'none';
        }
        
        // Keep the old shortcuts overlay reference for backward compatibility
        const shortcutsOverlay = document.getElementById('shortcuts-overlay');
        if (shortcutsOverlay) {
            shortcutsOverlay.style.display = this.isVisible ? 'block' : 'none';
        }
    }
    
    toggleMute() {
        const isMuted = this.particleSystem.toggleMute();
        
        // Visual feedback - show mute state in console for debugging
        console.log(`System ${isMuted ? 'MUTED' : 'UNMUTED'} - Audio also ${isMuted ? 'MUTED' : 'UNMUTED'}`);
        
        // MUTED status display has been removed from performance overlays
    }
    
    
    initializeFirebaseStatus() {
        const statusElement = document.getElementById('connection-status');
        const countElement = document.getElementById('preset-count');
        
        // Initial status
        this.updateFirebaseStatus();
        
        // Update status periodically
        setInterval(() => {
            this.updateFirebaseStatus();
        }, 2000);
        
        // Listen for preset updates
        window.addEventListener('presetsUpdated', () => {
            this.updateFirebaseStatus();
        });
    }
    
    updateFirebaseStatus() {
        const statusElement = document.getElementById('connection-status');
        const countElement = document.getElementById('preset-count');
        
        if (!statusElement || !countElement) return;
        
        const isConnected = this.presetManager.isCloudEnabled();
        
        if (isConnected) {
            // Get the cloud preset count directly from the presetManager's cloudPresets Map
            const cloudStatus = this.presetManager.getCloudStatus();
            const cloudPresetCount = cloudStatus.presetCount || 0;
            
            // Alternative: count presets with isCloud flag
            const allPresets = this.presetManager.getUserPresets();
            const cloudPresets = allPresets.filter(p => p.isCloud || p.key?.startsWith('cloud_'));
            const displayCount = Math.max(cloudPresetCount, cloudPresets.length);
            
            statusElement.textContent = '✅ Connected';
            statusElement.style.color = 'var(--success-color, #4a9eff)';
            countElement.textContent = `${displayCount} cloud presets`;
        } else {
            statusElement.textContent = '⚠️ Connecting...';
            statusElement.style.color = 'var(--warning-color, #ffa500)';
            countElement.textContent = '';
        }
    }
    
    updateSaveButton() {
        const saveBtn = document.getElementById('save-preset-btn');
        const presetNameInput = document.getElementById('preset-name-input');
        const presetSelector = document.getElementById('preset-selector');
        
        if (!saveBtn || !presetNameInput) return;
        
        const newName = presetNameInput.value.trim();
        const hasNewName = newName.length > 0;
        const currentPresetKey = this.currentEditingPreset || presetSelector.value;
        
        if (hasNewName) {
            // User entered a new name - save as new preset
            saveBtn.textContent = 'Save New Preset';
            saveBtn.className = 'btn btn-primary';
        } else if (currentPresetKey && currentPresetKey !== '') {
            // No new name but preset selected - update mode
            saveBtn.textContent = 'Update Preset';
            saveBtn.className = 'btn btn-secondary';
        } else {
            // No preset selected and no name - disabled
            saveBtn.textContent = 'Enter Name to Save';
            saveBtn.disabled = true;
            return;
        }
        
        saveBtn.disabled = false;
    }
    
    async savePreset() {
        const presetNameInput = document.getElementById('preset-name-input');
        const statusDiv = document.getElementById('preset-save-status');
        const presetSelector = document.getElementById('preset-selector');
        
        const newPresetName = presetNameInput.value.trim();
        const currentPresetKey = this.currentEditingPreset || presetSelector.value;
        
        // Determine if we're updating or creating new
        const isNewPreset = newPresetName.length > 0;
        
        if (!isNewPreset && !currentPresetKey) {
            statusDiv.textContent = '❌ Please select a preset or enter a new name';
            statusDiv.style.color = '#ff4444';
            return;
        }
        
        // Check for invalid preset names if creating new
        if (isNewPreset && this.isInvalidPresetName(newPresetName)) {
            statusDiv.textContent = '❌ Cannot use system preset names';
            statusDiv.style.color = '#ff4444';
            alert('Cannot save presets named "Custom", "New Preset", "Untitled", or "Default". Please choose a different name.');
            return;
        }
        
        try {
            // Export current state as preset
            const preset = this.particleSystem.exportPreset();
            
            // Include modulations if they exist
            if (this.modulationManager) {
                preset.modulations = this.modulationManager.exportConfig();
            }
            
            let saveKey;
            let statusMessage;
            
            if (isNewPreset) {
                // Creating new preset with the provided name
                preset.name = newPresetName;
                saveKey = this.presetManager.generateUniqueKey(newPresetName);
                statusMessage = '⏳ Saving new preset...';
            } else {
                // Updating existing preset
                const currentPreset = this.presetManager.getPreset(currentPresetKey);
                if (currentPreset) {
                    preset.name = currentPreset.name; // Keep original name
                    saveKey = currentPresetKey;
                    statusMessage = '⏳ Updating preset...';
                } else {
                    throw new Error('Selected preset not found');
                }
            }
            
            statusDiv.textContent = statusMessage;
            statusDiv.style.color = '#888';
            
            // Save the preset
            await this.presetManager.savePreset(saveKey, preset);
            
            // Update the UI
            this.currentEditingPreset = saveKey;
            statusDiv.textContent = isNewPreset ? '✅ New preset saved!' : '✅ Preset updated!';
            statusDiv.style.color = '#4a9eff';
            
            // Update preset selector
            this.updatePresetSelector();
            
            // Select the saved preset
            presetSelector.value = saveKey;
            
            // Clear the name input if it was a new preset
            if (isNewPreset) {
                presetNameInput.value = '';
                this.updateSaveButton();
            }
            
            // Clear status after 3 seconds
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
            
        } catch (error) {
            console.error('Failed to save preset:', error);
            statusDiv.textContent = '❌ Save failed: ' + error.message;
            statusDiv.style.color = '#ff4444';
        }
    }
    
    isInvalidPresetName(name) {
        if (!name || typeof name !== 'string') return true;
        
        // Normalize name for comparison
        const normalizedName = name.trim().toLowerCase();
        
        // Block various forms of invalid names
        const invalidNames = [
            'custom',
            'new preset',
            'untitled',
            'default',
            '',
            'preset'
        ];
        
        return invalidNames.includes(normalizedName);
    }
    
    randomizeForces() {
        // Enhanced force randomization with sophisticated pattern selection
        const edgeBias = this.forceDistribution || 0.7; // Default to cluster-friendly bias
        const patterns = ['clusters', 'predator-prey', 'territorial', 'symbiotic', 'cyclic'];
        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // Update UI to reflect the selected pattern
        const patternSelector = document.getElementById('force-pattern-selector');
        if (patternSelector) {
            patternSelector.value = selectedPattern;
        }
        
        // Update parameter panel to show default parameters for this pattern
        this.updatePatternParametersPanel(selectedPattern);
        
        // Apply the pattern with default parameters using the new system
        this.particleSystem.applyForcePattern(selectedPattern, edgeBias, {});
        
        // Also randomize collision parameters for complete dynamics overhaul
        this.particleSystem.collisionRadius = this.particleSystem.createMatrix(8, 40);
        this.particleSystem.collisionForce = this.particleSystem.createMatrix(-2.5, -0.2);
        
        this.updateGraph();
        
        // Enhanced visual feedback with pattern name
        const btn = document.getElementById('randomize-forces-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `✓ ${selectedPattern.charAt(0).toUpperCase() + selectedPattern.slice(1).replace('-', ' ')}!`;
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }
    
    randomizeValues() {
        // Clusters-inspired random parameter generation focused on emergent physics
        const { scenario, params } = this.generateClustersLikeParams();
        
        // Apply physics-focused parameters
        this.applyClustersParams(params);
        
        // Generate initial distribution pattern for all species
        this.generateComplexInitialDistribution(scenario);
        
        // Randomize background color based on scenario
        this.randomizeBackgroundColor(scenario);
        
        // Update UI to reflect changes
        this.updateUIFromParticleSystem();
        this.updateGraph();
        
        // Visual feedback removed - button no longer exists
    }
    
    // Clusters-inspired random parameter generation
    generateClustersLikeParams() {
        const scenarios = [
            'clusters',  // NEW: Stable cluster formations
            'swarm',     // High mobility, coordinated movement
            'predator',  // Clear chase dynamics
            'crystal',   // Structured formations
            'organic',   // Fluid, natural patterns
            'chaotic',   // High energy, unstable
            'minimal'    // Simple, clean behaviors
        ];
        
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const params = {};
        
        switch(scenario) {
            case 'clusters':
                params.particlesPerSpecies = 120 + Math.random() * 180; // Optimized for cluster formation
                params.numSpecies = 4 + Math.floor(Math.random() * 3); // 4-6 species for complex clustering
                params.forceFactor = 1.5 + Math.random() * 2.0; // Stronger forces for stable clusters
                params.friction = 0.94 + Math.random() * 0.04; // Higher friction for stability
                params.socialRadius = 70 + Math.random() * 80; // Optimized social interaction range
                params.collisionRadius = 12 + Math.random() * 18; // Enhanced collision dynamics
                params.forceDistribution = 0.75; // Edge-biased for distinct clustering
                params.environmentPressure = -0.2 + Math.random() * 0.3; // Slight environmental influence
                params.chaosLevel = Math.random() * 0.15; // Low chaos for stable patterns
                params.forcePattern = 'clusters';
                break;
                
            case 'swarm':
                params.particlesPerSpecies = 200 + Math.random() * 300;
                params.numSpecies = 3 + Math.floor(Math.random() * 3);
                params.forceFactor = 2.0 + Math.random() * 3.0;
                params.friction = 0.85 + Math.random() * 0.1; // Low friction
                params.socialRadius = 100 + Math.random() * 200;
                params.forceDistribution = 0.3; // More uniform forces
                break;
                
            case 'predator':
                params.particlesPerSpecies = 100 + Math.random() * 200;
                params.numSpecies = 2 + Math.floor(Math.random() * 3);
                params.forceFactor = 3.0 + Math.random() * 4.0;
                params.friction = 0.9 + Math.random() * 0.08;
                params.forceDistribution = 0.8; // Strong asymmetry
                break;
                
            case 'crystal':
                params.particlesPerSpecies = 150 + Math.random() * 150;
                params.numSpecies = 3 + Math.floor(Math.random() * 2);
                params.forceFactor = 1.0 + Math.random() * 2.0;
                params.friction = 0.95 + Math.random() * 0.04; // High friction
                params.socialRadius = 50 + Math.random() * 100;
                params.forceDistribution = 0.5;
                break;
                
            case 'organic':
                params.particlesPerSpecies = 180 + Math.random() * 220;
                params.numSpecies = 4 + Math.floor(Math.random() * 4);
                params.forceFactor = 1.5 + Math.random() * 2.5;
                params.friction = 0.88 + Math.random() * 0.1;
                params.socialRadius = 80 + Math.random() * 150;
                params.forceDistribution = 0.6 + Math.random() * 0.2;
                break;
                
            case 'chaotic':
                params.particlesPerSpecies = 50 + Math.random() * 400;
                params.numSpecies = 5 + Math.floor(Math.random() * 10);
                params.forceFactor = 4.0 + Math.random() * 6.0;
                params.friction = 0.8 + Math.random() * 0.15;
                params.socialRadius = 50 + Math.random() * 300;
                params.forceDistribution = 0.7 + Math.random() * 0.3;
                break;
                
            case 'minimal':
                params.particlesPerSpecies = 50 + Math.random() * 100;
                params.numSpecies = 2;
                params.forceFactor = 0.5 + Math.random() * 1.5;
                params.friction = 0.9 + Math.random() * 0.08;
                params.socialRadius = 80 + Math.random() * 80;
                params.forceDistribution = 0.4 + Math.random() * 0.4;
                break;
        }
        
        // Always set physics-focused parameters (not visual effects)
        params.collisionRadius = 5 + Math.random() * 30;
        params.wallDamping = 0.7 + Math.random() * 0.5;
        params.trailEnabled = Math.random() > 0.3;
        params.blur = 0.88 + Math.random() * 0.11; // Focus on high trail values
        
        return { scenario, params };
    }
    
    applyClustersParams(params) {
        // Apply enhanced physics parameters for sophisticated emergent behaviors
        if (params.numSpecies) {
            this.particleSystem.setSpeciesCount(params.numSpecies);
        }
        if (params.particlesPerSpecies) {
            this.particleSystem.particlesPerSpecies = Math.floor(params.particlesPerSpecies);
        }
        if (params.forceFactor) {
            this.particleSystem.forceFactor = params.forceFactor;
        }
        if (params.friction) {
            this.particleSystem.friction = 1.0 - params.friction; // Convert UI to physics
        }
        if (params.socialRadius) {
            // Update all social radius values
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    this.particleSystem.socialRadius[i][j] = params.socialRadius;
                }
            }
        }
        if (params.collisionRadius) {
            // Update all collision radius values
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    this.particleSystem.collisionRadius[i][j] = params.collisionRadius;
                }
            }
        }
        // New enhanced parameters
        if (params.environmentPressure !== undefined) {
            this.particleSystem.environmentPressure = params.environmentPressure;
        }
        if (params.chaosLevel !== undefined) {
            this.particleSystem.chaosLevel = params.chaosLevel;
        }
        if (params.forcePattern) {
            // Apply sophisticated force patterns
            const edgeBias = params.forceDistribution || 0.7;
            this.particleSystem.socialForce = this.particleSystem.createForcePattern(params.forcePattern, edgeBias);
        }
        if (params.wallDamping) {
            this.particleSystem.wallDamping = params.wallDamping;
        }
        if (params.trailEnabled !== undefined) {
            this.particleSystem.trailEnabled = params.trailEnabled;
        }
        if (params.blur) {
            this.particleSystem.blur = params.blur;
        }
        if (params.forceDistribution) {
            this.forceDistribution = params.forceDistribution;
            // Apply force pattern with this distribution
            if (params.forcePattern) {
                // Use specific force pattern (e.g., 'clusters')
                this.particleSystem.socialForce = this.particleSystem.createForcePattern(params.forcePattern, params.forceDistribution);
            } else {
                // Use default asymmetric matrix
                this.particleSystem.socialForce = this.particleSystem.createAsymmetricMatrixWithDistribution(params.forceDistribution);
            }
        }
        
        // Reinitialize particles with new configuration
        this.particleSystem.initializeParticles();
    }
    
    loadNextPreset() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;
        
        const options = Array.from(selector.options);
        if (options.length <= 1) return; // Only Custom option exists
        
        const currentIndex = selector.selectedIndex;
        
        // Calculate next index, skipping Custom (index 0)
        let nextIndex = currentIndex + 1;
        if (nextIndex >= options.length) {
            nextIndex = 1; // Wrap to first real preset (skip Custom at index 0)
        } else if (nextIndex === 0) {
            nextIndex = 1; // Skip Custom
        }
        
        // Apply the preset
        if (nextIndex < options.length && options[nextIndex]) {
            selector.selectedIndex = nextIndex;
            const presetKey = options[nextIndex].value;
            
            if (presetKey) {
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    console.log(`Loading next preset: ${preset.name} (index ${nextIndex})`);
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                    this.currentEditingPreset = presetKey;
                    
                    // Update modulation system for new preset
                    // Note: modulations are already imported by loadFullPreset, 
                    // and onPresetChanged is called which updates the list
                    if (this.modulationManager) {
                        this.updateModulationParameterOptions();
                    }
                }
            }
        }
    }
    
    loadPreviousPreset() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;
        
        const options = Array.from(selector.options);
        if (options.length <= 1) return; // Only Custom option exists
        
        const currentIndex = selector.selectedIndex;
        
        // Calculate previous index, skipping Custom (index 0)
        let prevIndex = currentIndex - 1;
        if (prevIndex <= 0) {
            prevIndex = options.length - 1; // Wrap to last preset
        }
        
        // Apply the preset
        if (prevIndex > 0 && options[prevIndex]) {
            selector.selectedIndex = prevIndex;
            const presetKey = options[prevIndex].value;
            
            if (presetKey) {
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    console.log(`Loading previous preset: ${preset.name} (index ${prevIndex})`);
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                    this.currentEditingPreset = presetKey;
                    
                    // Update modulation system for new preset
                    // Note: modulations are already imported by loadFullPreset, 
                    // and onPresetChanged is called which updates the list
                    if (this.modulationManager) {
                        this.updateModulationParameterOptions();
                    }
                }
            }
        }
    }
    
    generateRandomParams(scenario) {
        const random = (min, max) => min + Math.random() * (max - min);
        const randomInt = (min, max) => Math.floor(random(min, max + 1));
        const choice = (array) => array[Math.floor(Math.random() * array.length)];
        
        // Add variation factors to ensure uniqueness
        const variationSeed = Math.random();
        const complexityFactor = 0.7 + variationSeed * 0.6; // 0.7 to 1.3 multiplier
        
        let params = {};
        
        switch (scenario) {
            case 'clusters':
                params = {
                    particlesPerSpecies: randomInt(100, 250),
                    numSpecies: randomInt(3, 6),
                    forceFactor: random(1.0, 2.5),
                    friction: random(0.12, 0.18), // High friction for stability
                    wallDamping: random(0.8, 1.2),
                    collisionRadius: randomInt(8, 20),
                    socialRadius: randomInt(60, 140),
                    particleSize: random(2.0, 5.0),
                    trailEnabled: choice([true, true, false]), // Favor trails
                    blur: random(0.88, 0.96),
                    glowIntensity: random(0.2, 0.5),
                    forcePattern: 'clusters' // Use clusters force pattern
                };
                break;
                
            case 'swarms':
                params = {
                    particlesPerSpecies: Math.round(randomInt(200, 500) * complexityFactor),
                    numSpecies: randomInt(3, 8),
                    forceFactor: random(1.5, 4.0) * complexityFactor,
                    friction: random(0.02, 0.08), // UI value
                    wallDamping: random(0.6, 1.2),
                    collisionRadius: Math.round(randomInt(8, 20) * complexityFactor),
                    socialRadius: Math.round(randomInt(80, 200) * complexityFactor),
                    particleSize: random(1.5, 4.0),
                    trailEnabled: choice([true, false]),
                    blur: random(0.85, 0.95),
                    glowIntensity: random(0.1, 0.4)
                };
                break;
                
            case 'crystals':
                params = {
                    particlesPerSpecies: randomInt(100, 300),
                    numSpecies: randomInt(2, 4),
                    forceFactor: random(0.8, 2.0),
                    friction: random(0.15, 0.2), // High friction for stability
                    wallDamping: random(0.8, 1.5),
                    collisionRadius: randomInt(15, 35),
                    socialRadius: randomInt(40, 120),
                    particleSize: random(2.0, 6.0),
                    trailEnabled: choice([true, true, false]), // Favor trails
                    blur: random(0.92, 0.98),
                    glowIntensity: random(0.3, 0.7)
                };
                break;
                
            case 'plasma':
                params = {
                    particlesPerSpecies: randomInt(150, 400),
                    numSpecies: randomInt(4, 8),
                    forceFactor: random(3.0, 8.0),
                    friction: random(0.01, 0.05), // Low friction for energy
                    wallDamping: random(0.4, 0.8),
                    collisionRadius: randomInt(5, 15),
                    socialRadius: randomInt(60, 250),
                    particleSize: random(1.0, 3.5),
                    trailEnabled: true, // Always trails for plasma
                    blur: random(0.75, 0.88),
                    renderMode: 'dreamtime',
                    glowIntensity: random(0.6, 1.0),
                    glowRadius: random(2.5, 4.5)
                };
                break;
                
            case 'organic':
                params = {
                    particlesPerSpecies: randomInt(120, 280),
                    numSpecies: randomInt(3, 7),
                    forceFactor: random(0.8, 2.5),
                    friction: random(0.08, 0.15),
                    wallDamping: random(0.7, 1.1),
                    collisionRadius: randomInt(10, 25),
                    socialRadius: randomInt(50, 150),
                    particleSize: random(2.0, 5.0),
                    trailEnabled: choice([true, true, true, false]), // Mostly trails
                    blur: random(0.88, 0.95),
                    glowIntensity: random(0.2, 0.5)
                };
                break;
                
            case 'chaos':
                params = {
                    particlesPerSpecies: Math.round(randomInt(50, 800) * complexityFactor),
                    numSpecies: randomInt(2, 15),
                    forceFactor: random(0.2, 10.0) * (0.5 + complexityFactor),
                    friction: random(0.0, 0.2),
                    wallDamping: random(0.2, 2.0),
                    collisionRadius: Math.round(randomInt(1, 80) * complexityFactor),
                    socialRadius: Math.round(randomInt(20, 400) * complexityFactor),
                    particleSize: random(0.5, 15.0),
                    trailEnabled: choice([true, false]),
                    blur: random(0.5, 0.99),
                    glowIntensity: random(0.0, 1.0)
                };
                break;
                
            case 'minimal':
                params = {
                    particlesPerSpecies: randomInt(30, 100),
                    numSpecies: randomInt(2, 4),
                    forceFactor: random(0.5, 1.5),
                    friction: random(0.1, 0.18),
                    wallDamping: random(0.8, 1.2),
                    collisionRadius: randomInt(12, 30),
                    socialRadius: randomInt(60, 120),
                    particleSize: random(3.0, 8.0),
                    trailEnabled: choice([true, false, false]), // Prefer no trails
                    blur: random(0.9, 0.97),
                    glowIntensity: random(0.0, 0.3)
                };
                break;
                
            case 'dreamscape':
                params = {
                    particlesPerSpecies: randomInt(80, 200),
                    numSpecies: randomInt(3, 6),
                    forceFactor: random(0.3, 1.2),
                    friction: random(0.12, 0.18),
                    wallDamping: random(0.6, 0.9),
                    collisionRadius: randomInt(8, 20),
                    socialRadius: randomInt(80, 180),
                    particleSize: random(2.5, 6.0),
                    trailEnabled: true,
                    blur: random(0.92, 0.97),
                    renderMode: 'dreamtime',
                    glowIntensity: random(0.7, 0.9),
                    glowRadius: random(3.0, 4.5),
                    speciesGlowEnabled: true
                };
                break;
        }
        
        return { ...params, scenario };
    }
    
    getUniqueScenario(scenarios) {
        // Initialize recent scenarios tracking if not exists
        if (!this.recentScenarios) {
            this.recentScenarios = [];
        }
        
        // If we've used all scenarios recently, reset the history
        if (this.recentScenarios.length >= scenarios.length - 1) {
            this.recentScenarios = [];
        }
        
        // Find scenarios not used recently
        const availableScenarios = scenarios.filter(s => !this.recentScenarios.includes(s));
        
        // Safety check - if no available scenarios, use all scenarios
        const scenariosToChooseFrom = availableScenarios.length > 0 ? availableScenarios : scenarios;
        
        // Pick a random scenario from available ones
        const selectedScenario = scenariosToChooseFrom[Math.floor(Math.random() * scenariosToChooseFrom.length)];
        
        // Add to recent history only if it's not already there
        if (!this.recentScenarios.includes(selectedScenario)) {
            this.recentScenarios.push(selectedScenario);
        }
        
        // Scenario selected
        
        return selectedScenario;
    }
    
    applyRandomizedParams(params, scenario) {
        // Apply particle system parameters
        if (params.numSpecies) {
            this.particleSystem.setSpeciesCount(params.numSpecies);
        }
        
        if (params.particlesPerSpecies) {
            this.particleSystem.particlesPerSpecies = params.particlesPerSpecies;
            // Update species particle counts
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                if (this.particleSystem.species[i]) {
                    this.particleSystem.species[i].particleCount = params.particlesPerSpecies;
                }
            }
            this.particleSystem.initializeParticlesWithPositions();
        }
        
        if (params.forceFactor) {
            this.particleSystem.forceFactor = params.forceFactor;
        }
        
        if (params.friction !== undefined) {
            this.particleSystem.friction = 1.0 - params.friction; // Convert UI to physics
        }
        
        if (params.wallDamping) {
            this.particleSystem.wallDamping = params.wallDamping;
        }
        
        if (params.collisionRadius) {
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    if (this.particleSystem.collisionRadius[i]) {
                        this.particleSystem.collisionRadius[i][j] = params.collisionRadius;
                    }
                }
            }
        }
        
        if (params.socialRadius) {
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    if (this.particleSystem.socialRadius[i]) {
                        this.particleSystem.socialRadius[i][j] = params.socialRadius;
                    }
                }
            }
        }
        
        if (params.particleSize) {
            this.particleSystem.particleSize = params.particleSize;
            // Update all species sizes
            if (this.particleSystem.species && this.particleSystem.species.length > 0) {
                for (let i = 0; i < this.particleSystem.species.length; i++) {
                    if (this.particleSystem.species[i]) {
                        this.particleSystem.species[i].size = params.particleSize;
                    }
                }
            }
        }
        
        if (params.trailEnabled !== undefined) {
            this.particleSystem.trailEnabled = params.trailEnabled;
        }
        
        if (params.blur) {
            this.particleSystem.blur = params.blur;
        }
        
        if (params.renderMode) {
            this.particleSystem.renderMode = params.renderMode;
        }
        
        if (params.glowIntensity !== undefined) {
            this.particleSystem.glowIntensity = params.glowIntensity;
        }
        
        if (params.glowRadius) {
            this.particleSystem.glowRadius = params.glowRadius;
        }
        
        // Randomize force matrix for interesting interactions
        this.particleSystem.socialForce = this.particleSystem.createAsymmetricMatrix();
        
        // Apply special glow effects for certain scenarios
        if (params.speciesGlowEnabled || scenario === 'plasma' || scenario === 'dreamscape') {
            const numGlowing = Math.min(3, this.particleSystem.numSpecies);
            for (let i = 0; i < numGlowing; i++) {
                const intensity = 0.3 + Math.random() * 0.5;
                const size = 1.2 + Math.random() * 1.3;
                this.particleSystem.setSpeciesGlow(i, { intensity, size });
            }
        }
        
        // Randomize background color with complementary tones
        this.randomizeBackgroundColor(scenario);
        
        // Generate sophisticated initial distribution patterns
        this.generateComplexInitialDistribution(scenario);
        
        // Generate new random colors for variety
        this.randomizeSpeciesColors();
        
        // Ensure mutual exclusion of halo and glow effects
        // Wait a moment for all UI elements to be updated first
        setTimeout(() => {
            this.enforceEffectMutualExclusion();
        }, 50);
        
        // Clear caches to ensure visual updates
        this.particleSystem.clearCaches();
    }
    
    randomizeSpeciesColors() {
        // Professional color palettes inspired by design systems
        const colorPalettes = [
            // Nature inspired
            () => this.getProfessionalPalette('nature'),
            // Ocean/Water themes
            () => this.getProfessionalPalette('ocean'),
            // Sunset/Warm themes
            () => this.getProfessionalPalette('sunset'),
            // Neon/Electric themes
            () => this.getProfessionalPalette('neon'),
            // Pastel/Soft themes
            () => this.getProfessionalPalette('pastel'),
            // Monochrome with accent
            () => this.getProfessionalPalette('monochrome'),
            // Retro/Vintage themes
            () => this.getProfessionalPalette('retro'),
            // Deep space themes
            () => this.getProfessionalPalette('space')
        ];
        
        const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]();
        
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            if (this.particleSystem.species[i]) {
                this.particleSystem.species[i].color = palette[i % palette.length];
            }
        }
    }
    
    getProfessionalPalette(theme) {
        const palettes = {
            nature: [
                { r: 76, g: 175, b: 80 },   // Green
                { r: 139, g: 195, b: 74 },  // Light Green
                { r: 205, g: 220, b: 57 },  // Lime
                { r: 255, g: 193, b: 7 },   // Amber
                { r: 255, g: 152, b: 0 },   // Orange
                { r: 121, g: 85, b: 72 },   // Brown
                { r: 96, g: 125, b: 139 },  // Blue Grey
                { r: 158, g: 158, b: 158 }  // Grey
            ],
            ocean: [
                { r: 0, g: 188, b: 212 },   // Cyan
                { r: 0, g: 172, b: 193 },   // Light Blue
                { r: 3, g: 169, b: 244 },   // Blue
                { r: 63, g: 81, b: 181 },   // Indigo
                { r: 103, g: 58, b: 183 },  // Deep Purple
                { r: 156, g: 39, b: 176 },  // Purple
                { r: 233, g: 30, b: 99 },   // Pink
                { r: 255, g: 87, b: 34 }    // Deep Orange
            ],
            sunset: [
                { r: 255, g: 235, b: 59 },  // Yellow
                { r: 255, g: 193, b: 7 },   // Amber
                { r: 255, g: 152, b: 0 },   // Orange
                { r: 255, g: 87, b: 34 },   // Deep Orange
                { r: 244, g: 67, b: 54 },   // Red
                { r: 233, g: 30, b: 99 },   // Pink
                { r: 156, g: 39, b: 176 },  // Purple
                { r: 103, g: 58, b: 183 }   // Deep Purple
            ],
            neon: [
                { r: 0, g: 255, b: 255 },   // Cyan
                { r: 0, g: 255, b: 127 },   // Spring Green
                { r: 127, g: 255, b: 0 },   // Chartreuse
                { r: 255, g: 255, b: 0 },   // Yellow
                { r: 255, g: 127, b: 0 },   // Orange
                { r: 255, g: 0, b: 127 },   // Deep Pink
                { r: 127, g: 0, b: 255 },   // Blue Violet
                { r: 255, g: 20, b: 147 }   // Deep Pink
            ],
            pastel: [
                { r: 255, g: 205, b: 210 }, // Light Pink
                { r: 225, g: 190, b: 231 }, // Light Purple
                { r: 187, g: 222, b: 251 }, // Light Blue
                { r: 178, g: 235, b: 242 }, // Light Cyan
                { r: 165, g: 214, b: 167 }, // Light Green
                { r: 255, g: 245, b: 157 }, // Light Yellow
                { r: 255, g: 204, b: 128 }, // Light Orange
                { r: 215, g: 204, b: 200 }  // Light Brown
            ],
            monochrome: [
                { r: 245, g: 245, b: 245 }, // White Smoke
                { r: 224, g: 224, b: 224 }, // Light Grey
                { r: 189, g: 189, b: 189 }, // Silver
                { r: 158, g: 158, b: 158 }, // Grey
                { r: 117, g: 117, b: 117 }, // Dim Grey
                { r: 97, g: 97, b: 97 },    // Dark Grey
                { r: 66, g: 66, b: 66 },    // Darker Grey
                { r: 33, g: 150, b: 243 }   // Blue accent
            ],
            retro: [
                { r: 255, g: 87, b: 51 },   // Tomato
                { r: 255, g: 193, b: 7 },   // Gold
                { r: 139, g: 195, b: 74 },  // Yellow Green
                { r: 0, g: 188, b: 212 },   // Dark Turquoise
                { r: 121, g: 85, b: 72 },   // Saddle Brown
                { r: 255, g: 138, b: 101 }, // Dark Salmon
                { r: 240, g: 230, b: 140 }, // Khaki
                { r: 205, g: 133, b: 63 }   // Peru
            ],
            space: [
                { r: 25, g: 25, b: 112 },   // Midnight Blue
                { r: 72, g: 61, b: 139 },   // Dark Slate Blue
                { r: 123, g: 104, b: 238 }, // Medium Slate Blue
                { r: 138, g: 43, b: 226 },  // Blue Violet
                { r: 75, g: 0, b: 130 },    // Indigo
                { r: 148, g: 0, b: 211 },   // Dark Violet
                { r: 255, g: 20, b: 147 },  // Deep Pink
                { r: 255, g: 105, b: 180 }  // Hot Pink
            ]
        };
        
        return palettes[theme] || palettes.nature;
    }
    
    randomizeBackgroundColor(scenario) {
        const backgroundColors = {
            clusters: ['#1a1a2e', '#16213e', '#0f3460', '#2c3e50'], // Deep blues/grays for contrast
            swarms: ['#0d1117', '#161b22', '#21262d', '#1c2128'],
            crystals: ['#f6f8fa', '#ffffff', '#f0f6ff', '#dbeafe'],
            plasma: ['#000000', '#0d1117', '#1a0033', '#330066'],
            organic: ['#f6f8fa', '#fefefe', '#f0f9ff', '#ecfdf5'],
            chaos: ['#1a1a1a', '#000000', '#220a0a', '#0a0a22'],
            minimal: ['#ffffff', '#fafafa', '#f5f5f5', '#f0f0f0'],
            dreamscape: ['#0f0f23', '#1a1a3a', '#2d1b69', '#1e1e3f']
        };
        
        const colors = backgroundColors[scenario] || backgroundColors.swarms;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        this.particleSystem.backgroundColor = color;
        const bgColorInput = document.getElementById('background-color');
        if (bgColorInput) {
            bgColorInput.value = color;
        }
    }
    
    generateComplexInitialDistribution(scenario) {
        if (!this.distributionDrawer) {
            console.warn('DistributionDrawer not available for pattern generation');
            return;
        }
        
        const patterns = {
            clusters: () => this.createClustersDistribution(),
            swarms: () => this.createSwarmPattern(),
            crystals: () => this.createCrystalPattern(),
            plasma: () => this.createPlasmaPattern(),
            organic: () => this.createOrganicPattern(),
            chaos: () => this.createChaoticPattern(),
            minimal: () => this.createMinimalPattern(),
            dreamscape: () => this.createDreamscapePattern()
        };
        
        const pattern = patterns[scenario] || patterns.swarms;
        const distributionData = pattern();
        
        // Import the generated distribution
        if (distributionData && Object.keys(distributionData).length > 0) {
            this.distributionDrawer.importDistribution(distributionData);
            // Distribution pattern applied
        } else {
            console.warn(`No distribution data generated for scenario: ${scenario}`);
        }
    }
    
    createSwarmPattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Ensure ALL species get distributions
        // Create primary swarm clusters for main species
        const primaryClusters = Math.min(numSpecies, 6);
        
        for (let i = 0; i < primaryClusters; i++) {
            const angle = (i / primaryClusters) * 2 * Math.PI;
            const radius = 0.3 + Math.random() * 0.2;
            const centerX = 0.5 + Math.cos(angle) * radius;
            const centerY = 0.5 + Math.sin(angle) * radius;
            const size = 0.08 + Math.random() * 0.04;
            
            distribution[i] = this.createClusterPoints(centerX, centerY, size);
        }
        
        // Create smaller satellite clusters for remaining species
        for (let i = primaryClusters; i < numSpecies; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = 0.15 + Math.random() * 0.3;
            const centerX = 0.5 + Math.cos(angle) * radius;
            const centerY = 0.5 + Math.sin(angle) * radius;
            const size = 0.04 + Math.random() * 0.03; // Smaller satellites
            
            distribution[i] = this.createClusterPoints(centerX, centerY, size);
        }
        
        return distribution;
    }
    
    // NEW: Clusters Distribution - Creates well-separated cluster starting positions
    createClustersDistribution() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Create distinct clusters positioned to avoid overlap
        const gridSize = Math.ceil(Math.sqrt(numSpecies));
        const spacing = 0.7 / gridSize; // Leaves margin from edges
        const baseOffset = 0.15; // Start position offset from edges
        
        for (let i = 0; i < numSpecies; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Position clusters in a grid with some randomization
            const baseX = baseOffset + col * spacing + Math.random() * spacing * 0.3;
            const baseY = baseOffset + row * spacing + Math.random() * spacing * 0.3;
            
            // Ensure positions stay within bounds
            const centerX = Math.min(0.85, Math.max(0.15, baseX));
            const centerY = Math.min(0.85, Math.max(0.15, baseY));
            
            // Create tight clusters for better cohesion
            const clusterSize = 0.04 + Math.random() * 0.03;
            
            distribution[i] = this.createClusterPoints(centerX, centerY, clusterSize);
        }
        
        return distribution;
    }
    
    createCrystalPattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Create geometric grid pattern
        const gridSize = Math.ceil(Math.sqrt(numSpecies));
        for (let i = 0; i < numSpecies; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const x = (col + 0.5) / gridSize;
            const y = (row + 0.5) / gridSize;
            
            distribution[i] = this.createClusterPoints(x, y, 0.06);
        }
        
        return distribution;
    }
    
    createPlasmaPattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Create turbulent, energy-like distribution
        for (let i = 0; i < numSpecies; i++) {
            const x = Math.random();
            const y = Math.random();
            const size = 0.12 + Math.random() * 0.08;
            
            distribution[i] = this.createClusterPoints(x, y, size);
        }
        
        return distribution;
    }
    
    createOrganicPattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Create flowing, natural patterns
        for (let i = 0; i < numSpecies; i++) {
            const t = i / (numSpecies - 1);
            const x = 0.2 + 0.6 * t + 0.1 * Math.sin(t * Math.PI * 3);
            const y = 0.5 + 0.3 * Math.sin(t * Math.PI * 2);
            
            distribution[i] = this.createClusterPoints(x, y, 0.07 + Math.random() * 0.03);
        }
        
        return distribution;
    }
    
    createChaoticPattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Ensure ALL species get at least one cluster
        for (let i = 0; i < numSpecies; i++) {
            const x = Math.random();
            const y = Math.random();
            const size = 0.06 + Math.random() * 0.08;
            
            distribution[i] = this.createClusterPoints(x, y, size);
        }
        
        // Add additional random clusters for chaos
        const extraClusters = Math.floor(Math.random() * numSpecies);
        for (let i = 0; i < extraClusters; i++) {
            const species = Math.floor(Math.random() * numSpecies);
            const x = Math.random();
            const y = Math.random();
            const size = 0.02 + Math.random() * 0.10;
            
            // Add to existing species distribution
            distribution[species] = distribution[species].concat(this.createClusterPoints(x, y, size));
        }
        
        return distribution;
    }
    
    createMinimalPattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Create simple, clean patterns that accommodate all species
        const basePositions = [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
            { x: 0.5, y: 0.3 },
            { x: 0.5, y: 0.7 },
            { x: 0.2, y: 0.3 },
            { x: 0.8, y: 0.3 },
            { x: 0.2, y: 0.7 },
            { x: 0.8, y: 0.7 }
        ];
        
        for (let i = 0; i < numSpecies; i++) {
            let pos;
            if (i < basePositions.length) {
                pos = basePositions[i];
            } else {
                // Generate additional positions in a circle pattern
                const angle = ((i - basePositions.length) / (numSpecies - basePositions.length)) * 2 * Math.PI;
                pos = {
                    x: 0.5 + 0.25 * Math.cos(angle),
                    y: 0.5 + 0.25 * Math.sin(angle)
                };
            }
            
            distribution[i] = this.createClusterPoints(pos.x, pos.y, 0.08);
        }
        
        return distribution;
    }
    
    createDreamscapePattern() {
        const numSpecies = this.particleSystem.numSpecies;
        const distribution = {};
        
        // Create ethereal, flowing patterns in spiral formation
        for (let i = 0; i < numSpecies; i++) {
            // Create a golden ratio spiral for natural distribution
            const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle
            const angle = i * goldenAngle + Math.random() * 0.3;
            const radius = 0.1 + (i / numSpecies) * 0.3 + Math.random() * 0.15;
            const x = 0.5 + Math.cos(angle) * radius;
            const y = 0.5 + Math.sin(angle) * radius;
            
            distribution[i] = this.createClusterPoints(x, y, 0.08 + Math.random() * 0.05);
        }
        
        return distribution;
    }
    
    createClusterPoints(centerX, centerY, size) {
        // Clamp values to valid ranges
        centerX = Math.max(0.1, Math.min(0.9, centerX));
        centerY = Math.max(0.1, Math.min(0.9, centerY));
        size = Math.max(0.02, Math.min(0.2, size));
        
        const points = [];
        const numPoints = Math.floor(15 + Math.random() * 15); // 15-30 points per cluster
        const radius = size;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius * 0.8;
            const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
            const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
            
            points.push({
                x,
                y,
                size: size * 0.2 * (0.8 + Math.random() * 0.4),
                opacity: 0.7 + Math.random() * 0.3
            });
        }
        
        return points;
    }
    
    
    enforceEffectMutualExclusion() {
        const perSpeciesHaloEnabledEl = document.getElementById('per-species-halo-enabled');
        const speciesGlowEnabledEl = document.getElementById('species-glow-enabled');
        
        if (!perSpeciesHaloEnabledEl || !speciesGlowEnabledEl) {
            console.warn('Effect elements not found during mutual exclusion check');
            return;
        }
        
        const haloEnabled = perSpeciesHaloEnabledEl.checked;
        const speciesGlowEnabled = speciesGlowEnabledEl.checked;
        
        // If both are enabled, disable species glow to prevent conflicts
        if (haloEnabled && speciesGlowEnabled) {
            speciesGlowEnabledEl.checked = false;
            
            // Hide species glow controls
            const glowControls = document.getElementById('species-glow-controls');
            const glowSizeControl = document.getElementById('species-glow-size-control');
            const glowIntensityControl = document.getElementById('species-glow-intensity-control');
            
            if (glowControls) glowControls.style.display = 'none';
            if (glowSizeControl) glowSizeControl.style.display = 'none';
            if (glowIntensityControl) glowIntensityControl.style.display = 'none';
            
            // Clear all species glow
            if (this.particleSystem && this.particleSystem.clearAllSpeciesGlow) {
                this.particleSystem.clearAllSpeciesGlow();
            }
        }
    }
    
    // Non-linear trail slider mapping for fine control in high values
    mapTrailValue(sliderValue) {
        // Slider range: 0-100
        if (sliderValue < 80) {
            // 0-80 maps to 0.5-0.9 (linear)
            return 0.5 + (sliderValue / 80) * 0.4;
        } else {
            // 80-100 maps to 0.9-0.999 (exponential for fine control)
            const t = (sliderValue - 80) / 20; // 0-1
            return 0.9 + (Math.pow(t, 2) * 0.099); // 0.9-0.999
        }
    }
    
    // Reverse mapping: blur value back to slider value
    unmapTrailValue(blurValue) {
        // Clamp blur value to valid range
        blurValue = Math.max(0.5, Math.min(0.999, blurValue));
        
        if (blurValue <= 0.9) {
            // Linear range: 0.5-0.9 maps back to 0-80
            const result = ((blurValue - 0.5) / 0.4) * 80;
            return Math.round(result * 100) / 100; // Round to 2 decimal places
        } else {
            // Exponential range: 0.9-0.999 maps back to 80-100
            const normalizedBlur = (blurValue - 0.9) / 0.099; // 0-1
            const t = Math.sqrt(normalizedBlur); // Inverse of t^2
            const result = 80 + (t * 20);
            return Math.round(result * 100) / 100; // Round to 2 decimal places
        }
    }
    
    // Reverse mapping for UI initialization 
    reverseMapTrailValue(blurValue) {
        if (blurValue <= 0.9) {
            // Linear range: 0.5-0.9 maps to 0-80
            return ((blurValue - 0.5) / 0.4) * 80;
        } else {
            // Exponential range: 0.9-0.999 maps to 80-100
            const t = Math.sqrt((blurValue - 0.9) / 0.099); // Inverse of power function
            return 80 + (t * 20);
        }
    }

    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    
    setupDistributionCanvasSize(canvas) {
        // Calculate aspect ratio from simulation canvas
        const simAspectRatio = this.particleSystem.width / this.particleSystem.height;
        
        // Set a reasonable width for the floating UI and calculate height to match aspect ratio
        const maxWidth = 288; // Keep same max width as before
        const maxHeight = 160; // Reasonable max height for UI
        
        let width, height;
        
        // Fit within max dimensions while preserving aspect ratio
        if (simAspectRatio > maxWidth / maxHeight) {
            // Simulation is wider - constrain by width
            width = maxWidth;
            height = Math.round(maxWidth / simAspectRatio);
        } else {
            // Simulation is taller - constrain by height
            height = maxHeight;
            width = Math.round(maxHeight * simAspectRatio);
        }
        
        // Ensure minimum dimensions for usability
        width = Math.max(200, width);
        height = Math.max(100, height);
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
    }
    
    updateSpeciesColors(count) {
        const container = document.getElementById('species-colors-container');
        container.innerHTML = '';
        
        // Update all species names based on their colors
        this.updateAllSpeciesNames();
        
        for (let i = 0; i < count; i++) {
            const species = this.particleSystem.species[i];
            let colorValue;
            
            if (species?.color) {
                // Convert RGB object to hex string if needed
                if (typeof species.color === 'object' && species.color.r !== undefined) {
                    colorValue = this.rgbToHex(species.color);
                } else {
                    colorValue = species.color;
                }
            } else {
                colorValue = this.generateSpeciesColor(i);
            }
            
            const row = document.createElement('div');
            row.className = 'species-color-row';
            row.innerHTML = `
                <span class="species-label" id="species-label-${i}">${species?.name || `Species ${i + 1}`}</span>
                <div class="species-color-wrapper">
                    <input type="color" class="species-color" data-species="${i}" 
                           value="${colorValue}">
                </div>
                <input type="number" class="species-amount" data-species="${i}" 
                       min="0" max="1000" step="10" 
                       value="${species?.particleCount || this.particleSystem.particlesPerSpecies}">
                <div class="species-sliders">
                    <div class="mini-slider-group">
                        <label class="mini-label">Mobility</label>
                        <input type="range" class="mini-slider species-mobility" data-species="${i}"
                               min="0.1" max="3.0" step="0.1" value="${species?.mobility || 1.5}">
                        <span class="mini-value">${(species?.mobility || 1.5).toFixed(1)}</span>
                    </div>
                    <div class="mini-slider-group">
                        <label class="mini-label">Inertia</label>
                        <input type="range" class="mini-slider species-inertia" data-species="${i}"
                               min="0.70" max="0.99" step="0.01" value="${species?.inertia || 0.85}">
                        <span class="mini-value">${(species?.inertia || 0.85).toFixed(2)}</span>
                    </div>
                </div>
            `;
            container.appendChild(row);
        }
        
        // Add event listeners
        container.querySelectorAll('.species-color').forEach(input => {
            input.addEventListener('change', (e) => {
                const speciesIndex = parseInt(e.target.dataset.species);
                if (this.particleSystem.species[speciesIndex]) {
                    // Convert hex to RGB object for particle system
                    const hex = e.target.value;
                    const r = parseInt(hex.substr(1, 2), 16);
                    const g = parseInt(hex.substr(3, 2), 16);
                    const b = parseInt(hex.substr(5, 2), 16);
                    this.particleSystem.species[speciesIndex].color = { r, g, b };
                    
                    // Update color name automatically
                    this.updateSpeciesColorName(speciesIndex, hex);
                    
                    // Update all UI components that display species names/colors
                    this.updateSpeciesSelectors(this.particleSystem.numSpecies);
                    this.updateSpeciesButtons(this.particleSystem.numSpecies);
                    this.updateDistributionSpeciesSelector(this.particleSystem.numSpecies);
                    
                    // Update modulation parameter options
                    if (this.modulationManager) {
                        this.updateModulationParameterOptions();
                    }
                    
                    // Update force editor if it exists
                    if (this.forceEditor) {
                        this.forceEditor.setSpecies(this.particleSystem.species);
                    }
                    
                    this.triggerAutoSave();
                }
            });
        });
        
        container.querySelectorAll('.species-amount').forEach(input => {
            input.addEventListener('change', (e) => {
                const speciesIndex = parseInt(e.target.dataset.species);
                let value = parseInt(e.target.value) || 0;
                
                // Validate and clamp the value
                if (value < 0) {
                    value = 0;
                    e.target.value = 0;
                } else if (value > 2000) {
                    value = 2000;
                    e.target.value = 2000;
                    alert('Maximum particles per species is 2000 for performance reasons');
                }
                
                if (this.particleSystem.species[speciesIndex]) {
                    this.particleSystem.species[speciesIndex].particleCount = value;
                    this.particleSystem.initializeParticles();
                    this.updateTotalParticles();
                    this.triggerAutoSave();
                }
            });
        });

        // Add mobility slider event listeners
        container.querySelectorAll('.species-mobility').forEach(input => {
            input.addEventListener('input', (e) => {
                const speciesIndex = parseInt(e.target.dataset.species);
                const value = parseFloat(e.target.value);
                if (this.particleSystem.species[speciesIndex]) {
                    this.particleSystem.species[speciesIndex].mobility = value;
                    // Update the display value
                    const valueSpan = e.target.nextElementSibling;
                    if (valueSpan) {
                        valueSpan.textContent = value.toFixed(1);
                    }
                    this.triggerAutoSave();
                }
            });
        });

        // Add inertia slider event listeners
        container.querySelectorAll('.species-inertia').forEach(input => {
            input.addEventListener('input', (e) => {
                const speciesIndex = parseInt(e.target.dataset.species);
                const value = parseFloat(e.target.value);
                if (this.particleSystem.species[speciesIndex]) {
                    this.particleSystem.species[speciesIndex].inertia = value;
                    // Update the display value
                    const valueSpan = e.target.nextElementSibling;
                    if (valueSpan) {
                        valueSpan.textContent = value.toFixed(2);
                    }
                    this.triggerAutoSave();
                }
            });
        });
    }
    
    generateSpeciesColor(index) {
        const hue = (index * 360 / 20) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    updateSpeciesColorName(speciesIndex, hexColor) {
        const colorName = this.getColorName(hexColor);
        const labelElement = document.getElementById(`species-label-${speciesIndex}`);
        if (labelElement) {
            labelElement.textContent = colorName;
        }
        // Also update the species name in the particle system
        if (this.particleSystem.species[speciesIndex]) {
            this.particleSystem.species[speciesIndex].name = colorName;
        }
    }
    
    updateAllSpeciesNames() {
        // Update all species names based on their current colors
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            if (species && species.color) {
                let hexColor;
                if (typeof species.color === 'object' && species.color.r !== undefined) {
                    hexColor = this.rgbToHex(species.color);
                } else {
                    hexColor = species.color;
                }
                // Generate name based on color
                const colorName = this.getColorName(hexColor);
                species.name = colorName;
            }
        }
        
        // Update all UI components that display species names/colors
        this.updateSpeciesSelectors(this.particleSystem.numSpecies);
        this.updateSpeciesButtons(this.particleSystem.numSpecies);
        this.updateDistributionSpeciesSelector(this.particleSystem.numSpecies);
    }

    getColorName(hexColor) {
        // Convert hex to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // Convert RGB to HSL for better color detection
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        let l = (max + min) / 2;
        let h, s;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            const r1 = r / 255;
            const g1 = g / 255;
            const b1 = b / 255;
            
            switch (max) {
                case r1: h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6; break;
                case g1: h = ((b1 - r1) / d + 2) / 6; break;
                case b1: h = ((r1 - g1) / d + 4) / 6; break;
            }
        }
        
        h *= 360;
        s *= 100;
        l *= 100;
        
        // Check for grayscale colors first
        if (s < 10) {
            if (l < 20) return 'Black';
            if (l > 80) return 'White';
            if (l > 60) return 'Light Gray';
            if (l > 40) return 'Gray';
            return 'Dark Gray';
        }
        
        // For chromatic colors, use hue-based naming with modifiers
        let baseName = '';
        let modifier = '';
        
        // Determine lightness modifier
        if (l < 25) modifier = 'Dark ';
        else if (l > 75) modifier = 'Light ';
        else if (s < 30) modifier = 'Pale ';
        else if (s > 80 && l > 40 && l < 60) modifier = 'Bright ';
        
        // Determine base color by hue with more precise ranges
        if (h >= 355 || h < 10) baseName = 'Red';
        else if (h >= 10 && h < 20) baseName = 'Red-Orange';
        else if (h >= 20 && h < 40) baseName = 'Orange';
        else if (h >= 40 && h < 50) baseName = 'Yellow-Orange';
        else if (h >= 50 && h < 65) baseName = 'Yellow';
        else if (h >= 65 && h < 80) baseName = 'Yellow-Green';
        else if (h >= 80 && h < 150) baseName = 'Green';
        else if (h >= 150 && h < 170) baseName = 'Teal';
        else if (h >= 170 && h < 200) baseName = 'Cyan';
        else if (h >= 200 && h < 240) baseName = 'Blue';
        else if (h >= 240 && h < 260) baseName = 'Blue-Violet';
        else if (h >= 260 && h < 290) baseName = 'Violet';
        else if (h >= 290 && h < 310) baseName = 'Purple';
        else if (h >= 310 && h < 330) baseName = 'Magenta';
        else if (h >= 330 && h < 355) baseName = 'Pink';
        
        // Special cases for common colors
        if (h >= 30 && h < 40 && s > 60 && l > 30 && l < 60) return 'Brown';
        if (h >= 330 && h < 355 && s > 40 && l > 60) return 'Pink';
        if (h >= 280 && h < 320 && s > 40 && l > 60) return 'Lavender';
        
        return modifier + baseName;
    }
    
    rgbToHex(color) {
        const toHex = (n) => {
            const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    }
    
    updateTotalParticles() {
        const total = this.particleSystem.species.reduce((sum, s) => sum + (s.particleCount || 0), 0);
        const totalElement = document.getElementById('total-particles');
        if (totalElement) {
            totalElement.textContent = total;
        }
    }
    
    setupEventListeners() {
        // Find elements in main UI only (not in modal)
        const findMainUIElement = (id) => {
            const elements = document.querySelectorAll(`#${id}`);
            for (const el of elements) {
                if (!el.closest('.preset-modal')) {
                    return el;
                }
            }
            return null;
        };
        
        // Helper to add event listener to main UI element only
        const safeAddEventListener = (id, event, handler) => {
            const element = findMainUIElement(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Main UI element '${id}' not found`);
            }
        };
        
        // Expose safeAddEventListener as a method for testing
        this.safeAddEventListener = safeAddEventListener;
        
        // Minimize button
        safeAddEventListener('minimize-btn', 'click', () => {
            this.toggleVisibility();
        });
        
        // Initialize Firebase status monitoring
        this.initializeFirebaseStatus();
        
        // Preset controls with auto-load on selection
        const presetSelector = document.getElementById('preset-selector');
        const presetNameInput = document.getElementById('preset-name-input');
        
        // Single change handler for preset selector - auto-loads preset
        presetSelector.addEventListener('change', () => {
            const presetKey = presetSelector.value;
            console.log('Preset selector changed to:', presetKey);
            
            if (presetKey) {
                // Load the selected preset automatically
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                    
                    // Update modulation system
                    if (this.modulationManager) {
                        this.updateModulationParameterOptions();
                    }
                    
                    // Store selected preset for persistence
                    localStorage.setItem('lastSelectedPreset', presetKey);
                    
                    // Clear preset name input and set to update mode
                    presetNameInput.value = '';
                    this.currentEditingPreset = presetKey;
                    this.updateSaveButton();
                    
                    // Trigger auto-save
                    this.triggerAutoSave();
                }
            } else {
                // Custom preset selected
                this.currentEditingPreset = null;
                presetNameInput.value = '';
                this.updateSaveButton();
            }
        });
        
        // Monitor preset name input for save button updates
        presetNameInput.addEventListener('input', () => {
            this.updateSaveButton();
        });
        
        // Save preset button handler
        document.getElementById('save-preset-btn').addEventListener('click', async () => {
            await this.savePreset();
        });
        
        // Particle controls
        document.getElementById('particles-per-species').addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            
            // Validate and clamp the value
            if (isNaN(value) || value < 0) {
                value = 0;
                e.target.value = 0;
                console.warn('Particles per species cannot be negative, setting to 0');
            } else if (value > 2000) {
                value = 2000;
                e.target.value = 2000;
                console.warn('Particles per species cannot exceed 2000, setting to 2000');
                alert('Maximum particles per species is 2000 for performance reasons');
            }
            
            this.particleSystem.particlesPerSpecies = value;
            // Update species particle counts
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                if (this.particleSystem.species[i]) {
                    this.particleSystem.species[i].particleCount = value;
                }
            }
            // Reinitialize with positions
            this.particleSystem.initializeParticlesWithPositions();
            document.getElementById('particles-per-species-value').textContent = value;
            // Update the individual species amount inputs
            document.querySelectorAll('.species-amount').forEach((input, i) => {
                if (i < this.particleSystem.numSpecies) {
                    input.value = value;
                }
            });
            this.updateTotalParticles();
            
            // Performance warning for high particle counts
            const totalParticles = this.particleSystem.numSpecies * value;
            if (totalParticles > 5000) {
                console.warn(`High particle count detected: ${totalParticles} total particles`);
                if (totalParticles > 10000) {
                    alert(`Warning: ${totalParticles} total particles may cause performance issues. Consider reducing particle count or species count.`);
                }
            }
            
            this.triggerAutoSave();
        });
        
        safeAddEventListener('species-count', 'input', (e) => {
            let value = parseInt(e.target.value);
            
            // Validate and clamp the value
            if (isNaN(value) || value < 1) {
                value = 1;
                e.target.value = 1;
                console.warn('Species count cannot be less than 1, setting to 1');
            } else if (value > 20) {
                value = 20;
                e.target.value = 20;
                console.warn('Species count cannot exceed 20, setting to 20');
                alert('Maximum species count is 20 for performance reasons');
            }
            
            // Use the proper API method for species count changes
            if (this.particleSystem.setSpeciesCount) {
                // Debug log
                // Setting species count
                
                const result = this.particleSystem.setSpeciesCount(value);
                
                if (result) {
                    // Update UI elements only if the change was successful
                    const countDisplay = document.getElementById('species-count-value');
                    if (countDisplay) {
                        countDisplay.textContent = value;
                    }
                    
                    // Also update the slider value to stay in sync
                    e.target.value = value;
                    
                    this.updateSpeciesSelectors(value);
                    this.updateSpeciesColors(value);
                    this.updateGraph();
                    this.updateTotalParticles();
                    
                    // Update modulation parameter options  
                    if (this.modulationManager) {
                        this.updateModulationParameterOptions();
                    }
                    
                    // Resize distribution canvas to match current simulation dimensions
                    if (this.distributionDrawer) {
                        const distributionCanvas = document.getElementById('distribution-canvas');
                        this.setupDistributionCanvasSize(distributionCanvas);
                        this.distributionDrawer.resize();
                    }
                    
                    this.triggerAutoSave();
                    
                    // Species count updated
                } else {
                    console.error(`Failed to set species count to ${value}`);
                    // Reset to a safe value
                    e.target.value = this.particleSystem.numSpecies;
                }
            }
        });
        
        // Distribution drawer controls - Species buttons
        this.setupSpeciesButtons();
        
        document.getElementById('distribution-brush-slider').addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.distributionDrawer.setBrushSize(size);
            document.getElementById('distribution-brush').value = size;
            document.getElementById('distribution-brush-value').textContent = size;
        });
        
        document.getElementById('distribution-brush').addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.distributionDrawer.setBrushSize(size);
            document.getElementById('distribution-brush-slider').value = size;
            document.getElementById('distribution-brush-value').textContent = size;
        });
        
        // Clear button is now handled in utility button handlers above
        
        // Mode button handlers (enhanced UI)
        this.container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update button states
                this.container.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Set mode
                const mode = e.target.dataset.mode;
                if (mode) {
                    this.distributionDrawer.setMode(mode);
                }
            });
        });
        
        // Utility button handlers (clear button)
        this.container.querySelectorAll('.util-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.id === 'distribution-clear') {
                    this.distributionDrawer.clear();
                }
            });
        });
        
        // Physics controls
        document.getElementById('force-strength').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.forceFactor = value;
            document.getElementById('force-strength-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });
        
        document.getElementById('friction').addEventListener('input', (e) => {
            const uiFriction = parseFloat(e.target.value);
            this.particleSystem.friction = 1.0 - uiFriction;
            document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
            this.triggerAutoSave();
        });
        
        // Noise controls
        const noiseEnabled = document.getElementById('noise-enabled');
        const noiseControls = document.getElementById('noise-controls');
        
        if (noiseEnabled) {
            noiseEnabled.addEventListener('change', (e) => {
                this.particleSystem.setNoiseEnabled(e.target.checked);
                noiseControls.style.display = e.target.checked ? '' : 'none';
                this.triggerAutoSave();
            });
        }
        
        const noisePattern = document.getElementById('noise-pattern');
        if (noisePattern) {
            noisePattern.addEventListener('change', (e) => {
                this.particleSystem.setNoisePattern(e.target.value);
                this.triggerAutoSave();
            });
        }
        
        const noiseAmplitude = document.getElementById('noise-amplitude');
        if (noiseAmplitude) {
            noiseAmplitude.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.setNoiseAmplitude(value);
                document.getElementById('noise-amplitude-value').textContent = value.toFixed(2);
                this.triggerAutoSave();
            });
        }
        
        const noiseScale = document.getElementById('noise-scale');
        if (noiseScale) {
            noiseScale.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.setNoiseScale(value);
                document.getElementById('noise-scale-value').textContent = value.toFixed(2);
                this.triggerAutoSave();
            });
        }
        
        const noiseTimeScale = document.getElementById('noise-time-scale');
        if (noiseTimeScale) {
            noiseTimeScale.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.setNoiseTimeScale(value);
                document.getElementById('noise-time-scale-value').textContent = value.toFixed(3);
                this.triggerAutoSave();
            });
        }
        
        const noiseContrast = document.getElementById('noise-contrast');
        if (noiseContrast) {
            noiseContrast.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.setNoiseContrast(value);
                document.getElementById('noise-contrast-value').textContent = value.toFixed(2);
                this.triggerAutoSave();
            });
        }
        
        const noiseAnimation = document.getElementById('noise-animation');
        if (noiseAnimation) {
            noiseAnimation.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (this.particleSystem.noiseGenerator) {
                    this.particleSystem.noiseGenerator.setTimeIncrement(value);
                }
                document.getElementById('noise-animation-value').textContent = value.toFixed(3);
                this.triggerAutoSave();
            });
        }
        
        const noiseOctaves = document.getElementById('noise-octaves');
        if (noiseOctaves) {
            noiseOctaves.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (this.particleSystem.noiseGenerator) {
                    this.particleSystem.noiseGenerator.setGlobalOctaves(value);
                }
                document.getElementById('noise-octaves-value').textContent = value;
                this.triggerAutoSave();
            });
        }
        
        const noiseVectorEnabled = document.getElementById('noise-vector-enabled');
        if (noiseVectorEnabled) {
            noiseVectorEnabled.addEventListener('change', (e) => {
                this.particleSystem.noiseVectorEnabled = e.target.checked;
                document.getElementById('noise-vector-controls').style.display = e.target.checked ? '' : 'none';
                this.triggerAutoSave();
            });
        }
        
        const noiseVectorScale = document.getElementById('noise-vector-scale');
        if (noiseVectorScale) {
            noiseVectorScale.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.particleSystem.noiseVectorScale = value;
                document.getElementById('noise-vector-scale-value').textContent = value.toFixed(2);
                this.triggerAutoSave();
            });
        }
        
        // Noise seed controls
        const noiseSeed = document.getElementById('noise-seed');
        if (noiseSeed) {
            noiseSeed.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 2147483647) {
                    if (this.particleSystem.noiseGenerator) {
                        this.particleSystem.noiseGenerator.setSeed(value);
                        localStorage.setItem('noiseSeed', value.toString());
                        document.getElementById('noise-seed-value').textContent = value;
                        this.triggerAutoSave();
                    }
                }
            });
        }
        
        const noiseSeedRandom = document.getElementById('noise-seed-random');
        if (noiseSeedRandom) {
            noiseSeedRandom.addEventListener('click', () => {
                const newSeed = Math.floor(Math.random() * 2147483647);
                if (this.particleSystem.noiseGenerator) {
                    this.particleSystem.noiseGenerator.setSeed(newSeed);
                    localStorage.setItem('noiseSeed', newSeed.toString());
                    document.getElementById('noise-seed').value = newSeed;
                    document.getElementById('noise-seed-value').textContent = newSeed;
                    this.triggerAutoSave();
                }
            });
        }
        
        document.getElementById('wall-bounce').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.wallDamping = value;
            document.getElementById('wall-bounce-value').textContent = value.toFixed(2);
            this.triggerAutoSave();
        });
        
        document.getElementById('repulsive-force').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.repulsiveForce = value;
            document.getElementById('repulsive-force-value').textContent = value.toFixed(2);
            this.triggerAutoSave();
        });
        
        document.getElementById('wrap-around-walls').addEventListener('change', (e) => {
            this.particleSystem.wrapAroundWalls = e.target.checked;
            
            // Show/hide wall controls based on wrap-around mode
            const wallControls = document.getElementById('wall-controls');
            const repulsiveControl = document.getElementById('repulsive-control');
            
            if (e.target.checked) {
                // Wrap-around mode: hide wall controls and disable repulsive force
                wallControls.style.display = 'none';
                repulsiveControl.style.display = 'none';
                this.particleSystem.repulsiveForce = 0;
            } else {
                // Wall mode: show wall controls
                wallControls.style.display = '';
                repulsiveControl.style.display = '';
                // Restore repulsive force to default if it was 0
                if (this.particleSystem.repulsiveForce === 0) {
                    this.particleSystem.repulsiveForce = 0.3;
                    document.getElementById('repulsive-force').value = 0.3;
                    document.getElementById('repulsive-force-value').textContent = '0.30';
                }
            }
            
            this.triggerAutoSave();
        });
        
        // Collision strength control
        document.getElementById('collision-strength').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.collisionMultiplier = value;
            document.getElementById('collision-strength-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });
        
        // Collision offset control
        document.getElementById('collision-offset').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.collisionOffset = value;
            document.getElementById('collision-offset-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });

        
        document.getElementById('social-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    if (this.particleSystem.socialRadius[i]) {
                        this.particleSystem.socialRadius[i][j] = value;
                    }
                }
            }
            document.getElementById('social-radius-value').textContent = value;
        });
        
        // Advanced Physics controls
        document.getElementById('environmental-pressure').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.environmentalPressure = value;
            document.getElementById('environmental-pressure-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });
        
        
        // Shockwave controls
        document.getElementById('shockwave-enabled').addEventListener('change', (e) => {
            this.particleSystem.shockwaveEnabled = e.target.checked;
            const controls = document.getElementById('shockwave-controls');
            if (controls) {
                controls.style.display = e.target.checked ? 'block' : 'none';
            }
            this.triggerAutoSave();
        });
        
        document.getElementById('shockwave-strength').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.shockwaveStrength = value;
            document.getElementById('shockwave-strength-value').textContent = value;
            this.triggerAutoSave();
        });
        
        document.getElementById('shockwave-size').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.shockwaveSize = value;
            document.getElementById('shockwave-size-value').textContent = value;
            this.triggerAutoSave();
        });
        
        document.getElementById('shockwave-falloff').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.shockwaveFalloff = value;
            document.getElementById('shockwave-falloff-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });
        
        // Force relationship controls
        document.getElementById('from-species').addEventListener('change', () => this.updateGraph());
        document.getElementById('to-species').addEventListener('change', () => this.updateGraph());
        
        document.getElementById('clear-forces-btn').addEventListener('click', () => {
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    this.particleSystem.setSocialForce(i, j, 0);
                }
            }
            this.updateGraph();
        });
        
        // Effects controls
        document.getElementById('trails-enabled').addEventListener('change', (e) => {
            this.particleSystem.trailEnabled = e.target.checked;
            document.getElementById('trail-controls').style.display = e.target.checked ? '' : 'none';
            // Clear halo gradient cache since trail state affects halo rendering
            this.particleSystem.haloGradientCache.clear();
            this.triggerAutoSave();
        });
        
        document.getElementById('trail-length').addEventListener('input', (e) => {
            const sliderValue = parseFloat(e.target.value);
            const mappedValue = this.mapTrailValue(sliderValue);
            
            if (this.particleSystem.linkAllSpeciesTrails) {
                // Linked mode: update global blur and sync all species
                this.particleSystem.setGlobalBlur(mappedValue);
            } else if (this.particleSystem.trailExclusionEnabled) {
                // Exclusion mode: slider controls ONLY the excluded species trail
                // Global blur stays at its default value
                this.particleSystem.excludedSpeciesTrail = mappedValue;
                console.log('Exclusion mode - setting excluded trail to:', mappedValue, 'global blur remains:', this.particleSystem.blur);
            } else {
                // Legacy per-species mode: update only the selected species
                const selectedSpecies = parseInt(document.getElementById('trail-species-selector').value);
                this.particleSystem.setSpeciesTrail(selectedSpecies, mappedValue);
            }
            
            document.getElementById('trail-length-value').textContent = mappedValue.toFixed(3);
            this.triggerAutoSave();
        });
        
        // Link all species trails toggle
        document.getElementById('link-all-species-trails').addEventListener('change', (e) => {
            const linked = e.target.checked;
            this.particleSystem.linkAllSpeciesTrails = linked;
            
            // Update UI visibility
            document.getElementById('trail-exclusion-container').style.display = linked ? 'none' : '';
            document.getElementById('trail-species-selector-container').style.display = 
                (!linked && this.particleSystem.trailExclusionEnabled) ? '' : 'none';
            
            // Update label
            const label = document.getElementById('trail-length-label');
            if (linked) {
                label.textContent = 'Trail Length (All Species)';
            } else if (this.particleSystem.trailExclusionEnabled) {
                label.textContent = 'Trail Length (Excluded Species Only)';
            } else {
                label.textContent = 'Trail Length (Selected Species)';
            }
            
            if (linked) {
                // Disable exclusion mode when linking all species
                this.particleSystem.setTrailExclusion(false);
                document.getElementById('trail-exclusion-enabled').checked = false;
                // Sync all species to current global blur value
                this.particleSystem.syncAllSpeciesTrails();
                // Update slider to show global value
                document.getElementById('trail-length').value = this.reverseMapTrailValue(this.particleSystem.blur);
                document.getElementById('trail-length-value').textContent = this.particleSystem.blur.toFixed(3);
            }
            
            this.triggerAutoSave();
        });
        
        // Trail exclusion mode toggle
        document.getElementById('trail-exclusion-enabled').addEventListener('change', (e) => {
            const enabled = e.target.checked;
            const selectedSpecies = parseInt(document.getElementById('trail-species-selector').value);
            
            if (enabled) {
                // Enable exclusion mode with selected species
                // Start with excluded species having same trail as global
                const currentTrail = this.particleSystem.blur;
                this.particleSystem.setTrailExclusion(true, selectedSpecies, currentTrail);
                
                // Update slider to show excluded species trail value
                document.getElementById('trail-length').value = this.reverseMapTrailValue(currentTrail);
                document.getElementById('trail-length-value').textContent = currentTrail.toFixed(3);
                
                console.log('Exclusion enabled - species', selectedSpecies, 'with trail', currentTrail);
            } else {
                // Disable exclusion mode
                this.particleSystem.setTrailExclusion(false);
            }
            
            // Update UI visibility
            document.getElementById('trail-species-selector-container').style.display = enabled ? '' : 'none';
            
            // Update label
            const label = document.getElementById('trail-length-label');
            label.textContent = enabled ? 'Trail Length (Excluded Species Only)' : 'Trail Length (Selected Species)';
            
            this.triggerAutoSave();
        });
        
        // Trail species selector (for exclusion mode)
        document.getElementById('trail-species-selector').addEventListener('change', (e) => {
            const selectedSpecies = parseInt(e.target.value);
            
            if (this.particleSystem.trailExclusionEnabled) {
                // Update excluded species
                this.particleSystem.excludedSpeciesId = selectedSpecies;
                
                // If "None" is selected, disable exclusion
                if (selectedSpecies === -1) {
                    this.particleSystem.setTrailExclusion(false);
                    document.getElementById('trail-exclusion-enabled').checked = false;
                    document.getElementById('trail-species-selector-container').style.display = 'none';
                }
            } else if (!this.particleSystem.linkAllSpeciesTrails) {
                // Legacy per-species mode (compatibility)
                const currentTrail = this.particleSystem.getSpeciesTrail(selectedSpecies);
                
                // Update slider to show current species trail value
                document.getElementById('trail-length').value = this.reverseMapTrailValue(currentTrail);
                document.getElementById('trail-length-value').textContent = currentTrail.toFixed(3);
                
                // Update global blur to show this species' trail immediately
                this.particleSystem.blur = currentTrail;
            }
            
            this.triggerAutoSave();
        });
        
        // Per-species halo enable/disable
        document.getElementById('per-species-halo-enabled').addEventListener('change', (e) => {
            const enabled = e.target.checked;
            document.getElementById('per-species-halo-controls').style.display = enabled ? '' : 'none';
            document.getElementById('per-species-halo-intensity-control').style.display = enabled ? '' : 'none';
            document.getElementById('per-species-halo-radius-control').style.display = enabled ? '' : 'none';
            
            if (!enabled) {
                // Disable halo for all species using proper API
                this.particleSystem.clearAllSpeciesHalo();
            } else {
                // Enable halo for selected species using proper API
                const selectedSpecies = parseInt(document.getElementById('halo-species-selector').value);
                const intensity = parseFloat(document.getElementById('per-species-halo-intensity').value);
                const radius = parseFloat(document.getElementById('per-species-halo-radius').value);
                this.particleSystem.setSpeciesHalo(selectedSpecies, { intensity, radius });
            }
            this.triggerAutoSave();
        });
        
        document.getElementById('species-glow-enabled').addEventListener('change', (e) => {
            const enabled = e.target.checked;
            document.getElementById('species-glow-controls').style.display = enabled ? '' : 'none';
            document.getElementById('species-glow-size-control').style.display = enabled ? '' : 'none';
            document.getElementById('species-glow-intensity-control').style.display = enabled ? '' : 'none';
            
            if (!enabled) {
                // Disable glow for all species using proper API
                this.particleSystem.clearAllSpeciesGlow();
            } else {
                // Enable glow for selected species using proper API
                const selectedSpecies = parseInt(document.getElementById('glow-species-selector').value);
                const intensity = parseFloat(document.getElementById('species-glow-intensity').value);
                const size = parseFloat(document.getElementById('species-glow-size').value);
                this.particleSystem.setSpeciesGlow(selectedSpecies, { intensity, size });
            }
        });
        
        document.getElementById('glow-species-selector').addEventListener('change', (e) => {
            const selectedSpecies = parseInt(e.target.value);
            // Species selected for glow
            
            // Update sliders to show current values for selected species using proper API
            const glowSettings = this.particleSystem.getSpeciesGlow(selectedSpecies);
            
            document.getElementById('species-glow-size').value = glowSettings.size;
            document.getElementById('species-glow-size-value').textContent = glowSettings.size.toFixed(1);
            
            document.getElementById('species-glow-intensity').value = glowSettings.intensity;
            document.getElementById('species-glow-intensity-value').textContent = glowSettings.intensity.toFixed(2);
            
            // Glow settings updated
        });
        
        document.getElementById('species-glow-size').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('species-glow-size-value').textContent = value.toFixed(1);
            const selectedSpecies = parseInt(document.getElementById('glow-species-selector').value);
            this.particleSystem.setSpeciesGlow(selectedSpecies, { size: value });
        });
        
        document.getElementById('species-glow-intensity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('species-glow-intensity-value').textContent = value.toFixed(2);
            const selectedSpecies = parseInt(document.getElementById('glow-species-selector').value);
            this.particleSystem.setSpeciesGlow(selectedSpecies, { intensity: value });
        });
        
        // Missing event handler for glow species selector
        document.getElementById('glow-species-selector').addEventListener('change', (e) => {
            const selectedSpecies = parseInt(e.target.value);
            // Update UI to show current settings for this species
            const glowSettings = this.particleSystem.getSpeciesGlow(selectedSpecies);
            if (glowSettings) {
                document.getElementById('species-glow-size').value = glowSettings.size;
                document.getElementById('species-glow-size-value').textContent = glowSettings.size.toFixed(1);
                document.getElementById('species-glow-intensity').value = glowSettings.intensity;
                document.getElementById('species-glow-intensity-value').textContent = glowSettings.intensity.toFixed(2);
            }
        });
        
        // Per-species halo controls (simplified - no enable/disable checkbox)
        
        document.getElementById('halo-species-selector').addEventListener('change', (e) => {
            const selectedSpecies = parseInt(e.target.value);
            // Update UI to show current settings for this species
            const haloSettings = this.particleSystem.getSpeciesHalo(selectedSpecies);
            if (haloSettings) {
                document.getElementById('per-species-halo-intensity').value = haloSettings.intensity;
                document.getElementById('per-species-halo-intensity-value').textContent = haloSettings.intensity.toFixed(3);
                document.getElementById('per-species-halo-radius').value = haloSettings.radius;
                document.getElementById('per-species-halo-radius-value').textContent = haloSettings.radius.toFixed(1);
            }
        });
        
        document.getElementById('per-species-halo-intensity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('per-species-halo-intensity-value').textContent = value.toFixed(3);
            const selectedSpecies = parseInt(document.getElementById('halo-species-selector').value);
            this.particleSystem.setSpeciesHalo(selectedSpecies, { intensity: value });
            this.triggerAutoSave();
        });
        
        document.getElementById('per-species-halo-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('per-species-halo-radius-value').textContent = value.toFixed(1);
            const selectedSpecies = parseInt(document.getElementById('halo-species-selector').value);
            this.particleSystem.setSpeciesHalo(selectedSpecies, { radius: value });
            this.triggerAutoSave();
        });
        
        // Visual controls
        safeAddEventListener('background-mode', 'change', (e) => {
            this.particleSystem.backgroundMode = e.target.value;
            this.toggleBackgroundModeUI(e.target.value);
            this.triggerAutoSave();
        });
        
        safeAddEventListener('background-color', 'change', (e) => {
            this.particleSystem.backgroundColor = e.target.value;
            this.triggerAutoSave();
        });
        
        safeAddEventListener('background-color1', 'change', (e) => {
            this.particleSystem.backgroundColor1 = e.target.value;
            this.triggerAutoSave();
        });
        
        safeAddEventListener('background-color2', 'change', (e) => {
            this.particleSystem.backgroundColor2 = e.target.value;
            this.triggerAutoSave();
        });
        
        safeAddEventListener('background-cycle-time', 'input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.backgroundCycleTime = value;
            document.getElementById('background-cycle-time-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });
        
        // New species size controls
        safeAddEventListener('species-size', 'input', (e) => {
            const value = parseFloat(e.target.value);
            const selectedSpecies = this.selectedSpeciesForSize;
            
            if (selectedSpecies !== null && selectedSpecies !== undefined && this.particleSystem.species[selectedSpecies]) {
                // Clamp value to safe range
                const safeValue = Math.max(0.5, Math.min(30, value));
                
                if (document.getElementById('link-all-sizes').checked) {
                    // Update all species sizes when linked
                    for (let i = 0; i < this.particleSystem.species.length; i++) {
                        if (this.particleSystem.species[i]) {
                            this.particleSystem.species[i].size = safeValue;
                        }
                    }
                } else {
                    // Update only selected species
                    this.particleSystem.species[selectedSpecies].size = safeValue;
                }
                
                document.getElementById('species-size-value').textContent = value.toFixed(1);
                this.triggerAutoSave();
            }
        });
        
        safeAddEventListener('link-all-sizes', 'change', (e) => {
            this.triggerAutoSave();
        });
        
        
        // Action buttons
        document.getElementById('randomize-forces-btn').addEventListener('click', () => {
            this.randomizeForces();
        });
        
        document.getElementById('reset-defaults-btn').addEventListener('click', () => {
            // Reset to default values
            this.particleSystem.loadDefaults();
            this.updateUIFromParticleSystem();
            this.updateGraph();
        });
        
        // Force distribution slider
        document.getElementById('force-distribution').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('force-distribution-value').textContent = value.toFixed(1);
            this.forceDistribution = value;
            
            // Update UI state manager if available
            if (window.uiStateManager) {
                window.uiStateManager.updateParameter('forceDistribution', value, 'ui');
            }
            
            // Apply current pattern with new force distribution
            const currentPattern = document.getElementById('force-pattern-selector').value;
            const parameters = this.getPatternParameters(currentPattern);
            this.particleSystem.applyForcePattern(currentPattern, value, parameters);
            this.updateGraph();
            
            this.triggerAutoSave();
        });
        
        // Force pattern selector with dynamic parameters
        document.getElementById('force-pattern-selector').addEventListener('change', (e) => {
            const pattern = e.target.value;
            const edgeBias = this.forceDistribution || 0.8;
            
            // Update dynamic parameter panel
            this.updatePatternParametersPanel(pattern);
            
            // Apply the selected force pattern with current parameters
            const currentParams = this.getPatternParameters(pattern);
            this.particleSystem.applyForcePattern(pattern, edgeBias, currentParams);
            this.updateGraph();
            
            // Visual feedback
            const selector = e.target;
            const originalBg = selector.style.backgroundColor;
            selector.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                selector.style.backgroundColor = originalBg;
            }, 1000);
            
            this.triggerAutoSave();
        });
        
        // Aspect ratio controls
        if (this.aspectRatioManager) {
            this.setupAspectRatioControls();
        }
        
        // Modulation controls
        this.setupModulationControls();
    }
    
    setupModulationControls() {
        // Setting up modulation controls
        
        const parameterSelect = document.getElementById('modulation-parameter');
        const rangeControls = document.getElementById('modulation-range-controls');
        const waveControls = document.getElementById('modulation-wave-controls');
        const timeControls = document.getElementById('modulation-time-controls');
        const addBtn = document.getElementById('add-modulation-btn');
        const numericRange = document.getElementById('modulation-numeric-range');
        const colorRange = document.getElementById('modulation-color-range');
        const minSlider = document.getElementById('modulation-min');
        const maxSlider = document.getElementById('modulation-max');
        const minValue = document.getElementById('modulation-min-value');
        const maxValue = document.getElementById('modulation-max-value');
        const waveSelect = document.getElementById('modulation-wave-type');
        const timeSlider = document.getElementById('modulation-time');
        const timeValue = document.getElementById('modulation-time-value');
        const colorMin = document.getElementById('modulation-color-min');
        const colorMax = document.getElementById('modulation-color-max');
        
        // Check if elements exist
        if (!parameterSelect) {
            console.error('Modulation parameter select not found!');
            return;
        }
        
        if (!this.modulationManager) {
            console.error('ModulationManager not initialized!');
            return;
        }
        
        // Populate parameter dropdown
        // Populating modulation parameters
        this.updateModulationParameterOptions();
        
        // Handle parameter selection
        parameterSelect.addEventListener('change', (e) => {
            console.log('Parameter selected:', e.target.value);
            
            // Stop any existing preview
            this.modulationManager.stopPreview();
            
            const parameterId = e.target.value;
            if (!parameterId) {
                rangeControls.style.display = 'none';
                waveControls.style.display = 'none';
                timeControls.style.display = 'none';
                addBtn.style.display = 'none';
                return;
            }
            
            const categories = this.modulationManager.getParameterCategories();
            let paramConfig = null;
            
            for (const category of Object.values(categories)) {
                if (category[parameterId]) {
                    paramConfig = category[parameterId];
                    break;
                }
            }
            
            if (!paramConfig) {
                console.error('Parameter config not found for:', parameterId);
                return;
            }
            
            console.log('Parameter config:', paramConfig);
            
            rangeControls.style.display = 'block';
            waveControls.style.display = 'block';
            timeControls.style.display = 'block';
            addBtn.style.display = 'block';
            
            if (paramConfig.type === 'color') {
                numericRange.style.display = 'none';
                colorRange.style.display = 'block';
                document.getElementById('modulation-range-label').textContent = 'Colors';
                
                // Set current color as both min and max initially
                const currentColor = paramConfig.current();
                colorMin.value = currentColor;
                colorMax.value = currentColor;
            } else {
                numericRange.style.display = 'block';
                colorRange.style.display = 'none';
                document.getElementById('modulation-range-label').textContent = 'Range';
                
                // Configure range sliders
                const min = paramConfig.min || 0;
                const max = paramConfig.max || 1;
                const currentValue = paramConfig.current();
                
                console.log('Setting up range for', parameterId, {min, max, currentValue});
                
                minSlider.min = min;
                minSlider.max = max;
                minSlider.step = (max - min) / 100;
                
                maxSlider.min = min;
                maxSlider.max = max;
                maxSlider.step = (max - min) / 100;
                
                // Set initial range around current value
                // If current value is at the extremes, create a reasonable range
                let minVal, maxVal;
                const range = max - min;
                
                if (currentValue <= min + range * 0.1) {
                    // Current is near minimum
                    minVal = min;
                    maxVal = Math.min(max, min + range * 0.5);
                } else if (currentValue >= max - range * 0.1) {
                    // Current is near maximum
                    minVal = Math.max(min, max - range * 0.5);
                    maxVal = max;
                } else {
                    // Current is in the middle
                    minVal = Math.max(min, currentValue - range * 0.2);
                    maxVal = Math.min(max, currentValue + range * 0.2);
                }
                
                minSlider.value = minVal;
                maxSlider.value = maxVal;
                
                console.log('Initial slider values:', {minVal, maxVal});
                
                this.updateModulationRangeDisplay();
                
                // Start preview when parameter is selected
                this.startModulationPreview();
            }
        });
        
        // Handle range slider updates
        const updateModulationRangeDisplay = (event) => {
            const min = parseFloat(minSlider.value);
            const max = parseFloat(maxSlider.value);
            
            // Ensure min doesn't exceed max
            if (min > max) {
                if (event && event.target === minSlider) {
                    maxSlider.value = min;
                } else if (event && event.target === maxSlider) {
                    minSlider.value = max;
                }
            }
            
            minValue.textContent = parseFloat(minSlider.value).toFixed(2);
            maxValue.textContent = parseFloat(maxSlider.value).toFixed(2);
            
            // Update range fill visual
            const rangeFill = document.getElementById('modulation-range-fill');
            const minPercent = ((minSlider.value - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
            const maxPercent = ((maxSlider.value - maxSlider.min) / (maxSlider.max - maxSlider.min)) * 100;
            rangeFill.style.left = minPercent + '%';
            rangeFill.style.width = (maxPercent - minPercent) + '%';
        };
        
        this.updateModulationRangeDisplay = updateModulationRangeDisplay;
        
        // Add preview functionality
        this.startModulationPreview = () => {
            const parameterId = parameterSelect.value;
            if (!parameterId) return;
            
            const categories = this.modulationManager.getParameterCategories();
            let paramConfig = null;
            for (const category of Object.values(categories)) {
                if (category[parameterId]) {
                    paramConfig = category[parameterId];
                    break;
                }
            }
            
            if (!paramConfig) return;
            
            let minVal, maxVal;
            if (paramConfig.type === 'color') {
                minVal = colorMin.value;
                maxVal = colorMax.value;
            } else {
                minVal = parseFloat(minSlider.value);
                maxVal = parseFloat(maxSlider.value);
            }
            
            const duration = parseFloat(timeSlider.value);
            const waveType = waveSelect.value || 'sine';
            
            this.modulationManager.previewModulation(
                parameterId,
                minVal,
                maxVal,
                duration,
                waveType,
                paramConfig
            );
        };
        
        // Update preview when any value changes
        minSlider.addEventListener('input', (e) => {
            updateModulationRangeDisplay(e);
            this.startModulationPreview();
        });
        maxSlider.addEventListener('input', (e) => {
            updateModulationRangeDisplay(e);
            this.startModulationPreview();
        });
        
        // Handle wave type changes
        waveSelect.addEventListener('change', () => {
            this.startModulationPreview();
        });
        
        // Handle time slider
        timeSlider.addEventListener('input', (e) => {
            timeValue.textContent = parseFloat(e.target.value).toFixed(1) + 's';
            this.startModulationPreview();
        });
        
        // Handle color changes for preview
        colorMin.addEventListener('input', () => {
            this.startModulationPreview();
        });
        colorMax.addEventListener('input', () => {
            this.startModulationPreview();
        });
        
        // Add modulation button
        addBtn.addEventListener('click', () => {
            console.log('Adding modulation...');
            const parameterId = parameterSelect.value;
            if (!parameterId) return;
            
            const categories = this.modulationManager.getParameterCategories();
            let paramConfig = null;
            
            for (const category of Object.values(categories)) {
                if (category[parameterId]) {
                    paramConfig = category[parameterId];
                    break;
                }
            }
            
            if (!paramConfig) {
                console.error('Parameter config not found for:', parameterId);
                return;
            }
            
            console.log('Parameter config:', paramConfig);
            
            let minVal, maxVal;
            if (paramConfig.type === 'color') {
                minVal = colorMin.value;
                maxVal = colorMax.value;
            } else {
                minVal = parseFloat(minSlider.value);
                maxVal = parseFloat(maxSlider.value);
                
                // Debug: check what the display shows vs what the sliders have
                console.log('Display shows:', minValue.textContent, 'to', maxValue.textContent);
                console.log('Slider values:', minSlider.value, 'to', maxSlider.value);
            }
            
            const duration = parseFloat(timeSlider.value);
            
            console.log('Adding modulation with:', { parameterId, minVal, maxVal, duration });
            
            const waveType = waveSelect.value || 'sine';
            const modId = this.modulationManager.addModulation(
                parameterId,
                minVal,
                maxVal,
                duration,
                paramConfig,
                waveType
            );
            
            console.log('Modulation added with ID:', modId);
            this.updateModulationList();
            
            // Update pending modulations immediately
            if (this.particleSystem) {
                const modConfig = this.modulationManager.exportConfig();
                this.particleSystem.pendingModulations = modConfig;
            }
            
            this.triggerAutoSave();  // Auto-save modulation changes
            
            // Stop preview when adding
            this.modulationManager.stopPreview();
            
            // Reset form
            parameterSelect.value = '';
            rangeControls.style.display = 'none';
            waveControls.style.display = 'none';
            timeControls.style.display = 'none';
            addBtn.style.display = 'none';
        });
        
        this.updateModulationList();
    }
    
    updateModulationParameterOptions() {
        const select = document.getElementById('modulation-parameter');
        if (!select) {
            console.error('Modulation parameter select not found!');
            return;
        }
        
        const categories = this.modulationManager.getParameterCategories();
        // Parameter categories loaded
        
        // Clear existing options except the placeholder
        select.innerHTML = '<option value="">Select parameter...</option>';
        
        // Add categorized options
        for (const [categoryName, parameters] of Object.entries(categories)) {
            if (Object.keys(parameters).length === 0) continue;
            
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoryName;
            
            for (const [paramId, paramConfig] of Object.entries(parameters)) {
                const option = document.createElement('option');
                option.value = paramId;
                option.textContent = paramConfig.name;
                optgroup.appendChild(option);
            }
            
            select.appendChild(optgroup);
        }
    }
    
    updateModulationList() {
        const listContainer = document.getElementById('modulation-list');
        const modulations = this.modulationManager.getActiveModulations();
        
        // Updating modulation list
        
        if (modulations.length === 0) {
            listContainer.innerHTML = '<div style="color: var(--text-tertiary); text-align: center; padding: 10px;">No active modulations</div>';
            return;
        }
        
        listContainer.innerHTML = '';
        
        for (const mod of modulations) {
            const item = document.createElement('div');
            item.className = 'modulation-item';
            item.dataset.modId = mod.id;
            item.style.cssText = `
                padding: 8px;
                margin-bottom: 8px;
                background: var(--background-elevated);
                border-radius: 4px;
                font-size: 12px;
            `;
            
            // Create normal view
            const normalView = document.createElement('div');
            normalView.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            normalView.className = 'modulation-normal-view';
            
            const info = document.createElement('div');
            info.style.flex = '1';
            
            if (mod.type === 'color') {
                info.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong>${mod.parameterName}</strong>
                        <span style="display: inline-block; width: 20px; height: 20px; background: ${mod.minValue}; border: 1px solid var(--border-color); border-radius: 2px;"></span>
                        <span>↔</span>
                        <span style="display: inline-block; width: 20px; height: 20px; background: ${mod.maxValue}; border: 1px solid var(--border-color); border-radius: 2px;"></span>
                        <span style="color: var(--text-secondary);">${(mod.duration / 1000).toFixed(1)}s</span>
                    </div>
                `;
            } else {
                info.innerHTML = `
                    <div>
                        <strong>${mod.parameterName}</strong>
                        <span style="color: var(--text-secondary); margin-left: 8px;">
                            ${mod.minValue.toFixed(2)} ↔ ${mod.maxValue.toFixed(2)} • ${(mod.duration / 1000).toFixed(1)}s
                        </span>
                    </div>
                `;
            }
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = 'display: flex; gap: 4px;';
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✎';
            editBtn.title = 'Edit modulation';
            editBtn.style.cssText = `
                background: transparent;
                border: none;
                color: var(--text-tertiary);
                font-size: 16px;
                cursor: pointer;
                padding: 0 4px;
                line-height: 1;
            `;
            editBtn.addEventListener('click', () => this.editModulation(mod));
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.title = 'Remove modulation';
            removeBtn.style.cssText = `
                background: transparent;
                border: none;
                color: var(--text-tertiary);
                font-size: 20px;
                cursor: pointer;
                padding: 0 4px;
                line-height: 1;
            `;
            removeBtn.addEventListener('click', () => {
                this.modulationManager.removeModulation(mod.id);
                this.updateModulationList();
                
                // Update pending modulations immediately
                if (this.particleSystem) {
                    const modConfig = this.modulationManager.exportConfig();
                    this.particleSystem.pendingModulations = modConfig;
                }
                
                this.triggerAutoSave();  // Auto-save after removing modulation
            });
            
            normalView.appendChild(info);
            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(removeBtn);
            normalView.appendChild(buttonContainer);
            
            item.appendChild(normalView);
            
            // Create edit view (initially hidden)
            const editView = this.createModulationEditView(mod);
            editView.style.display = 'none';
            item.appendChild(editView);
            
            listContainer.appendChild(item);
        }
    }
    
    createModulationEditView(mod) {
        const editView = document.createElement('div');
        editView.className = 'modulation-edit-view';
        editView.style.cssText = 'padding: 8px 0;';
        
        if (mod.type === 'color') {
            editView.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">Color Range</label>
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                        <input type="color" class="edit-color-min" value="${mod.minValue}" style="width: 50px; height: 30px;">
                        <span style="color: var(--text-tertiary);">→</span>
                        <input type="color" class="edit-color-max" value="${mod.maxValue}" style="width: 50px; height: 30px;">
                    </div>
                </div>
            `;
        } else {
            // Get the parameter config to know the min/max bounds
            const categories = this.modulationManager.getParameterCategories();
            let paramConfig = null;
            for (const category of Object.values(categories)) {
                if (category[mod.parameterId]) {
                    paramConfig = category[mod.parameterId];
                    break;
                }
            }
            
            const min = paramConfig?.min || 0;
            const max = paramConfig?.max || 1;
            
            editView.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">
                        Range
                        <span class="edit-range-display" style="margin-left: 8px;">
                            ${mod.minValue.toFixed(2)} - ${mod.maxValue.toFixed(2)}
                        </span>
                    </label>
                    <div style="position: relative; margin-top: 4px;">
                        <div class="range-fill edit-range-fill" style="
                            position: absolute;
                            height: 4px;
                            background: var(--accent-color);
                            opacity: 0.3;
                            pointer-events: none;
                            top: 50%;
                            transform: translateY(-50%);
                            border-radius: 2px;
                        "></div>
                        <input type="range" class="modulation-slider edit-range-min" 
                               min="${min}" max="${max}" step="${(max - min) / 100}" 
                               value="${mod.minValue}"
                               style="position: absolute; width: 100%; background: transparent; -webkit-appearance: none;">
                        <input type="range" class="modulation-slider edit-range-max" 
                               min="${min}" max="${max}" step="${(max - min) / 100}" 
                               value="${mod.maxValue}"
                               style="position: relative; width: 100%; background: transparent; -webkit-appearance: none;">
                    </div>
                </div>
            `;
        }
        
        // Add wave type control
        const waveControl = document.createElement('div');
        waveControl.style.marginTop = '12px';
        waveControl.innerHTML = `
            <label style="font-size: 11px; color: var(--text-secondary);">Wave Type</label>
            <select class="edit-wave-type" style="width: 100%; margin-top: 4px; padding: 4px; background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 3px; font-size: 11px;">
                <option value="sine" ${mod.waveType === 'sine' || !mod.waveType ? 'selected' : ''}>Sine (Smooth)</option>
                <option value="triangle" ${mod.waveType === 'triangle' ? 'selected' : ''}>Triangle (Linear)</option>
                <option value="sawtooth" ${mod.waveType === 'sawtooth' ? 'selected' : ''}>Sawtooth (Ramp Up)</option>
                <option value="square" ${mod.waveType === 'square' ? 'selected' : ''}>Square (On/Off)</option>
                <option value="smooth-square" ${mod.waveType === 'smooth-square' ? 'selected' : ''}>Smooth Square</option>
                <option value="exponential" ${mod.waveType === 'exponential' ? 'selected' : ''}>Exponential</option>
                <option value="logarithmic" ${mod.waveType === 'logarithmic' ? 'selected' : ''}>Logarithmic</option>
                <option value="elastic" ${mod.waveType === 'elastic' ? 'selected' : ''}>Elastic</option>
                <option value="bounce" ${mod.waveType === 'bounce' ? 'selected' : ''}>Bounce</option>
                <option value="random" ${mod.waveType === 'random' ? 'selected' : ''}>Random</option>
            </select>
        `;
        editView.appendChild(waveControl);
        
        // Add duration control
        const durationControl = document.createElement('div');
        durationControl.style.marginTop = '12px';
        durationControl.innerHTML = `
            <label style="font-size: 11px; color: var(--text-secondary);">
                Duration
                <span class="edit-duration-display" style="margin-left: 8px;">
                    ${(mod.duration / 1000).toFixed(1)}s
                </span>
            </label>
            <input type="range" class="edit-duration" 
                   min="0.5" max="20" step="0.5" 
                   value="${mod.duration / 1000}"
                   style="width: 100%; margin-top: 4px;">
        `;
        editView.appendChild(durationControl);
        
        // Add save/cancel buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';
        buttonContainer.innerHTML = `
            <button class="save-edit-btn" style="
                flex: 1;
                padding: 4px 8px;
                background: var(--accent-color);
                color: white;
                border: none;
                border-radius: 3px;
                font-size: 11px;
                cursor: pointer;
            ">Save</button>
            <button class="cancel-edit-btn" style="
                flex: 1;
                padding: 4px 8px;
                background: var(--background-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                font-size: 11px;
                cursor: pointer;
            ">Cancel</button>
        `;
        editView.appendChild(buttonContainer);
        
        // Set up event handlers after elements are created
        setTimeout(() => this.setupEditViewHandlers(editView, mod), 0);
        
        return editView;
    }
    
    setupEditViewHandlers(editView, mod) {
        const parent = editView.parentElement;
        if (!parent) return;
        
        // Function to update live preview during editing
        const updateEditPreview = () => {
            let newMin, newMax;
            
            if (mod.type === 'color') {
                newMin = editView.querySelector('.edit-color-min')?.value || mod.minValue;
                newMax = editView.querySelector('.edit-color-max')?.value || mod.maxValue;
            } else {
                newMin = parseFloat(editView.querySelector('.edit-range-min')?.value || mod.minValue);
                newMax = parseFloat(editView.querySelector('.edit-range-max')?.value || mod.maxValue);
            }
            
            const newDuration = parseFloat(editView.querySelector('.edit-duration')?.value || mod.duration / 1000);
            const newWaveType = editView.querySelector('.edit-wave-type')?.value || mod.waveType || 'sine';
            
            // Update the actual modulation temporarily for preview
            this.modulationManager.updateModulation(mod.id, newMin, newMax, newDuration, newWaveType);
        };
        
        // Handle range sliders for numeric values
        if (mod.type !== 'color') {
            const minSlider = editView.querySelector('.edit-range-min');
            const maxSlider = editView.querySelector('.edit-range-max');
            const rangeDisplay = editView.querySelector('.edit-range-display');
            const rangeFill = editView.querySelector('.edit-range-fill');
            
            const updateRangeDisplay = () => {
                const min = parseFloat(minSlider.value);
                const max = parseFloat(maxSlider.value);
                
                // Ensure min doesn't exceed max
                if (min > max) {
                    if (document.activeElement === minSlider) {
                        maxSlider.value = min;
                    } else {
                        minSlider.value = max;
                    }
                }
                
                rangeDisplay.textContent = `${parseFloat(minSlider.value).toFixed(2)} - ${parseFloat(maxSlider.value).toFixed(2)}`;
                
                // Update range fill
                const minPercent = ((minSlider.value - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
                const maxPercent = ((maxSlider.value - maxSlider.min) / (maxSlider.max - maxSlider.min)) * 100;
                rangeFill.style.left = minPercent + '%';
                rangeFill.style.width = (maxPercent - minPercent) + '%';
            };
            
            minSlider.addEventListener('input', () => {
                updateRangeDisplay();
                updateEditPreview();
            });
            maxSlider.addEventListener('input', () => {
                updateRangeDisplay();
                updateEditPreview();
            });
            updateRangeDisplay();
        } else {
            // Handle color inputs for color modulations
            const colorMin = editView.querySelector('.edit-color-min');
            const colorMax = editView.querySelector('.edit-color-max');
            if (colorMin && colorMax) {
                colorMin.addEventListener('input', updateEditPreview);
                colorMax.addEventListener('input', updateEditPreview);
            }
        }
        
        // Handle wave type changes
        const waveSelect = editView.querySelector('.edit-wave-type');
        if (waveSelect) {
            waveSelect.addEventListener('change', updateEditPreview);
        }
        
        // Handle duration slider
        const durationSlider = editView.querySelector('.edit-duration');
        const durationDisplay = editView.querySelector('.edit-duration-display');
        durationSlider.addEventListener('input', () => {
            durationDisplay.textContent = parseFloat(durationSlider.value).toFixed(1) + 's';
            updateEditPreview();
        });
        
        // Handle save button
        editView.querySelector('.save-edit-btn').addEventListener('click', () => {
            let newMin, newMax;
            
            if (mod.type === 'color') {
                newMin = editView.querySelector('.edit-color-min').value;
                newMax = editView.querySelector('.edit-color-max').value;
            } else {
                newMin = parseFloat(editView.querySelector('.edit-range-min').value);
                newMax = parseFloat(editView.querySelector('.edit-range-max').value);
            }
            
            const newDuration = parseFloat(durationSlider.value);
            const newWaveType = editView.querySelector('.edit-wave-type')?.value || mod.waveType || 'sine';
            
            // Update the modulation
            this.modulationManager.updateModulation(mod.id, newMin, newMax, newDuration, newWaveType);
            
            // Exit edit mode and refresh list
            this.updateModulationList();
            
            // Update pending modulations immediately
            if (this.particleSystem) {
                const modConfig = this.modulationManager.exportConfig();
                this.particleSystem.pendingModulations = modConfig;
            }
            
            this.triggerAutoSave();  // Auto-save after updating modulation
        });
        
        // Handle cancel button
        editView.querySelector('.cancel-edit-btn').addEventListener('click', () => {
            // Exit edit mode without saving
            editView.style.display = 'none';
            parent.querySelector('.modulation-normal-view').style.display = 'flex';
        });
    }
    
    editModulation(mod) {
        // Find the modulation item
        const item = document.querySelector(`[data-mod-id="${mod.id}"]`);
        if (!item) return;
        
        // Hide normal view, show edit view
        item.querySelector('.modulation-normal-view').style.display = 'none';
        item.querySelector('.modulation-edit-view').style.display = 'block';
    }
    
    setupAspectRatioControls() {
        const enableCheckbox = document.getElementById('aspect-ratio-enabled');
        const strokeCheckbox = document.getElementById('aspect-ratio-stroke');
        const controls = document.getElementById('aspect-ratio-controls');
        const ratioButtons = document.querySelectorAll('.ratio-btn');
        const customRatioControls = document.getElementById('custom-ratio-controls');
        const customWidth = document.getElementById('custom-width');
        const customHeight = document.getElementById('custom-height');
        const canvasSize = document.getElementById('canvas-size');
        const customSizeControls = document.getElementById('custom-size-controls');
        const customCanvasWidth = document.getElementById('custom-canvas-width');
        const customCanvasHeight = document.getElementById('custom-canvas-height');
        
        // Enable/disable aspect ratio
        enableCheckbox.addEventListener('change', (e) => {
            this.aspectRatioManager.setEnabled(e.target.checked);
            controls.style.display = e.target.checked ? 'block' : 'none';
            
            // Resize particle system
            this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
            this.triggerAutoSave();
        });
        
        // Enable/disable stroke
        strokeCheckbox.addEventListener('change', (e) => {
            this.aspectRatioManager.setStrokeEnabled(e.target.checked);
            this.triggerAutoSave();
        });
        
        // Ratio buttons
        ratioButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                ratioButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const ratio = btn.dataset.ratio;
                if (ratio === 'custom') {
                    customRatioControls.style.display = 'block';
                    const w = parseInt(customWidth.value);
                    const h = parseInt(customHeight.value);
                    this.aspectRatioManager.setRatio(w, h);
                } else {
                    customRatioControls.style.display = 'none';
                    const [w, h] = ratio.split(':').map(Number);
                    this.aspectRatioManager.setRatio(w, h);
                }
                
                this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
                this.triggerAutoSave();
            });
        });
        
        // Custom ratio inputs
        customWidth.addEventListener('input', () => {
            if (document.querySelector('.ratio-btn[data-ratio="custom"]').classList.contains('active')) {
                this.aspectRatioManager.setRatio(parseInt(customWidth.value), parseInt(customHeight.value));
                this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
                this.triggerAutoSave();
            }
        });
        
        customHeight.addEventListener('input', () => {
            if (document.querySelector('.ratio-btn[data-ratio="custom"]').classList.contains('active')) {
                this.aspectRatioManager.setRatio(parseInt(customWidth.value), parseInt(customHeight.value));
                this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
                this.triggerAutoSave();
            }
        });
        
        // Canvas size selector
        canvasSize.addEventListener('change', (e) => {
            this.aspectRatioManager.setCanvasSize(e.target.value);
            customSizeControls.style.display = e.target.value === 'custom-size' ? 'block' : 'none';
            this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
            this.triggerAutoSave();
        });
        
        // Custom canvas size
        customCanvasWidth.addEventListener('input', () => {
            this.aspectRatioManager.setCustomSize(parseInt(customCanvasWidth.value), parseInt(customCanvasHeight.value));
            this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
            this.triggerAutoSave();
        });
        
        customCanvasHeight.addEventListener('input', () => {
            this.aspectRatioManager.setCustomSize(parseInt(customCanvasWidth.value), parseInt(customCanvasHeight.value));
            this.particleSystem.resize(this.aspectRatioManager.canvas.width, this.aspectRatioManager.canvas.height);
            this.triggerAutoSave();
        });
        
        // Set default ratio button
        setTimeout(() => {
            const firstRatioBtn = ratioButtons[0];
            if (firstRatioBtn) {
                firstRatioBtn.click();
            }
        }, 100);
    }
    
    updateSpeciesSelectors(numSpecies) {
        const selectors = ['from-species', 'to-species', 'glow-species-selector', 'halo-species-selector', 'trail-species-selector', 'size-species-selector'];
        
        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (!select) return;
            
            const currentValue = select.value;
            select.innerHTML = '';
            
            // Add "None" option for trail-species-selector in exclusion mode
            if (selectorId === 'trail-species-selector' && this.particleSystem.trailExclusionEnabled) {
                const noneOption = document.createElement('option');
                noneOption.value = '-1';
                noneOption.textContent = 'None';
                select.appendChild(noneOption);
            }
            
            for (let i = 0; i < numSpecies; i++) {
                const option = document.createElement('option');
                option.value = i;
                // Use dynamic species name based on color
                option.textContent = this.particleSystem.getSpeciesName(i);
                select.appendChild(option);
            }
            
            // Restore previous value if valid
            if (currentValue && (parseInt(currentValue) < numSpecies || (selectorId === 'trail-species-selector' && currentValue === '-1'))) {
                select.value = currentValue;
            } else if (selectorId === 'to-species' && numSpecies > 1) {
                select.value = '1';
            }
        });
        
        // Update distribution species buttons separately
        this.updateSpeciesButtons(numSpecies);
    }
    
    updateGraph() {
        const fromSpecies = parseInt(document.getElementById('from-species').value);
        const toSpecies = parseInt(document.getElementById('to-species').value);
        const force = this.particleSystem.socialForce[fromSpecies]?.[toSpecies] || 0;
        
        this.forceGraph.setValue(force);
        this.updateGraphInfo();
    }
    
    updateGraphInfo() {
        const fromSpecies = parseInt(document.getElementById('from-species').value);
        const toSpecies = parseInt(document.getElementById('to-species').value);
        const force = this.particleSystem.socialForce[fromSpecies]?.[toSpecies] || 0;
        
        // Use dynamic species names from particle system
        const fromName = this.particleSystem.getSpeciesName(fromSpecies);
        const toName = this.particleSystem.getSpeciesName(toSpecies);
        
        this.forceGraph.setInfo(`${fromName} → ${toName}: ${force.toFixed(2)}`);
    }
    
    // Dynamic pattern parameters panel management
    updatePatternParametersPanel(pattern) {
        const panel = document.getElementById('pattern-parameters-panel');
        if (!panel) {
            return;
        }
        
        // Store current parameter values before switching patterns
        const currentPattern = document.getElementById('force-pattern-selector').value;
        if (currentPattern && currentPattern !== pattern && panel.children.length > 0) {
            this.storePatternParameters(currentPattern);
        }
        
        // Clear existing content
        panel.innerHTML = '';
        
        if (pattern === 'random') {
            panel.style.display = 'none';
            return;
        }
        
        panel.style.display = 'block';
        
        // Generate parameter controls based on pattern
        switch (pattern) {
            case 'clusters':
                this.createClustersParameterPanel(panel);
                break;
            case 'predator-prey':
                this.createPredatorPreyParameterPanel(panel);
                break;
            case 'territorial':
                this.createTerritorialParameterPanel(panel);
                break;
            case 'symbiotic':
                this.createSymbioticParameterPanel(panel);
                break;
            case 'cyclic':
                this.createCyclicParameterPanel(panel);
                break;
            default:
                console.warn(`Unknown pattern: ${pattern}`);
        }
        
        // Restore saved parameter values for this pattern
        this.restorePatternParameters(pattern);
    }
    
    createClustersParameterPanel(panel) {
        panel.innerHTML = `
            <div class="pattern-parameters-header">
                <h5>Cluster Parameters</h5>
                <p class="pattern-description">Create stable cluster formations with orbital dynamics</p>
            </div>
            <div class="control-group">
                <label>Quick Presets</label>
                <div class="preset-buttons">
                    <button class="btn btn-sm preset-btn" data-preset="orbital" title="Tight rotating formations - inspired by 'planets'">Orbital</button>
                    <button class="btn btn-sm preset-btn" data-preset="layered" title="Concentric shell structures - inspired by 'atoms'">Layered</button>
                    <button class="btn btn-sm preset-btn" data-preset="competitive" title="Dynamic territorial clusters - inspired by 'red menace'">Competitive</button>
                    <button class="btn btn-sm preset-btn" data-preset="loose" title="Sparse cloud formations - inspired by 'gems'">Loose</button>
                </div>
            </div>
            <div class="control-group">
                <label title="Choose the type of cluster formation pattern">
                    Cluster Type <span class="tooltip-icon">ℹ️</span>
                </label>
                <select class="select select-sm" id="param-cluster-type" title="Orbital: rotating clusters, Layered: concentric shells, Competitive: dynamic territories">
                    <option value="orbital">Orbital (rotating clusters)</option>
                    <option value="layered">Layered (concentric shells)</option>
                    <option value="competitive_clustering">Competitive (dynamic territories)</option>
                    <option value="symbiotic_chains">Symbiotic Chains (linked groups)</option>
                    <option value="hierarchical_rings">Hierarchical Rings (nested circles)</option>
                </select>
            </div>
            <div class="control-group">
                <label title="Controls how strongly particles attract within their cluster. Higher values create tighter, more stable clusters.">
                    Cohesion Strength
                    <span class="value-display" id="param-cohesion-value">0.8</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-cohesion-strength" 
                       min="0.05" max="3.0" step="0.05" value="0.8" title="0.05 = ultra-loose clusters, 3.0 = ultra-tight formations">
                <div class="slider-labels">
                    <span class="slider-label-left">Loose</span>
                    <span class="slider-label-right">Tight</span>
                </div>
            </div>
            <div class="control-group">
                <label title="Optimal distance between cluster members. Lower values create denser formations.">
                    Separation Distance
                    <span class="value-display" id="param-separation-value">0.5</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-separation-distance" 
                       min="0.05" max="1.5" step="0.05" value="0.5" title="0.05 = ultra-dense packing, 1.5 = maximum spread">
                <div class="slider-labels">
                    <span class="slider-label-left">Dense</span>
                    <span class="slider-label-right">Spread</span>
                </div>
            </div>
            <div class="control-group">
                <label title="How much clusters prefer specific formations over random arrangements. Higher values create more structured patterns.">
                    Formation Bias
                    <span class="value-display" id="param-formation-value">0.6</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-formation-bias" 
                       min="0.0" max="1.0" step="0.1" value="0.6" title="0.1 = random arrangement, 1.0 = perfect formation">
                <div class="slider-labels">
                    <span class="slider-label-left">Random</span>
                    <span class="slider-label-right">Structured</span>
                </div>
            </div>
        `;
        
        // Add event listeners for real-time updates
        this.attachParameterListeners('clusters');
    }
    
    createPredatorPreyParameterPanel(panel) {
        panel.innerHTML = `
            <div class="pattern-parameters-header">
                <h5>Predator-Prey Parameters</h5>
                <p class="pattern-description">Simulate hunting dynamics and food chain behaviors</p>
            </div>
            <div class="control-group">
                <label>Quick Presets</label>
                <div class="preset-buttons">
                    <button class="btn btn-sm preset-btn" data-preset="simple" title="Basic linear hunting chains - inspired by 'simple'">Simple</button>
                    <button class="btn btn-sm preset-btn" data-preset="complex" title="Interconnected ecosystem web - inspired by 'complex'">Complex</button>
                    <button class="btn btn-sm preset-btn" data-preset="pack" title="Coordinated group hunting - inspired by 'pack hunting'">Pack</button>
                    <button class="btn btn-sm preset-btn" data-preset="territorial" title="Area-based hunting grounds - inspired by 'territorial'">Territorial</button>
                </div>
            </div>
            <div class="control-group">
                <label title="Choose the ecosystem complexity and interaction patterns">
                    Ecosystem Type <span class="tooltip-icon">ℹ️</span>
                </label>
                <select class="select select-sm" id="param-ecosystem-type" title="Simple Chain: linear predator-prey relationships, Complex Web: interconnected food web">
                    <option value="simple_chain">Simple Chain (linear food chain)</option>
                    <option value="complex_web">Complex Web (interconnected)</option>
                    <option value="territorial">Territorial (area-based hunting)</option>
                    <option value="pack_hunting">Pack Hunting (group coordination)</option>
                </select>
            </div>
            <div class="control-group">
                <label title="How aggressively predators pursue prey. Higher values create more intense hunting behavior.">
                    Hunt Intensity
                    <span class="value-display" id="param-hunt-value">3.0</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-hunt-intensity" 
                       min="0.5" max="6.0" step="0.1" value="3.0" title="0.5 = nearly passive, 6.0 = relentless pursuit">
                <div class="slider-labels">
                    <span class="slider-label-left">Passive</span>
                    <span class="slider-label-right">Aggressive</span>
                </div>
            </div>
            <div class="control-group">
                <label title="How strongly prey species flee from predators. Higher values create more dramatic escape behaviors.">
                    Escape Intensity
                    <span class="value-display" id="param-escape-value">2.5</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-escape-intensity" 
                       min="0.3" max="6.0" step="0.1" value="2.5" title="0.3 = sluggish response, 6.0 = instant panic flight">
                <div class="slider-labels">
                    <span class="slider-label-left">Slow</span>
                    <span class="slider-label-right">Rapid</span>
                </div>
            </div>
            <div class="control-group">
                <label title="Ratio of predators to prey in the ecosystem. Lower values = more prey, higher values = more predators.">
                    Population Balance
                    <span class="value-display" id="param-population-value">0.4</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-population-balance" 
                       min="0.2" max="0.8" step="0.1" value="0.4" title="0.2 = many prey species, 0.8 = many predator species">
                <div class="slider-labels">
                    <span class="slider-label-left">Few Predators</span>
                    <span class="slider-label-right">Many Predators</span>
                </div>
            </div>
        `;
        
        // Add event listeners for real-time updates
        this.attachParameterListeners('predator-prey');
    }
    
    createTerritorialParameterPanel(panel) {
        panel.innerHTML = `
            <div class="pattern-parameters-header">
                <h5>Territorial Parameters</h5>
                <p class="pattern-description">Create aggressive territorial behaviors with strong boundaries</p>
            </div>
            <div class="control-group">
                <label>Quick Presets</label>
                <div class="preset-buttons">
                    <button class="btn btn-sm preset-btn" data-preset="peaceful" title="Vast domains with permeable borders - inspired by 'gems'">Peaceful</button>
                    <button class="btn btn-sm preset-btn" data-preset="aggressive" title="Micro-territories with berserker fury - inspired by 'red menace'">Aggressive</button>
                    <button class="btn btn-sm preset-btn" data-preset="fortress" title="Impenetrable defensive bastions - inspired by 'fortress'">Fortress</button>
                    <button class="btn btn-sm preset-btn" data-preset="nomadic" title="Expansive wandering domains - inspired by 'field'">Nomadic</button>
                </div>
            </div>
            <div class="control-group">
                <label title="Size of each species' territorial area. Smaller territories create tighter groups, larger territories allow more spread.">
                    Territory Size
                    <span class="value-display" id="param-territory-value">0.3</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-territory-size" 
                       min="0.05" max="1.2" step="0.05" value="0.3" title="0.05 = micro-territories, 1.2 = vast domains">
                <div class="slider-labels">
                    <span class="slider-label-left">Small</span>
                    <span class="slider-label-right">Large</span>
                </div>
            </div>
            <div class="control-group">
                <label title="How strongly species defend their territorial boundaries. Higher values create more aggressive defensive behavior.">
                    Boundary Strength
                    <span class="value-display" id="param-boundary-value">1.2</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-boundary-strength" 
                       min="0.2" max="4.0" step="0.1" value="1.2" title="0.2 = permeable borders, 4.0 = impenetrable walls">
                <div class="slider-labels">
                    <span class="slider-label-left">Weak</span>
                    <span class="slider-label-right">Strong</span>
                </div>
            </div>
            <div class="control-group">
                <label title="How violently species react to territorial invasion. Higher values create more dramatic territorial conflicts.">
                    Invasion Response
                    <span class="value-display" id="param-invasion-value">2.0</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-invasion-response" 
                       min="0.2" max="5.0" step="0.1" value="2.0" title="0.2 = pacifist response, 5.0 = berserker fury">
                <div class="slider-labels">
                    <span class="slider-label-left">Mild</span>
                    <span class="slider-label-right">Violent</span>
                </div>
            </div>
        `;
        
        this.attachParameterListeners('territorial');
    }
    
    createSymbioticParameterPanel(panel) {
        panel.innerHTML = `
            <div class="pattern-parameters-header">
                <h5>Symbiotic Parameters</h5>
                <p class="pattern-description">Create mutually beneficial partnerships between species</p>
            </div>
            <div class="control-group">
                <label>Quick Presets</label>
                <div class="preset-buttons">
                    <button class="btn btn-sm preset-btn" data-preset="mutualism" title="Perfect harmony with total dependency - inspired by 'alliances'">Mutualism</button>
                    <button class="btn btn-sm preset-btn" data-preset="commensalism" title="Indirect cooperation through environment - inspired by 'stigmergy'">Commensalism</button>
                    <button class="btn btn-sm preset-btn" data-preset="competition" title="High-stakes competitive partnerships - inspired by 'acrobats'">Competition</button>
                    <button class="btn btn-sm preset-btn" data-preset="independence" title="Minimal interdependence - inspired by 'simplify'">Independence</button>
                </div>
            </div>
            <div class="control-group">
                <label>
                    Cooperation Strength
                    <span class="value-display" id="param-cooperation-value">1.5</span>
                </label>
                <input type="range" class="range-slider" id="param-cooperation-strength" 
                       min="0.5" max="3.0" step="0.1" value="1.5">
            </div>
            <div class="control-group">
                <label>
                    Dependency Level
                    <span class="value-display" id="param-dependency-value">0.7</span>
                </label>
                <input type="range" class="range-slider" id="param-dependency-level" 
                       min="0.1" max="1.0" step="0.05" value="0.7" 
                       title="0.1 = completely independent, 1.0 = total dependency">
            </div>
            <div class="control-group">
                <label>Mutualism Type</label>
                <select class="select-dropdown" id="param-mutualism-type" 
                        title="Choose interaction type: obligate (must cooperate) or facultative (can survive alone)">
                    <option value="obligate">Obligate (Dependent)</option>
                    <option value="facultative" selected>Facultative (Optional)</option>
                </select>
            </div>
            <div class="control-group">
                <label>
                    Competition Intensity
                    <span class="value-display" id="param-competition-value">1.2</span>
                </label>
                <input type="range" class="range-slider" id="param-competition-intensity" 
                       min="0.1" max="4.0" step="0.1" value="1.2" 
                       title="0.1 = peaceful coexistence, 4.0 = intense competition">
            </div>
        `;
        
        this.attachParameterListeners('symbiotic');
    }
    
    createCyclicParameterPanel(panel) {
        panel.innerHTML = `
            <div class="pattern-parameters-header">
                <h5>Cyclic Parameters</h5>
                <p class="pattern-description">Create rock-paper-scissors style circular dominance relationships</p>
            </div>
            <div class="control-group">
                <label>Quick Presets</label>
                <div class="preset-buttons">
                    <button class="btn btn-sm preset-btn" data-preset="classic" title="Stable orbital dynamics - inspired by 'planets'">Classic</button>
                    <button class="btn btn-sm preset-btn" data-preset="chaotic" title="Rapid division and reformation - inspired by 'mitosis'">Chaotic</button>
                    <button class="btn btn-sm preset-btn" data-preset="stable" title="Hypnotic slow transitions - inspired by 'dreamtime'">Stable</button>
                    <button class="btn btn-sm preset-btn" data-preset="complex" title="Multi-layered sophistication - inspired by 'pollack'">Complex</button>
                </div>
            </div>
            <div class="control-group">
                <label title="Speed of the dominance cycle transitions. Higher values create faster changing dynamics.">
                    Cycle Speed
                    <span class="value-display" id="param-cycle-speed-value">1.0</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-cycle-speed" 
                       min="0.1" max="4.0" step="0.1" value="1.0" title="0.1 = glacial transitions, 4.0 = lightning-fast cycles">
                <div class="slider-labels">
                    <span class="slider-label-left">Slow</span>
                    <span class="slider-label-right">Fast</span>
                </div>
            </div>
            <div class="control-group">
                <label title="Strength of dominance relationships. Higher values create more dramatic chase-flee behaviors.">
                    Dominance Strength
                    <span class="value-display" id="param-dominance-value">2.0</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-dominance-strength" 
                       min="0.3" max="4.0" step="0.1" value="2.0" title="0.3 = gentle influence, 4.0 = absolute dominion">
                <div class="slider-labels">
                    <span class="slider-label-left">Mild</span>
                    <span class="slider-label-right">Strong</span>
                </div>
            </div>
            <div class="control-group">
                <label>Cycle Complexity</label>
                <select class="select-dropdown" id="param-cycle-complexity" 
                        title="Pattern complexity: simple (basic cycles), complex (multi-layered), multi-level (nested patterns)">
                    <option value="simple" selected>Simple</option>
                    <option value="complex">Complex</option>
                    <option value="multi-level">Multi-Level</option>
                </select>
            </div>
            <div class="control-group">
                <label title="How stable individual species clusters are within the cycle. Higher values resist disruption.">
                    Stability Factor
                    <span class="value-display" id="param-stability-value">0.5</span>
                    <span class="tooltip-icon">ℹ️</span>
                </label>
                <input type="range" class="range-slider" id="param-stability-factor" 
                       min="0.05" max="1.0" step="0.05" value="0.5" title="0.05 = pure chaos, 1.0 = unbreakable formations">
                <div class="slider-labels">
                    <span class="slider-label-left">Chaotic</span>
                    <span class="slider-label-right">Stable</span>
                </div>
            </div>
        `;
        
        this.attachParameterListeners('cyclic');
    }
    
    // Attach event listeners for pattern parameter controls
    attachParameterListeners(pattern) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const panel = document.getElementById('pattern-parameters-panel');
            if (!panel) {
                console.warn('Pattern parameters panel not found');
                return;
            }
            
            // Create ID mapping for value displays
            const idMappings = {
                // Clusters
                'param-cluster-type': null, // No value display for selects
                'param-cohesion-strength': 'param-cohesion-value',
                'param-separation-distance': 'param-separation-value',
                'param-formation-bias': 'param-formation-value',
                
                // Predator-Prey
                'param-ecosystem-type': null,
                'param-hunt-intensity': 'param-hunt-value',
                'param-escape-intensity': 'param-escape-value',
                'param-population-balance': 'param-population-value',
                
                // Territorial
                'param-territory-size': 'param-territory-value',
                'param-boundary-strength': 'param-boundary-value',
                'param-invasion-response': 'param-invasion-value',
                
                // Symbiotic
                'param-cooperation-strength': 'param-cooperation-value',
                'param-dependency-level': 'param-dependency-value',
                'param-competition-intensity': 'param-competition-value',
                
                // Cyclic
                'param-cycle-speed': 'param-cycle-speed-value',
                'param-dominance-strength': 'param-dominance-value',
                'param-stability-factor': 'param-stability-value'
            };
            
            // Get all inputs and selects in the parameter panel
            const inputs = panel.querySelectorAll('input[type="range"], select');
            
            
            inputs.forEach(input => {
                const eventType = input.type === 'range' ? 'input' : 'change';
                
                // For range inputs, also update the display immediately
                if (input.type === 'range') {
                    const valueDisplayId = idMappings[input.id];
                    if (valueDisplayId) {
                        const valueDisplay = panel.querySelector(`#${valueDisplayId}`);
                        if (valueDisplay) {
                            const value = parseFloat(input.value);
                            valueDisplay.textContent = Number.isInteger(value) ? value.toString() : value.toFixed(1);
                            // Initial value display set
                        }
                    }
                }
                
                input.addEventListener(eventType, (e) => {
                    // Parameter changed
                    
                    // Update value display for range inputs
                    if (input.type === 'range') {
                        const valueDisplayId = idMappings[input.id];
                        if (valueDisplayId) {
                            const valueDisplay = panel.querySelector(`#${valueDisplayId}`);
                            if (valueDisplay) {
                                const value = parseFloat(input.value);
                                valueDisplay.textContent = Number.isInteger(value) ? value.toString() : value.toFixed(1);
                            }
                        }
                    }
                    
                    // Apply updated parameters to particle system
                    const currentPattern = document.getElementById('force-pattern-selector').value;
                    const edgeBias = this.forceDistribution || 0.8;
                    const parameters = this.getPatternParameters(currentPattern);
                    
                    this.particleSystem.applyForcePattern(currentPattern, edgeBias, parameters);
                    this.updateGraph();
                    this.triggerAutoSave();
                });
            });
            
            // Add preset button listeners
            const presetButtons = panel.querySelectorAll('.preset-btn');
            
            presetButtons.forEach(button => {
                const presetName = button.dataset.preset;
                
                button.addEventListener('click', () => {
                    this.applyPatternPreset(pattern, presetName);
                });
            });
        }, 10); // Small delay to ensure DOM is ready
    }
    
    // Extract current parameter values from the UI
    getPatternParameters(pattern) {
        const panel = document.getElementById('pattern-parameters-panel');
        if (!panel) {
            console.warn('Pattern parameters panel not found for getPatternParameters');
            return {};
        }
        
        const parameters = {};
        
        switch (pattern) {
            case 'clusters':
                const clusterType = panel.querySelector('#param-cluster-type');
                const cohesionStrength = panel.querySelector('#param-cohesion-strength');
                const separationDistance = panel.querySelector('#param-separation-distance');
                const formationBias = panel.querySelector('#param-formation-bias');
                
                if (clusterType) {
                    parameters.clusterType = clusterType.value;
                }
                if (cohesionStrength) {
                    parameters.cohesionStrength = parseFloat(cohesionStrength.value);
                }
                if (separationDistance) {
                    parameters.separationDistance = parseFloat(separationDistance.value);
                }
                if (formationBias) {
                    parameters.formationBias = parseFloat(formationBias.value);
                }
                break;
                
            case 'predator-prey':
                const ecosystemType = panel.querySelector('#param-ecosystem-type');
                const huntIntensity = panel.querySelector('#param-hunt-intensity');
                const escapeIntensity = panel.querySelector('#param-escape-intensity');
                const populationBalance = panel.querySelector('#param-population-balance');
                
                if (ecosystemType) {
                    parameters.ecosystemType = ecosystemType.value;
                }
                if (huntIntensity) {
                    parameters.huntIntensity = parseFloat(huntIntensity.value);
                }
                if (escapeIntensity) {
                    parameters.escapeIntensity = parseFloat(escapeIntensity.value);
                }
                if (populationBalance) {
                    parameters.populationBalance = parseFloat(populationBalance.value);
                }
                break;
                
            case 'territorial':
                const territorySize = panel.querySelector('#param-territory-size');
                const boundaryStrength = panel.querySelector('#param-boundary-strength');
                const invasionResponse = panel.querySelector('#param-invasion-response');
                
                if (territorySize) {
                    parameters.territorySize = parseFloat(territorySize.value);
                }
                if (boundaryStrength) {
                    parameters.boundaryStrength = parseFloat(boundaryStrength.value);
                }
                if (invasionResponse) {
                    parameters.invasionResponse = parseFloat(invasionResponse.value);
                }
                break;
                
            case 'symbiotic':
                const cooperationStrength = panel.querySelector('#param-cooperation-strength');
                const dependencyLevel = panel.querySelector('#param-dependency-level');
                const mutualismType = panel.querySelector('#param-mutualism-type');
                const competitionIntensity = panel.querySelector('#param-competition-intensity');
                
                if (cooperationStrength) {
                    parameters.cooperationStrength = parseFloat(cooperationStrength.value);
                }
                if (dependencyLevel) {
                    parameters.dependencyLevel = parseFloat(dependencyLevel.value);
                }
                if (mutualismType) {
                    parameters.mutualismType = mutualismType.value;
                }
                if (competitionIntensity) {
                    parameters.competitionIntensity = parseFloat(competitionIntensity.value);
                }
                break;
                
            case 'cyclic':
                const cycleSpeed = panel.querySelector('#param-cycle-speed');
                const dominanceStrength = panel.querySelector('#param-dominance-strength');
                const cycleComplexity = panel.querySelector('#param-cycle-complexity');
                const stabilityFactor = panel.querySelector('#param-stability-factor');
                
                if (cycleSpeed) {
                    parameters.cycleSpeed = parseFloat(cycleSpeed.value);
                }
                if (dominanceStrength) {
                    parameters.dominanceStrength = parseFloat(dominanceStrength.value);
                }
                if (cycleComplexity) {
                    parameters.cycleComplexity = cycleComplexity.value;
                }
                if (stabilityFactor) {
                    parameters.stabilityFactor = parseFloat(stabilityFactor.value);
                }
                break;
        }
        
        return parameters;
    }
    
    // Store parameter values for pattern switching persistence
    storePatternParameters(pattern) {
        const parameters = this.getPatternParameters(pattern);
        if (Object.keys(parameters).length > 0) {
            this.patternParameterStates[pattern] = parameters;
        }
    }
    
    // Restore parameter values when switching back to a pattern
    restorePatternParameters(pattern) {
        const savedParams = this.patternParameterStates[pattern];
        if (!savedParams) return;
        
        const panel = document.getElementById('pattern-parameters-panel');
        if (!panel) return;
        
        // Restore values to UI controls
        Object.entries(savedParams).forEach(([paramName, value]) => {
            let elementId;
            
            // Map parameter names to UI element IDs
            switch (paramName) {
                // Clusters parameters
                case 'clusterType': elementId = 'param-cluster-type'; break;
                case 'cohesionStrength': elementId = 'param-cohesion-strength'; break;
                case 'separationDistance': elementId = 'param-separation-distance'; break;
                case 'formationBias': elementId = 'param-formation-bias'; break;
                
                // Predator-prey parameters
                case 'ecosystemType': elementId = 'param-ecosystem-type'; break;
                case 'huntIntensity': elementId = 'param-hunt-intensity'; break;
                case 'escapeIntensity': elementId = 'param-escape-intensity'; break;
                case 'populationBalance': elementId = 'param-population-balance'; break;
                
                // Territorial parameters
                case 'territorySize': elementId = 'param-territory-size'; break;
                case 'boundaryStrength': elementId = 'param-boundary-strength'; break;
                case 'invasionResponse': elementId = 'param-invasion-response'; break;
                
                // Symbiotic parameters
                case 'cooperationStrength': elementId = 'param-cooperation-strength'; break;
                case 'dependencyLevel': elementId = 'param-dependency-level'; break;
                case 'mutualismType': elementId = 'param-mutualism-type'; break;
                case 'competitionIntensity': elementId = 'param-competition-intensity'; break;
                
                // Cyclic parameters
                case 'cycleSpeed': elementId = 'param-cycle-speed'; break;
                case 'dominanceStrength': elementId = 'param-dominance-strength'; break;
                case 'cycleComplexity': elementId = 'param-cycle-complexity'; break;
                case 'stabilityFactor': elementId = 'param-stability-factor'; break;
                
                default: return;
            }
            
            const element = panel.querySelector(`#${elementId}`);
            if (element) {
                element.value = value;
                
                // Update value display for range inputs using correct ID mapping
                if (element.type === 'range') {
                    const idMappings = {
                        'param-cohesion-strength': 'param-cohesion-value',
                        'param-separation-distance': 'param-separation-value',
                        'param-formation-bias': 'param-formation-value',
                        'param-hunt-intensity': 'param-hunt-value',
                        'param-escape-intensity': 'param-escape-value',
                        'param-population-balance': 'param-population-value',
                        'param-territory-size': 'param-territory-value',
                        'param-boundary-strength': 'param-boundary-value',
                        'param-invasion-response': 'param-invasion-value',
                        'param-cooperation-strength': 'param-cooperation-value',
                        'param-dependency-level': 'param-dependency-value',
                        'param-competition-intensity': 'param-competition-value',
                        'param-cycle-speed': 'param-cycle-speed-value',
                        'param-dominance-strength': 'param-dominance-value',
                        'param-stability-factor': 'param-stability-value'
                    };
                    
                    const valueDisplayId = idMappings[elementId];
                    if (valueDisplayId) {
                        const valueDisplay = panel.querySelector(`#${valueDisplayId}`);
                        if (valueDisplay) {
                            const displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
                            valueDisplay.textContent = displayValue;
                            // Value display restored
                        }
                    }
                }
            }
        });
    }
    
    restoreUIState() {
        // Restore UI-specific state from UI state manager if available
        if (window.uiStateManager) {
            const forceDistribution = window.uiStateManager.getParameter('forceDistribution', 'ui');
            if (forceDistribution !== undefined) {
                this.forceDistribution = forceDistribution;
                document.getElementById('force-distribution').value = forceDistribution;
                document.getElementById('force-distribution-value').textContent = forceDistribution.toFixed(1);
            }
        }
    }
    
    updateUIFromParticleSystem() {
        const ps = this.particleSystem;
        
        // PARTICLES Section
        DOMHelpers.safeUpdateElement('particles-per-species', 'value', ps.particlesPerSpecies);
        DOMHelpers.safeUpdateElement('particles-per-species-value', 'textContent', ps.particlesPerSpecies);
        document.getElementById('species-count').value = ps.numSpecies;
        document.getElementById('species-count-value').textContent = ps.numSpecies;
        
        // Update distribution drawer
        if (this.distributionDrawer) {
            this.distributionDrawer.updateFromParticleSystem();
        }
        
        // PHYSICS Section
        document.getElementById('force-strength').value = ps.forceFactor;
        document.getElementById('force-strength-value').textContent = ps.forceFactor.toFixed(1);
        const uiFriction = 1.0 - ps.friction;
        document.getElementById('friction').value = uiFriction;
        document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
        document.getElementById('wall-bounce').value = ps.wallDamping;
        document.getElementById('wall-bounce-value').textContent = ps.wallDamping.toFixed(2);
        document.getElementById('repulsive-force').value = ps.repulsiveForce || 0.3;
        document.getElementById('repulsive-force-value').textContent = (ps.repulsiveForce || 0.3).toFixed(2);
        document.getElementById('wrap-around-walls').checked = ps.wrapAroundWalls || false;
        
        // Update wall controls visibility based on wrap-around mode
        const wallControls = document.getElementById('wall-controls');
        const repulsiveControl = document.getElementById('repulsive-control');
        if (ps.wrapAroundWalls) {
            if (wallControls) wallControls.style.display = 'none';
            if (repulsiveControl) repulsiveControl.style.display = 'none';
        } else {
            if (wallControls) wallControls.style.display = '';
            if (repulsiveControl) repulsiveControl.style.display = '';
        }
        // New collision strength control
        document.getElementById('collision-strength').value = ps.collisionMultiplier || 1.0;
        document.getElementById('collision-strength-value').textContent = (ps.collisionMultiplier || 1.0).toFixed(1);
        
        // Collision offset control
        document.getElementById('collision-offset').value = ps.collisionOffset || 0.0;
        document.getElementById('collision-offset-value').textContent = (ps.collisionOffset || 0.0).toFixed(1);
        
        document.getElementById('social-radius').value = ps.socialRadius[0]?.[0] || 50;
        document.getElementById('social-radius-value').textContent = ps.socialRadius[0]?.[0] || 50;
        
        // Advanced Physics controls
        document.getElementById('environmental-pressure').value = ps.environmentalPressure || 0.0;
        document.getElementById('environmental-pressure-value').textContent = (ps.environmentalPressure || 0.0).toFixed(1);
        
        // Force distribution and pattern
        this.forceDistribution = ps.forceDistribution || 0.8;
        document.getElementById('force-distribution').value = this.forceDistribution;
        document.getElementById('force-distribution-value').textContent = this.forceDistribution.toFixed(1);
        
        // Force pattern selector - restore from particle system
        const currentPattern = ps.forcePatternType || 'random';
        document.getElementById('force-pattern-selector').value = currentPattern;
        
        // Store pattern parameters and update dynamic panel
        if (ps.forcePatternParameters) {
            this.patternParameterStates[currentPattern] = ps.forcePatternParameters;
        }
        this.updatePatternParametersPanel(currentPattern);
        
        // Shockwave controls
        document.getElementById('shockwave-enabled').checked = ps.shockwaveEnabled || false;
        const shockwaveControls = document.getElementById('shockwave-controls');
        if (shockwaveControls) {
            shockwaveControls.style.display = ps.shockwaveEnabled ? 'block' : 'none';
        }
        document.getElementById('shockwave-strength').value = ps.shockwaveStrength || 50;
        document.getElementById('shockwave-strength-value').textContent = ps.shockwaveStrength || 50;
        document.getElementById('shockwave-size').value = ps.shockwaveSize || 100;
        document.getElementById('shockwave-size-value').textContent = ps.shockwaveSize || 100;
        document.getElementById('shockwave-falloff').value = ps.shockwaveFalloff || 2.0;
        document.getElementById('shockwave-falloff-value').textContent = (ps.shockwaveFalloff || 2.0).toFixed(1);
        
        // Noise controls
        const noiseConfig = ps.getNoiseConfig();
        document.getElementById('noise-enabled').checked = noiseConfig.enabled || false;
        const noiseControls = document.getElementById('noise-controls');
        if (noiseControls) {
            noiseControls.style.display = noiseConfig.enabled ? '' : 'none';
        }
        document.getElementById('noise-pattern').value = noiseConfig.pattern || 'perlin';
        document.getElementById('noise-amplitude').value = noiseConfig.globalAmplitude || 0;
        document.getElementById('noise-amplitude-value').textContent = (noiseConfig.globalAmplitude || 0).toFixed(2);
        document.getElementById('noise-scale').value = noiseConfig.globalScale || 1.0;
        document.getElementById('noise-scale-value').textContent = (noiseConfig.globalScale || 1.0).toFixed(2);
        document.getElementById('noise-time-scale').value = noiseConfig.globalTimeScale || 1.0;
        document.getElementById('noise-time-scale-value').textContent = (noiseConfig.globalTimeScale || 1.0).toFixed(3);
        document.getElementById('noise-contrast').value = noiseConfig.contrast || 1.0;
        document.getElementById('noise-contrast-value').textContent = (noiseConfig.contrast || 1.0).toFixed(2);
        document.getElementById('noise-animation').value = noiseConfig.timeIncrement || 0.01;
        document.getElementById('noise-animation-value').textContent = (noiseConfig.timeIncrement || 0.01).toFixed(3);
        document.getElementById('noise-octaves').value = noiseConfig.globalOctaves || 3;
        document.getElementById('noise-octaves-value').textContent = noiseConfig.globalOctaves || 3;
        document.getElementById('noise-seed').value = noiseConfig.seed || 0;
        document.getElementById('noise-seed-value').textContent = noiseConfig.seed || 0;
        document.getElementById('noise-vector-enabled').checked = ps.noiseVectorEnabled || false;
        document.getElementById('noise-vector-controls').style.display = (ps.noiseVectorEnabled || false) ? '' : 'none';
        document.getElementById('noise-vector-scale').value = ps.noiseVectorScale || 1.0;
        document.getElementById('noise-vector-scale-value').textContent = (ps.noiseVectorScale || 1.0).toFixed(2);
        
        // EFFECTS Section
        // Trail Effect
        document.getElementById('trails-enabled').checked = ps.trailEnabled;
        document.getElementById('trail-controls').style.display = ps.trailEnabled ? '' : 'none';
        
        // Trail linking and exclusion controls
        document.getElementById('link-all-species-trails').checked = ps.linkAllSpeciesTrails;
        document.getElementById('trail-exclusion-container').style.display = ps.linkAllSpeciesTrails ? 'none' : '';
        document.getElementById('trail-exclusion-enabled').checked = ps.trailExclusionEnabled;
        document.getElementById('trail-species-selector-container').style.display = 
            (!ps.linkAllSpeciesTrails && ps.trailExclusionEnabled) ? '' : 'none';
        
        // Update species selector for exclusion mode
        if (ps.trailExclusionEnabled && ps.excludedSpeciesId >= 0) {
            document.getElementById('trail-species-selector').value = ps.excludedSpeciesId;
        }
        
        // Update trail length slider and label
        const label = document.getElementById('trail-length-label');
        if (label) {
            if (ps.linkAllSpeciesTrails) {
                label.textContent = 'Trail Length (All Species)';
            } else if (ps.trailExclusionEnabled) {
                label.textContent = 'Trail Length (Excluded Species Only)';
            } else {
                label.textContent = 'Trail Length (Selected Species)';
            }
        }
        
        if (ps.linkAllSpeciesTrails) {
            // Linked mode: show global blur value
            document.getElementById('trail-length').value = this.reverseMapTrailValue(ps.blur);
            document.getElementById('trail-length-value').textContent = ps.blur.toFixed(3);
        } else if (ps.trailExclusionEnabled) {
            // Exclusion mode: show excluded species trail value
            document.getElementById('trail-length').value = this.reverseMapTrailValue(ps.excludedSpeciesTrail);
            document.getElementById('trail-length-value').textContent = ps.excludedSpeciesTrail.toFixed(3);
        } else {
            // Legacy per-species mode: show selected species value
            const selectedSpecies = parseInt(document.getElementById('trail-species-selector').value) || 0;
            const currentTrail = ps.getSpeciesTrail(selectedSpecies);
            document.getElementById('trail-length').value = this.reverseMapTrailValue(currentTrail);
            document.getElementById('trail-length-value').textContent = currentTrail.toFixed(3);
            
            // Ensure global blur matches selected species for rendering consistency
            ps.blur = currentTrail;
        }
        
        // Global halo effect removed - now per-species only
        
        // Species Glow Effect
        this.updateSpeciesGlowUI(ps);
        
        // COLORS Section
        document.getElementById('background-mode').value = ps.backgroundMode || 'solid';
        document.getElementById('background-color').value = ps.backgroundColor || '#000000';
        document.getElementById('background-color1').value = ps.backgroundColor1 || '#000000';
        document.getElementById('background-color2').value = ps.backgroundColor2 || '#001133';
        document.getElementById('background-cycle-time').value = ps.backgroundCycleTime || 5.0;
        document.getElementById('background-cycle-time-value').textContent = (ps.backgroundCycleTime || 5.0).toFixed(1);
        this.toggleBackgroundModeUI(ps.backgroundMode || 'solid');
        
        // Update species size display for currently selected species
        if (this.selectedSpeciesForSize !== undefined && ps.species[this.selectedSpeciesForSize]) {
            this.selectSpeciesForSize(this.selectedSpeciesForSize);
        }
        
        // Update species colors in UI
        this.updateSpeciesColors(ps.numSpecies);
        
        // Update selectors and totals
        this.updateSpeciesSelectors(ps.numSpecies);
        this.updateTotalParticles();
        
        // Update distribution species selector after all species data is loaded
        this.updateDistributionSpeciesSelector(ps.numSpecies);
        
        // Update force relationship graph
        this.updateGraph();
    }
    
    updatePresetSelector() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;
        
        // Save current selection
        const currentValue = selector.value;
        
        // Get fresh preset list
        const userPresets = this.presetManager.getUserPresets();
        
        // Build a map of current presets for quick lookup
        const presetMap = new Map();
        userPresets.forEach(preset => {
            presetMap.set(preset.key, preset);
        });
        
        // Update cached order: keep existing order, add new ones at the end
        const newCachedOrder = [];
        
        // First, keep all presets that still exist in their original order
        this.cachedPresetOrder.forEach(key => {
            if (presetMap.has(key)) {
                newCachedOrder.push(key);
            }
        });
        
        // Then add any new presets that aren't in the cache
        userPresets.forEach(preset => {
            if (!newCachedOrder.includes(preset.key)) {
                newCachedOrder.push(preset.key);
            }
        });
        
        // Update the cache
        this.cachedPresetOrder = newCachedOrder;
        
        // Clear and rebuild selector options
        selector.innerHTML = '<option value="">Custom</option>';
        
        // Add presets in stable cached order
        this.cachedPresetOrder.forEach(key => {
            const preset = presetMap.get(key);
            if (preset) {
                const option = document.createElement('option');
                option.value = preset.key;
                option.textContent = preset.name;
                selector.appendChild(option);
            }
        });
        
        // Restore previous selection if it still exists
        if (currentValue && Array.from(selector.options).some(opt => opt.value === currentValue)) {
            selector.value = currentValue;
        }
    }
    
    applyDistributionToParticleSystem() {
        if (this.distributionDrawer) {
            this.distributionDrawer.applyToParticleSystem();
        }
    }
    
    updateDistributionSpeciesColor(speciesId) {
        // Add a color indicator next to the species selector (like test page)
        const species = this.particleSystem.species[speciesId];
        if (!species || !species.color) return;
        
        const color = species.color;
        // Create or update a color indicator
        let colorIndicator = document.getElementById('distribution-color-indicator');
        if (!colorIndicator) {
            colorIndicator = document.createElement('div');
            colorIndicator.id = 'distribution-color-indicator';
            colorIndicator.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 1px solid var(--border-default);
                margin-left: 8px;
            `;
            const speciesSelector = document.getElementById('distribution-species');
            speciesSelector.parentNode.appendChild(colorIndicator);
        }
        
        colorIndicator.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    
    addDemoDistributionIfEmpty() {
        if (!this.distributionDrawer) return;
        
        const currentDistribution = this.distributionDrawer.exportDistribution();
        const hasAnyDistribution = Object.keys(currentDistribution).length > 0;
        
        if (!hasAnyDistribution && this.particleSystem.numSpecies >= 3) {
            // Add minimal demo distributions for first 3 species
            const demoDistributions = {
                0: [{ x: 0.25, y: 0.3, size: 0.08, opacity: 0.8 }], // Red - top left
                1: [{ x: 0.75, y: 0.3, size: 0.08, opacity: 0.8 }], // Green - top right  
                2: [{ x: 0.5, y: 0.7, size: 0.08, opacity: 0.8 }]   // Blue - bottom center
            };
            
            this.distributionDrawer.importDistribution(demoDistributions);
        }
    }
    
    updateDistributionSpeciesSelector(numSpecies) {
        const selector = document.getElementById('distribution-species');
        if (!selector) return;
        
        const currentValue = selector.value;
        selector.innerHTML = '';
        
        for (let i = 0; i < numSpecies; i++) {
            const species = this.particleSystem.species[i];
            const option = document.createElement('option');
            option.value = i;
            
            if (species && species.color) {
                const color = species.color;
                const colorHex = this.rgbToHex(color);
                option.textContent = `● ${species.name || `Species ${i + 1}`}`;
                option.style.color = colorHex;
            } else {
                option.textContent = `Species ${i + 1}`;
            }
            
            selector.appendChild(option);
        }
        
        // Restore previous value if valid
        if (currentValue && parseInt(currentValue) < numSpecies) {
            selector.value = currentValue;
            this.updateDistributionSpeciesColor(parseInt(currentValue));
        } else {
            selector.value = '0';
            this.updateDistributionSpeciesColor(0);
        }
    }
    
    updateSpeciesGlowUI(ps) {
        // Update species glow dropdown
        const glowSelector = document.getElementById('glow-species-selector');
        if (glowSelector) {
            // Clear existing options
            glowSelector.innerHTML = '';
            
            // Add options for each species
            for (let i = 0; i < ps.numSpecies; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = ps.species[i]?.name || `Species ${i + 1}`;
                glowSelector.appendChild(option);
            }
            
            // Set to first species by default
            glowSelector.value = 0;
            
            // Update glow sliders with current values for first species
            const firstSpeciesGlow = ps.getSpeciesGlow(0);
            document.getElementById('species-glow-size').value = firstSpeciesGlow.size;
            document.getElementById('species-glow-size-value').textContent = firstSpeciesGlow.size.toFixed(1);
            document.getElementById('species-glow-intensity').value = firstSpeciesGlow.intensity;
            document.getElementById('species-glow-intensity-value').textContent = firstSpeciesGlow.intensity.toFixed(2);
            
            // Update glow enabled state
            const hasGlow = ps.speciesGlowIntensity.some(intensity => intensity > 0);
            document.getElementById('species-glow-enabled').checked = hasGlow;
            
            // Show/hide glow controls based on enabled state
            document.getElementById('species-glow-controls').style.display = hasGlow ? '' : 'none';
            document.getElementById('species-glow-size-control').style.display = hasGlow ? '' : 'none';
            document.getElementById('species-glow-intensity-control').style.display = hasGlow ? '' : 'none';
        }
        
        // Update per-species halo state
        if (ps.speciesHaloIntensity) {
            const selectedSpecies = parseInt(document.getElementById('halo-species-selector').value) || 0;
            const haloSettings = ps.getSpeciesHalo(selectedSpecies);
            if (haloSettings) {
                document.getElementById('per-species-halo-intensity').value = haloSettings.intensity;
                document.getElementById('per-species-halo-intensity-value').textContent = haloSettings.intensity.toFixed(3);
                document.getElementById('per-species-halo-radius').value = haloSettings.radius;
                document.getElementById('per-species-halo-radius-value').textContent = haloSettings.radius.toFixed(1);
            }
            
            // Update halo enabled state
            const hasHalo = ps.speciesHaloIntensity.some(intensity => intensity > 0);
            document.getElementById('per-species-halo-enabled').checked = hasHalo;
            
            // Show/hide halo controls based on enabled state
            document.getElementById('per-species-halo-controls').style.display = hasHalo ? '' : 'none';
            document.getElementById('per-species-halo-intensity-control').style.display = hasHalo ? '' : 'none';
            document.getElementById('per-species-halo-radius-control').style.display = hasHalo ? '' : 'none';
        }
        
        // Update species names and related UI components
        this.updateAllSpeciesNames();
        this.updateSpeciesButtons(ps.numSpecies);
        this.updateDistributionSpeciesSelector(ps.numSpecies);
    }
    
    setupSpeciesButtons() {
        const container = document.getElementById('species-buttons-container');
        if (!container) return;
        
        this.updateSpeciesButtons(this.particleSystem.numSpecies);
    }
    
    updateSpeciesButtons(numSpecies) {
        const container = document.getElementById('species-buttons-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const letterLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        
        for (let i = 0; i < numSpecies; i++) {
            const species = this.particleSystem.species[i];
            const button = document.createElement('button');
            button.className = `species-btn ${i === 0 ? 'active' : ''}`;
            button.dataset.speciesId = i;
            button.title = `${species.name || `Species ${i + 1}`} (${letterLabels[i] || i + 1})`;
            button.style.background = `rgb(${species.color.r}, ${species.color.g}, ${species.color.b})`;
            button.textContent = letterLabels[i] || (i + 1);
            
            button.addEventListener('click', (e) => {
                // Update button states
                container.querySelectorAll('.species-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update distribution drawer
                const speciesId = parseInt(e.target.dataset.speciesId);
                this.distributionDrawer.setSpecies(speciesId);
                
                // Update size controls
                this.selectSpeciesForSize(speciesId);
            });
            
            container.appendChild(button);
        }
        
        // Select first species by default for size control
        if (numSpecies > 0) {
            this.selectSpeciesForSize(0);
        }
    }
    
    selectSpeciesForSize(speciesId) {
        this.selectedSpeciesForSize = speciesId;
        const species = this.particleSystem.species[speciesId];
        
        if (species) {
            // Update species name display
            const nameElement = document.getElementById('selected-species-name');
            if (nameElement) {
                nameElement.textContent = species.name || `Species ${speciesId + 1}`;
                nameElement.style.color = `rgb(${species.color.r}, ${species.color.g}, ${species.color.b})`;
            }
            
            // Update size slider
            const sizeSlider = document.getElementById('species-size');
            const sizeValue = document.getElementById('species-size-value');
            if (sizeSlider && sizeValue) {
                sizeSlider.disabled = false;
                sizeSlider.value = species.size || this.particleSystem.particleSize;
                sizeValue.textContent = (species.size || this.particleSystem.particleSize).toFixed(1);
            }
        }
    }
    
    toggleBackgroundModeUI(mode) {
        const solidGroup = document.getElementById('solid-background-group');
        const sinusoidalGroup = document.getElementById('sinusoidal-background-group');
        
        if (mode === 'sinusoidal') {
            solidGroup.style.display = 'none';
            sinusoidalGroup.style.display = 'block';
        } else {
            solidGroup.style.display = 'block';
            sinusoidalGroup.style.display = 'none';
        }
    }
    
    // Parameter system functionality complete
    
    // Apply predefined parameter presets for different patterns
    applyPatternPreset(pattern, presetName) {
        
        const presets = {
            clusters: {
                // Inspired by "planets" - tight orbital formations
                orbital: { clusterType: 'orbital', cohesionStrength: 1.2, separationDistance: 0.3, formationBias: 0.8 },
                // Inspired by "atoms" - layered concentric structures
                layered: { clusterType: 'layered', cohesionStrength: 0.9, separationDistance: 0.6, formationBias: 0.9 },
                // Inspired by "red menace" - competitive territorial clusters
                competitive: { clusterType: 'competitive_clustering', cohesionStrength: 1.8, separationDistance: 0.2, formationBias: 0.7 },
                // Inspired by "gems" - loose, sparse formations
                loose: { clusterType: 'orbital', cohesionStrength: 0.4, separationDistance: 1.0, formationBias: 0.3 }
            },
            'predator-prey': {
                // Basic linear hunting chains
                simple: { ecosystemType: 'simple_chain', huntIntensity: 2.0, escapeIntensity: 1.8, populationBalance: 0.3 },
                // Interconnected ecosystem web
                complex: { ecosystemType: 'complex_web', huntIntensity: 3.5, escapeIntensity: 3.0, populationBalance: 0.5 },
                // Coordinated group hunting
                pack: { ecosystemType: 'pack_hunting', huntIntensity: 4.2, escapeIntensity: 3.8, populationBalance: 0.4 },
                // Area-based hunting grounds
                territorial: { ecosystemType: 'territorial', huntIntensity: 2.8, escapeIntensity: 2.2, populationBalance: 0.6 }
            },
            territorial: {
                // Inspired by "gems" - small, precious territories fiercely defended
                peaceful: { territorySize: 1.0, boundaryStrength: 0.3, invasionResponse: 0.5 },
                // Inspired by "red menace" - aggressive expansion with violent response
                aggressive: { territorySize: 0.1, boundaryStrength: 3.8, invasionResponse: 4.5 },
                // Inspired by "fortress" - impenetrable defensive positions  
                fortress: { territorySize: 0.25, boundaryStrength: 4.0, invasionResponse: 2.8 },
                // Inspired by "field" - vast, loosely controlled domains
                nomadic: { territorySize: 1.15, boundaryStrength: 0.4, invasionResponse: 0.8 }
            },
            symbiotic: {
                // Inspired by "alliances" - perfect cooperation with total dependency
                mutualism: { cooperationStrength: 3.8, dependencyLevel: 0.95, mutualismType: 'obligate', competitionIntensity: 0.15 },
                // Inspired by "stigmergy" - indirect cooperation through environmental interaction  
                commensalism: { cooperationStrength: 1.8, dependencyLevel: 0.25, mutualismType: 'facultative', competitionIntensity: 1.2 },
                // Inspired by "acrobats" - competitive partnerships with high stakes
                competition: { cooperationStrength: 0.4, dependencyLevel: 0.1, mutualismType: 'facultative', competitionIntensity: 3.5 },
                // Inspired by "simplify" - minimal interdependence, loose cooperation
                independence: { cooperationStrength: 1.2, dependencyLevel: 0.2, mutualismType: 'facultative', competitionIntensity: 0.8 }
            },
            cyclic: {
                // Inspired by "planets" - stable, predictable orbital dynamics
                classic: { cycleSpeed: 0.8, dominanceStrength: 1.8, cycleComplexity: 'simple', stabilityFactor: 0.75 },
                // Inspired by "mitosis" - rapid division and chaotic reformation
                chaotic: { cycleSpeed: 3.5, dominanceStrength: 3.2, cycleComplexity: 'complex', stabilityFactor: 0.1 },
                // Inspired by "dreamtime" - slow, hypnotic transitions
                stable: { cycleSpeed: 0.2, dominanceStrength: 1.0, cycleComplexity: 'simple', stabilityFactor: 0.95 },
                // Inspired by "pollack" - multi-layered, sophisticated patterns
                complex: { cycleSpeed: 2.2, dominanceStrength: 3.5, cycleComplexity: 'multi-level', stabilityFactor: 0.3 }
            }
        };
        
        const patternPresets = presets[pattern];
        if (!patternPresets) {
            console.warn(`No presets defined for pattern: ${pattern}`);
            return;
        }
        
        const presetParams = patternPresets[presetName];
        if (!presetParams) {
            console.warn(`No preset '${presetName}' found for pattern: ${pattern}`);
            return;
        }
        
        // Apply parameters to UI controls
        const panel = document.getElementById('pattern-parameters-panel');
        if (!panel) {
            console.warn('Pattern parameters panel not found');
            return;
        }
        
        Object.entries(presetParams).forEach(([paramName, value]) => {
            this.setParameterValue(pattern, paramName, value);
        });
        
        // Apply to particle system
        const edgeBias = this.forceDistribution || 0.8;
        this.particleSystem.applyForcePattern(pattern, edgeBias, presetParams);
        this.updateGraph();
        this.triggerAutoSave();
    }
    
    // Helper method to set individual parameter values in UI
    setParameterValue(pattern, paramName, value) {
        const panel = document.getElementById('pattern-parameters-panel');
        if (!panel) return;
        
        // Map parameter names to UI element IDs
        const paramMappings = {
            // Clusters
            clusterType: 'param-cluster-type',
            cohesionStrength: 'param-cohesion-strength',
            separationDistance: 'param-separation-distance',
            formationBias: 'param-formation-bias',
            
            // Predator-Prey
            ecosystemType: 'param-ecosystem-type',
            huntIntensity: 'param-hunt-intensity',
            escapeIntensity: 'param-escape-intensity',
            populationBalance: 'param-population-balance',
            
            // Territorial
            territorySize: 'param-territory-size',
            boundaryStrength: 'param-boundary-strength', 
            invasionResponse: 'param-invasion-response',
            
            // Symbiotic  
            cooperationStrength: 'param-cooperation-strength',
            dependencyLevel: 'param-dependency-level',
            mutualismType: 'param-mutualism-type',
            competitionIntensity: 'param-competition-intensity',
            
            // Cyclic
            cycleSpeed: 'param-cycle-speed',
            dominanceStrength: 'param-dominance-strength',
            cycleComplexity: 'param-cycle-complexity',
            stabilityFactor: 'param-stability-factor'
        };
        
        const elementId = paramMappings[paramName];
        if (!elementId) {
            console.warn(`No UI mapping found for parameter: ${paramName}`);
            return;
        }
        
        const element = panel.querySelector(`#${elementId}`);
        if (!element) {
            console.warn(`UI element not found: ${elementId}`);
            return;
        }
        
        // Set the value
        element.value = value;
        
        // Trigger event to update displays and apply changes
        const eventType = element.type === 'range' ? 'input' : 'change';
        element.dispatchEvent(new Event(eventType));
        
        // Parameter updated
    }
    
    // Called when a preset is loaded to refresh modulation display
    onPresetChanged() {
        console.log('MainUI.onPresetChanged called');
        
        // Note: Modulations have already been cleared and loaded by SimpleParticleSystem.loadFullPreset
        // We just need to check for any pending modulations that couldn't be loaded earlier
        if (this.particleSystem.pendingModulations && 
            this.particleSystem.pendingModulations.length > 0 && 
            this.modulationManager) {
            
            // Only import if modulations aren't already loaded
            const currentMods = this.modulationManager.getActiveModulations();
            if (currentMods.length === 0) {
                console.log('Loading pending modulations from preset:', this.particleSystem.pendingModulations);
                try {
                    this.modulationManager.importConfig(this.particleSystem.pendingModulations);
                    console.log(`Imported ${this.particleSystem.pendingModulations.length} modulations from preset`);
                } catch (error) {
                    console.error('Failed to load pending modulations:', error);
                }
            }
        }
        
        // Refresh modulation references after species changes
        if (this.modulationManager) {
            console.log('Refreshing modulation system after preset change');
            this.modulationManager.refreshParameterReferences();
            this.updateModulationList();
            
            // Update the UI list to reflect the current state
            const activeMods = this.modulationManager.getActiveModulations();
            console.log(`Active modulations after preset change: ${activeMods.length}`);
            
            // Also update pending modulations to match current state
            if (this.particleSystem) {
                this.particleSystem.pendingModulations = this.modulationManager.exportConfig();
            }
        }
    }
    
}