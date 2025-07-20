import { XYGraph } from './XYGraph.js';
import { PARAMETER_MAP, generateDefaultSynthAssignments } from '../utils/ParameterMapping.js';

export class MainUI {
    constructor(particleSystem, presetManager) {
        this.particleSystem = particleSystem;
        this.presetManager = presetManager;
        this.isVisible = true;
        this.container = null;
        this.forceGraph = null;
        this.copiedSettings = null;
        this.currentEditingPreset = null;
        this.synthAssignments = generateDefaultSynthAssignments();
        
        this.init();
        this.setupKeyboardShortcuts();
        
        // Load synth assignments after initialization
        this.loadSynthAssignments(this.synthAssignments);
    }
    
    // Helper function to safely add event listeners
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element '${elementId}' not found for event listener`);
        }
    }
    
    // Helper function to safely update UI elements
    safeUpdateElement(id, property, value) {
        const element = document.getElementById(id);
        if (element) {
            if (property === 'textContent' || property === 'value' || property === 'checked') {
                element[property] = value;
            }
        } else {
            console.warn(`Cannot update element '${id}' - not found`);
        }
    }
    
    validateUIElements() {
        // List of all expected UI element IDs
        const expectedIds = [
            // Preset controls
            'minimize-btn', 'preset-selector', 'load-preset-btn', 'configure-preset-btn',
            // Particle controls
            'particles-per-species', 'particles-per-species-value', 'species-count', 'species-count-value',
            'start-pattern', 'total-particles',
            // Physics controls
            'force-strength', 'force-strength-value', 'friction', 'friction-value',
            'wall-bounce', 'wall-bounce-value', 'collision-radius', 'collision-radius-value',
            'social-radius', 'social-radius-value',
            // Force controls
            'from-species', 'to-species', 'force-graph-container', 'clear-forces-btn',
            // Effects controls
            'trails-enabled', 'trail-controls', 'trail-length', 'trail-length-value',
            'halo-enabled', 'halo-controls', 'halo-radius-control', 'halo-intensity', 'halo-intensity-value',
            'halo-radius', 'halo-radius-value',
            'species-glow-enabled', 'species-glow-controls', 'species-glow-size-control', 
            'species-glow-intensity-control', 'glow-species-selector', 'species-glow-size',
            'species-glow-size-value', 'species-glow-intensity', 'species-glow-intensity-value',
            // Visual controls
            'background-color', 'particle-size', 'particle-size-value', 'species-colors-container',
            // Action buttons
            'copy-settings-btn', 'randomize-forces-btn', 'reset-defaults-btn'
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
            console.log('All UI elements validated successfully');
        }
        
        return missingIds.length === 0;
    }
    
    init() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'panel main-ui';
        this.container.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Particle Life Synth</h3>
                <button class="btn btn-icon btn-ghost" id="minimize-btn" title="Hide panel (C)">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6h8v1H4z"/>
                    </svg>
                </button>
            </div>
            <div class="panel-content">
                
                <!-- 1. PRESETS Section -->
                <div class="section">
                    <h4 class="section-title">Presets</h4>
                    <div class="control-group">
                        <select class="select" id="preset-selector">
                            <option value="">Custom</option>
                            <option value="predatorPrey">Predator-Prey</option>
                            <option value="crystallization">Crystallization</option>
                            <option value="vortex">Vortex</option>
                            <option value="symbiosis">Symbiosis</option>
                            <option value="dreamtime">Dreamtime</option>
                            <option value="random">Randomize</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <button class="btn btn-primary btn-block" id="load-preset-btn">Load Preset</button>
                    </div>
                </div>
                
                <!-- 2. PARTICLES Section -->
                <div class="section">
                    <h4 class="section-title">Particles</h4>
                    <div class="control-group">
                        <label>
                            Amount Scale
                            <span class="value-display" id="particles-per-species-value">${this.particleSystem.particlesPerSpecies}</span>
                        </label>
                        <input type="range" class="range-slider" id="particles-per-species" 
                               min="0" max="1000" step="10" value="${this.particleSystem.particlesPerSpecies}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="particles-amount-synth" 
                                   placeholder="e.g. LFO Rate, Grain Density" 
                                   data-parameter="particles_amount_scale">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Species Count
                            <span class="value-display" id="species-count-value">${this.particleSystem.numSpecies}</span>
                        </label>
                        <input type="range" class="range-slider" id="species-count" 
                               min="1" max="20" step="1" value="${this.particleSystem.numSpecies}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="species-count-synth" 
                                   placeholder="e.g. Voice Count, OSC Mix" 
                                   data-parameter="particles_species_count">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>Initial Distribution</label>
                        <select class="select select-sm" id="start-pattern">
                            <option value="cluster">Cluster</option>
                            <option value="ring">Ring</option>
                            <option value="grid">Grid</option>
                            <option value="random">Random</option>
                        </select>
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="distribution-synth" 
                                   placeholder="e.g. Wave Shape, Sample Start" 
                                   data-parameter="particles_distribution_pattern">
                        </div>
                    </div>
                    <div class="info-text">
                        Total: <span id="total-particles">${this.particleSystem.numSpecies * this.particleSystem.particlesPerSpecies}</span> particles
                    </div>
                </div>
                
                <!-- 3. PHYSICS Section -->
                <div class="section">
                    <h4 class="section-title">Physics</h4>
                    <div class="control-group">
                        <label>
                            Force Strength
                            <span class="value-display" id="force-strength-value">${this.particleSystem.forceFactor.toFixed(1)}</span>
                        </label>
                        <input type="range" class="range-slider" id="force-strength" 
                               min="0.1" max="10" step="0.1" value="${this.particleSystem.forceFactor}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="force-strength-synth" 
                                   placeholder="e.g. Filter Cutoff, LFO Amount" 
                                   data-parameter="physics_force_strength">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Friction
                            <span class="value-display" id="friction-value">${(1.0 - this.particleSystem.friction).toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="friction" 
                               min="0" max="0.2" step="0.01" value="${1.0 - this.particleSystem.friction}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="friction-synth" 
                                   placeholder="e.g. Envelope Decay, Damping" 
                                   data-parameter="physics_friction_amount">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Wall Bounce
                            <span class="value-display" id="wall-bounce-value">${this.particleSystem.wallDamping.toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="wall-bounce" 
                               min="0" max="2.0" step="0.05" value="${this.particleSystem.wallDamping}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="wall-bounce-synth" 
                                   placeholder="e.g. Distortion, Compression" 
                                   data-parameter="physics_wall_bounce">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Collision Radius
                            <span class="value-display" id="collision-radius-value">${this.particleSystem.collisionRadius[0][0]}</span>
                        </label>
                        <input type="range" class="range-slider" id="collision-radius" 
                               min="1" max="100" step="1" value="${this.particleSystem.collisionRadius[0][0]}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="collision-radius-synth" 
                                   placeholder="e.g. Resonance, Feedback" 
                                   data-parameter="physics_collision_radius">
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Social Radius
                            <span class="value-display" id="social-radius-value">${this.particleSystem.socialRadius[0][0]}</span>
                        </label>
                        <input type="range" class="range-slider" id="social-radius" 
                               min="1" max="500" step="5" value="${this.particleSystem.socialRadius[0][0]}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="social-radius-synth" 
                                   placeholder="e.g. Chorus Width, Stereo" 
                                   data-parameter="physics_social_radius">
                        </div>
                    </div>
                </div>
                
                <!-- 4. FORCE RELATIONSHIPS Section -->
                <div class="section">
                    <h4 class="section-title">Force Relationships</h4>
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
                    <button class="btn btn-secondary btn-block btn-sm" id="clear-forces-btn">Clear All Forces</button>
                </div>
                
                <!-- 5. EFFECTS Section -->
                <div class="section">
                    <h4 class="section-title">Effects</h4>
                    
                    <!-- Trail Effect -->
                    <div class="effect-group">
                        <div class="control-group">
                            <label>
                                <input type="checkbox" id="trails-enabled" ${this.particleSystem.trailEnabled ? 'checked' : ''}>
                                Enable Trails
                            </label>
                        </div>
                        <div class="control-group" id="trail-controls" style="${!this.particleSystem.trailEnabled ? 'display: none;' : ''}">
                            <label>
                                Trail Length
                                <span class="value-display" id="trail-length-value">${this.particleSystem.blur.toFixed(2)}</span>
                            </label>
                            <input type="range" class="range-slider" id="trail-length" 
                                   min="0.0" max="0.99" step="0.01" value="${this.particleSystem.blur}">
                            <div class="synth-assignment">
                                <input type="text" class="synth-field" id="trail-length-synth" 
                                       placeholder="e.g. Reverb Size, Delay Time" 
                                       data-parameter="effects_trail_length">
                            </div>
                            <span class="info-text">Lower = longer trails</span>
                        </div>
                    </div>
                    
                    <!-- Halo Effect (renamed from Dreamtime) -->
                    <div class="effect-group">
                        <div class="control-group">
                            <label>
                                <input type="checkbox" id="halo-enabled" ${this.particleSystem.renderMode === 'dreamtime' ? 'checked' : ''}>
                                Enable Halo
                            </label>
                        </div>
                        <div class="control-group" id="halo-controls" style="${this.particleSystem.renderMode !== 'dreamtime' ? 'display: none;' : ''}">
                            <label>
                                Halo Intensity
                                <span class="value-display" id="halo-intensity-value">${this.particleSystem.glowIntensity?.toFixed(2) || '0.80'}</span>
                            </label>
                            <input type="range" class="range-slider" id="halo-intensity" 
                                   min="0.0" max="1.0" step="0.05" value="${this.particleSystem.glowIntensity || 0.8}">
                            <div class="synth-assignment">
                                <input type="text" class="synth-field" id="halo-intensity-synth" 
                                       placeholder="e.g. Ambient Level, Pad Mix" 
                                       data-parameter="effects_halo_intensity">
                            </div>
                        </div>
                        <div class="control-group" id="halo-radius-control" style="${this.particleSystem.renderMode !== 'dreamtime' ? 'display: none;' : ''}">
                            <label>
                                Halo Radius
                                <span class="value-display" id="halo-radius-value">${this.particleSystem.glowRadius?.toFixed(1) || '3.0'}</span>
                            </label>
                            <input type="range" class="range-slider" id="halo-radius" 
                                   min="1.0" max="5.0" step="0.1" value="${this.particleSystem.glowRadius || 3.0}">
                            <div class="synth-assignment">
                                <input type="text" class="synth-field" id="halo-radius-synth" 
                                       placeholder="e.g. Chorus Depth, Spread" 
                                       data-parameter="effects_halo_radius">
                            </div>
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
                            <div class="synth-assignment">
                                <input type="text" class="synth-field" id="glow-species-synth" 
                                       placeholder="e.g. Lead Voice, Solo Target" 
                                       data-parameter="effects_species_glow_target">
                            </div>
                        </div>
                        <div class="control-group" id="species-glow-size-control" style="display: none;">
                            <label>
                                Glow Size
                                <span class="value-display" id="species-glow-size-value">1.0</span>
                            </label>
                            <input type="range" class="range-slider" id="species-glow-size" 
                                   min="0.5" max="3.0" step="0.1" value="1.0">
                            <div class="synth-assignment">
                                <input type="text" class="synth-field" id="species-glow-size-synth" 
                                       placeholder="e.g. Lead Width, Voice Size" 
                                       data-parameter="effects_species_glow_size">
                            </div>
                        </div>
                        <div class="control-group" id="species-glow-intensity-control" style="display: none;">
                            <label>
                                Glow Intensity
                                <span class="value-display" id="species-glow-intensity-value">0.0</span>
                            </label>
                            <input type="range" class="range-slider" id="species-glow-intensity" 
                                   min="0.0" max="1.0" step="0.05" value="0.0">
                            <div class="synth-assignment">
                                <input type="text" class="synth-field" id="species-glow-intensity-synth" 
                                       placeholder="e.g. Lead Level, Solo Mix" 
                                       data-parameter="effects_species_glow_intensity">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 6. COLORS Section -->
                <div class="section">
                    <h4 class="section-title">Colors</h4>
                    <div class="control-group">
                        <label>Background Color</label>
                        <input type="color" id="background-color" value="#000000">
                    </div>
                    <div class="control-group">
                        <label>Particle Size
                            <span class="value-display" id="particle-size-value">${this.particleSystem.particleSize.toFixed(1)}</span>
                        </label>
                        <input type="range" class="range-slider" id="particle-size" 
                               min="0.5" max="20" step="0.5" value="${this.particleSystem.particleSize}">
                        <div class="synth-assignment">
                            <input type="text" class="synth-field" id="particle-size-synth" 
                                   placeholder="e.g. Note Size, Grain Size" 
                                   data-parameter="visual_particle_size">
                        </div>
                        <div class="info-text">Visual size only (doesn't affect physics)</div>
                    </div>
                    <div class="control-group">
                        <label>Species Colors</label>
                        <div id="species-colors-container">
                            <!-- Dynamically generated color pickers based on species count -->
                        </div>
                    </div>
                </div>
                
                <!-- 7. ACTIONS Section -->
                <div class="section">
                    <h4 class="section-title">Actions</h4>
                    <button class="btn btn-primary btn-block" id="copy-settings-btn">
                        Copy Settings (X)
                    </button>
                    <button class="btn btn-secondary btn-block" id="configure-preset-btn">
                        Configure Presets
                    </button>
                    <div class="quick-actions-row">
                        <button class="btn btn-secondary btn-sm" id="randomize-forces-btn">
                            🎲 Randomize Forces (R)
                        </button>
                        <button class="btn btn-secondary btn-sm" id="reset-defaults-btn">
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add enhanced styles
        const style = document.createElement('style');
        style.textContent = `
            :root {
                /* Professional Color Palette */
                --text-primary: #ffffff;
                --text-secondary: #cccccc;
                --text-tertiary: #999999;
                --text-accent: #4a9eff;
                
                /* Typography Scale */
                --font-size-xs: 11px;
                --font-size-sm: 12px;
                --font-size-md: 14px;
                --font-size-lg: 16px;
                --font-size-xl: 18px;
                
                /* Font Weights */
                --font-weight-normal: 400;
                --font-weight-medium: 500;
                --font-weight-semibold: 600;
                
                /* Spacing System */
                --space-xs: 4px;
                --space-sm: 8px;
                --space-md: 12px;
                --space-lg: 16px;
                --space-xl: 24px;
            }
            
