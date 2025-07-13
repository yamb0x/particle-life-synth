import { XYGraph } from './XYGraph.js';

export class MainUI {
    constructor(particleSystem, presetManager) {
        this.particleSystem = particleSystem;
        this.presetManager = presetManager;
        this.isVisible = true;
        this.container = null;
        this.forceGraph = null;
        
        this.init();
        this.setupKeyboardShortcuts();
    }
    
    init() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'panel main-ui';
        this.container.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Particle Life</h3>
                <button class="btn btn-icon btn-ghost" id="minimize-btn" title="Hide panel (C)">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6h8v1H4z"/>
                    </svg>
                </button>
            </div>
            <div class="panel-content">
                <!-- Preset Section -->
                <div class="section">
                    <div class="control-group">
                        <label>
                            Preset
                            <button class="btn btn-primary btn-sm" id="configure-preset-btn">Configure</button>
                        </label>
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
                </div>
                
                <!-- Particle Settings -->
                <div class="section">
                    <h4 class="section-title">Particles</h4>
                    <div class="control-group">
                        <label>
                            Per Species
                            <span class="value-display" id="particles-per-species-value">${this.particleSystem.particlesPerSpecies}</span>
                        </label>
                        <input type="range" class="range-slider" id="particles-per-species" 
                               min="0" max="1000" step="10" value="${this.particleSystem.particlesPerSpecies}">
                    </div>
                    <div class="control-group">
                        <label>
                            Species Count
                            <span class="value-display" id="num-species-value">${this.particleSystem.numSpecies}</span>
                        </label>
                        <input type="range" class="range-slider" id="num-species" 
                               min="1" max="10" step="1" value="${this.particleSystem.numSpecies}">
                    </div>
                    <div class="info-text">
                        Total: <span id="total-particles">${this.particleSystem.numSpecies * this.particleSystem.particlesPerSpecies}</span> particles
                    </div>
                </div>
                
