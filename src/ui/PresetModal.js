import { DistributionDrawer } from './DistributionDrawer.js';
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
    this.distributionDrawer = null;
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
        <div class="preset-selector-group">
          <label class="preset-selector-label">Preset:</label>
          <select class="select preset-selector" id="modal-preset-selector">
            <option value="">New Preset</option>
          </select>
        </div>
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
                <span class="value-display" id="modal-species-count-value">5</span>
              </label>
              <input type="range" class="range-slider" id="modal-species-count" min="1" max="20" value="5">
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
                <span class="value-display" id="modal-particle-size-value">2</span>
              </label>
              <input type="range" class="range-slider" id="modal-particle-size" min="0.5" max="20" step="0.5" value="2">
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" id="modal-trail-enabled" checked>
                Enable Trails
              </label>
            </div>
            <div class="control-group">
              <label>Background Color:</label>
              <input type="color" id="modal-background-color" value="#000000">
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
                <span class="value-display" id="modal-collision-radius-value">15</span>
              </label>
              <input type="range" class="range-slider" id="modal-collision-radius" min="1" max="100" step="1" value="15">
            </div>
            <div class="control-group">
              <label>
                Social Radius
                <span class="value-display" id="modal-social-radius-value">50</span>
              </label>
              <input type="range" class="range-slider" id="modal-social-radius" min="1" max="500" step="5" value="50">
            </div>
          </div>
        </div>
        
        <div class="preset-tab-content" data-content="layout">
          <div class="layout-controls">
            <h3>Initial Distribution</h3>
            <p>Paint custom distributions or use pattern tools. Each species can have unique starting positions.</p>
            <canvas id="distribution-drawer-canvas" width="400" height="300"></canvas>
            
            <div class="distribution-modal-controls">
              <div class="control-group">
                <label>Species:</label>
                <select class="select" id="modal-distribution-species">
                  <option value="0">Red</option>
                  <option value="1">Green</option>
                  <option value="2">Blue</option>
                  <option value="3">Yellow</option>
                  <option value="4">Purple</option>
                </select>
              </div>
              
              <div class="control-group">
                <label>
                  Brush Size
                  <span class="value-display" id="modal-brush-size-value">25</span>
                </label>
                <input type="range" class="range-slider" id="modal-brush-size" min="5" max="80" value="25">
              </div>
              
              <div class="control-group">
                <label>
                  Opacity
                  <span class="value-display" id="modal-opacity-value">0.7</span>
                </label>
                <input type="range" class="range-slider" id="modal-opacity" min="0.1" max="1.0" step="0.1" value="0.7">
              </div>
              
              <div class="pattern-buttons-modal">
                <button class="btn btn-secondary btn-sm pattern-btn active" data-pattern="draw">✏️ Paint</button>
                <button class="btn btn-secondary btn-sm pattern-btn" data-pattern="erase">🧽 Erase</button>
                <button class="btn btn-secondary btn-sm pattern-btn" data-pattern="cluster">○ Cluster</button>
                <button class="btn btn-secondary btn-sm pattern-btn" data-pattern="ring">⊙ Ring</button>
                <button class="btn btn-secondary btn-sm pattern-btn" data-pattern="grid">⊞ Grid</button>
                <button class="btn btn-secondary btn-sm pattern-btn" data-pattern="random">∴ Random</button>
              </div>
              
              <div class="modal-action-buttons">
                <button class="btn btn-secondary btn-sm" id="modal-clear-distribution">Clear All</button>
                <button class="btn btn-secondary btn-sm" id="modal-apply-distribution">Apply to Particles</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="preset-modal-footer">
        <div class="preset-save-status"></div>
        <div class="footer-actions">
          <button class="btn btn-secondary btn-sm preset-btn-fetch">📥 Fetch Scene Data</button>
          <button class="btn btn-secondary btn-sm preset-btn-delete">Delete</button>
          <button class="btn btn-primary btn-sm preset-btn-save">Save As New</button>
        </div>
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
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        
        .preset-selector-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        
        .preset-selector-label {
          font-size: var(--font-size-md);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }
        
        .preset-selector {
          min-width: 150px;
          font-size: var(--font-size-md);
        }
        
        .preset-name-input {
          flex: 1;
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
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .footer-actions {
          display: flex;
          gap: var(--space-sm);
          align-items: center;
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
    
    // Initialize Force Editor
    const forceCanvas = this.modal.querySelector('#force-editor-canvas');
    this.forceEditor = new ForceEditor(forceCanvas, () => this.markChanged());
    this.forceEditor.setInfoElement(this.modal.querySelector('#force-info'));
    
    // Initialize Distribution Drawer for layout tab (extended version)
    const distributionCanvas = this.modal.querySelector('#distribution-drawer-canvas');
    if (distributionCanvas) {
      this.distributionDrawer = new DistributionDrawer(distributionCanvas, this.particleSystem, {
        compact: false, // Extended version for configuration panel
        onChange: () => this.markChanged()
      });
    }
    
    // Initialize Species Glow Control with modal prefix
    this.speciesGlowControl = new SpeciesGlowControl(this.particleSystem, 'modal-');
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
    
    // Preset dropdown change handler
    this.modal.querySelector('#modal-preset-selector').addEventListener('change', (e) => {
      const newPresetKey = e.target.value;
      
      // Check if there are unsaved changes
      if (this.hasChanges) {
        const confirm = window.confirm('You have unsaved changes. Do you want to switch presets anyway?');
        if (!confirm) {
          // Restore previous selection
          e.target.value = this.currentPresetKey || '';
          return;
        }
      }
      
      // Load the selected preset
      if (newPresetKey) {
        // Get preset from manager (could be local or cloud)
        let preset = this.presetManager.getPreset(newPresetKey);
        
        if (preset) {
          this.currentPresetKey = newPresetKey;
          this.currentPreset = JSON.parse(JSON.stringify(preset));
          this.loadPresetToUI();
          this.updateButtonStates();
          this.hasChanges = false;
          this.updateSaveStatus('');
        }
      } else {
        // New preset selected
        this.currentPresetKey = null;
        this.currentPreset = this.particleSystem.exportPreset();
        this.currentPreset.name = 'New Preset';
        this.loadPresetToUI();
        this.updateButtonStates();
        this.hasChanges = false;
        this.updateSaveStatus('');
      }
    });
    
    this.modal.querySelectorAll('.preset-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
    
    this.modal.querySelector('#modal-species-count').addEventListener('input', (e) => {
      this.modal.querySelector('#modal-species-count-value').textContent = e.target.value;
      this.updateSpeciesCount(parseInt(e.target.value));
      this.markChanged();
    });
    
    const sliders = [
      { id: 'modal-blur', valueId: 'blur-value', syncId: 'blur' },
      { id: 'modal-particle-size', valueId: 'modal-particle-size-value', syncId: 'particle-size' },
      { id: 'modal-friction', valueId: 'modal-friction-value', syncId: 'friction' },
      { id: 'modal-wall-damping', valueId: 'wall-damping-value', syncId: 'wall-damping' },
      { id: 'force-factor', valueId: 'force-factor-value', syncId: 'force-factor' },
      { id: 'modal-collision-radius', valueId: 'modal-collision-radius-value', syncId: 'collision-radius' },
      { id: 'modal-social-radius', valueId: 'modal-social-radius-value', syncId: 'social-radius' }
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
    this.modal.querySelector('.preset-name-input').addEventListener('input', () => {
      this.markChanged();
      this.updateButtonStates(); // Update button text when name changes
    });
    this.modal.querySelector('#modal-trail-enabled').addEventListener('change', (e) => {
      this.particleSystem.trailEnabled = e.target.checked;
      const mainTrailCheckbox = document.getElementById('trails');
      if (mainTrailCheckbox) {
        mainTrailCheckbox.checked = e.target.checked;
      }
      this.markChanged();
    });
    this.modal.querySelector('#modal-background-color').addEventListener('change', (e) => {
      this.particleSystem.backgroundColor = e.target.value;
      const mainBgColor = document.getElementById('background-color-main');
      if (mainBgColor) {
        mainBgColor.value = e.target.value;
      }
      this.markChanged();
    });
    
    this.modal.querySelector('.preset-btn-save').addEventListener('click', () => this.save());
    this.modal.querySelector('.preset-btn-delete').addEventListener('click', () => this.deletePreset());
    this.modal.querySelector('.preset-btn-fetch').addEventListener('click', () => this.fetchCurrentSceneSettings());
    
    // Force preset buttons
    this.modal.querySelectorAll('.force-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.forceEditor.applyForcePreset(btn.dataset.preset);
        this.markChanged();
      });
    });
    
    // Distribution drawer controls for layout tab
    const modalDistributionSpecies = this.modal.querySelector('#modal-distribution-species');
    if (modalDistributionSpecies) {
      modalDistributionSpecies.addEventListener('change', (e) => {
        if (this.distributionDrawer) {
          const speciesId = parseInt(e.target.value);
          this.distributionDrawer.setSpecies(speciesId);
        }
      });
    }
    
    const modalClearDistribution = this.modal.querySelector('#modal-clear-distribution');
    if (modalClearDistribution) {
      modalClearDistribution.addEventListener('click', () => {
        if (this.distributionDrawer) {
          this.distributionDrawer.clear();
          this.markChanged();
        }
      });
    }
    
    const modalApplyDistribution = this.modal.querySelector('#modal-apply-distribution');
    if (modalApplyDistribution) {
      modalApplyDistribution.addEventListener('click', () => {
        if (this.distributionDrawer) {
          this.distributionDrawer.applyToParticleSystem();
          this.markChanged();
        }
      });
    }
    
    // Pattern buttons for distribution drawer
    this.modal.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all pattern buttons
        this.modal.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Set the pattern mode in distribution drawer
        if (this.distributionDrawer) {
          const pattern = btn.dataset.pattern;
          this.distributionDrawer.setMode(pattern);
        }
      });
    });
    
    // Distribution controls (brush size, opacity)
    const modalBrushSize = this.modal.querySelector('#modal-brush-size');
    const modalBrushSizeValue = this.modal.querySelector('#modal-brush-size-value');
    if (modalBrushSize && modalBrushSizeValue) {
      modalBrushSize.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        modalBrushSizeValue.textContent = value;
        if (this.distributionDrawer) {
          this.distributionDrawer.setBrushSize(value);
        }
      });
    }
    
    const modalOpacity = this.modal.querySelector('#modal-opacity');
    const modalOpacityValue = this.modal.querySelector('#modal-opacity-value');
    if (modalOpacity && modalOpacityValue) {
      modalOpacity.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        modalOpacityValue.textContent = value.toFixed(1);
        if (this.distributionDrawer) {
          this.distributionDrawer.setOpacity(value);
        }
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    
    this.modal.querySelectorAll('.preset-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.modal.querySelectorAll('.preset-tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.content === tabName);
    });
    
    if (tabName === 'layout' && this.currentPreset && this.distributionDrawer) {
      // Convert species definitions to distribution data and apply
      this.updateDistributionFromPreset(this.currentPreset.species.definitions);
      // Also update from current particle system state to ensure we have the latest
      this.distributionDrawer.updateFromParticleSystem();
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
    if (this.activeTab === 'layout' && this.distributionDrawer) {
      this.updateDistributionFromPreset(this.currentPreset.species.definitions);
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

  updateDistributionFromPreset(speciesDefinitions) {
    if (!this.distributionDrawer || !speciesDefinitions) return;
    
    // Convert species startPositions to distribution data
    const distributionData = {};
    
    speciesDefinitions.forEach((def, index) => {
      if (def.startPosition && def.startPosition.type === 'custom' && def.startPosition.customPoints) {
        distributionData[index] = def.startPosition.customPoints;
      }
    });
    
    // Apply to distribution drawer
    if (Object.keys(distributionData).length > 0) {
      this.distributionDrawer.importDistribution(distributionData);
    }
  }

  updateModalDistributionSpeciesSelector() {
    const selector = this.modal.querySelector('#modal-distribution-species');
    if (!selector || !this.currentPreset) return;
    
    const currentValue = selector.value;
    selector.innerHTML = '';
    
    const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Cyan', 'Pink', 'Lime', 'Magenta'];
    
    this.currentPreset.species.definitions.forEach((species, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `● ${species.name || colors[index] || `Species ${index + 1}`}`;
      
      // Set color based on species color if available
      if (species.color) {
        const color = `rgb(${species.color.r}, ${species.color.g}, ${species.color.b})`;
        option.style.color = color;
      }
      
      selector.appendChild(option);
    });
    
    // Restore previous value if valid
    if (currentValue && parseInt(currentValue) < this.currentPreset.species.definitions.length) {
      selector.value = currentValue;
    } else {
      selector.value = '0';
    }
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
        // Only update particle system if not loading preset
        if (!this.isLoadingPreset) {
          // Update particle system species color in real-time
          if (this.particleSystem.species[index]) {
            this.particleSystem.species[index].color = color;
          }
          if (this.activeTab === 'layout' && this.distributionDrawer) {
            this.updateDistributionFromPreset(this.currentPreset.species.definitions);
          }
          this.markChanged();
        }
      });
      
      colorPicker.setColor(species.color, true); // Silent mode - don't trigger onChange
      
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
    
    // Update modal distribution species selector
    this.updateModalDistributionSpeciesSelector();
  }


  populatePresetDropdown() {
    const selector = this.modal.querySelector('#modal-preset-selector');
    if (!selector) return;
    
    // Clear existing options
    selector.innerHTML = '<option value="">New Preset</option>';
    
    // No built-in presets - Firebase is the single source of truth
    
    // Add user presets (including cloud presets)
    const userPresets = this.presetManager.getUserPresets();
    userPresets.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.key;
      option.textContent = preset.name;
      selector.appendChild(option);
    });
  }
  
  open(presetKey = null) {
    this.currentPresetKey = presetKey;
    
    // Populate the preset dropdown
    this.populatePresetDropdown();
    
    // Set the dropdown to current preset
    const selector = this.modal.querySelector('#modal-preset-selector');
    if (selector) {
      selector.value = presetKey || '';
    }
    
    // Set loading flag to prevent color updates during initialization
    this.isLoadingPreset = true;
    
    // Always start with the current state to preserve colors and other settings
    this.currentPreset = this.particleSystem.exportPreset();
    
    if (presetKey) {
      let savedPreset = this.presetManager.getPreset(presetKey);
      
      if (savedPreset) {
        // If opening a specific preset, merge its data with current state
        this.currentPreset.name = savedPreset.name;
        // Only load non-visual properties from saved preset to preserve current colors
        if (savedPreset.physics) {
          this.currentPreset.physics = JSON.parse(JSON.stringify(savedPreset.physics));
        }
        if (savedPreset.forces) {
          this.currentPreset.forces = JSON.parse(JSON.stringify(savedPreset.forces));
        }
      }
    } else if (presetKey === '' || presetKey === null) {
      // Empty string or null means "Custom" - keep current state
      this.currentPresetKey = null;
    }
    
    this.loadPresetToUI();
    this.updateButtonStates();
    this.overlay.style.display = 'flex';
    this.isOpen = true;
    this.hasChanges = false;
    this.switchTab('species');
    this.updateSaveStatus('');
    
    // Clear loading flag after UI is loaded
    this.isLoadingPreset = false;
    
  }

  updateButtonStates() {
    const saveBtn = this.modal.querySelector('.preset-btn-save');
    const deleteBtn = this.modal.querySelector('.preset-btn-delete');
    const isNew = !this.currentPresetKey;
    const presetName = this.modal.querySelector('.preset-name-input').value;
    
    // Determine if name has changed from original
    let nameChanged = false;
    if (this.currentPresetKey) {
      const currentPreset = this.presetManager.getPreset(this.currentPresetKey);
      if (currentPreset && currentPreset.name !== presetName) {
        nameChanged = true;
      }
    }
    
    // Save button behavior - clearer naming
    if (isNew || nameChanged) {
      saveBtn.textContent = 'Save As New';
      saveBtn.title = 'Save as new preset';
      deleteBtn.disabled = isNew;
      deleteBtn.title = isNew ? 'No preset selected to delete' : 'Delete current preset';
    } else {
      saveBtn.textContent = 'Update Preset';
      saveBtn.title = 'Update existing preset with changes';
      deleteBtn.disabled = false;
      deleteBtn.title = 'Delete this preset';
    }
  }

  close() {
    if (this.hasChanges) {
      this.autoSave();
    }
    
    // Sync any final changes to main UI before closing
    this.syncToMainUI();
    
    this.overlay.style.display = 'none';
    this.isOpen = false;
    this.currentPresetKey = null;
    clearTimeout(this.autoSaveTimeout);
  }
  
  markChanged() {
    this.hasChanges = true;
    
    this.updateSaveStatus('Changed (auto-saving...)');
    
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
    
    try {
      const preset = this.getPresetFromUI();
      
      // Auto-save should only save to localStorage for temporary state preservation
      // Don't upload "Custom" presets or temporary working states to Firebase
      if (this.isInvalidPresetName(preset.name)) {
        // For Custom/temporary presets, only save locally for session preservation
        await this.presetManager.storage.savePreset(this.currentPresetKey, preset);
        this.hasChanges = false;
        this.updateSaveStatus('Auto-saved locally ✓');
      } else {
        // For named presets, save normally (includes Firebase upload)
        await this.presetManager.savePreset(this.currentPresetKey, preset);
        this.hasChanges = false;
        this.updateSaveStatus('Saved ✓');
      }
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (!this.hasChanges) {
          this.updateSaveStatus('');
        }
      }, 3000);
    } catch (error) {
      this.updateSaveStatus('Auto-save failed!');
      console.error('Auto-save error:', error);
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
    
    this.modal.querySelector('#modal-species-count').value = this.currentPreset.species.count;
    this.modal.querySelector('#modal-species-count-value').textContent = this.currentPreset.species.count;
    
    this.modal.querySelector('#modal-blur').value = this.currentPreset.visual.blur;
    this.modal.querySelector('#blur-value').textContent = this.currentPreset.visual.blur;
    this.modal.querySelector('#modal-particle-size').value = this.currentPreset.visual.particleSize;
    this.modal.querySelector('#modal-particle-size-value').textContent = this.currentPreset.visual.particleSize;
    this.modal.querySelector('#modal-trail-enabled').checked = this.currentPreset.visual.trailEnabled;
    this.modal.querySelector('#modal-background-color').value = this.currentPreset.visual.backgroundColor || '#000000';
    
    this.modal.querySelector('#modal-friction').value = this.currentPreset.physics.friction;
    this.modal.querySelector('#modal-friction-value').textContent = this.currentPreset.physics.friction;
    this.modal.querySelector('#modal-wall-damping').value = this.currentPreset.physics.wallDamping;
    this.modal.querySelector('#wall-damping-value').textContent = this.currentPreset.physics.wallDamping;
    this.modal.querySelector('#force-factor').value = this.currentPreset.physics.forceFactor;
    this.modal.querySelector('#force-factor-value').textContent = this.currentPreset.physics.forceFactor;
    this.modal.querySelector('#modal-collision-radius').value = this.currentPreset.physics.collisionRadius;
    this.modal.querySelector('#modal-collision-radius-value').textContent = this.currentPreset.physics.collisionRadius;
    this.modal.querySelector('#modal-social-radius').value = this.currentPreset.physics.socialRadius;
    this.modal.querySelector('#modal-social-radius-value').textContent = this.currentPreset.physics.socialRadius;
    
    this.updateSpeciesList();
    if (this.distributionDrawer) {
      this.updateDistributionFromPreset(this.currentPreset.species.definitions);
    }
    
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
    const speciesCountInput = this.modal.querySelector('#modal-species-count');
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
    
    const particleSize = this.modal.querySelector('#modal-particle-size');
    if (particleSize) {
      preset.visual.particleSize = parseFloat(particleSize.value);
    }
    
    const trailEnabled = this.modal.querySelector('#modal-trail-enabled');
    if (trailEnabled) {
      preset.visual.trailEnabled = trailEnabled.checked;
    }
    
    const backgroundColor = this.modal.querySelector('#modal-background-color');
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
    
    // Update start positions from distribution drawer if available
    if (this.distributionDrawer) {
      const distribution = this.distributionDrawer.exportDistribution();
      console.log('Distribution data being saved:', distribution);
      
      Object.entries(distribution).forEach(([speciesId, points]) => {
        const index = parseInt(speciesId);
        if (preset.species.definitions[index]) {
          if (points.length > 0) {
            // Calculate center and radius for the preset format
            let centerX = 0, centerY = 0, totalWeight = 0;
            for (const point of points) {
              const weight = point.opacity;
              centerX += point.x * weight;
              centerY += point.y * weight;
              totalWeight += weight;
            }
            if (totalWeight > 0) {
              centerX /= totalWeight;
              centerY /= totalWeight;
              
              let avgRadius = 0;
              for (const point of points) {
                const dist = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
                avgRadius += dist;
              }
              avgRadius /= points.length;
              avgRadius = Math.max(0.05, Math.min(0.4, avgRadius));
              
              preset.species.definitions[index].startPosition = {
                type: 'custom',
                center: { x: centerX, y: centerY },
                radius: avgRadius,
                customPoints: points
              };
              
              console.log(`Saved custom distribution for species ${index}:`, preset.species.definitions[index].startPosition);
            }
          } else {
            // If no custom points, keep existing startPosition or use default
            if (!preset.species.definitions[index].startPosition) {
              preset.species.definitions[index].startPosition = {
                type: 'cluster',
                center: { x: 0.5, y: 0.5 },
                radius: 0.1
              };
            }
          }
        }
      });
      
      // Also sync the distribution data to the particle system for immediate use
      const currentDistribution = this.distributionDrawer.exportDistribution();
      Object.entries(currentDistribution).forEach(([speciesId, points]) => {
        const index = parseInt(speciesId);
        if (this.particleSystem.species[index] && points.length > 0) {
          // Update the particle system's species startPosition
          this.particleSystem.species[index].startPosition = preset.species.definitions[index].startPosition;
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
    const trailEnabled = this.modal.querySelector('#modal-trail-enabled');
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

  
  syncToMainUI() {
    // Sync all changes to the main UI to ensure consistency
    const mainUI = window.mainUI;
    if (!mainUI) return;
    
    // Update main UI distribution drawer with current modal data
    if (mainUI.distributionDrawer && this.distributionDrawer) {
      const distributionData = this.distributionDrawer.exportDistribution();
      if (Object.keys(distributionData).length > 0) {
        mainUI.distributionDrawer.importDistribution(distributionData);
      }
    }
    
    // Update main UI preset selector to match current preset
    const mainPresetSelector = document.getElementById('preset-selector');
    if (mainPresetSelector && this.currentPresetKey) {
      mainPresetSelector.value = this.currentPresetKey;
    }
    
    // Trigger auto-save in main UI if available
    if (mainUI.triggerAutoSave) {
      mainUI.triggerAutoSave();
    }
  }

  async save() {
    try {
      const preset = this.getPresetFromUI();
      
      // Validate preset name - don't allow saving "Custom" presets
      if (this.isInvalidPresetName(preset.name)) {
        this.updateSaveStatus('❌ Cannot save "Custom" presets');
        alert('Cannot save presets named "Custom". Please choose a different name.');
        return;
      }
      
      // Determine if this should be a new preset or update existing
      let saveKey = this.currentPresetKey;
      
      if (this.currentPresetKey) {
        // Check if name has changed - if so, save as new
        const currentPreset = this.presetManager.getPreset(this.currentPresetKey);
        if (currentPreset && currentPreset.name !== preset.name) {
          // Name changed - create new preset with new name
          saveKey = this.presetManager.generateUniqueKey(preset.name);
          console.log(`Name changed from '${currentPreset.name}' to '${preset.name}' - creating new preset`);
        }
      } else {
        // No current preset - definitely new
        saveKey = this.presetManager.generateUniqueKey(preset.name);
      }
      
      await this.presetManager.savePreset(saveKey, preset);
      
      // Update current preset key if we created a new one
      this.currentPresetKey = saveKey;
      
      this.hasChanges = false;
      this.updateSaveStatus('Saved ✓');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (!this.hasChanges) {
          this.updateSaveStatus('');
        }
      }, 3000);
      
      // Force preset list refresh to show changes
      this.populatePresetDropdown();
      this.updateButtonStates();
    } catch (error) {
      console.error('Save failed:', error);
      this.updateSaveStatus('Save failed!');
    }
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
    
    const message = `Are you sure you want to delete the preset "${preset.name}"?\n\nThis action cannot be undone.`;
    
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
  
  fetchCurrentSceneSettings() {
    // Get the current scene state directly from particle system
    // This is more robust than copying/pasting
    try {
      // Export current complete state
      const currentState = this.particleSystem.exportPreset();
      
      // Preserve the current preset name instead of using exported name
      const presetName = this.modal.querySelector('.preset-name-input').value;
      currentState.name = presetName;
      
      // Update the current preset object
      this.currentPreset = currentState;
      
      // Update all UI elements to reflect the current scene
      this.loadPresetToUI();
      
      // Force update the distribution drawer with current particle system state
      if (this.distributionDrawer) {
        this.distributionDrawer.updateFromParticleSystem();
        // If there's existing distribution data in the particle system, import it
        this.updateDistributionFromCurrentSystem();
      }
      
      // Update force editor with current state
      if (this.forceEditor) {
        this.forceEditor.setForceMatrix(this.particleSystem.socialForce);
        this.forceEditor.setSpecies(this.currentPreset.species.definitions);
        this.forceEditor.updateMatrixView();
      }
      
      this.markChanged();
      this.updateSaveStatus('✓ Fetched current scene settings');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (!this.hasChanges) {
          this.updateSaveStatus('');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Fetch scene settings error:', error);
      alert('Failed to fetch scene settings: ' + error.message);
    }
  }

  updateDistributionFromCurrentSystem() {
    // Update distribution drawer with actual particle positions or species start positions
    const distributionData = {};
    
    // Check if we have custom start positions for each species
    for (let i = 0; i < this.particleSystem.numSpecies; i++) {
      if (this.particleSystem.species[i] && this.particleSystem.species[i].startPosition) {
        const startPos = this.particleSystem.species[i].startPosition;
        if (startPos.type === 'custom' && startPos.customPoints) {
          distributionData[i] = startPos.customPoints;
          console.log(`Found custom distribution for species ${i}:`, startPos.customPoints.length, 'points');
        }
      }
    }
    
    // Import the distribution data if we have any
    if (Object.keys(distributionData).length > 0 && this.distributionDrawer) {
      console.log('Importing distribution data for', Object.keys(distributionData).length, 'species');
      this.distributionDrawer.importDistribution(distributionData);
    } else {
      console.log('No custom distribution data found in particle system');
    }
  }


  isInvalidPresetName(name) {
    if (!name || typeof name !== 'string') return true;
    
    // Normalize name for comparison
    const normalizedName = name.trim().toLowerCase();
    
    // Block various forms of "Custom"
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
}