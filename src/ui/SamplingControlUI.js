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
    this.overlayToggle = null;
    this.crosshairToggle = null;
    this.zonesToggle = null;
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
        
        // Update the sampling area immediately for visual feedback
        if (this.audioSystem && this.audioSystem.samplingArea) {
          this.audioSystem.samplingArea.setCenter(this.centerX, this.centerY);
        }
      }
    });
    
    // Sync with current sampling area position
    if (this.audioSystem && this.audioSystem.samplingArea) {
      this.centerX = this.audioSystem.samplingArea.centerX;
      this.centerY = this.audioSystem.samplingArea.centerY;
    }
    
    // Set initial position
    this.xyGraph.setValue({ x: this.centerX, y: this.centerY });
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
      if (this.audioSystem && this.audioSystem.setSamplingRadius) {
        this.audioSystem.setSamplingRadius(this.radius);
      }
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
      if (this.audioSystem && this.audioSystem.setMaxParticles) {
        this.audioSystem.setMaxParticles(value);
      }
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
    label.textContent = 'Visual Overlay';
    group.appendChild(label);
    
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = 'var(--space-xs)';
    
    // Overlay toggle
    this.overlayToggle = document.createElement('button');
    this.overlayToggle.className = 'btn active';
    this.overlayToggle.textContent = 'Overlay';
    this.overlayToggle.addEventListener('click', () => {
      const isActive = this.overlayToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.overlayVisible = isActive;
      }
    });
    controls.appendChild(this.overlayToggle);
    
    // Crosshair toggle
    this.crosshairToggle = document.createElement('button');
    this.crosshairToggle.className = 'btn active';
    this.crosshairToggle.textContent = 'Crosshair';
    this.crosshairToggle.addEventListener('click', () => {
      const isActive = this.crosshairToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.showCrosshair = isActive;
      }
    });
    controls.appendChild(this.crosshairToggle);
    
    // Zones toggle
    this.zonesToggle = document.createElement('button');
    this.zonesToggle.className = 'btn';
    this.zonesToggle.textContent = 'Zones';
    this.zonesToggle.addEventListener('click', () => {
      const isActive = this.zonesToggle.classList.toggle('active');
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.showZones = isActive;
      }
    });
    controls.appendChild(this.zonesToggle);
    
    group.appendChild(controls);
    
    // Overlay opacity
    const opacityGroup = document.createElement('div');
    opacityGroup.style.marginTop = '10px';
    
    const opacityLabel = document.createElement('label');
    opacityLabel.className = 'audio-control-label';
    opacityLabel.innerHTML = 'Overlay Opacity <span class="value-display" id="overlay-opacity-value">70%</span>';
    opacityGroup.appendChild(opacityLabel);
    
    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.className = 'range-slider';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = '70';
    
    opacitySlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (this.audioSystem && this.audioSystem.samplingArea) {
        this.audioSystem.samplingArea.overlayOpacity = value / 100;
      }
      const valueDisplay = document.getElementById('overlay-opacity-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toString();
      }
    });
    
    opacityGroup.appendChild(opacitySlider);
    group.appendChild(opacityGroup);
    
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
    
    if (this.element) {
      this.element.remove();
    }
  }
}