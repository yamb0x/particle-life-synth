import { StartPositionEditor } from './StartPositionEditor.js';
import { ColorPicker } from './ColorPicker.js';
import { ForceEditor } from './ForceEditor.js';
import { SpeciesGlowControl } from './SpeciesGlowControl.js';

export class PresetModal {
  constructor(particleSystem, presetManager) {
    this.particleSystem = particleSystem;
    this.presetManager = presetManager;
    this.currentPreset = null;
    this.currentPresetKey = null;
    this.activeTab = 'species';
    this.startPositionEditor = null;
    this.forceEditor = null;
    this.colorPickers = [];
    this.speciesGlowControl = null;
    this.isOpen = false;
    this.hasChanges = false;
    this.autoSaveTimeout = null;
    
    this.createModal();
    this.attachEventListeners();
  }

  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'preset-modal-overlay';
    this.overlay.style.display = 'none';
    
    this.modal = document.createElement('div');
    this.modal.className = 'preset-modal';
    
    this.modal.innerHTML = `
      <div class="preset-modal-header">
        <input type="text" class="input preset-name-input" placeholder="Preset Name" value="New Preset">
        <button class="btn btn-icon btn-ghost preset-modal-close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
          </svg>
        </button>
      </div>
      
      <div class="preset-modal-tabs">
        <button class="preset-tab active" data-tab="species">Species</button>
        <button class="preset-tab" data-tab="forces">Forces</button>
        <button class="preset-tab" data-tab="visual">Visual</button>
        <button class="preset-tab" data-tab="physics">Physics</button>
        <button class="preset-tab" data-tab="layout">Layout</button>
      </div>
      
      <div class="preset-modal-content">
        <div class="preset-tab-content active" data-content="species">
          <div class="species-controls">
            <div class="control-group">
              <label>
                Number of Species
                <span class="value-display" id="species-count-value">5</span>
              </label>
              <input type="range" class="range-slider" id="species-count" min="2" max="10" value="5">
            </div>
            <div id="species-list"></div>
          </div>
        </div>
        
        <div class="preset-tab-content" data-content="forces">
          <div class="forces-controls">
            <h4 class="section-title">Force Relationships</h4>
            <p class="info-text">
              Configure how each species interacts with others. Positive values = attraction, Negative = repulsion.
            </p>
            <div class="species-selectors">
              <div class="selector-group">
                <label>From</label>
                <select class="select select-sm" id="force-from-species"></select>
              </div>
              <div class="selector-group">
                <label>To</label>
                <select class="select select-sm" id="force-to-species"></select>
              </div>
            </div>
            <canvas id="force-editor-canvas" width="400" height="200" style="border: 1px solid #333; border-radius: 4px;"></canvas>
            <div id="force-info" style="font-size: var(--font-size-sm); color: #888; margin-top: 5px;">
              Click and drag to set force value
            </div>
            <div style="margin-top: 20px;">
              <h5 style="margin-bottom: 10px;">Quick Presets</h5>
              <button class="btn btn-secondary btn-sm force-preset-btn" data-preset="neutral">Neutral</button>
              <button class="btn btn-secondary btn-sm force-preset-btn" data-preset="repel-all">Repel All</button>
              <button class="btn btn-secondary btn-sm force-preset-btn" data-preset="attract-same">Attract Same</button>
              <button class="btn btn-secondary btn-sm force-preset-btn" data-preset="chain">Chain</button>
              <button class="btn btn-secondary btn-sm force-preset-btn" data-preset="random">Random</button>
            </div>
            <div style="margin-top: 15px;">
              <h5 style="margin-bottom: 10px;">Force Matrix View</h5>
              <div id="force-matrix-view" style="font-family: monospace; font-size: var(--font-size-md); background: #111; padding: 10px; border-radius: 4px; overflow-x: auto;"></div>
            </div>
          </div>
        </div>
        
        <div class="preset-tab-content" data-content="visual">
          <div class="visual-controls">
            <div class="control-group">
              <label>
                Trail Effect
                <span class="value-display" id="blur-value">0.95</span>
              </label>
              <input type="range" class="range-slider" id="modal-blur" min="0.5" max="0.99" step="0.01" value="0.95">
            </div>
            <div class="control-group">
              <label>
                Particle Size
                <span class="value-display" id="particle-size-value">2</span>
              </label>
              <input type="range" class="range-slider" id="particle-size" min="0.5" max="20" step="0.5" value="2">
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" id="trail-enabled" checked>
                Enable Trails
              </label>
            </div>
            <div class="control-group">
              <label>Background Color:</label>
              <input type="color" id="background-color" value="#000000">
            </div>
            <div id="modal-species-glow-container"></div>
          </div>
        </div>
        
        <div class="preset-tab-content" data-content="physics">
          <div class="physics-controls">
            <div class="control-group">
              <label>
                Friction
                <span class="value-display" id="modal-friction-value">0.05</span>
              </label>
              <input type="range" class="range-slider" id="modal-friction" min="0" max="1.0" step="0.01" value="0.05">
            </div>
            <div class="control-group">
              <label>
                Wall Damping
                <span class="value-display" id="wall-damping-value">0.9</span>
              </label>
              <input type="range" class="range-slider" id="modal-wall-damping" min="0" max="2.0" step="0.05" value="0.9">
            </div>
            <div class="control-group">
              <label>
                Force Factor
                <span class="value-display" id="force-factor-value">0.5</span>
              </label>
              <input type="range" class="range-slider" id="force-factor" min="0.1" max="10" step="0.1" value="0.5">
            </div>
            <div class="control-group">
              <label>
                Collision Radius
                <span class="value-display" id="collision-radius-value">15</span>
              </label>
              <input type="range" class="range-slider" id="modal-collision-radius" min="1" max="100" step="1" value="15">
            </div>
            <div class="control-group">
              <label>
                Social Radius
                <span class="value-display" id="social-radius-value">50</span>
              </label>
              <input type="range" class="range-slider" id="modal-social-radius" min="1" max="500" step="5" value="50">
            </div>
          </div>
        </div>
        
        <div class="preset-tab-content" data-content="layout">
          <div class="layout-controls">
            <h3>Starting Positions</h3>
            <p>Click and drag species positions. Select a species to change its spawn pattern.</p>
            <canvas id="start-position-canvas" width="400" height="400"></canvas>
            <div id="position-pattern-controls"></div>
          </div>
        </div>
      </div>
      
      <div class="preset-modal-footer">
        <div class="preset-save-status"></div>
        <button class="btn btn-secondary btn-sm preset-btn-paste">Paste from Floating UI</button>
        <button class="btn btn-secondary btn-sm preset-btn-delete">Delete</button>
        <button class="btn btn-secondary btn-sm preset-btn-close">Close</button>
        <button class="btn btn-secondary btn-sm preset-btn-save-new">Save as New</button>
        <button class="btn btn-primary btn-sm preset-btn-save">Save</button>
        <button class="btn btn-primary btn-sm preset-btn-apply">Apply</button>
      </div>
    `;
    
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);
    
    // Ensure modal is hidden initially
    this.overlay.style.display = 'none';
    
    // Add custom styles for modal
    if (!document.getElementById('preset-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'preset-modal-styles';
      style.textContent = `
        .preset-modal {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
        }
        
        .preset-modal-header {
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-default);
          padding: var(--space-md) var(--space-lg);
        }
        
        .preset-name-input {
          flex: 1;
          margin-right: var(--space-md);
          font-size: var(--font-size-lg);
        }
        
        .preset-modal-tabs {
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-default);
        }
        
        .preset-tab {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: var(--space-md) var(--space-lg);
          font-size: var(--font-size-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          border-bottom: 2px solid transparent;
        }
        
        .preset-tab:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        
        .preset-tab.active {
          color: var(--text-primary);
          background: var(--bg-secondary);
          border-bottom-color: var(--accent-primary);
        }
        
        .preset-modal-content {
          padding: var(--space-lg);
        }
        
        .preset-modal-footer {
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border-default);
          padding: var(--space-md) var(--space-lg);
          gap: var(--space-sm);
        }
        
        .species-item {
          background: var(--bg-primary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-md);
        }
        
        .species-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }
        
        .species-name {
          flex: 1;
        }
        
        #force-editor-canvas {
          border: 1px solid var(--border-default) !important;
          background: var(--bg-primary);
          display: block;
          margin-top: var(--space-md);
        }
        
        #force-info {
          font-size: var(--font-size-xs) !important;
          color: var(--text-tertiary) !important;
          margin-top: var(--space-sm) !important;
        }
        
        #force-matrix-view {
          font-family: var(--font-mono) !important;
          font-size: var(--font-size-xs) !important;
          background: var(--bg-primary) !important;
          padding: var(--space-md) !important;
          border-radius: var(--radius-md) !important;
          border: 1px solid var(--border-default);
        }
        
        .preset-save-status {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          flex: 1;
        }
        
        /* Control group overrides for modal */
        .preset-modal .control-group {
          margin-bottom: var(--space-lg);
        }
        
        .preset-modal h4 {
          font-size: var(--font-size-md);
          color: var(--text-primary);
          margin-bottom: var(--space-md);
        }
        
        .preset-modal h5 {
          font-size: var(--font-size-sm);
          color: var(--text-primary);
          margin-bottom: var(--space-sm);
        }
        
        .preset-modal .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);
    }
    
    const canvas = this.modal.querySelector('#start-position-canvas');
    this.startPositionEditor = new StartPositionEditor(canvas, () => this.markChanged());
    
    const forceCanvas = this.modal.querySelector('#force-editor-canvas');
    this.forceEditor = new ForceEditor(forceCanvas, () => this.markChanged());
    this.forceEditor.setInfoElement(this.modal.querySelector('#force-info'));
    
    // Initialize Species Glow Control
    this.speciesGlowControl = new SpeciesGlowControl(this.particleSystem);
    const glowContainer = this.modal.querySelector('#modal-species-glow-container');
    if (glowContainer) {
      glowContainer.appendChild(this.speciesGlowControl.createElement());
    }
  }

  attachEventListeners() {
    this.modal.querySelector('.preset-modal-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    
    this.modal.querySelectorAll('.preset-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    this.modal.querySelector('#species-count').addEventListener('input', (e) => {
      this.modal.querySelector('#species-count-value').textContent = e.target.value;
      this.updateSpeciesCount(parseInt(e.target.value));
      this.markChanged();
    });
    
    const sliders = [
      { id: 'modal-blur', valueId: 'blur-value', syncId: 'blur' },
      { id: 'particle-size', valueId: 'particle-size-value', syncId: 'particle-size' },
      { id: 'modal-friction', valueId: 'modal-friction-value', syncId: 'friction' },
      { id: 'modal-wall-damping', valueId: 'wall-damping-value', syncId: 'wall-damping' },
      { id: 'force-factor', valueId: 'force-factor-value', syncId: 'force-factor' },
      { id: 'modal-collision-radius', valueId: 'collision-radius-value', syncId: 'collision-radius' },
      { id: 'modal-social-radius', valueId: 'social-radius-value', syncId: 'social-radius' }
    ];
    sliders.forEach(config => {
      const slider = this.modal.querySelector(`#${config.id}`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          this.modal.querySelector(`#${config.valueId}`).textContent = e.target.value;
          this.syncToParticleSystem(config.syncId, parseFloat(e.target.value));
          this.syncToMainUI(config.syncId, parseFloat(e.target.value));
          this.markChanged();
        });
      }
    });
    
    // Track changes on other inputs
    this.modal.querySelector('.preset-name-input').addEventListener('input', () => this.markChanged());
    this.modal.querySelector('#trail-enabled').addEventListener('change', (e) => {
      this.particleSystem.trailEnabled = e.target.checked;
      const mainTrailCheckbox = document.getElementById('trails');
      if (mainTrailCheckbox) {
        mainTrailCheckbox.checked = e.target.checked;
      }
      this.markChanged();
    });
    this.modal.querySelector('#background-color').addEventListener('change', (e) => {
      this.particleSystem.backgroundColor = e.target.value;
      const mainBgColor = document.getElementById('background-color-main');
      if (mainBgColor) {
        mainBgColor.value = e.target.value;
      }
      this.markChanged();
    });
    
    this.modal.querySelector('.preset-btn-close').addEventListener('click', () => this.close());
    this.modal.querySelector('.preset-btn-apply').addEventListener('click', () => this.apply());
    this.modal.querySelector('.preset-btn-save').addEventListener('click', () => this.save());
    this.modal.querySelector('.preset-btn-save-new').addEventListener('click', () => this.saveAsNew());
    this.modal.querySelector('.preset-btn-delete').addEventListener('click', () => this.deletePreset());
    this.modal.querySelector('.preset-btn-paste').addEventListener('click', () => this.pasteSettings());
    
    // Force preset buttons
    this.modal.querySelectorAll('.force-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.forceEditor.applyForcePreset(btn.dataset.preset);
        this.markChanged();
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    this.modal.querySelectorAll('.preset-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.modal.querySelectorAll('.preset-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.content === tabName);
    });
    
    if (tabName === 'layout' && this.currentPreset) {
      this.startPositionEditor.setSpecies(this.currentPreset.species.definitions);
    }
    
    if (tabName === 'forces' && this.currentPreset) {
      this.forceEditor.setSpecies(this.currentPreset.species.definitions);
      this.forceEditor.setForceMatrix(this.currentPreset.forces.social);
      this.forceEditor.updateMatrixView();
    }
  }

  syncToParticleSystem(parameterId, value) {
    switch(parameterId) {
      case 'blur':
        this.particleSystem.blur = value;
        break;
      case 'particle-size':
        this.particleSystem.particleSize = value;
        for (let i = 0; i < this.particleSystem.species.length; i++) {
          this.particleSystem.species[i].size = value + (Math.random() - 0.5);
        }
        break;
      case 'friction':
        this.particleSystem.friction = 1.0 - value; // Convert UI friction to physics friction
        break;
      case 'wall-damping':
        this.particleSystem.wallDamping = value;
        break;
      case 'force-factor':
        this.particleSystem.forceFactor = value;
        break;
      case 'collision-radius':
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
          for (let j = 0; j < this.particleSystem.numSpecies; j++) {
            this.particleSystem.collisionRadius[i][j] = value;
          }
        }
        break;
      case 'social-radius':
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
          for (let j = 0; j < this.particleSystem.numSpecies; j++) {
            this.particleSystem.socialRadius[i][j] = value;
          }
        }
        break;
    }
  }

  syncToMainUI(parameterId, value) {
    // Update corresponding controls in the main UI
    switch(parameterId) {
      case 'blur':
        const blurSlider = document.getElementById('blur');
        const blurValue = document.getElementById('main-blur-value');
        if (blurSlider && blurValue) {
          blurSlider.value = value;
          blurValue.textContent = value.toFixed(2);
        }
        break;
      case 'particle-size':
        const sizeSlider = document.getElementById('particle-size');
        const sizeValue = document.getElementById('particle-size-value');
        if (sizeSlider && sizeValue) {
          sizeSlider.value = value;
          sizeValue.textContent = value.toFixed(1);
        }
        break;
      case 'friction':
        const frictionSlider = document.getElementById('friction');
        const frictionValue = document.getElementById('main-friction-value');
        if (frictionSlider && frictionValue) {
          frictionSlider.value = value;
          frictionValue.textContent = value.toFixed(2);
        }
        break;
      case 'wall-damping':
        const wallSlider = document.getElementById('wall-damping');
        const wallValue = document.getElementById('main-wall-damping-value');
        if (wallSlider && wallValue) {
          wallSlider.value = value;
          wallValue.textContent = value.toFixed(2);
        }
        break;
      case 'force-factor':
        const forceSlider = document.getElementById('force');
        const forceValue = document.getElementById('main-force-value');
        if (forceSlider && forceValue) {
          forceSlider.value = value;
          forceValue.textContent = value.toFixed(1);
        }
        break;
      case 'collision-radius':
        const collisionSlider = document.getElementById('collision-radius');
        const collisionValue = document.getElementById('main-collision-radius-value');
        if (collisionSlider && collisionValue) {
          collisionSlider.value = value;
          collisionValue.textContent = value;
        }
        break;
      case 'social-radius':
        const socialSlider = document.getElementById('social-radius');
        const socialValue = document.getElementById('main-social-radius-value');
        if (socialSlider && socialValue) {
          socialSlider.value = value;
          socialValue.textContent = value;
        }
        break;
    }
  }

  updateSpeciesCount(count) {
    if (!this.currentPreset) return;
    
    const oldCount = this.currentPreset.species.count;
    this.currentPreset.species.count = count;
    
    if (count > oldCount) {
      for (let i = oldCount; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        const color = this.hslToRgb(hue, 70, 50);
        this.currentPreset.species.definitions.push({
          id: i,
          name: `Species ${i + 1}`,
          color: color,
          size: 3,
          opacity: 0.9,
          particleCount: 100,
          startPosition: { type: 'cluster', center: { x: 0.5, y: 0.5 }, radius: 0.1 }
        });
      }
      
      this.currentPreset.forces.collision = this.expandMatrix(this.currentPreset.forces.collision, count, 10);
      this.currentPreset.forces.social = this.expandMatrix(this.currentPreset.forces.social, count, 0);
    } else {
      this.currentPreset.species.definitions = this.currentPreset.species.definitions.slice(0, count);
      this.currentPreset.forces.collision = this.shrinkMatrix(this.currentPreset.forces.collision, count);
      this.currentPreset.forces.social = this.shrinkMatrix(this.currentPreset.forces.social, count);
    }
    
    // Apply changes to particle system immediately
    this.particleSystem.numSpecies = count;
    this.particleSystem.initializeSpecies();
    this.particleSystem.initializeParticles();
    
    // Update force matrices from the expanded/shrunk preset matrices
    this.particleSystem.collisionForce = this.currentPreset.forces.collision;
    this.particleSystem.socialForce = this.currentPreset.forces.social;
    
    this.updateSpeciesList();
    if (this.activeTab === 'layout') {
      this.startPositionEditor.setSpecies(this.currentPreset.species.definitions);
    }
    
    // Update main UI species count display
    const numSpeciesSlider = document.getElementById('num-species');
    const numSpeciesValue = document.getElementById('num-species-value');
    if (numSpeciesSlider && numSpeciesValue) {
      numSpeciesSlider.value = count;
      numSpeciesValue.textContent = count;
    }
    
    // Update species glow control
    if (this.speciesGlowControl) {
      this.speciesGlowControl.updateSpeciesList();
    }
  }

  expandMatrix(matrix, newSize, defaultValue) {
    const result = Array(newSize).fill().map(() => Array(newSize).fill(defaultValue));
    const oldSize = matrix.length;
    for (let i = 0; i < Math.min(oldSize, newSize); i++) {
      for (let j = 0; j < Math.min(oldSize, newSize); j++) {
        result[i][j] = matrix[i][j];
      }
    }
    return result;
  }

  shrinkMatrix(matrix, newSize) {
    return matrix.slice(0, newSize).map(row => row.slice(0, newSize));
  }

  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  updateSpeciesList() {
    const container = this.modal.querySelector('#species-list');
    container.innerHTML = '';
    
    this.colorPickers = [];
    
    this.currentPreset.species.definitions.forEach((species, index) => {
      const speciesDiv = document.createElement('div');
      speciesDiv.className = 'species-item';
      
      const colorPicker = new ColorPicker((color) => {
        this.currentPreset.species.definitions[index].color = color;
        // Update particle system species color in real-time
        if (this.particleSystem.species[index]) {
          this.particleSystem.species[index].color = color;
        }
        if (this.activeTab === 'layout') {
          this.startPositionEditor.setSpecies(this.currentPreset.species.definitions);
        }
        this.markChanged();
      });
      
      colorPicker.setColor(species.color);
      
      speciesDiv.innerHTML = `
        <div class="species-header">
          <input type="text" class="input species-name" value="${species.name}" data-index="${index}">
          <div class="species-color-picker" id="color-picker-${index}"></div>
        </div>
        <div class="control-group">
          <label>
            Count
            <span class="value-display" id="species-${index}-count">${species.particleCount}</span>
          </label>
          <input type="range" class="range-slider species-particle-count" data-index="${index}" 
                 min="1" max="1000" value="${species.particleCount}">
        </div>
      `;
      
      container.appendChild(speciesDiv);
      speciesDiv.querySelector(`#color-picker-${index}`).appendChild(colorPicker.element);
      this.colorPickers.push(colorPicker);
      
      speciesDiv.querySelector('.species-name').addEventListener('input', (e) => {
        this.currentPreset.species.definitions[index].name = e.target.value;
        this.markChanged();
      });
      
      speciesDiv.querySelector('.species-particle-count').addEventListener('input', (e) => {
        const count = parseInt(e.target.value);
        this.currentPreset.species.definitions[index].particleCount = count;
        speciesDiv.querySelector(`#species-${index}-count`).textContent = count;
        
        // Apply the change to the particle system immediately
        this.particleSystem.species[index].particleCount = count;
        this.particleSystem.initializeParticles();
        
        // Update main UI total particle count
        const totalParticles = this.currentPreset.species.definitions.reduce((sum, spec) => sum + spec.particleCount, 0);
        const totalDisplay = document.getElementById('total-particles');
        if (totalDisplay) {
          totalDisplay.textContent = totalParticles;
        }
        
        this.markChanged();
      });
    });
  }

  open(presetKey = null) {
    this.currentPresetKey = presetKey;
    if (presetKey && this.presetManager.getPreset(presetKey)) {
      this.currentPreset = JSON.parse(JSON.stringify(this.presetManager.getPreset(presetKey)));
    } else if (presetKey === '' || presetKey === null) {
      // Empty string or null means "Custom" - export current state
      this.currentPreset = this.particleSystem.exportPreset();
      this.currentPresetKey = null;
    } else {
      this.currentPreset = this.presetManager.createDefaultPreset();
    }
    
    this.loadPresetToUI();
    this.updateButtonStates();
    this.overlay.style.display = 'flex';
    this.isOpen = true;
    this.hasChanges = false;
    this.switchTab('species');
    this.updateSaveStatus('');
    
    // Enable paste button if there are copied settings
    if (window.mainUI && window.mainUI.copiedSettings) {
      this.enablePaste(window.mainUI.copiedSettings);
    } else {
      this.enablePaste(null);
    }
  }

  updateButtonStates() {
    const saveBtn = this.modal.querySelector('.preset-btn-save');
    const saveNewBtn = this.modal.querySelector('.preset-btn-save-new');
    const deleteBtn = this.modal.querySelector('.preset-btn-delete');
    const builtInPresets = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis'];
    const isBuiltIn = builtInPresets.includes(this.currentPresetKey);
    const isNew = !this.currentPresetKey;
    
    // Save button - always stays "Save" but behavior changes
    saveBtn.textContent = 'Save';
    
    if (isNew) {
      saveBtn.title = 'Save as new preset (no current preset to update)';
      deleteBtn.disabled = true;
      deleteBtn.title = 'Cannot delete unsaved preset';
    } else if (isBuiltIn) {
      saveBtn.title = 'Cannot overwrite built-in preset - will save as new instead';
      deleteBtn.disabled = false;
      deleteBtn.title = 'Delete this built-in preset';
    } else {
      saveBtn.title = 'Save changes to current preset';
      deleteBtn.disabled = false;
      deleteBtn.title = 'Delete this preset';
    }
    
    // Save as New button - always available
    saveNewBtn.title = 'Create a new preset copy';
  }

  close() {
    if (this.hasChanges) {
      this.autoSave();
    }
    this.overlay.style.display = 'none';
    this.isOpen = false;
    this.currentPresetKey = null;
    clearTimeout(this.autoSaveTimeout);
  }
  
  markChanged() {
    this.hasChanges = true;
    
    // Check if it's a built-in preset
    const builtInPresets = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis'];
    if (builtInPresets.includes(this.currentPresetKey)) {
      this.updateSaveStatus('Modified built-in preset (save as new)');
    } else {
      this.updateSaveStatus('Changed (auto-saving...)');
    }
    
    // Update button states in case preset type changed
    this.updateButtonStates();
    
    // Clear existing timeout
    clearTimeout(this.autoSaveTimeout);
    
    // Set new timeout for auto-save
    this.autoSaveTimeout = setTimeout(() => {
      this.autoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }
  
  async autoSave() {
    if (!this.hasChanges || !this.currentPresetKey) {
      return;
    }
    
    // Don't auto-save built-in presets
    const builtInPresets = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'];
    if (builtInPresets.includes(this.currentPresetKey)) {
      this.updateSaveStatus('Built-in preset (save as new)');
      return;
    }
    
    try {
      const preset = this.getPresetFromUI();
      await this.presetManager.savePreset(this.currentPresetKey, preset);
      this.hasChanges = false;
      this.updateSaveStatus('Saved ✓');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (!this.hasChanges) {
          this.updateSaveStatus('');
        }
      }, 3000);
    } catch (error) {
      this.updateSaveStatus('Save failed!');
    }
  }
  
  updateSaveStatus(message) {
    const statusEl = this.modal.querySelector('.preset-save-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.color = message.includes('✓') ? '#4a9eff' : 
                            message.includes('failed') ? '#ff4444' : '#888';
    }
  }

  loadPresetToUI() {
    this.modal.querySelector('.preset-name-input').value = this.currentPreset.name;
    
    this.modal.querySelector('#species-count').value = this.currentPreset.species.count;
    this.modal.querySelector('#species-count-value').textContent = this.currentPreset.species.count;
    
    this.modal.querySelector('#modal-blur').value = this.currentPreset.visual.blur;
    this.modal.querySelector('#blur-value').textContent = this.currentPreset.visual.blur;
    this.modal.querySelector('#particle-size').value = this.currentPreset.visual.particleSize;
    this.modal.querySelector('#particle-size-value').textContent = this.currentPreset.visual.particleSize;
    this.modal.querySelector('#trail-enabled').checked = this.currentPreset.visual.trailEnabled;
    this.modal.querySelector('#background-color').value = this.currentPreset.visual.backgroundColor || '#000000';
    
    this.modal.querySelector('#modal-friction').value = this.currentPreset.physics.friction;
    this.modal.querySelector('#modal-friction-value').textContent = this.currentPreset.physics.friction;
    this.modal.querySelector('#modal-wall-damping').value = this.currentPreset.physics.wallDamping;
    this.modal.querySelector('#wall-damping-value').textContent = this.currentPreset.physics.wallDamping;
    this.modal.querySelector('#force-factor').value = this.currentPreset.physics.forceFactor;
    this.modal.querySelector('#force-factor-value').textContent = this.currentPreset.physics.forceFactor;
    this.modal.querySelector('#modal-collision-radius').value = this.currentPreset.physics.collisionRadius;
    this.modal.querySelector('#collision-radius-value').textContent = this.currentPreset.physics.collisionRadius;
    this.modal.querySelector('#modal-social-radius').value = this.currentPreset.physics.socialRadius;
    this.modal.querySelector('#social-radius-value').textContent = this.currentPreset.physics.socialRadius;
    
    this.updateSpeciesList();
    this.startPositionEditor.setSpecies(this.currentPreset.species.definitions);
    
    // Load force matrix
    if (this.currentPreset.forces && this.currentPreset.forces.social) {
      this.forceEditor.setForceMatrix(this.currentPreset.forces.social);
      this.forceEditor.setSpecies(this.currentPreset.species.definitions);
    }
    
    // Update species glow control
    if (this.speciesGlowControl) {
      this.speciesGlowControl.updateFromParticleSystem();
    }
  }

  getPresetFromUI() {
    // Get the current state from the particle system
    const preset = this.particleSystem.exportPreset();
    
    // Override with the preset name from the modal
    preset.name = this.modal.querySelector('.preset-name-input').value;
    
    // Update specific values that might have been modified in the modal
    const speciesCountInput = this.modal.querySelector('#species-count');
    if (speciesCountInput) {
      preset.species.count = parseInt(speciesCountInput.value);
    }
    
    // Update species-specific properties from modal UI
    this.updateSpeciesPropertiesFromUI(preset);
    
    // Update visual settings from modal if they exist
    const modalBlur = this.modal.querySelector('#modal-blur');
    if (modalBlur) {
      preset.visual.blur = parseFloat(modalBlur.value);
    }
    
    const particleSize = this.modal.querySelector('#particle-size');
    if (particleSize) {
      preset.visual.particleSize = parseFloat(particleSize.value);
    }
    
    const trailEnabled = this.modal.querySelector('#trail-enabled');
    if (trailEnabled) {
      preset.visual.trailEnabled = trailEnabled.checked;
    }
    
    const backgroundColor = this.modal.querySelector('#background-color');
    if (backgroundColor) {
      preset.visual.backgroundColor = backgroundColor.value;
    }
    
    // Update physics settings from modal if they exist
    const modalFriction = this.modal.querySelector('#modal-friction');
    if (modalFriction) {
      preset.physics.friction = parseFloat(modalFriction.value);
    }
    
    const modalWallDamping = this.modal.querySelector('#modal-wall-damping');
    if (modalWallDamping) {
      preset.physics.wallDamping = parseFloat(modalWallDamping.value);
    }
    
    const forceFactor = this.modal.querySelector('#force-factor');
    if (forceFactor) {
      preset.physics.forceFactor = parseFloat(forceFactor.value);
    }
    
    const modalCollisionRadius = this.modal.querySelector('#modal-collision-radius');
    if (modalCollisionRadius) {
      // Update both the single value and the matrix for UI compatibility
      preset.physics.collisionRadiusValue = parseFloat(modalCollisionRadius.value);
      // Don't overwrite the matrix - keep the existing matrix structure
    }
    
    const modalSocialRadius = this.modal.querySelector('#modal-social-radius');
    if (modalSocialRadius) {
      // Update both the single value and the matrix for UI compatibility
      preset.physics.socialRadiusValue = parseFloat(modalSocialRadius.value);
      // Don't overwrite the matrix - keep the existing matrix structure
    }
    
    // Update start positions from editor if available
    if (this.startPositionEditor) {
      const positions = this.startPositionEditor.getPositions();
      positions.forEach((pos, index) => {
        if (preset.species.definitions[index]) {
          preset.species.definitions[index].startPosition = pos;
        }
      });
    }
    
    // Update force matrix from editor if available
    if (this.forceEditor && this.forceEditor.forceMatrix) {
      preset.forces.social = this.forceEditor.forceMatrix;
    }
    
    // Update effects from modal UI
    this.updateEffectsFromUI(preset);
    
    // Update synth assignments from main UI
    this.updateSynthAssignmentsFromUI(preset);
    
    return preset;
  }
  
  updateSpeciesPropertiesFromUI(preset) {
    // Update species colors, names, sizes, opacity, and other properties from modal UI
    const speciesList = this.modal.querySelector('#species-list');
    if (!speciesList) return;
    
    const speciesContainers = speciesList.querySelectorAll('.species-container');
    speciesContainers.forEach((container, index) => {
      if (!preset.species.definitions[index]) return;
      
      // Update species name
      const nameInput = container.querySelector('.species-name-input');
      if (nameInput) {
        preset.species.definitions[index].name = nameInput.value;
      }
      
      // Update species color from color picker
      const colorInput = container.querySelector('.species-color-input');
      if (colorInput) {
        preset.species.definitions[index].color = this.particleSystem.hexToRgb(colorInput.value);
      }
      
      // Update species size
      const sizeInput = container.querySelector('.species-size-input');
      if (sizeInput) {
        preset.species.definitions[index].size = parseFloat(sizeInput.value);
      }
      
      // Update species opacity
      const opacityInput = container.querySelector('.species-opacity-input');
      if (opacityInput) {
        preset.species.definitions[index].opacity = parseFloat(opacityInput.value);
      }
      
      // Update particle count
      const particleCountInput = container.querySelector('.species-particles-input');
      if (particleCountInput) {
        preset.species.definitions[index].particleCount = parseInt(particleCountInput.value);
      }
      
      // Update glow settings
      const glowSizeInput = container.querySelector('.species-glow-size-input');
      if (glowSizeInput) {
        preset.species.definitions[index].glowSize = parseFloat(glowSizeInput.value);
      }
      
      const glowIntensityInput = container.querySelector('.species-glow-intensity-input');
      if (glowIntensityInput) {
        preset.species.definitions[index].glowIntensity = parseFloat(glowIntensityInput.value);
      }
    });
  }
  
  updateEffectsFromUI(preset) {
    // Update halo effects
    const haloEnabled = this.modal.querySelector('#halo-enabled');
    if (haloEnabled) {
      preset.effects.haloEnabled = haloEnabled.checked;
    }
    
    const haloIntensity = this.modal.querySelector('#halo-intensity');
    if (haloIntensity) {
      preset.effects.haloIntensity = parseFloat(haloIntensity.value);
    }
    
    const haloRadius = this.modal.querySelector('#halo-radius');
    if (haloRadius) {
      preset.effects.haloRadius = parseFloat(haloRadius.value);
    }
    
    // Update trail effects
    const trailEnabled = this.modal.querySelector('#trail-enabled');
    if (trailEnabled) {
      preset.effects.trailEnabled = trailEnabled.checked;
    }
    
    // Update species glow arrays from particle system
    if (this.particleSystem.speciesGlowSize && this.particleSystem.speciesGlowIntensity) {
      preset.effects.speciesGlowArrays = {
        sizes: [...this.particleSystem.speciesGlowSize.slice(0, this.particleSystem.numSpecies)],
        intensities: [...this.particleSystem.speciesGlowIntensity.slice(0, this.particleSystem.numSpecies)]
      };
      preset.effects.speciesGlowEnabled = preset.effects.speciesGlowArrays.intensities.some(i => i > 0);
    }
  }
  
  updateSynthAssignmentsFromUI(preset) {
    // Get synth assignments from main UI
    const mainUI = window.mainUI;
    if (mainUI && mainUI.synthAssignments) {
      preset.synthAssignments = { ...mainUI.synthAssignments };
    }
  }

  apply() {
    const preset = this.getPresetFromUI();
    this.particleSystem.loadFullPreset(preset);
    
    // Update the main UI to reflect the new values
    if (window.updateUIFromPreset) {
      window.updateUIFromPreset(this.particleSystem);
    }
    
    // Note: Apply does NOT save the preset - just applies changes temporarily
  }

  async save() {
    if (!this.currentPresetKey) {
      // If no preset key, treat as "Save as New"
      return this.saveAsNew();
    }
    
    // Check if it's a built-in preset
    const builtInPresets = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'];
    if (builtInPresets.includes(this.currentPresetKey)) {
      // Can't save over built-in presets, must save as new
      return this.saveAsNew();
    }
    
    try {
      const preset = this.getPresetFromUI();
      await this.presetManager.savePreset(this.currentPresetKey, preset);
      this.hasChanges = false;
      this.updateSaveStatus('Saved ✓');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (!this.hasChanges) {
          this.updateSaveStatus('');
        }
      }, 3000);
    } catch (error) {
      this.updateSaveStatus('Save failed!');
    }
  }

  async saveAsNew() {
    const preset = this.getPresetFromUI();
    const key = this.presetManager.generateUniqueKey(preset.name);
    await this.presetManager.savePreset(key, preset);
    
    // Switch to editing the new preset
    this.currentPresetKey = key;
    this.hasChanges = false;
    
    if (window.updatePresetSelector) {
      window.updatePresetSelector();
      // Update the selector to show the new preset
      const selector = document.getElementById('preset-selector');
      if (selector) {
        selector.value = key;
        // Save as the last selected preset
        localStorage.setItem('lastSelectedPreset', key);
      }
    }
    
    this.updateSaveStatus(`Saved as: ${preset.name} ✓`);
    setTimeout(() => {
      this.updateSaveStatus('');
    }, 3000);
  }

  
  async deletePreset() {
    if (!this.currentPresetKey) {
      alert('No preset selected to delete');
      return;
    }
    
    const preset = this.presetManager.getPreset(this.currentPresetKey);
    if (!preset) {
      alert('Preset not found');
      return;
    }
    
    // Show warning for built-in presets
    const builtInPresets = ['predatorPrey', 'crystallization', 'vortex', 'symbiosis', 'dreamtime'];
    const isBuiltIn = builtInPresets.includes(this.currentPresetKey);
    
    const message = isBuiltIn 
      ? `Are you sure you want to delete the built-in preset "${preset.name}"?\n\nThis action cannot be undone. The preset will be permanently removed.`
      : `Are you sure you want to delete the preset "${preset.name}"?\n\nThis action cannot be undone.`;
    
    if (confirm(message)) {
      try {
        await this.presetManager.deletePreset(this.currentPresetKey);
        
        // Update the selector
        if (window.updatePresetSelector) {
          window.updatePresetSelector();
        }
        
        // Reset selector to first available preset
        const selector = document.getElementById('preset-selector');
        if (selector && selector.options.length > 0) {
          selector.selectedIndex = 0;
        }
        
        // Close the modal
        this.close();
        
        alert(`Preset "${preset.name}" has been deleted.`);
      } catch (error) {
        alert('Failed to delete preset: ' + error.message);
      }
    }
  }
  
  pasteSettings() {
    // Check if there are copied settings available from MainUI
    const mainUI = window.mainUI;
    if (!mainUI || !mainUI.copiedSettings) {
      alert('No settings copied from Floating UI. Please copy settings first.');
      return;
    }
    
    const settings = mainUI.copiedSettings;
    
    try {
      // Apply the complete preset to the particle system
      this.particleSystem.loadFullPreset(settings);
      
      // Update modal UI to reflect the new settings
      this.syncAllModalElements(settings);
      
      // Update the force editor if on forces tab
      if (this.activeTab === 'forces' && this.forceEditor) {
        this.forceEditor.setForceMatrix(this.particleSystem.socialForce);
        this.forceEditor.updateMatrixView();
      }
      
      // Update the start position editor if on layout tab
      if (this.activeTab === 'layout' && this.startPositionEditor) {
        this.startPositionEditor.setSpecies(this.particleSystem.species);
      }
      
      // Apply UI-specific state
      if (settings.uiState) {
        this.applyUIState(settings.uiState);
      }
      
      // Apply synth assignments to main UI
      if (settings.synthAssignments && mainUI.loadSynthAssignments) {
        mainUI.loadSynthAssignments(settings.synthAssignments);
      }
      
      // Refresh the UI to show the pasted settings
      this.loadPresetToUI();
      this.markChanged();
      
      // Update main UI to reflect changes
      if (mainUI.updateUIFromParticleSystem) {
        mainUI.updateUIFromParticleSystem();
      }
      
      // Show success message
      this.updateSaveStatus('✓ Settings pasted from Floating UI');
      
    } catch (error) {
      console.error('Paste settings error:', error);
      alert('Failed to paste settings: ' + error.message);
    }
  }
  
  syncAllModalElements(settings) {
    // Sync all modal elements with the new settings
    
    // Species count
    if (settings.particles && settings.particles.numSpecies !== this.particleSystem.numSpecies) {
      const speciesCountInput = this.modal.querySelector('#species-count');
      const speciesCountValue = this.modal.querySelector('#species-count-value');
      if (speciesCountInput) {
        speciesCountInput.value = settings.particles.numSpecies;
        if (speciesCountValue) {
          speciesCountValue.textContent = settings.particles.numSpecies;
        }
        this.updateSpeciesCount(settings.particles.numSpecies);
      }
    }
    
    // Physics settings
    if (settings.physics) {
      this.syncToModal('modal-friction', settings.physics.friction);
      this.syncToModal('modal-wall-damping', settings.physics.wallDamping);
      this.syncToModal('force-factor', settings.physics.forceFactor);
      this.syncToModal('modal-collision-radius', settings.physics.collisionRadiusValue || settings.physics.collisionRadius);
      this.syncToModal('modal-social-radius', settings.physics.socialRadiusValue || settings.physics.socialRadius);
    }
    
    // Visual settings
    if (settings.visual) {
      this.syncToModal('background-color', settings.visual.backgroundColor);
      this.syncToModal('particle-size', settings.visual.particleSize);
      this.syncToModal('modal-blur', settings.visual.blur);
      this.syncToModal('trail-enabled', settings.visual.trailEnabled);
    }
    
    // Effects settings
    if (settings.effects) {
      this.syncToModal('trail-enabled', settings.effects.trailEnabled);
      
      // Halo settings
      if (settings.effects.haloEnabled !== undefined) {
        this.particleSystem.renderMode = settings.effects.haloEnabled ? 'dreamtime' : 'normal';
        this.syncToModal('halo-enabled', settings.effects.haloEnabled);
        this.syncToModal('halo-intensity', settings.effects.haloIntensity);
        this.syncToModal('halo-radius', settings.effects.haloRadius);
      }
    }
  }
  
  applyUIState(uiState) {
    // Apply UI-specific state that's not part of the particle system
    
    // Species glow state
    if (uiState.speciesGlowEnabled !== undefined) {
      const glowEnabledCheckbox = this.modal.querySelector('#species-glow-enabled');
      if (glowEnabledCheckbox) {
        glowEnabledCheckbox.checked = uiState.speciesGlowEnabled;
      }
    }
    
    // Force relationship selectors
    if (uiState.fromSpecies !== undefined) {
      const fromSpeciesSelect = this.modal.querySelector('#force-from-species');
      if (fromSpeciesSelect) {
        fromSpeciesSelect.value = uiState.fromSpecies;
      }
    }
    
    if (uiState.toSpecies !== undefined) {
      const toSpeciesSelect = this.modal.querySelector('#force-to-species');
      if (toSpeciesSelect) {
        toSpeciesSelect.value = uiState.toSpecies;
      }
    }
  }
  
  syncToModal(elementId, value) {
    const element = this.modal.querySelector(`#${elementId}`);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = value;
      } else if (element.type === 'color') {
        element.value = value;
      } else {
        element.value = value;
      }
      
      // Update value displays
      const valueDisplay = this.modal.querySelector(`#${elementId}-value`);
      if (valueDisplay) {
        valueDisplay.textContent = typeof value === 'number' ? value.toFixed(2) : value;
      }
      
      // Sync to particle system
      const syncMapping = {
        'friction': 'friction',
        'wall-damping': 'wall-damping',
        'force-factor': 'force-factor',
        'modal-collision-radius': 'collision-radius',
        'modal-social-radius': 'social-radius',
        'modal-blur': 'blur',
        'particle-size': 'particle-size'
      };
      
      if (syncMapping[elementId]) {
        this.syncToParticleSystem(syncMapping[elementId], value);
        this.syncToMainUI(syncMapping[elementId], value);
      }
    }
  }
  
  enablePaste(copiedSettings) {
    // Enable or disable the paste button based on availability of copied settings
    const pasteButton = this.modal.querySelector('.preset-btn-paste');
    if (pasteButton) {
      if (copiedSettings) {
        pasteButton.disabled = false;
        pasteButton.title = 'Paste settings from Floating UI';
        pasteButton.style.opacity = '1';
      } else {
        pasteButton.disabled = true;
        pasteButton.title = 'No settings copied. Copy settings from Floating UI first.';
        pasteButton.style.opacity = '0.5';
      }
    }
  }
}