            .main-ui {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 320px;
                max-height: calc(100vh - 20px);
                overflow-y: auto;
                z-index: var(--z-sticky);
                transition: transform var(--transition-normal), opacity var(--transition-normal);
            }
            
            .main-ui.hidden {
                transform: translateX(340px);
                opacity: 0;
            }
            
            .panel-title {
                margin: 0;
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
                color: var(--text-primary);
            }
            
            .section {
                margin-bottom: var(--space-xl);
                padding: var(--space-md);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.02);
            }
            
            .section-title {
                font-size: var(--font-size-md);
                font-weight: var(--font-weight-semibold);
                color: var(--text-primary);
                text-transform: none;
                margin-bottom: var(--space-md);
            }
            
            .value-display {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                color: var(--text-accent);
                margin-left: var(--space-sm);
            }
            
            .control-group label {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-normal);
                color: var(--text-secondary);
                text-transform: none;
            }
            
            .info-text {
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
                font-style: italic;
                margin-top: var(--space-xs);
            }
            
            .synth-assignment {
                margin-top: var(--space-xs);
            }
            
            .synth-field {
                width: 100%;
                padding: var(--space-xs) var(--space-sm);
                font-size: var(--font-size-xs);
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
            }
            
            .synth-field:focus {
                outline: none;
                border-color: var(--text-accent);
                background: rgba(255, 255, 255, 0.08);
            }
            
            .synth-field::placeholder {
                color: var(--text-tertiary);
                font-size: var(--font-size-xs);
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
            
            .select-sm {
                padding: var(--space-xs) var(--space-sm);
                font-size: var(--font-size-sm);
            }
            
            .btn-sm {
                padding: var(--space-xs) var(--space-sm);
                font-size: var(--font-size-xs);
            }
            
            .btn-block {
                width: 100%;
                margin-top: var(--space-sm);
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
            
            input[type="checkbox"] {
                margin-right: var(--space-sm);
                width: 12px;
                height: 12px;
            }
            
            .control-group input[type="range"] {
                flex: 1;
                margin: 0 var(--space-sm);
            }
            
            .effect-group {
                margin-bottom: var(--space-lg);
                padding-bottom: var(--space-lg);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
                width: 40px;
                height: 24px;
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-sm);
                cursor: pointer;
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
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.container);
        
        // Initialize XY Graph
        this.forceGraph = new XYGraph('force-graph-container', {
            width: 288,
            height: 120,
            minX: -1,
            maxX: 1,
            labelX: 'Force',
            gradientColors: ['#cc6666', '#999999', '#66cc66'],
            gridLines: 5,
            showTooltip: true,
            onChange: (value) => {
                const fromSpecies = parseInt(document.getElementById('from-species').value);
                const toSpecies = parseInt(document.getElementById('to-species').value);
                console.log(`Setting force from ${fromSpecies} to ${toSpecies}: ${value}`);
                this.particleSystem.setSocialForce(fromSpecies, toSpecies, value);
                this.updateGraphInfo();
                
                // Force a redraw to see immediate effect
                if (this.particleSystem.socialForce[fromSpecies]) {
                    console.log('Current force matrix row:', this.particleSystem.socialForce[fromSpecies]);
                }
            }
        });
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Set initial values
        this.updateUIFromParticleSystem();
        this.updateSpeciesColors(this.particleSystem.numSpecies);
        this.updateGraph();
        
        // Validate all UI elements are properly created
        this.validateUIElements();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            
            switch(e.key.toLowerCase()) {
                case 'c':
                    this.toggleVisibility();
                    e.preventDefault();
                    break;
                case 'x':
                    this.copySettings();
                    e.preventDefault();
                    break;
                case 'r':
                    this.randomizeForces();
                    e.preventDefault();
                    break;
            }
        });
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
    }
    
    copySettings() {
        // Capture all current settings including synth assignments
        // Use exportPreset to get complete and consistent state
        const completePreset = this.particleSystem.exportPreset();
        
        // Add UI-specific state that's not in the particle system
        this.copiedSettings = {
            ...completePreset,
            // UI state additions
            uiState: {
                selectedGlowSpecies: parseInt(document.getElementById('glow-species-selector').value),
                speciesGlowEnabled: document.getElementById('species-glow-enabled').checked,
                fromSpecies: parseInt(document.getElementById('from-species').value),
                toSpecies: parseInt(document.getElementById('to-species').value),
                currentForceValue: this.particleSystem.socialForce[
                    parseInt(document.getElementById('from-species').value)
                ][parseInt(document.getElementById('to-species').value)]
            },
            synthAssignments: this.saveSynthAssignments()
        };
        
        // Visual feedback
        const btn = document.getElementById('copy-settings-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#4a9eff';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1500);
        
        // Enable paste in preset modal if it exists
        if (window.presetModal) {
            window.presetModal.enablePaste(this.copiedSettings);
        }
    }
    
    randomizeForces() {
        this.particleSystem.socialForce = this.particleSystem.createAsymmetricMatrix();
        this.updateGraph();
        
        // Visual feedback
        const btn = document.getElementById('randomize-forces-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Randomized!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1500);
    }
    
    saveSynthAssignments() {
        const assignments = {};
        document.querySelectorAll('.synth-field').forEach(field => {
            const parameter = field.dataset.parameter;
            const assignment = field.value.trim();
            if (parameter && assignment) {
                assignments[parameter] = assignment;
            }
        });
        // Log assignments for debugging
        if (Object.keys(assignments).length > 0) {
            console.log('Saved synth assignments:', assignments);
        }
        return assignments;
    }
    
    loadSynthAssignments(assignments) {
        if (!assignments || typeof assignments !== 'object') {
            console.warn('No valid synth assignments to load');
            return;
        }
        
        Object.entries(assignments).forEach(([parameter, assignment]) => {
            const field = document.querySelector(`[data-parameter="${parameter}"]`);
            if (field) {
                field.value = assignment;
                // Trigger input event to ensure any handlers are called
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // Don't warn for missing fields as some parameters don't have synth assignments
        });
    }
    
    updateSpeciesColors(count) {
        const container = document.getElementById('species-colors-container');
        container.innerHTML = '';
        
        const defaultColors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta',
                              'Teal', 'Indigo', 'Brown', 'Gray', 'Violet', 'Coral', 'Navy', 'Gold', 'Silver', 'Crimson'];
        
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
                <span class="species-label">${defaultColors[i] || `Species ${i + 1}`}</span>
                <input type="color" class="species-color" data-species="${i}" 
                       value="${colorValue}">
                <input type="number" class="species-amount" data-species="${i}" 
                       min="0" max="1000" step="10" 
                       value="${species?.particleCount || this.particleSystem.particlesPerSpecies}">
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
                }
            });
        });
        
        container.querySelectorAll('.species-amount').forEach(input => {
            input.addEventListener('change', (e) => {
                const speciesIndex = parseInt(e.target.dataset.species);
                const value = parseInt(e.target.value) || 0;
                if (this.particleSystem.species[speciesIndex]) {
                    this.particleSystem.species[speciesIndex].particleCount = value;
                    this.particleSystem.initializeParticles();
                    this.updateTotalParticles();
                }
            });
        });
    }
    
    generateSpeciesColor(index) {
        const hue = (index * 360 / 20) % 360;
        return `hsl(${hue}, 70%, 50%)`;
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
        
        // Minimize button
        safeAddEventListener('minimize-btn', 'click', () => {
            this.toggleVisibility();
        });
        
        // Preset controls
        document.getElementById('preset-selector').addEventListener('change', (e) => {
            const presetKey = e.target.value;
            if (presetKey && presetKey !== 'custom') {
                this.currentEditingPreset = presetKey;
                document.getElementById('load-preset-btn').textContent = 
                    presetKey ? `Load ${this.presetManager.getPreset(presetKey)?.name || presetKey}` : 'Load Preset';
            } else {
                this.currentEditingPreset = null;
                document.getElementById('load-preset-btn').textContent = 'Load Preset';
            }
        });
        
        document.getElementById('load-preset-btn').addEventListener('click', () => {
            const presetKey = document.getElementById('preset-selector').value;
            if (presetKey === 'random') {
                this.randomizeForces();
            } else if (presetKey) {
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                }
            }
        });
        
        document.getElementById('configure-preset-btn').addEventListener('click', () => {
            const currentPresetKey = document.getElementById('preset-selector').value;
            window.presetModal.open(currentPresetKey);
        });
        
        // Particle controls
        document.getElementById('particles-per-species').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
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
        });
        
        safeAddEventListener('species-count', 'input', (e) => {
            const value = parseInt(e.target.value);
            
            // Use the proper API method for species count changes
            if (this.particleSystem.setSpeciesCount) {
                // Debug log
                console.log(`Setting species count to ${value}`);
                console.log(`Canvas dimensions: ${this.particleSystem.width}x${this.particleSystem.height}`);
                console.log(`Particle count before: ${this.particleSystem.particles.length}`);
                
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
                    
                    console.log(`Particle count after: ${this.particleSystem.particles.length}`);
                    console.log(`Species array length: ${this.particleSystem.species.length}`);
                } else {
                    console.error(`Failed to set species count to ${value}`);
                }
            }
        });
        
        document.getElementById('start-pattern').addEventListener('change', (e) => {
            const pattern = e.target.value;
            // Update all species with new pattern
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                if (this.particleSystem.species[i]) {
                    this.particleSystem.species[i].startPosition = {
                        type: pattern,
                        center: { x: 0.5, y: 0.5 },
                        radius: 0.2
                    };
                }
            }
            // Reinitialize particles with new positions
            this.particleSystem.initializeParticlesWithPositions();
        });
        
        // Physics controls
        document.getElementById('force-strength').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.forceFactor = value;
            document.getElementById('force-strength-value').textContent = value.toFixed(1);
        });
        
        document.getElementById('friction').addEventListener('input', (e) => {
            const uiFriction = parseFloat(e.target.value);
            this.particleSystem.friction = 1.0 - uiFriction;
            document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
        });
        
        document.getElementById('wall-bounce').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.wallDamping = value;
            document.getElementById('wall-bounce-value').textContent = value.toFixed(2);
        });
        
        document.getElementById('collision-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    if (this.particleSystem.collisionRadius[i]) {
                        this.particleSystem.collisionRadius[i][j] = value;
                    }
                }
            }
            document.getElementById('collision-radius-value').textContent = value;
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
        });
        
        document.getElementById('trail-length').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.blur = value;
            document.getElementById('trail-length-value').textContent = value.toFixed(2);
        });
        
        document.getElementById('halo-enabled').addEventListener('change', (e) => {
            this.particleSystem.renderMode = e.target.checked ? 'dreamtime' : 'normal';
            document.getElementById('halo-controls').style.display = e.target.checked ? '' : 'none';
            document.getElementById('halo-radius-control').style.display = e.target.checked ? '' : 'none';
            if (e.target.checked) {
                this.particleSystem.glowIntensity = parseFloat(document.getElementById('halo-intensity').value);
                this.particleSystem.glowRadius = parseFloat(document.getElementById('halo-radius').value);
            }
            this.particleSystem.clearCaches();
        });
        
        document.getElementById('halo-intensity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.glowIntensity = value;
            document.getElementById('halo-intensity-value').textContent = value.toFixed(2);
            this.particleSystem.clearCaches();
        });
        
        document.getElementById('halo-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.glowRadius = value;
            document.getElementById('halo-radius-value').textContent = value.toFixed(1);
            this.particleSystem.clearCaches();
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
            console.log('Selected species for glow:', selectedSpecies);
            
            // Update sliders to show current values for selected species using proper API
            const glowSettings = this.particleSystem.getSpeciesGlow(selectedSpecies);
            
            document.getElementById('species-glow-size').value = glowSettings.size;
            document.getElementById('species-glow-size-value').textContent = glowSettings.size.toFixed(1);
            
            document.getElementById('species-glow-intensity').value = glowSettings.intensity;
            document.getElementById('species-glow-intensity-value').textContent = glowSettings.intensity.toFixed(2);
            
            console.log('Updated sliders - Size:', glowSettings.size, 'Intensity:', glowSettings.intensity);
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
        
        // Visual controls
        safeAddEventListener('background-color', 'change', (e) => {
            this.particleSystem.backgroundColor = e.target.value;
        });
        
        safeAddEventListener('particle-size', 'input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.particleSize = value;
            
            // Update all species sizes
            if (this.particleSystem.species && this.particleSystem.species.length > 0) {
                for (let i = 0; i < this.particleSystem.species.length; i++) {
                    if (this.particleSystem.species[i]) {
                        this.particleSystem.species[i].size = value;
                    }
                }
            }
            
            document.getElementById('particle-size-value').textContent = value.toFixed(1);
        });
        
        // Action buttons
        document.getElementById('copy-settings-btn').addEventListener('click', () => {
            this.copySettings();
        });
        
        document.getElementById('randomize-forces-btn').addEventListener('click', () => {
            this.randomizeForces();
        });
        
        document.getElementById('reset-defaults-btn').addEventListener('click', () => {
            // Reset to default values
            this.particleSystem.loadDefaults();
            this.updateUIFromParticleSystem();
            this.updateGraph();
        });
        
        // Synth assignment fields - save on change and provide immediate feedback
        document.querySelectorAll('.synth-field').forEach(field => {
            field.addEventListener('input', (e) => {
                // Save assignments
                this.synthAssignments = this.saveSynthAssignments();
                
                // Visual feedback that the field is active
                e.target.style.borderColor = '#4a9eff';
                setTimeout(() => {
                    e.target.style.borderColor = '';
                }, 500);
            });
            
            field.addEventListener('blur', () => {
                // Save on blur as well to ensure changes are captured
                this.synthAssignments = this.saveSynthAssignments();
            });
        });
    }
    
    updateSpeciesSelectors(numSpecies) {
        const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta',
                       'Teal', 'Indigo', 'Brown', 'Gray', 'Violet', 'Coral', 'Navy', 'Gold', 'Silver', 'Crimson'];
        
        const selectors = ['from-species', 'to-species', 'glow-species-selector'];
        
        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (!select) return;
            
            const currentValue = select.value;
            select.innerHTML = '';
            
            for (let i = 0; i < numSpecies; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = colors[i] || `Species ${i + 1}`;
                select.appendChild(option);
            }
            
            // Restore previous value if valid
            if (currentValue && parseInt(currentValue) < numSpecies) {
                select.value = currentValue;
            } else if (selectorId === 'to-species' && numSpecies > 1) {
                select.value = '1';
            }
        });
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
        const colorNames = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta',
                           'Teal', 'Indigo', 'Brown', 'Gray', 'Violet', 'Coral', 'Navy', 'Gold', 'Silver', 'Crimson'];
        
        const fromName = colorNames[fromSpecies] || `Species ${fromSpecies + 1}`;
        const toName = colorNames[toSpecies] || `Species ${toSpecies + 1}`;
        
        this.forceGraph.setInfo(`${fromName} → ${toName}: ${force.toFixed(2)}`);
    }
    
    updateUIFromParticleSystem() {
        const ps = this.particleSystem;
        
        // PARTICLES Section
        this.safeUpdateElement('particles-per-species', 'value', ps.particlesPerSpecies);
        this.safeUpdateElement('particles-per-species-value', 'textContent', ps.particlesPerSpecies);
        document.getElementById('species-count').value = ps.numSpecies;
        document.getElementById('species-count-value').textContent = ps.numSpecies;
        
        // Update start pattern if available
        if (ps.species[0]?.startPosition?.type) {
            document.getElementById('start-pattern').value = ps.species[0].startPosition.type;
        }
        
        // PHYSICS Section
        document.getElementById('force-strength').value = ps.forceFactor;
        document.getElementById('force-strength-value').textContent = ps.forceFactor.toFixed(1);
        const uiFriction = 1.0 - ps.friction;
        document.getElementById('friction').value = uiFriction;
        document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
        document.getElementById('wall-bounce').value = ps.wallDamping;
        document.getElementById('wall-bounce-value').textContent = ps.wallDamping.toFixed(2);
        document.getElementById('collision-radius').value = ps.collisionRadius[0]?.[0] || 15;
        document.getElementById('collision-radius-value').textContent = ps.collisionRadius[0]?.[0] || 15;
        document.getElementById('social-radius').value = ps.socialRadius[0]?.[0] || 50;
        document.getElementById('social-radius-value').textContent = ps.socialRadius[0]?.[0] || 50;
        
        // EFFECTS Section
        // Trail Effect
        document.getElementById('trails-enabled').checked = ps.trailEnabled;
        document.getElementById('trail-controls').style.display = ps.trailEnabled ? '' : 'none';
        document.getElementById('trail-length').value = ps.blur;
        document.getElementById('trail-length-value').textContent = ps.blur.toFixed(2);
        
        // Halo Effect
        const haloEnabled = ps.renderMode === 'dreamtime';
        document.getElementById('halo-enabled').checked = haloEnabled;
        document.getElementById('halo-controls').style.display = haloEnabled ? '' : 'none';
        document.getElementById('halo-radius-control').style.display = haloEnabled ? '' : 'none';
        document.getElementById('halo-intensity').value = ps.glowIntensity || 0.8;
        document.getElementById('halo-intensity-value').textContent = (ps.glowIntensity || 0.8).toFixed(2);
        document.getElementById('halo-radius').value = ps.glowRadius || 3.0;
        document.getElementById('halo-radius-value').textContent = (ps.glowRadius || 3.0).toFixed(1);
        
        // Species Glow Effect
        this.updateSpeciesGlowUI(ps);
        
        // COLORS Section
        document.getElementById('background-color').value = ps.backgroundColor || '#000000';
        document.getElementById('particle-size').value = ps.particleSize;
        document.getElementById('particle-size-value').textContent = ps.particleSize.toFixed(1);
        
        // Update species colors in UI
        this.updateSpeciesColors(ps.numSpecies);
        
        // Update selectors and totals
        this.updateSpeciesSelectors(ps.numSpecies);
        this.updateTotalParticles();
        
        // Update force relationship graph
        this.updateGraph();
    }
    
    updatePresetSelector() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;
        
        // Clear existing options except built-in ones
        const builtInOptions = ['', 'predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime', 'random'];
        const optionsToRemove = [];
        
        for (let i = 0; i < selector.options.length; i++) {
            const option = selector.options[i];
            if (!builtInOptions.includes(option.value)) {
                optionsToRemove.push(option);
            }
        }
        
        // Remove non-built-in options
        optionsToRemove.forEach(option => option.remove());
        
        // Add user presets
        const userPresets = this.presetManager.getUserPresets();
        userPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.key;
            option.textContent = preset.name;
            selector.appendChild(option);
        });
        
        // Insert separator before random option if there are user presets
        if (userPresets.length > 0) {
            const randomOption = selector.querySelector('option[value="random"]');
            if (randomOption) {
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '─────────────';
                selector.insertBefore(separator, randomOption);
            }
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
    }
}