                <!-- Visual Settings -->
                <div class="section">
                    <h4 class="section-title">Visual</h4>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="trails" ${this.particleSystem.trailEnabled ? 'checked' : ''}>
                            Enable Trails
                        </label>
                    </div>
                    <div class="control-group">
                        <label>
                            Trail Length
                            <span class="value-display" id="blur-value">${this.particleSystem.blur.toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="blur" 
                               min="0.5" max="0.99" step="0.01" value="${this.particleSystem.blur}">
                        <span class="info-text">Lower = longer trails</span>
                    </div>
                    <div class="control-group">
                        <label>
                            Particle Size
                            <span class="value-display" id="particle-size-value">${this.particleSystem.particleSize.toFixed(1)}</span>
                        </label>
                        <input type="range" class="range-slider" id="particle-size" 
                               min="0.5" max="20" step="0.5" value="${this.particleSystem.particleSize}">
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">
                            Visual size only (doesn't affect physics)
                        </div>
                    </div>
                    <div class="control-group">
                        <label>Background Color</label>
                        <input type="color" id="background-color-main" value="#000000" style="width: 100%; height: 32px; border: 1px solid var(--border-default); border-radius: var(--radius-sm);">
                    </div>
                    <div class="control-group">
                        <label>
                            <input type="checkbox" id="dreamtime-mode" ${this.particleSystem.renderMode === 'dreamtime' ? 'checked' : ''}>
                            Dreamtime Effect
                        </label>
                    </div>
                </div>
                
                <!-- Physics Settings -->
                <div class="section">
                    <h4 class="section-title">Physics</h4>
                    <div class="control-group">
                        <label>
                            Force Strength
                            <span class="value-display" id="force-value">${this.particleSystem.forceFactor.toFixed(1)}</span>
                        </label>
                        <input type="range" class="range-slider" id="force" 
                               min="0.1" max="10" step="0.1" value="${this.particleSystem.forceFactor}">
                    </div>
                    <div class="control-group">
                        <label>
                            Friction
                            <span class="value-display" id="friction-value">${(1.0 - this.particleSystem.friction).toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="friction" 
                               min="0" max="1.0" step="0.01" value="${1.0 - this.particleSystem.friction}">
                    </div>
                    <div class="control-group">
                        <label>
                            Wall Bounce
                            <span class="value-display" id="wall-damping-value">${this.particleSystem.wallDamping.toFixed(2)}</span>
                        </label>
                        <input type="range" class="range-slider" id="wall-damping" 
                               min="0" max="2.0" step="0.05" value="${this.particleSystem.wallDamping}">
                    </div>
                    <div class="control-group">
                        <label>
                            Collision Radius
                            <span class="value-display" id="collision-radius-value">${this.particleSystem.collisionRadius[0][0]}</span>
                        </label>
                        <input type="range" class="range-slider" id="collision-radius" 
                               min="1" max="100" step="1" value="${this.particleSystem.collisionRadius[0][0]}">
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">
                            Distance for collision forces (independent of visual size)
                        </div>
                    </div>
                    <div class="control-group">
                        <label>
                            Social Radius
                            <span class="value-display" id="social-radius-value">${this.particleSystem.socialRadius[0][0]}</span>
                        </label>
                        <input type="range" class="range-slider" id="social-radius" 
                               min="1" max="500" step="5" value="${this.particleSystem.socialRadius[0][0]}">
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">
                            Distance for attraction/repulsion forces
                        </div>
                    </div>
                </div>
                
                <!-- Force Relationships -->
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
                
                <!-- Info Message -->
                <div class="info-message">
                    For per-species settings (colors, names, particle counts) and starting positions, use the Configure panel
                </div>
            </div>
        `;
        
        // Add styles specific to MainUI
        const style = document.createElement('style');
        style.textContent = `
            .main-ui {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 280px;
                max-height: calc(100vh - 20px);
                overflow-y: auto;
                z-index: var(--z-sticky);
                transition: transform var(--transition-normal), opacity var(--transition-normal);
            }
            
            .main-ui.hidden {
                transform: translateX(300px);
                opacity: 0;
            }
            
            .panel-title {
                margin: 0;
                font-size: var(--font-size-md);
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .info-text {
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
                margin-top: var(--space-xs);
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
            }
            
            .btn-sm {
                padding: 2px 6px;
                font-size: var(--font-size-xs);
            }
            
            .btn-block {
                width: 100%;
                margin-top: var(--space-sm);
            }
            
            input[type="checkbox"] {
                margin-right: var(--space-sm);
                width: 12px;
                height: 12px;
            }
            
            /* Make sliders full width in labels */
            .control-group input[type="range"] {
                flex: 1;
                margin: 0 var(--space-sm);
            }
            
            /* Info message */
            .info-message {
                font-size: var(--font-size-xs);
                color: var(--text-tertiary);
                background: var(--bg-primary);
                padding: var(--space-sm);
                border-radius: var(--radius-sm);
                margin-top: var(--space-md);
                text-align: center;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.container);
        
        // Initialize XY Graph
        this.forceGraph = new XYGraph('force-graph-container', {
            width: 256,
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
                this.particleSystem.setSocialForce(fromSpecies, toSpecies, value);
                this.updateGraphInfo();
            }
        });
        
        // Setup event listeners AFTER DOM elements are added
        this.setupEventListeners();
        
        // Set initial background color
        const bgColorMain = document.getElementById('background-color-main');
        if (bgColorMain) {
            bgColorMain.value = this.particleSystem.backgroundColor;
        }
        
        // Initial updates
        this.updatePresetSelector();
        this.updateGraph();
        
        // Set initial preset
        const lastSelectedPreset = localStorage.getItem('lastSelectedPreset') || 'predatorPrey';
        const selector = document.getElementById('preset-selector');
        if (selector) {
            selector.value = lastSelectedPreset;
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
                this.toggleVisibility();
            }
        });
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
    }
    
