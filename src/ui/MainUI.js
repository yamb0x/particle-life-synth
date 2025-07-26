import { XYGraph } from './XYGraph.js';
import { DistributionDrawer } from './DistributionDrawer.js';
import { PARAMETER_MAP, generateDefaultSynthAssignments } from '../utils/ParameterMapping.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

export class MainUI {
    constructor(particleSystem, presetManager, autoSaveCallback = null, presetModal = null, aspectRatioManager = null) {
        this.particleSystem = particleSystem;
        this.presetManager = presetManager;
        this.autoSaveCallback = autoSaveCallback;
        this.presetModal = presetModal;
        this.aspectRatioManager = aspectRatioManager;
        this.isVisible = true;
        this.container = null;
        this.forceGraph = null;
        this.distributionDrawer = null;
        this.copiedSettings = null;
        this.currentEditingPreset = null;
        this.synthAssignments = generateDefaultSynthAssignments();
        this.forceDistribution = 0.5; // 0 = uniform, 1 = edges
        
        this.init();
        this.setupKeyboardShortcuts();
        
        // Load synth assignments after initialization
        this.loadSynthAssignments(this.synthAssignments);
    }
    
    
    validateUIElements() {
        // List of all expected UI element IDs
        const expectedIds = [
            // Preset controls
            'minimize-btn', 'preset-selector', 'load-preset-btn', 'randomize-values-btn', 'configure-preset-btn',
            // Particle controls
            'particles-per-species', 'particles-per-species-value', 'species-count', 'species-count-value',
            'distribution-canvas', 'distribution-brush', 'distribution-brush-slider', 'distribution-brush-value', 'distribution-clear', 'total-particles',
            // Physics controls
            'force-strength', 'force-strength-value', 'friction', 'friction-value',
            'wall-bounce', 'wall-bounce-value', 'collision-radius', 'collision-radius-value',
            'social-radius', 'social-radius-value',
            // Shockwave controls
            'shockwave-enabled', 'shockwave-controls', 'shockwave-strength', 'shockwave-strength-value',
            'shockwave-size', 'shockwave-size-value', 'shockwave-falloff', 'shockwave-falloff-value',
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
            'background-mode', 'background-color', 'background-color1', 'background-color2', 
            'background-cycle-time', 'background-cycle-time-value', 'particle-size', 'particle-size-value', 
            'per-species-size-enabled', 'per-species-size-controls', 'size-species-selector', 'species-size', 'species-size-value',
            'species-colors-container',
            // Action buttons
            'randomize-forces-btn', 'reset-defaults-btn', 'force-distribution', 'force-distribution-value'
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
                
            
            <!-- 1. PRESETS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Presets</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <select class="select" id="preset-selector">
                            <option value="">Custom</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <button class="btn btn-primary" id="load-preset-btn" style="width: 100%;">Load Preset</button>
                    </div>
                    <div class="control-group">
                        <div class="randomize-buttons-row">
                            <button class="btn btn-secondary" id="randomize-values-btn">
                                Randomize Values
                            </button>
                            <button class="btn btn-secondary" id="randomize-forces-btn">
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
                </div>
            </div>
            
            <!-- 2. PARTICLES Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Particles</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            Amount Scale
                            <span class="value-display" id="particles-per-species-value">${this.particleSystem.particlesPerSpecies}</span>
                        </label>
                        <input type="range" class="range-slider" id="particles-per-species" 
                               min="0" max="1000" step="10" value="${this.particleSystem.particlesPerSpecies}">
                    </div>
                    <div class="control-group">
                        <label>
                            Species Count
                            <span class="value-display" id="species-count-value">${this.particleSystem.numSpecies}</span>
                        </label>
                        <input type="range" class="range-slider" id="species-count" 
                               min="1" max="20" step="1" value="${this.particleSystem.numSpecies}">
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
                    <div class="info-text">
                        Total: <span id="total-particles">${this.particleSystem.numSpecies * this.particleSystem.particlesPerSpecies}</span> particles
                    </div>
                </div>
            </div>
            
            <!-- 3. PHYSICS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Physics</h4>
                </div>
                <div class="panel-content">
                    <div class="control-group">
                        <label>
                            Force Strength
                            <span class="value-display" id="force-strength-value">${this.particleSystem.forceFactor.toFixed(1)}</span>
                        </label>
                        <input type="range" class="range-slider" id="force-strength" 
                               min="0.1" max="10" step="0.1" value="${this.particleSystem.forceFactor}">
                    </div>
                    <div class="control-group">
                        <label>
                            Friction
                            <span class="value-display" id="friction-value">${(1.0 - this.particleSystem.friction).toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="friction" 
                               min="0" max="0.2" step="0.01" value="${1.0 - this.particleSystem.friction}">
                    </div>
                    <div class="control-group">
                        <label>
                            Wall Bounce
                            <span class="value-display" id="wall-bounce-value">${this.particleSystem.wallDamping.toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="wall-bounce" 
                               min="0" max="2.0" step="0.05" value="${this.particleSystem.wallDamping}">
                    </div>
                    <div class="control-group">
                        <label>
                            Collision Radius
                            <span class="value-display" id="collision-radius-value">${this.particleSystem.collisionRadius[0][0]}</span>
                        </label>
                        <input type="range" class="range-slider" id="collision-radius" 
                               min="1" max="100" step="1" value="${this.particleSystem.collisionRadius[0][0]}">
                    </div>
                    <div class="control-group">
                        <label>
                            Social Radius
                            <span class="value-display" id="social-radius-value">${this.particleSystem.socialRadius[0][0]}</span>
                        </label>
                        <input type="range" class="range-slider" id="social-radius" 
                               min="1" max="500" step="5" value="${this.particleSystem.socialRadius[0][0]}">
                    </div>
                    
                    <!-- Shockwave Controls -->
                    <div class="control-group">
                        <label>
                            Shockwave Enabled
                            <input type="checkbox" id="shockwave-enabled" ${this.particleSystem.shockwaveEnabled ? 'checked' : ''}>
                        </label>
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
                                Shockwave Size
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
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 4. FORCE RELATIONSHIPS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Force Relationships</h4>
                </div>
                <div class="panel-content">
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
            
            <!-- 5. EFFECTS Section -->
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
                            <label>
                                Trail Length
                                <span class="value-display" id="trail-length-value">${this.particleSystem.blur.toFixed(2)}</span>
                            </label>
                            <input type="range" class="range-slider" id="trail-length" 
                                   min="0.0" max="0.99" step="0.01" value="${this.particleSystem.blur}">
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
                        </div>
                        <div class="control-group" id="halo-radius-control" style="${this.particleSystem.renderMode !== 'dreamtime' ? 'display: none;' : ''}">
                            <label>
                                Halo Radius
                                <span class="value-display" id="halo-radius-value">${this.particleSystem.glowRadius?.toFixed(1) || '3.0'}</span>
                            </label>
                            <input type="range" class="range-slider" id="halo-radius" 
                                   min="1.0" max="5.0" step="0.1" value="${this.particleSystem.glowRadius || 3.0}">
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
            
            <!-- 6. COLORS Section -->
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
                        <label>Particle Size
                            <span class="value-display" id="particle-size-value">${this.particleSystem.particleSize.toFixed(1)}</span>
                        </label>
                        <input type="range" class="range-slider" id="particle-size" 
                               min="0.5" max="30" step="0.5" value="${this.particleSystem.particleSize}">
                        <div class="info-text">Visual size only (doesn't affect physics)</div>
                    </div>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="per-species-size-enabled">
                            Per Species Size
                        </label>
                    </div>
                    <div class="control-group" id="per-species-size-controls" style="display: none;">
                        <label>Species</label>
                        <select class="select select-sm" id="size-species-selector">
                            <option value="0">Red</option>
                            <option value="1">Green</option>
                            <option value="2">Blue</option>
                            <option value="3">Yellow</option>
                            <option value="4">Purple</option>
                        </select>
                        <label>Size
                            <span class="value-display" id="species-size-value">3.0</span>
                        </label>
                        <input type="range" class="range-slider" id="species-size" 
                               min="0.5" max="30" step="0.5" value="3.0">
                    </div>
                    <div class="control-group">
                        <label>Species Colors</label>
                        <div id="species-colors-container">
                            <!-- Dynamically generated color pickers based on species count -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 7. ASPECT RATIO Section -->
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
            
            <!-- 8. ACTIONS Section -->
            <div class="panel ui-section">
                <div class="panel-header">
                    <h4 class="section-title">Actions</h4>
                </div>
                <div class="panel-content">
                    <button class="btn btn-primary" id="configure-preset-btn" style="width: 100%; margin-bottom: var(--space-sm);">
                        Configure Presets
                    </button>
                    <button class="btn btn-secondary" id="reset-defaults-btn" style="width: 100%;">
                        Reset to Defaults
                    </button>
                    </div>
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
                position: fixed;
                top: 10px;
                right: 10px;
                width: 320px;
                max-height: calc(100vh - 20px);
                overflow-y: auto;
                z-index: var(--z-sticky);
                transition: transform var(--transition-normal), opacity var(--transition-normal);
                display: flex;
                flex-direction: column;
                gap: var(--space-md);
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
                this.triggerAutoSave();
                
                // Force a redraw to see immediate effect
                if (this.particleSystem.socialForce[fromSpecies]) {
                    console.log('Current force matrix row:', this.particleSystem.socialForce[fromSpecies]);
                }
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
        
        // Restore UI state from UI state manager if available
        this.restoreUIState();
        
        // Validate all UI elements are properly created
        this.validateUIElements();
    }
    
    triggerAutoSave() {
        if (this.autoSaveCallback) {
            this.autoSaveCallback();
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip all shortcuts if modal is open to avoid conflicts with text input
            if (window.presetModal && window.presetModal.isOpen) {
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
        
        // Also toggle performance overlay visibility
        const perfOverlay = document.getElementById('performance-overlay');
        if (perfOverlay) {
            perfOverlay.style.display = this.isVisible ? 'block' : 'none';
        }
        
        // Also toggle shortcuts overlay visibility
        const shortcutsOverlay = document.getElementById('shortcuts-overlay');
        if (shortcutsOverlay) {
            shortcutsOverlay.style.display = this.isVisible ? 'block' : 'none';
        }
    }
    
    toggleMute() {
        const isMuted = this.particleSystem.toggleMute();
        
        // Visual feedback - show mute state in console for debugging
        console.log(isMuted ? 'Simulation muted (frozen for performance)' : 'Simulation unmuted (running)');
        
        // Optional: Add visual indicator to performance overlay
        const perfOverlay = document.getElementById('performance-overlay');
        if (perfOverlay && isMuted) {
            // Add a muted indicator to the performance overlay
            const originalHTML = perfOverlay.innerHTML;
            if (!originalHTML.includes('MUTED')) {
                perfOverlay.innerHTML = originalHTML.replace('FPS:', 'MUTED | FPS:');
            }
        } else if (perfOverlay && !isMuted) {
            // Remove muted indicator
            perfOverlay.innerHTML = perfOverlay.innerHTML.replace('MUTED | ', '');
        }
    }
    
    
    randomizeForces() {
        this.particleSystem.socialForce = this.particleSystem.createAsymmetricMatrixWithDistribution(this.forceDistribution);
        this.updateGraph();
        
        // Visual feedback
        const btn = document.getElementById('randomize-forces-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Randomized!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1500);
    }
    
    randomizeValues() {
        // Smart randomization algorithms for interesting visual results
        const scenarios = [
            'swarms',      // High particle count, low friction, medium forces
            'crystals',    // Strong self-attraction, high friction, geometric patterns
            'plasma',      // High energy, strong forces, glowing effects
            'organic',     // Medium values, natural flow, trail effects
            'chaos',       // Extreme values, unpredictable behavior
            'minimal',     // Simple, clean, few particles
            'dreamscape'   // Ethereal glow effects, soft movement
        ];
        
        // Get unique scenario to avoid repetition
        const scenario = this.getUniqueScenario(scenarios);
        
        // Apply scenario-specific ranges
        let params = this.generateRandomParams(scenario);
        
        // Apply all parameters with visual feedback
        this.applyRandomizedParams(params, scenario);
        
        // Update UI to reflect changes
        this.updateUIFromParticleSystem();
        this.updateGraph();
        
        // Visual feedback
        const btn = document.getElementById('randomize-values-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `✓ ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}!`;
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }
    
    loadNextPreset() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;
        
        const options = Array.from(selector.options);
        if (options.length <= 1) return;
        
        const currentIndex = selector.selectedIndex;
        
        // Skip the first option (Custom) and wrap around if at the end
        let nextIndex = currentIndex + 1;
        if (nextIndex >= options.length) {
            nextIndex = 1; // Skip index 0 (Custom)
        }
        
        if (nextIndex < options.length && options[nextIndex]) {
            selector.selectedIndex = nextIndex;
            const presetKey = options[nextIndex].value;
            
            if (presetKey) {
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                    this.currentEditingPreset = presetKey;
                }
            }
        }
    }
    
    loadPreviousPreset() {
        const selector = document.getElementById('preset-selector');
        if (!selector) return;
        
        const options = Array.from(selector.options);
        const currentIndex = selector.selectedIndex;
        
        // Skip the first option (Custom) and wrap around if at the beginning
        let prevIndex = currentIndex - 1;
        if (prevIndex <= 0) {
            prevIndex = options.length - 1; // Go to last preset
        }
        
        if (prevIndex > 0 && options[prevIndex]) {
            selector.selectedIndex = prevIndex;
            const presetKey = options[prevIndex].value;
            
            if (presetKey) {
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                    this.currentEditingPreset = presetKey;
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
        
        console.log(`Current recent scenarios: [${this.recentScenarios.join(', ')}], Length: ${this.recentScenarios.length}`);
        
        // If we've used all scenarios recently, reset the history
        if (this.recentScenarios.length >= scenarios.length - 1) {
            console.log(`Resetting scenario history after ${this.recentScenarios.length} uses`);
            this.recentScenarios = [];
        }
        
        // Find scenarios not used recently
        const availableScenarios = scenarios.filter(s => !this.recentScenarios.includes(s));
        console.log(`Available scenarios: [${availableScenarios.join(', ')}]`);
        
        // Safety check - if no available scenarios, use all scenarios
        const scenariosToChooseFrom = availableScenarios.length > 0 ? availableScenarios : scenarios;
        
        // Pick a random scenario from available ones
        const selectedScenario = scenariosToChooseFrom[Math.floor(Math.random() * scenariosToChooseFrom.length)];
        
        // Add to recent history only if it's not already there
        if (!this.recentScenarios.includes(selectedScenario)) {
            this.recentScenarios.push(selectedScenario);
        }
        
        console.log(`Selected scenario: ${selectedScenario}, Updated recent: [${this.recentScenarios.join(', ')}]`);
        
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
            console.log(`Applied ${scenario} distribution pattern with ${Object.keys(distributionData).length} species`);
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
        const haloEnabledEl = document.getElementById('halo-enabled');
        const speciesGlowEnabledEl = document.getElementById('species-glow-enabled');
        
        if (!haloEnabledEl || !speciesGlowEnabledEl) {
            console.warn('Effect elements not found during mutual exclusion check');
            return;
        }
        
        const haloEnabled = haloEnabledEl.checked;
        const speciesGlowEnabled = speciesGlowEnabledEl.checked;
        
        console.log(`Effect mutual exclusion check: halo=${haloEnabled}, glow=${speciesGlowEnabled}`);
        
        // If both are enabled, disable species glow to prevent conflicts
        if (haloEnabled && speciesGlowEnabled) {
            console.log('Both effects enabled, disabling species glow for mutual exclusion');
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
        
        // Expose safeAddEventListener as a method for testing
        this.safeAddEventListener = safeAddEventListener;
        
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
            if (presetKey) {
                const preset = this.presetManager.getPreset(presetKey);
                if (preset) {
                    this.particleSystem.loadFullPreset(preset);
                    this.updateUIFromParticleSystem();
                    this.updateGraph();
                }
            }
        });
        
        document.getElementById('randomize-values-btn').addEventListener('click', () => {
            this.randomizeValues();
        });
        
        document.getElementById('configure-preset-btn').addEventListener('click', () => {
            const currentPresetKey = document.getElementById('preset-selector').value;
            if (this.presetModal) {
                this.presetModal.open(currentPresetKey);
            } else {
                console.warn('Preset modal not available');
            }
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
                    
                    // Resize distribution canvas to match current simulation dimensions
                    if (this.distributionDrawer) {
                        const distributionCanvas = document.getElementById('distribution-canvas');
                        this.setupDistributionCanvasSize(distributionCanvas);
                        this.distributionDrawer.resize();
                    }
                    
                    this.triggerAutoSave();
                    
                    console.log(`Particle count after: ${this.particleSystem.particles.length}`);
                    console.log(`Species array length: ${this.particleSystem.species.length}`);
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
        
        document.getElementById('wall-bounce').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.wallDamping = value;
            document.getElementById('wall-bounce-value').textContent = value.toFixed(2);
            this.triggerAutoSave();
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
            this.triggerAutoSave();
        });
        
        document.getElementById('trail-length').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.blur = value;
            document.getElementById('trail-length-value').textContent = value.toFixed(2);
            this.triggerAutoSave();
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
            this.triggerAutoSave();
        });
        
        document.getElementById('halo-intensity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.glowIntensity = value;
            document.getElementById('halo-intensity-value').textContent = value.toFixed(2);
            this.particleSystem.clearCaches();
            this.triggerAutoSave();
        });
        
        document.getElementById('halo-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.glowRadius = value;
            document.getElementById('halo-radius-value').textContent = value.toFixed(1);
            this.particleSystem.clearCaches();
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
        
        safeAddEventListener('particle-size', 'input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.particleSize = value;
            
            // Only update all species sizes if per-species mode is disabled
            if (!this.particleSystem.perSpeciesSize && this.particleSystem.species && this.particleSystem.species.length > 0) {
                for (let i = 0; i < this.particleSystem.species.length; i++) {
                    if (this.particleSystem.species[i]) {
                        this.particleSystem.species[i].size = value;
                    }
                }
            }
            
            document.getElementById('particle-size-value').textContent = value.toFixed(1);
            this.triggerAutoSave();
        });
        
        // Per-species size controls
        safeAddEventListener('per-species-size-enabled', 'change', (e) => {
            const enabled = e.target.checked;
            this.particleSystem.perSpeciesSize = enabled;
            
            // Show/hide per-species controls
            document.getElementById('per-species-size-controls').style.display = enabled ? '' : 'none';
            
            // If disabling per-species mode, sync all species to global size
            if (!enabled) {
                const globalSize = this.particleSystem.particleSize;
                for (let i = 0; i < this.particleSystem.species.length; i++) {
                    if (this.particleSystem.species[i]) {
                        this.particleSystem.species[i].size = globalSize;
                    }
                }
            } else {
                // If enabling per-species mode, update the current species selector display
                this.updateSpeciesSizeDisplay();
            }
            
            this.triggerAutoSave();
        });
        
        // Species size selector
        safeAddEventListener('size-species-selector', 'change', (e) => {
            this.updateSpeciesSizeDisplay();
        });
        
        // Individual species size slider
        safeAddEventListener('species-size', 'input', (e) => {
            const value = parseFloat(e.target.value);
            const selectedSpecies = parseInt(document.getElementById('size-species-selector').value);
            
            // Update the selected species size
            if (this.particleSystem.species[selectedSpecies]) {
                this.particleSystem.species[selectedSpecies].size = value;
            }
            
            document.getElementById('species-size-value').textContent = value.toFixed(1);
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
            
            this.triggerAutoSave();
        });
        
        // Aspect ratio controls
        if (this.aspectRatioManager) {
            this.setupAspectRatioControls();
        }
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
        const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta',
                       'Teal', 'Indigo', 'Brown', 'Gray', 'Violet', 'Coral', 'Navy', 'Gold', 'Silver', 'Crimson'];
        
        const selectors = ['from-species', 'to-species', 'glow-species-selector', 'size-species-selector'];
        
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
        const colorNames = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta',
                           'Teal', 'Indigo', 'Brown', 'Gray', 'Violet', 'Coral', 'Navy', 'Gold', 'Silver', 'Crimson'];
        
        const fromName = colorNames[fromSpecies] || `Species ${fromSpecies + 1}`;
        const toName = colorNames[toSpecies] || `Species ${toSpecies + 1}`;
        
        this.forceGraph.setInfo(`${fromName} → ${toName}: ${force.toFixed(2)}`);
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
        document.getElementById('collision-radius').value = ps.collisionRadius[0]?.[0] || 15;
        document.getElementById('collision-radius-value').textContent = ps.collisionRadius[0]?.[0] || 15;
        document.getElementById('social-radius').value = ps.socialRadius[0]?.[0] || 50;
        document.getElementById('social-radius-value').textContent = ps.socialRadius[0]?.[0] || 50;
        
        // Force distribution
        document.getElementById('force-distribution').value = this.forceDistribution;
        document.getElementById('force-distribution-value').textContent = this.forceDistribution.toFixed(1);
        
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
        document.getElementById('background-mode').value = ps.backgroundMode || 'solid';
        document.getElementById('background-color').value = ps.backgroundColor || '#000000';
        document.getElementById('background-color1').value = ps.backgroundColor1 || '#000000';
        document.getElementById('background-color2').value = ps.backgroundColor2 || '#001133';
        document.getElementById('background-cycle-time').value = ps.backgroundCycleTime || 5.0;
        document.getElementById('background-cycle-time-value').textContent = (ps.backgroundCycleTime || 5.0).toFixed(1);
        this.toggleBackgroundModeUI(ps.backgroundMode || 'solid');
        
        document.getElementById('particle-size').value = ps.particleSize;
        document.getElementById('particle-size-value').textContent = ps.particleSize.toFixed(1);
        
        // Per-species size controls
        document.getElementById('per-species-size-enabled').checked = ps.perSpeciesSize || false;
        document.getElementById('per-species-size-controls').style.display = ps.perSpeciesSize ? '' : 'none';
        
        // If per-species mode is enabled, update the species size display
        if (ps.perSpeciesSize) {
            this.updateSpeciesSizeDisplay();
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
        
        // Clear all options except Custom
        selector.innerHTML = '<option value="">Custom</option>';
        
        // Add user presets
        const userPresets = this.presetManager.getUserPresets();
        userPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.key;
            option.textContent = preset.name;
            selector.appendChild(option);
        });
        
        // No separator needed since no random option exists
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
        
        const speciesLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        
        for (let i = 0; i < numSpecies; i++) {
            const species = this.particleSystem.species[i];
            const button = document.createElement('button');
            button.className = `species-btn ${i === 0 ? 'active' : ''}`;
            button.dataset.speciesId = i;
            button.title = `Species ${speciesLabels[i]} (${i + 1})`;
            button.style.background = `rgb(${species.color.r}, ${species.color.g}, ${species.color.b})`;
            button.textContent = speciesLabels[i];
            
            button.addEventListener('click', (e) => {
                // Update button states
                container.querySelectorAll('.species-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update distribution drawer
                const speciesId = parseInt(e.target.dataset.speciesId);
                this.distributionDrawer.setSpecies(speciesId);
            });
            
            container.appendChild(button);
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
    
    updateSpeciesSizeDisplay() {
        const selectedSpecies = parseInt(document.getElementById('size-species-selector').value);
        
        // Get the current size for the selected species
        const currentSize = this.particleSystem.species[selectedSpecies]?.size || this.particleSystem.particleSize;
        
        // Update the slider and display
        document.getElementById('species-size').value = currentSize;
        document.getElementById('species-size-value').textContent = currentSize.toFixed(1);
    }
}