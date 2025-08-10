/**
 * SamplingControlUI.js - UI controls for circular sampling area
 * Includes XY graph for positioning and controls for sampling parameters
 */

import { XYGraph } from './XYGraph.js';

export class SamplingControlUI {
  constructor(audioSystem) {
    this.audioSystem = audioSystem;
    this.element = null;
    this.xyGraph = null;
    
    // Auto-save timeout for debouncing
    this.saveTimeout = null;
    
    // Current values
    this.centerX = 0.5;
    this.centerY = 0.5;
    this.radius = 0.2;
    this.maxParticles = 200;
    this.organizationMode = 'Direct (1:1)';
    
    // UI elements
    this.radiusSlider = null;
    this.maxParticlesSlider = null;
    this.organizationSelect = null;
    this.crosshairToggle = null;
    this.zonesToggle = null;
    
    // Audio-safe update system
    this.pendingUpdates = new Set();
    this.audioSafeUpdateTimer = null;
    this.isUpdating = false;
    this.UPDATE_THROTTLE_MS = 16; // ~60fps max
  }
  
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'sampling-control-ui';
    
    // XY Graph placeholder - will be initialized later
    this.createXYGraphPlaceholder();
    
    // Sampling radius control
    this.createRadiusControl();
    
    // Max particles control
    this.createMaxParticlesControl();
    
    // Grain organization mode
    this.createOrganizationControl();
    
    // Visual overlay controls
    this.createOverlayControls();
    
    // Organization-specific parameters
    this.createOrganizationParams();
    