    setupEventListeners() {
        // Minimize button
        document.getElementById('minimize-btn').addEventListener('click', () => {
            this.toggleVisibility();
        });
        
        // Preset controls
        document.getElementById('preset-selector').addEventListener('change', (e) => {
            this.handlePresetChange(e.target.value);
        });
        
        document.getElementById('configure-preset-btn').addEventListener('click', () => {
            const currentPresetKey = document.getElementById('preset-selector').value;
            window.presetModal.open(currentPresetKey);
        });
        
        // Particle controls
        document.getElementById('particles-per-species').addEventListener('input', (e) => {
            const newCount = parseInt(e.target.value);
            this.particleSystem.particlesPerSpecies = newCount;
            this.particleSystem.initializeParticles();
            document.getElementById('particles-per-species-value').textContent = newCount;
            document.getElementById('total-particles').textContent = this.particleSystem.numSpecies * newCount;
        });
        
        document.getElementById('num-species').addEventListener('input', (e) => {
            const newSpecies = parseInt(e.target.value);
            this.particleSystem.numSpecies = newSpecies;
            this.particleSystem.initializeSpecies();
            this.particleSystem.initializeParticles();
            document.getElementById('num-species-value').textContent = newSpecies;
            document.getElementById('total-particles').textContent = newSpecies * this.particleSystem.particlesPerSpecies;
            this.updateSpeciesSelectors(newSpecies);
            this.updateGraph();
            
            // Sync to modal if open
            if (window.presetModal && window.presetModal.isOpen) {
                const speciesCountSlider = document.getElementById('species-count');
                const speciesCountValue = document.getElementById('species-count-value');
                if (speciesCountSlider && speciesCountValue) {
                    speciesCountSlider.value = newSpecies;
                    speciesCountValue.textContent = newSpecies;
                    // Update the modal's currentPreset and regenerate species list
                    window.presetModal.updateSpeciesCount(newSpecies);
                }
            }
            
            // Update radius matrices after species count changes
            const collisionValue = parseFloat(document.getElementById('collision-radius').value);
            const socialValue = parseFloat(document.getElementById('social-radius').value);
            for (let i = 0; i < newSpecies; i++) {
                for (let j = 0; j < newSpecies; j++) {
                    if (this.particleSystem.collisionRadius[i]) {
                        this.particleSystem.collisionRadius[i][j] = collisionValue;
                    }
                    if (this.particleSystem.socialRadius[i]) {
                        this.particleSystem.socialRadius[i][j] = socialValue;
                    }
                }
            }
        });
        
        // Visual controls
        document.getElementById('trails').addEventListener('change', (e) => {
            this.particleSystem.trailEnabled = e.target.checked;
            this.syncToModal('trail-enabled', e.target.checked);
        });
        
        document.getElementById('blur').addEventListener('input', (e) => {
            this.particleSystem.blur = parseFloat(e.target.value);
            document.getElementById('blur-value').textContent = this.particleSystem.blur.toFixed(2);
            this.syncToModal('blur', parseFloat(e.target.value));
        });
        
        document.getElementById('particle-size').addEventListener('input', (e) => {
            const newSize = parseFloat(e.target.value);
            this.particleSystem.particleSize = newSize;
            for (let i = 0; i < this.particleSystem.species.length; i++) {
                this.particleSystem.species[i].size = newSize + (Math.random() - 0.5);
            }
            document.getElementById('particle-size-value').textContent = newSize.toFixed(1);
            this.syncToModal('particle-size', newSize);
        });
        
        document.getElementById('background-color-main').addEventListener('change', (e) => {
            this.particleSystem.backgroundColor = e.target.value;
            this.syncToModal('background-color', e.target.value);
        });
        
        document.getElementById('dreamtime-mode').addEventListener('change', (e) => {
            this.particleSystem.renderMode = e.target.checked ? 'dreamtime' : 'normal';
            // Adjust default glow settings for dreamtime mode
            if (e.target.checked) {
                this.particleSystem.glowIntensity = 0.8;
                this.particleSystem.glowRadius = 3.0;
                this.particleSystem.blur = 0.97; // Slightly longer trails for dreamtime
            }
        });
        
        // Physics controls
        document.getElementById('force').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.forceFactor = value;
            const forceDisplay = document.getElementById('force-value');
            if (forceDisplay) {
                forceDisplay.textContent = value.toFixed(1);
            }
            this.syncToModal('force-factor', value);
        });
        
        document.getElementById('friction').addEventListener('input', (e) => {
            const uiFriction = parseFloat(e.target.value);
            this.particleSystem.friction = 1.0 - uiFriction;
            const frictionDisplay = document.getElementById('friction-value');
            if (frictionDisplay) {
                frictionDisplay.textContent = uiFriction.toFixed(2);
            }
            this.syncToModal('friction', uiFriction);
        });
        
        document.getElementById('wall-damping').addEventListener('input', (e) => {
            this.particleSystem.wallDamping = parseFloat(e.target.value);
            const wallDisplay = document.getElementById('wall-damping-value');
            if (wallDisplay) {
                wallDisplay.textContent = parseFloat(e.target.value).toFixed(2);
            }
            this.syncToModal('wall-damping', parseFloat(e.target.value));
        });
        
        document.getElementById('collision-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            // Update all collision radii to the same value
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    this.particleSystem.collisionRadius[i][j] = value;
                }
            }
            const collisionDisplay = document.getElementById('collision-radius-value');
            if (collisionDisplay) {
                collisionDisplay.textContent = value;
            }
            this.syncToModal('collision-radius', value);
        });
        
        document.getElementById('social-radius').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            // Update all social radii to the same value
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                for (let j = 0; j < this.particleSystem.numSpecies; j++) {
                    this.particleSystem.socialRadius[i][j] = value;
                }
            }
            const socialDisplay = document.getElementById('social-radius-value');
            if (socialDisplay) {
                socialDisplay.textContent = value;
            }
            this.syncToModal('social-radius', value);
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
    }
    
    handlePresetChange(presetKey) {
        if (presetKey && presetKey !== 'random') {
            localStorage.setItem('lastSelectedPreset', presetKey);
        }
        
        if (presetKey === 'random') {
            this.particleSystem.socialForce = this.particleSystem.createAsymmetricMatrix();
            this.updateGraph();
        } else if (presetKey) {
            const preset = this.presetManager.getPreset(presetKey);
            if (preset) {
                this.particleSystem.loadFullPreset(preset);
                this.updateUIFromPreset();
                this.updateGraph();
            }
        }
    }
    
    syncToModal(parameterId, value) {
        // Update corresponding controls in the modal if it's open
        if (!window.presetModal || !window.presetModal.isOpen) return;
        
        // Find elements within the modal only
        const modal = document.querySelector('.preset-modal');
        if (!modal) return;
        
        const modalElement = modal.querySelector(`#${parameterId}`);
        if (modalElement) {
            if (modalElement.type === 'checkbox') {
                modalElement.checked = value;
            } else {
                modalElement.value = value;
            }
            
            // Update corresponding value display within the modal only
            const valueDisplay = modal.querySelector(`#${parameterId}-value`);
            if (valueDisplay) {
                if (typeof value === 'number') {
                    valueDisplay.textContent = parameterId === 'particle-size' ? value.toFixed(1) : 
                                             (parameterId.includes('radius') ? value : value.toFixed(2));
                } else {
                    valueDisplay.textContent = value;
                }
            }
        }
    }

    updateSpeciesSelectors(numSpecies) {
        const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta'];
        const fromSelect = document.getElementById('from-species');
        const toSelect = document.getElementById('to-species');
        
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        for (let i = 0; i < numSpecies; i++) {
            const fromOption = document.createElement('option');
            fromOption.value = i;
            fromOption.textContent = colors[i] || `Species ${i + 1}`;
            fromSelect.appendChild(fromOption);
            
            const toOption = document.createElement('option');
            toOption.value = i;
            toOption.textContent = colors[i] || `Species ${i + 1}`;
            toSelect.appendChild(toOption);
        }
        
        if (numSpecies > 1) {
            toSelect.value = '1';
        }
    }
    
    updateGraph() {
        const fromSpecies = parseInt(document.getElementById('from-species').value);
        const toSpecies = parseInt(document.getElementById('to-species').value);
        const force = this.particleSystem.socialForce[fromSpecies][toSpecies];
        
        this.forceGraph.setValue(force);
        this.updateGraphInfo();
    }
    
    updateGraphInfo() {
        const fromSpecies = parseInt(document.getElementById('from-species').value);
        const toSpecies = parseInt(document.getElementById('to-species').value);
        const force = this.particleSystem.socialForce[fromSpecies][toSpecies];
        const colorNames = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta'];
        
        const fromName = colorNames[fromSpecies] || `Species ${fromSpecies + 1}`;
        const toName = colorNames[toSpecies] || `Species ${toSpecies + 1}`;
        
        this.forceGraph.setInfo(`${fromName} → ${toName}: ${force.toFixed(2)}`);
    }
    
    updatePresetSelector() {
        const selector = document.getElementById('preset-selector');
        const currentValue = selector.value;
        
        while (selector.options.length > 6) {
            selector.remove(6);
        }
        
        const allPresets = this.presetManager.getAllPresets();
        allPresets.forEach(preset => {
            if (!['predatorPrey', 'crystallization', 'vortex', 'symbiosis'].includes(preset.key)) {
                const option = document.createElement('option');
                option.value = preset.key;
                option.textContent = preset.name;
                selector.appendChild(option);
            }
        });
        
        selector.value = currentValue;
    }
    
    updateUIFromPreset() {
        const ps = this.particleSystem;
        
        // Update visual controls
        document.getElementById('trails').checked = ps.trailEnabled;
        document.getElementById('blur').value = ps.blur;
        document.getElementById('blur-value').textContent = ps.blur.toFixed(2);
        document.getElementById('particle-size').value = ps.particleSize;
        document.getElementById('particle-size-value').textContent = ps.particleSize.toFixed(1);
        document.getElementById('dreamtime-mode').checked = ps.renderMode === 'dreamtime';
        
        // Update physics controls
        document.getElementById('force').value = ps.forceFactor;
        document.getElementById('force-value').textContent = ps.forceFactor.toFixed(1);
        const uiFriction = 1.0 - ps.friction;
        document.getElementById('friction').value = uiFriction;
        document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
        document.getElementById('wall-damping').value = ps.wallDamping;
        document.getElementById('wall-damping-value').textContent = ps.wallDamping.toFixed(2);
        
        // Get the average collision and social radius (they should all be the same)
        const collisionRadius = ps.collisionRadius[0][0];
        const socialRadius = ps.socialRadius[0][0];
        document.getElementById('collision-radius').value = collisionRadius;
        document.getElementById('collision-radius-value').textContent = collisionRadius;
        document.getElementById('social-radius').value = socialRadius;
        document.getElementById('social-radius-value').textContent = socialRadius;
        
        // Update particle counts
        const totalParticles = ps.species.reduce((sum, s) => sum + (s.particleCount || ps.particlesPerSpecies), 0);
        const avgParticlesPerSpecies = Math.round(totalParticles / ps.numSpecies);
        document.getElementById('particles-per-species').value = avgParticlesPerSpecies;
        document.getElementById('particles-per-species-value').textContent = avgParticlesPerSpecies;
        document.getElementById('num-species').value = ps.numSpecies;
        document.getElementById('num-species-value').textContent = ps.numSpecies;
        document.getElementById('total-particles').textContent = totalParticles;
        
        // Update species selectors if needed
        this.updateSpeciesSelectors(ps.numSpecies);
        
        // Update background color if available
        const bgColorMain = document.getElementById('background-color-main');
        if (bgColorMain && ps.backgroundColor) {
            bgColorMain.value = ps.backgroundColor;
        }
    }
}