    return this.element;
  }
  
  createXYGraphPlaceholder() {
    const graphContainer = document.createElement('div');
    graphContainer.className = 'xy-graph-container';
    graphContainer.style.marginBottom = '15px';
    
    // Label
    const label = document.createElement('label');
    label.textContent = 'Sampling Center Position';
    graphContainer.appendChild(label);
    
    // Info text
    const infoText = document.createElement('div');
    infoText.style.fontSize = '10px';
    infoText.style.color = 'rgba(255, 255, 255, 0.5)';
    infoText.style.marginBottom = '5px';
    infoText.textContent = 'Use this graph OR drag the spotlight area on canvas';
    graphContainer.appendChild(infoText);
    
    // Create container for XY graph
    const xyContainer = document.createElement('div');
    xyContainer.id = 'sampling-xy-graph-' + Math.random().toString(36).substr(2, 9);
    xyContainer.style.width = '200px';
    xyContainer.style.height = '200px';
    xyContainer.style.background = 'rgba(0, 0, 0, 0.3)';
    xyContainer.style.border = '1px solid rgba(100, 100, 120, 0.3)';
    xyContainer.style.borderRadius = '4px';
    xyContainer.style.position = 'relative';
    
    // Add temporary placeholder content
    const placeholder = document.createElement('div');
    placeholder.style.position = 'absolute';
    placeholder.style.top = '50%';
    placeholder.style.left = '50%';
    placeholder.style.transform = 'translate(-50%, -50%)';
    placeholder.style.color = 'rgba(255, 255, 255, 0.3)';
    placeholder.style.fontSize = '12px';
    placeholder.textContent = 'Loading...';
    xyContainer.appendChild(placeholder);
    
    graphContainer.appendChild(xyContainer);
    this.element.appendChild(graphContainer);
    
    // Store the container ID for later initialization
    this.xyContainerId = xyContainer.id;
  }
  
  // New method to initialize XY graph after element is in DOM
  initializeXYGraph() {
    if (this.xyGraph || !this.xyContainerId) return;
    
    // Check if container is in DOM
    const container = document.getElementById(this.xyContainerId);
    if (!container) {
      console.warn('XY graph container not found in DOM yet');
      return;
    }
    
    // Clear placeholder content
    container.innerHTML = '';
    container.style.background = 'transparent';
    container.style.border = 'none';
    
    // Now create XY graph with the container in DOM
    this.xyGraph = new XYGraph(this.xyContainerId, {
      width: 200,
      height: 200,
      minX: 0,
      maxX: 1,
      minY: 0,
      maxY: 1,
      labelX: 'X',
      labelY: 'Y',
      showTooltip: true,
      onChange: (value) => {
        // Handle both 1D and 2D values
        if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
          this.centerX = value.x;
          this.centerY = value.y;
        } else {
          this.centerX = value;
          this.centerY = 0.5; // Default Y for 1D case
        }
        
        // Queue audio-safe update instead of immediate update
        this.queueAudioSafeUpdate('center', { x: this.centerX, y: this.centerY });
      }
    });
    
    // Sync with current sampling area position
    if (this.audioSystem && this.audioSystem.samplingArea) {
      this.centerX = this.audioSystem.samplingArea.centerX;
      this.centerY = this.audioSystem.samplingArea.centerY;
      this.radius = this.audioSystem.samplingArea.radius;
      this.maxParticles = this.audioSystem.samplingArea.maxParticles;
      this.organizationMode = this.audioSystem.samplingArea.organizationMode;
    }
    
    // Set initial position
    this.xyGraph.setValue({ x: this.centerX, y: this.centerY });
    
    // Sync UI controls with loaded values
    this.syncControlsWithLoadedValues();
    
    // Listen for sampling area drag events to sync XY graph
    window.addEventListener('samplingAreaMoved', (event) => {
      if (this.xyGraph && event.detail) {
        this.centerX = event.detail.centerX;
        this.centerY = event.detail.centerY;
        this.xyGraph.setValue({ x: this.centerX, y: this.centerY });
      }
    });
    
    // Listen for sampling radius changes to sync slider
    window.addEventListener('samplingRadiusChanged', (event) => {
      if (this.radiusSlider && event.detail) {
        const radiusPercent = Math.round(event.detail.radius * 100);
        this.radiusSlider.value = radiusPercent;
        const valueDisplay = document.getElementById('radius-value');
        if (valueDisplay) {
          valueDisplay.textContent = radiusPercent + '%';
        }
      }
    });
    
    // Listen for style loading events
    window.addEventListener('samplingStyleLoaded', (event) => {
      if (event.detail) {
        this.syncControlsWithStyle(event.detail);
      }
    });
  }
  
  /**
   * Sync UI controls with loaded values from sampling area
   */
  syncControlsWithLoadedValues() {
    setTimeout(() => {
      try {
        // Update radius slider
        if (this.radiusSlider) {
          const radiusPercent = Math.round(this.radius * 100);
          this.radiusSlider.value = radiusPercent;
          const radiusDisplay = document.getElementById('radius-value');
          if (radiusDisplay) {
            radiusDisplay.textContent = radiusPercent + '%';
          }
        }
        
        // Update max particles slider
        if (this.maxParticlesSlider) {
          this.maxParticlesSlider.value = this.maxParticles;
          const maxParticlesDisplay = document.getElementById('max-sampled-value');
          if (maxParticlesDisplay) {
            maxParticlesDisplay.textContent = this.maxParticles.toString();
          }
        }
        
        // Update organization mode dropdown
        if (this.organizationSelect) {
          this.organizationSelect.value = this.organizationMode;
          this.updateOrganizationParams();
        }
        
        console.log('UI controls synced with loaded sampling area values');
      } catch (error) {
        console.warn('Error syncing UI controls with loaded values:', error);
      }
    }, 100); // Small delay to ensure elements are in DOM
  }
  
  /**
   * Audio-safe update system to prevent glitches
   */
  queueAudioSafeUpdate(type, value) {
    this.pendingUpdates.add({ type, value, timestamp: performance.now() });
    
    if (!this.audioSafeUpdateTimer) {
      this.audioSafeUpdateTimer = setTimeout(() => {
        this.processAudioSafeUpdates();
      }, this.UPDATE_THROTTLE_MS);
    }
  }
  
  processAudioSafeUpdates() {
    if (this.isUpdating || this.pendingUpdates.size === 0) return;
    
    this.isUpdating = true;
    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.audioSafeUpdateTimer = null;
    
    // Process all pending updates in a single batch
    requestAnimationFrame(() => {
      try {
        for (const update of updates) {
          this.applyUpdate(update);
        }
      } catch (error) {
        console.warn('Audio-safe update error:', error);
      } finally {
        this.isUpdating = false;
      }
    });
  }
  
  applyUpdate(update) {
    if (!this.audioSystem || !this.audioSystem.samplingArea) return;
    
    switch (update.type) {
      case 'center':
        this.audioSystem.samplingArea.setCenter(update.value.x, update.value.y);
        break;
      case 'radius':
        this.audioSystem.samplingArea.setRadius(update.value);
        break;
      case 'maxParticles':
        this.audioSystem.setMaxParticles(update.value);
        // Also save to sampling area for persistence
        if (this.audioSystem.samplingArea) {
          this.audioSystem.samplingArea.maxParticles = update.value;
          this.audioSystem.samplingArea.debouncedSave();
        }
        break;
      default:
        console.warn('Unknown update type:', update.type);
    }
  }

  /**
   * Auto-save style changes with debouncing
   */
  autoSaveStyle() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce saves by 500ms
    this.saveTimeout = setTimeout(() => {
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.saveStyleToLocalStorage();
      }
    }, 500);
  }
  
  /**
   * Sync UI controls with loaded style
   */
  syncControlsWithStyle(style) {
    // This will be called after UI is built, so we can update controls safely
    setTimeout(() => {
      try {
        // Update spotlight opacity
        const spotlightOpacityValue = document.getElementById('spotlight-opacity-value');
        if (spotlightOpacityValue && style.spotlightOpacity !== undefined) {
          const value = Math.round(style.spotlightOpacity * 100);
          const slider = spotlightOpacityValue.parentElement.previousElementSibling;
          if (slider && slider.type === 'range') {
            slider.value = value;
            spotlightOpacityValue.textContent = value + '%';
          }
        }
        
        // Update feather
        const featherValue = document.getElementById('circle-feather-value');
        if (featherValue && style.circleFeather !== undefined) {
          const slider = featherValue.parentElement.previousElementSibling;
          if (slider && slider.type === 'range') {
            slider.value = style.circleFeather;
            featherValue.textContent = style.circleFeather.toString();
          }
        }
        
        // Update blur amount
        const blurAmountValue = document.getElementById('blur-amount-value');
        if (blurAmountValue && style.backgroundBlurAmount !== undefined) {
          const value = Math.round(style.backgroundBlurAmount * 100);
          const slider = blurAmountValue.parentElement.previousElementSibling;
          if (slider && slider.type === 'range') {
            slider.value = value;
            blurAmountValue.textContent = value + '%';
          }
        }
        
        // Update vignette size
        const vignetteSizeValue = document.getElementById('vignette-size-value');
        if (vignetteSizeValue && style.vignetteSize !== undefined) {
          const value = Math.round(style.vignetteSize * 100);
          const slider = vignetteSizeValue.parentElement.previousElementSibling;
          if (slider && slider.type === 'range') {
            slider.value = value;
            vignetteSizeValue.textContent = value + '%';
          }
        }
        
        // Update vignette intensity
        const vignetteIntensityValue = document.getElementById('vignette-intensity-value');
        if (vignetteIntensityValue && style.vignetteIntensity !== undefined) {
          const value = Math.round(style.vignetteIntensity * 100);
          const slider = vignetteIntensityValue.parentElement.previousElementSibling;
          if (slider && slider.type === 'range') {
            slider.value = value;
            vignetteIntensityValue.textContent = value + '%';
          }
        }
        
        // Update toggle buttons
        if (this.crosshairToggle && style.showCrosshair !== undefined) {
          this.crosshairToggle.classList.toggle('active', style.showCrosshair);
        }
        if (this.zonesToggle && style.showZones !== undefined) {
          this.zonesToggle.classList.toggle('active', style.showZones);
        }
        
        console.log('UI controls synced with saved style');
      } catch (error) {
        console.warn('Error syncing UI controls with style:', error);
      }
    }, 100); // Small delay to ensure elements are in DOM
  }
  
  createRadiusControl() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.innerHTML = 'Sampling Radius <span class="value-display" id="radius-value">20%</span>';
    group.appendChild(label);
    
    this.radiusSlider = document.createElement('input');
    this.radiusSlider.type = 'range';
    this.radiusSlider.className = 'range-slider';
    this.radiusSlider.min = '5';
    this.radiusSlider.max = '50';
    this.radiusSlider.value = '20';
    
    this.radiusSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.radius = value / 100;
      
      // Queue audio-safe update instead of immediate update
      this.queueAudioSafeUpdate('radius', this.radius);
      
      const valueDisplay = document.getElementById('radius-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toString();
      }
    });
    
    group.appendChild(this.radiusSlider);
    this.element.appendChild(group);
  }
  
  createMaxParticlesControl() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.innerHTML = 'Max Particles Sampled <span class="value-display" id="max-sampled-value">200</span>';
    group.appendChild(label);
    
    const hint = document.createElement('div');
    hint.style.fontSize = '10px';
    hint.style.color = 'rgba(255, 255, 255, 0.4)';
    hint.style.marginBottom = '5px';
    hint.textContent = 'Affects CPU usage - lower for better performance';
    group.appendChild(hint);
    
    this.maxParticlesSlider = document.createElement('input');
    this.maxParticlesSlider.type = 'range';
    this.maxParticlesSlider.className = 'range-slider';
    this.maxParticlesSlider.min = '50';
    this.maxParticlesSlider.max = '1000';
    this.maxParticlesSlider.value = '200';
    
    this.maxParticlesSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.maxParticles = value;
      
      // Queue audio-safe update instead of immediate update
      this.queueAudioSafeUpdate('maxParticles', value);
      
      const valueDisplay = document.getElementById('max-sampled-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toString();
      }
    });
    
    group.appendChild(this.maxParticlesSlider);
    this.element.appendChild(group);
  }
  
  createOrganizationControl() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = 'Grain Organization Mode';
    group.appendChild(label);
    
    this.organizationSelect = document.createElement('select');
    this.organizationSelect.className = 'select';
    this.organizationSelect.style.width = '100%';
    this.organizationSelect.style.padding = '4px';
    this.organizationSelect.style.background = 'rgba(100, 100, 120, 0.2)';
    this.organizationSelect.style.border = '1px solid rgba(100, 100, 120, 0.3)';
    this.organizationSelect.style.borderRadius = '4px';
    this.organizationSelect.style.color = '#ffffff';
    
    const modes = [
      'Direct (1:1)',
      'Clustered Amplitude',
      'Density Modulation',
      'Swarm Intelligence',
      'Harmonic Layers',
      'Rhythmic Patterns',
      'Spatial Zones',
      'Chaos Modulation'
    ];
    
    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode;
      this.organizationSelect.appendChild(option);
    });
    
    this.organizationSelect.addEventListener('change', (e) => {
      this.organizationMode = e.target.value;
      if (this.audioSystem && this.audioSystem.setOrganizationMode) {
        this.audioSystem.setOrganizationMode(this.organizationMode);
      }
      // Save organization mode to sampling area for persistence
      if (this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.organizationMode = this.organizationMode;
        this.audioSystem.samplingArea.debouncedSave();
      }
      this.updateOrganizationParams();
    });
    
    group.appendChild(this.organizationSelect);
    
    // Mode description
    const description = document.createElement('div');
    description.id = 'mode-description';
    description.style.fontSize = '11px';
    description.style.color = 'rgba(255, 255, 255, 0.5)';
    description.style.marginTop = '5px';
    description.textContent = 'Each particle directly maps to one grain';
    group.appendChild(description);
    
    this.element.appendChild(group);
  }
  
  createOverlayControls() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = 'Spotlight Controls';
    group.appendChild(label);
    
    // Dark overlay opacity
    const opacityGroup = document.createElement('div');
    opacityGroup.style.marginTop = '10px';
    
    const opacityLabel = document.createElement('label');
    opacityLabel.className = 'audio-control-label';
    opacityLabel.innerHTML = 'Dark Overlay Opacity <span class="value-display" id="spotlight-opacity-value">60%</span>';
    opacityGroup.appendChild(opacityLabel);
    
    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.className = 'range-slider';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = '60';
    
    opacitySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.spotlightOpacity = value / 100;
      }
      const valueDisplay = document.getElementById('spotlight-opacity-value');
      if (valueDisplay) {
        valueDisplay.textContent = value + '%';
      }
      this.autoSaveStyle();
    });
    
    opacityGroup.appendChild(opacitySlider);
    group.appendChild(opacityGroup);
    
    // Circle feather control
    const featherGroup = document.createElement('div');
    featherGroup.style.marginTop = '15px';
    
    const featherLabel = document.createElement('label');
    featherLabel.className = 'audio-control-label';
    featherLabel.innerHTML = 'Circle Feather <span class="value-display" id="circle-feather-value">20</span>';
    featherGroup.appendChild(featherLabel);
    
    const featherSlider = document.createElement('input');
    featherSlider.type = 'range';
    featherSlider.className = 'range-slider';
    featherSlider.min = '0';
    featherSlider.max = '100';
    featherSlider.value = '20';
    
    featherSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.circleFeather = value;
      }
      const valueDisplay = document.getElementById('circle-feather-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toString();
      }
      this.autoSaveStyle();
    });
    
    featherGroup.appendChild(featherSlider);
    group.appendChild(featherGroup);
    
    // Background blur toggle and amount
    const blurGroup = document.createElement('div');
    blurGroup.style.marginTop = '15px';
    
    const blurLabel = document.createElement('label');
    blurLabel.textContent = 'Background Blur';
    blurGroup.appendChild(blurLabel);
    
    const blurToggle = document.createElement('button');
    blurToggle.className = 'btn';
    blurToggle.textContent = 'Off';
    blurToggle.style.width = '100%';
    blurToggle.style.marginBottom = '8px';
    
    blurToggle.addEventListener('click', () => {
      const isActive = blurToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.backgroundBlur = isActive;
      }
      blurToggle.textContent = isActive ? 'On' : 'Off';
      
      // Show/hide blur amount slider
      const blurAmountControl = document.getElementById('blur-amount-control');
      if (blurAmountControl) {
        blurAmountControl.style.display = isActive ? 'block' : 'none';
      }
      this.autoSaveStyle();
    });
    
    blurGroup.appendChild(blurToggle);
    
    // Blur amount slider (initially hidden)
    const blurAmountControl = document.createElement('div');
    blurAmountControl.id = 'blur-amount-control';
    blurAmountControl.style.display = 'none';
    blurAmountControl.style.marginTop = '8px';
    
    const blurAmountLabel = document.createElement('label');
    blurAmountLabel.className = 'audio-control-label';
    blurAmountLabel.innerHTML = 'Blur Amount <span class="value-display" id="blur-amount-value">50%</span>';
    blurAmountControl.appendChild(blurAmountLabel);
    
    const blurAmountSlider = document.createElement('input');
    blurAmountSlider.type = 'range';
    blurAmountSlider.className = 'range-slider';
    blurAmountSlider.min = '0';
    blurAmountSlider.max = '100';
    blurAmountSlider.value = '50';
    
    blurAmountSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.backgroundBlurAmount = value / 100;
      }
      const valueDisplay = document.getElementById('blur-amount-value');
      if (valueDisplay) {
        valueDisplay.textContent = value + '%';
      }
      this.autoSaveStyle();
    });
    
    blurAmountControl.appendChild(blurAmountSlider);
    blurGroup.appendChild(blurAmountControl);
    group.appendChild(blurGroup);
    
    // Crosshair toggle (keep this one)
    const extraControls = document.createElement('div');
    extraControls.style.marginTop = '15px';
    extraControls.style.display = 'flex';
    extraControls.style.gap = 'var(--space-xs)';
    
    this.crosshairToggle = document.createElement('button');
    this.crosshairToggle.className = 'btn'; // Not active by default
    this.crosshairToggle.textContent = 'Crosshair';
    this.crosshairToggle.addEventListener('click', () => {
      const isActive = this.crosshairToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.showCrosshair = isActive;
      }
      this.autoSaveStyle();
    });
    extraControls.appendChild(this.crosshairToggle);
    
    // Zones toggle
    this.zonesToggle = document.createElement('button');
    this.zonesToggle.className = 'btn';
    this.zonesToggle.textContent = 'Zones';
    this.zonesToggle.addEventListener('click', () => {
      const isActive = this.zonesToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.showZones = isActive;
      }
      this.autoSaveStyle();
    });
    extraControls.appendChild(this.zonesToggle);
    
    group.appendChild(extraControls);
    
    // Add vignette controls
    const vignetteGroup = document.createElement('div');
    vignetteGroup.style.marginTop = '20px';
    
    const vignetteLabel = document.createElement('label');
    vignetteLabel.textContent = 'Vignette Effect';
    vignetteGroup.appendChild(vignetteLabel);
    
    const vignetteToggle = document.createElement('button');
    vignetteToggle.className = 'btn';
    vignetteToggle.textContent = 'Off';
    vignetteToggle.style.width = '100%';
    vignetteToggle.style.marginBottom = '8px';
    
    vignetteToggle.addEventListener('click', () => {
      const isActive = vignetteToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.vignetteEnabled = isActive;
      }
      vignetteToggle.textContent = isActive ? 'On' : 'Off';
      
      // Show/hide vignette controls
      const vignetteControls = document.getElementById('vignette-controls');
      if (vignetteControls) {
        vignetteControls.style.display = isActive ? 'block' : 'none';
      }
      this.autoSaveStyle();
    });
    
    vignetteGroup.appendChild(vignetteToggle);
    
    // Vignette controls (initially hidden)
    const vignetteControls = document.createElement('div');
    vignetteControls.id = 'vignette-controls';
    vignetteControls.style.display = 'none';
    
    // Vignette size control
    const vignetteSizeGroup = document.createElement('div');
    vignetteSizeGroup.style.marginTop = '8px';
    
    const vignetteSizeLabel = document.createElement('label');
    vignetteSizeLabel.className = 'audio-control-label';
    vignetteSizeLabel.innerHTML = 'Vignette Size <span class=\"value-display\" id=\"vignette-size-value\">80%</span>';
    vignetteSizeGroup.appendChild(vignetteSizeLabel);
    
    const vignetteSizeSlider = document.createElement('input');
    vignetteSizeSlider.type = 'range';
    vignetteSizeSlider.className = 'range-slider';
    vignetteSizeSlider.min = '0';
    vignetteSizeSlider.max = '200';
    vignetteSizeSlider.value = '80';
    
    vignetteSizeSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.vignetteSize = value / 100;
      }
      const valueDisplay = document.getElementById('vignette-size-value');
      if (valueDisplay) {
        valueDisplay.textContent = value + '%';
      }
      this.autoSaveStyle();
    });
    
    vignetteSizeGroup.appendChild(vignetteSizeSlider);
    vignetteControls.appendChild(vignetteSizeGroup);
    
    // Vignette intensity control
    const vignetteIntensityGroup = document.createElement('div');
    vignetteIntensityGroup.style.marginTop = '8px';
    
    const vignetteIntensityLabel = document.createElement('label');
    vignetteIntensityLabel.className = 'audio-control-label';
    vignetteIntensityLabel.innerHTML = 'Vignette Intensity <span class=\"value-display\" id=\"vignette-intensity-value\">40%</span>';
    vignetteIntensityGroup.appendChild(vignetteIntensityLabel);
    
    const vignetteIntensitySlider = document.createElement('input');
    vignetteIntensitySlider.type = 'range';
    vignetteIntensitySlider.className = 'range-slider';
    vignetteIntensitySlider.min = '0';
    vignetteIntensitySlider.max = '100';
    vignetteIntensitySlider.value = '40';
    
    vignetteIntensitySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.vignetteIntensity = value / 100;
      }
      const valueDisplay = document.getElementById('vignette-intensity-value');
      if (valueDisplay) {
        valueDisplay.textContent = value + '%';
      }
      this.autoSaveStyle();
    });
    
    vignetteIntensityGroup.appendChild(vignetteIntensitySlider);
    vignetteControls.appendChild(vignetteIntensityGroup);
    
    vignetteGroup.appendChild(vignetteControls);
    group.appendChild(vignetteGroup);
    
    // Add instruction text
    const instructionText = document.createElement('div');
    instructionText.style.fontSize = '11px';
    instructionText.style.color = 'rgba(255, 255, 255, 0.6)';
    instructionText.style.marginTop = '10px';
    instructionText.style.fontStyle = 'italic';
    instructionText.textContent = 'Tip: Click and drag inside the spotlight area to move it around';
    group.appendChild(instructionText);
    
    this.element.appendChild(group);
  }
  
  createOrganizationParams() {
    const container = document.createElement('div');
    container.id = 'organization-params';
    container.className = 'organization-params';
    container.style.display = 'none';
    
    this.element.appendChild(container);
  }
  
  updateOrganizationParams() {
    const container = document.getElementById('organization-params');
    const description = document.getElementById('mode-description');
    
    if (!container || !description) return;
    
    // Clear existing params
    container.innerHTML = '';
    
    // Update description
    const descriptions = {
      'Direct (1:1)': 'Each particle directly maps to one grain',
      'Clustered Amplitude': 'Grouped particles create louder grains',
      'Density Modulation': 'Dense areas trigger grains faster',
      'Swarm Intelligence': 'Collective movement creates patterns',
      'Harmonic Layers': 'Y position creates harmonic series',
      'Rhythmic Patterns': 'Velocity creates rhythmic triggering',
      'Spatial Zones': 'Different behaviors in circle zones',
      'Chaos Modulation': 'System chaos affects grain behavior'
    };
    
    description.textContent = descriptions[this.organizationMode] || '';
    
    // Add mode-specific parameters
    switch (this.organizationMode) {
      case 'Clustered Amplitude':
        this.addClusterParams(container);
        break;
      case 'Harmonic Layers':
        this.addHarmonicParams(container);
        break;
      case 'Rhythmic Patterns':
        this.addRhythmicParams(container);
        break;
      case 'Spatial Zones':
        this.addSpatialParams(container);
        break;
    }
    
    container.style.display = container.children.length > 0 ? 'block' : 'none';
  }
  
  addClusterParams(container) {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.style.marginTop = '10px';
    
    const label = document.createElement('label');
    label.innerHTML = 'Cluster Distance: <span id="cluster-distance">30</span>px';
    group.appendChild(label);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'range-slider';
    slider.min = '10';
    slider.max = '100';
    slider.value = '30';
    
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.setOrganizationParams) {
        this.audioSystem.setOrganizationParams({ clusterThreshold: value });
      }
      const valueDisplay = document.getElementById('cluster-distance');
      if (valueDisplay) {
        valueDisplay.textContent = value.toString();
      }
    });
    
    group.appendChild(slider);
    container.appendChild(group);
  }
  
  addHarmonicParams(container) {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.style.marginTop = '10px';
    
    const label = document.createElement('label');
    label.textContent = 'Active Harmonics';
    group.appendChild(label);
    
    const harmonicButtons = document.createElement('div');
    harmonicButtons.style.display = 'flex';
    harmonicButtons.style.gap = 'var(--space-xs)';
    harmonicButtons.style.flexWrap = 'wrap';
    
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(harmonic => {
      const button = document.createElement('button');
      button.className = 'btn';
      button.textContent = harmonic.toString();
      button.style.width = 'calc(25% - 4px)';
      button.style.marginBottom = '4px';
      
      if ([1, 2, 4].includes(harmonic)) {
        button.classList.add('active');
      }
      
      button.addEventListener('click', () => {
        button.classList.toggle('active');
        const activeHarmonics = [];
        harmonicButtons.querySelectorAll('.active').forEach(btn => {
          activeHarmonics.push(parseInt(btn.textContent));
        });
        if (this.audioSystem && this.audioSystem.setOrganizationParams) {
          this.audioSystem.setOrganizationParams({ activeHarmonics });
        }
      });
      
      harmonicButtons.appendChild(button);
    });
    
    group.appendChild(harmonicButtons);
    container.appendChild(group);
  }
  
  addRhythmicParams(container) {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.style.marginTop = '10px';
    
    const label = document.createElement('label');
    label.textContent = 'Rhythm Grid';
    group.appendChild(label);
    
    const select = document.createElement('select');
    select.className = 'select';
    select.style.width = '100%';
    
    ['1/4', '1/8', '1/16', '1/32', 'Triplets', 'Free'].forEach(grid => {
      const option = document.createElement('option');
      option.value = grid;
      option.textContent = grid;
      if (grid === '1/16') option.selected = true;
      select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
      if (this.audioSystem && this.audioSystem.setOrganizationParams) {
        this.audioSystem.setOrganizationParams({ rhythmicGrid: e.target.value });
      }
    });
    
    group.appendChild(select);
    container.appendChild(group);
  }
  
  addSpatialParams(container) {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.style.marginTop = '10px';
    
    const label = document.createElement('label');
    label.innerHTML = 'Zone Count: <span id="zone-count">4</span>';
    group.appendChild(label);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'range-slider';
    slider.min = '2';
    slider.max = '8';
    slider.value = '4';
    
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.setOrganizationParams) {
        this.audioSystem.setOrganizationParams({ zoneCount: value });
      }
      const valueDisplay = document.getElementById('zone-count');
      if (valueDisplay) {
        valueDisplay.textContent = value.toString();
      }
      
      // Enable zones display
      if (this.zonesToggle && !this.zonesToggle.classList.contains('active')) {
        this.zonesToggle.click();
      }
    });
    
    group.appendChild(slider);
    container.appendChild(group);
  }
  
  destroy() {
    if (this.xyGraph) {
      this.xyGraph.destroy();
    }
    
    // Clean up timers
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    if (this.audioSafeUpdateTimer) {
      clearTimeout(this.audioSafeUpdateTimer);
    }
    
    // Clear pending updates
    this.pendingUpdates.clear();
    
    if (this.element) {
      this.element.remove();
    }
  }
}