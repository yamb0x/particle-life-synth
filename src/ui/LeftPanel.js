/**
 * LeftPanel.js - Audio controls panel (left side)
 * Mirrors the right panel design with CollapsibleSection components
 */

import { SamplingControlUI } from './SamplingControlUI.js';
import { MasterAudioControl } from './MasterAudioControl.js';
import { SpeciesAudioControl } from './SpeciesAudioControl.js';
import { CollapsibleSection } from './CollapsibleSection.js';

export class LeftPanel {
  constructor(audioSystem, particleSystem = null) {
    this.audioSystem = audioSystem;
    this.particleSystem = particleSystem;
    this.container = null;
    
    // UI state
    this.isVisible = true;
    this.activeSpeciesCount = this.particleSystem ? this.particleSystem.numSpecies : 5;
    
    // Components
    this.samplingControl = null;
    this.masterAudioControl = null;
    this.speciesControls = new Map();
    
    // Collapsible sections
    this.sections = new Map();
    
    // Species colors matching particle system
    this.speciesColors = [
      { r: 255, g: 100, b: 100, name: 'Red' },
      { r: 100, g: 255, b: 100, name: 'Green' },
      { r: 100, g: 150, b: 255, name: 'Blue' },
      { r: 255, g: 200, b: 100, name: 'Yellow' },
      { r: 255, g: 100, b: 255, name: 'Purple' }
    ];
  }
  
  setParticleSystem(particleSystem) {
    this.particleSystem = particleSystem;
    
    // Update active species count to match particle system
    if (particleSystem && particleSystem.numSpecies !== this.activeSpeciesCount) {
      this.updateSpeciesCount(particleSystem.numSpecies);
    }
    
    // Update existing species headers
    this.updateSpeciesHeaders();
  }
  
  updateSpeciesHeaders() {
    if (!this.particleSystem) return;
    
    for (let i = 0; i < this.activeSpeciesCount; i++) {
      const section = this.sections.get(`species-${i}`);
      if (section && section.element) {
        const header = section.element.querySelector('.collapsible-header');
        if (header && this.particleSystem.species[i]) {
          const color = this.particleSystem.species[i].color;
          const speciesColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
          const speciesName = this.particleSystem.getSpeciesName(i);
          const speciesLetter = String.fromCharCode(65 + i);
          
          const title = header.querySelector('.collapsible-title');
          if (title) {
            // Add color indicator circle and improved formatting
            title.innerHTML = `
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${speciesColor}; margin-right: 8px; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
              <span style="font-weight: 600;">Species ${speciesLetter}</span>
              <span style="font-weight: 400; opacity: 0.9;"> - ${speciesName.toUpperCase()}</span>
            `;
          }
        }
      }
    }
  }
  
  initialize(containerId = 'left-panel') {
    // Create or get container
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.log('Creating new left panel container');
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'left-panel audio-controls-panel';
      document.body.appendChild(this.container);
    } else {
      console.log('Found existing left panel container');
    }
    
    // Apply styles
    this.applyStyles();
    
    // Create collapsible sections
    this.createCollapsibleSections();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('LeftPanel initialized successfully');
    console.log('Container visible:', this.isVisible);
    console.log('Container element:', this.container);
  }
  
  applyStyles() {
    // Add CSS if not already present
    if (!document.getElementById('left-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'left-panel-styles';
      style.textContent = `
        .left-panel {
          position: fixed;
          left: 10px;
          top: 10px;
          width: 350px;
          max-height: 90vh;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: var(--z-sticky);
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 100, 120, 0.3) transparent;
        }
        
        .left-panel::-webkit-scrollbar {
          width: 8px;
        }
        
        .left-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .left-panel::-webkit-scrollbar-thumb {
          background: rgba(100, 100, 120, 0.3);
          border-radius: 4px;
        }
        
        .left-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 100, 120, 0.5);
        }
        
        .left-panel.hidden {
          display: none;
        }
        
        /* Use exact same panel styles as right panel */
        .left-panel .panel {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          margin-bottom: var(--space-sm);
        }
        
        .left-panel .panel-header {
          padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .left-panel .panel-content {
          padding: var(--space-md);
          min-height: 60px;
        }
        
        /* CRITICAL FIX: Prevent zero-height sections - force proper rendering */
        .left-panel .panel.ui-section {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          min-height: 80px !important;
          height: auto !important;
          margin-bottom: var(--space-sm) !important;
        }
        
        .left-panel .panel-content {
          min-height: 40px !important;
          display: block !important;
        }
        
        .left-panel .sampling-control-ui,
        .left-panel .master-audio-control,
        .left-panel .species-audio-control {
          display: block !important;
          min-height: 40px !important;
          height: auto !important;
          visibility: visible !important;
        }
        
        /* Additional defensive CSS - force rendering of all content */
        .left-panel .control-group,
        .left-panel .audio-control-group {
          display: block !important;
          min-height: 25px !important;
          margin-bottom: var(--space-md) !important;
        }
        
        /* Prevent any collapsing of components */
        .left-panel #sampling-control-content,
        .left-panel #master-audio-content,
        .left-panel #performance-metrics {
          min-height: 20px !important;
          display: block !important;
        }
        
        .left-panel .section-title {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        
        .audio-section {
          margin-bottom: 5px;
        }
        
        /* Use exact control-group styles from right panel */
        .control-group {
          margin-bottom: var(--space-md);
        }
        
        .control-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        
        .value-display {
          color: var(--text-primary);
          font-weight: 500;
        }
        
        /* Use exact range-slider styles from right panel */
        .range-slider {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--bg-tertiary);
          outline: none;
          -webkit-appearance: none;
        }
        
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          border: none;
        }
        
        /* Button styles matching right panel */
        .btn {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .btn:hover {
          background: var(--bg-quaternary);
        }
        
        .btn.active {
          background: var(--primary);
          color: var(--bg-primary);
        }
        
        .audio-control-group {
          margin-bottom: var(--space-md);
        }
        
        .audio-control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
        
        .audio-control-slider {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--bg-tertiary);
          outline: none;
          -webkit-appearance: none;
        }
        
        .audio-control-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .audio-control-buttons {
          display: flex;
          gap: var(--space-xs);
        }
        
        .audio-control-button {
          flex: 1;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .audio-control-button:hover {
          background: var(--bg-quaternary);
        }
        
        .audio-control-button.active {
          background: var(--primary);
          color: var(--bg-primary);
        }
        
        .species-audio-section {
          border-left: 3px solid var(--species-color);
          padding-left: 8px;
          margin-left: -8px;
        }
        
        @media (max-width: 768px) {
          .left-panel {
            width: 280px;
            left: 5px;
            top: 5px;
          }
        }
        
        @media (max-width: 480px) {
          .left-panel {
            width: calc(100% - 20px);
            max-height: 40vh;
            bottom: 10px;
            top: auto;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  createCollapsibleSections() {
    // Clear existing content
    this.container.innerHTML = '';
    
    // Add header panel (matching right panel structure exactly)
    const headerPanel = document.createElement('div');
    headerPanel.className = 'panel main-ui-header';
    headerPanel.innerHTML = `
      <div class="panel-header">
        <h3 class="panel-title">Audio Controls</h3>
        <button class="btn btn-ghost btn-icon" id="audio-minimize-btn" title="Hide controls & audio (C)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 8h8v1H4z"/>
          </svg>
        </button>
      </div>
    `;
    this.container.appendChild(headerPanel);
    
    // Set up minimize button
    const minimizeBtn = headerPanel.querySelector('#audio-minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        this.toggle();
      });
    }
    
    // Create all collapsible sections
    this.createSamplingSectionCollapsible();
    this.createMasterAudioSectionCollapsible();
    this.createPerformanceSectionCollapsible();
    this.createModulationSectionCollapsible();
    this.createSpeciesSectionsCollapsible();
  }
  
  createSamplingSectionCollapsible() {
    // Create sampling control UI first
    this.samplingControl = new SamplingControlUI(this.audioSystem);
    const contentElement = this.samplingControl.createElement();
    
    // Create HTML string from the element
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(contentElement);
    
    const section = new CollapsibleSection({
      id: 'sampling-area',
      title: 'Sampling Area',
      icon: '',
      content: tempDiv.innerHTML,
      defaultOpen: true,
      onInitialize: (container) => {
        // Re-attach the actual element to maintain event listeners
        container.innerHTML = '';
        container.appendChild(contentElement);
        
        // Initialize XY graph with robust timing
        const initializeGraph = () => {
          if (this.samplingControl && this.samplingControl.initializeXYGraph) {
            this.samplingControl.initializeXYGraph();
            return true;
          }
          return false;
        };
        
        // Try immediate initialization, then with animation frame if needed
        if (!initializeGraph()) {
          requestAnimationFrame(() => {
            if (!initializeGraph()) {
              // Final fallback with timeout
              setTimeout(initializeGraph, 50);
            }
          });
        }
      }
    });
    
    this.sections.set('sampling-area', section);
    this.container.appendChild(section.render());
  }
  
  createMasterAudioSectionCollapsible() {
    // Create master audio control UI first
    this.masterAudioControl = new MasterAudioControl(this.audioSystem);
    const contentElement = this.masterAudioControl.createElement();
    
    // Create HTML string from the element
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(contentElement);
    
    const section = new CollapsibleSection({
      id: 'master-audio',
      title: 'Master Audio',
      icon: '',
      content: tempDiv.innerHTML,
      defaultOpen: true,
      onInitialize: (container) => {
        // Re-attach the actual element to maintain event listeners
        container.innerHTML = '';
        container.appendChild(contentElement);
      }
    });
    
    this.sections.set('master-audio', section);
    this.container.appendChild(section.render());
  }
  
  createPerformanceSectionCollapsible() {
    const content = `
      <div class="control-group">
        <label>Quality Preset</label>
        <select class="select" id="quality-preset-select">
          <option value="ultra">Ultra</option>
          <option value="high">High</option>
          <option value="balanced" selected>Balanced</option>
          <option value="performance">Performance</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>
      <div class="control-group">
        <label>
          Max Particles Sampled
          <span class="value-display" id="max-particles-value">200</span>
        </label>
        <input type="range" class="range-slider" id="max-particles-slider" min="50" max="1000" value="200">
      </div>
      <div id="performance-metrics" class="performance-metrics" style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 10px;"></div>
    `;
    
    const section = new CollapsibleSection({
      id: 'performance',
      title: 'Performance',
      icon: '',
      content: content,
      defaultOpen: false,
      onInitialize: (container) => {
        // Set up event listeners
        const qualitySelect = container.querySelector('#quality-preset-select');
        qualitySelect.addEventListener('change', (e) => {
          if (this.audioSystem && this.audioSystem.setPerformanceMode) {
            this.audioSystem.setPerformanceMode(e.target.value);
          }
        });
        
        const particlesSlider = container.querySelector('#max-particles-slider');
        particlesSlider.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          if (this.audioSystem && this.audioSystem.setMaxParticles) {
            this.audioSystem.setMaxParticles(value);
          }
          const valueDisplay = container.querySelector('#max-particles-value');
          if (valueDisplay) {
            valueDisplay.textContent = value.toString();
          }
        });
      }
    });
    
    this.sections.set('performance', section);
    this.container.appendChild(section.render());
  }
  
  createModulationSectionCollapsible() {
    const content = `
      <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px; padding: 10px; text-align: center;">
        Modulation matrix coming soon...
      </div>
    `;
    
    const section = new CollapsibleSection({
      id: 'modulation',
      title: 'Modulation',
      icon: '',
      content: content,
      defaultOpen: false
    });
    
    this.sections.set('modulation', section);
    this.container.appendChild(section.render());
  }
  
  createSpeciesSectionsCollapsible() {
    // Create sections for initial species
    for (let i = 0; i < this.activeSpeciesCount; i++) {
      this.createSpeciesSectionCollapsible(i);
    }
  }
  
  createSpeciesSectionCollapsible(speciesIndex) {
    const speciesLetter = String.fromCharCode(65 + speciesIndex); // A, B, C, D...
    
    // Get actual species color from particle system if available
    let speciesColor;
    let speciesName;
    
    if (this.particleSystem && this.particleSystem.species && this.particleSystem.species[speciesIndex]) {
      const color = this.particleSystem.species[speciesIndex].color;
      speciesColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
      speciesName = this.particleSystem.getSpeciesName(speciesIndex);
    } else {
      // Fallback to default colors
      const speciesData = this.speciesColors[speciesIndex % this.speciesColors.length];
      speciesColor = `rgb(${speciesData.r}, ${speciesData.g}, ${speciesData.b})`;
      speciesName = speciesData.name;
    }
    
    // Create species audio control
    const speciesControl = new SpeciesAudioControl(
      this.audioSystem,
      speciesIndex
    );
    const contentElement = speciesControl.createElement();
    
    // Create HTML string from the element
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(contentElement);
    
    const section = new CollapsibleSection({
      id: `species-${speciesIndex}`,
      title: `Species ${speciesLetter} - ${speciesName}`,
      icon: '',
      content: tempDiv.innerHTML,
      defaultOpen: false,
      onInitialize: (container) => {
        // Re-attach the actual element to maintain event listeners
        container.innerHTML = '';
        container.appendChild(contentElement);
      }
    });
    
    // Apply species section styling  
    const sectionElement = section.render();
    const header = sectionElement.querySelector('.collapsible-header');
    if (header) {
      // Enhanced title with color indicator circle
      const title = header.querySelector('.collapsible-title');
      if (title) {
        title.innerHTML = `
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${speciesColor}; margin-right: 8px; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
          <span style="font-weight: 600;">Species ${speciesLetter}</span>
          <span style="font-weight: 400; opacity: 0.9;"> - ${speciesName.toUpperCase()}</span>
        `;
      }
    }
    
    this.sections.set(`species-${speciesIndex}`, section);
    this.speciesControls.set(speciesIndex, speciesControl);
    this.container.appendChild(sectionElement);
  }
  
  getSpeciesColorRGB(index) {
    return this.speciesColors[index % this.speciesColors.length];
  }
  
  setupEventListeners() {
    // Update performance metrics periodically
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000);
  }
  
  updatePerformanceMetrics() {
    const metrics = this.audioSystem.getPerformanceMetrics();
    const metricsDiv = document.getElementById('performance-metrics');
    
    if (metricsDiv && metrics) {
      metricsDiv.innerHTML = `
        Audio Load: ${(metrics.audioLoad * 100).toFixed(1)}% | 
        Particle FPS: ${(metrics.particleFPS ? metrics.particleFPS.toFixed(1) : '0')} | 
        Active Grains: ${metrics.totalActiveGrains || 0} | 
        Mode: ${metrics.performanceMode || 'balanced'}
      `;
    }
  }
  
  updateSpeciesCount(count) {
    // Add or remove species sections as needed
    if (count > this.activeSpeciesCount) {
      // Add new sections
      for (let i = this.activeSpeciesCount; i < count; i++) {
        this.createSpeciesSectionCollapsible(i);
        
        // Load random audio sample for new species and update display
        if (this.audioSystem && this.audioSystem.loadRandomSampleForSpecies) {
          this.audioSystem.loadRandomSampleForSpecies(i).then(() => {
            // Add delay to ensure everything is properly initialized
            setTimeout(() => {
              const speciesControl = this.speciesControls.get(i);
              if (speciesControl && speciesControl.refreshSampleDisplay) {
                speciesControl.refreshSampleDisplay();
              }
            }, 250);
          }).catch(error => {
            console.warn(`Failed to load sample for species ${i}:`, error);
            // Try to refresh anyway in case the sample loaded but promise failed
            setTimeout(() => {
              const speciesControl = this.speciesControls.get(i);
              if (speciesControl && speciesControl.refreshSampleDisplay) {
                speciesControl.refreshSampleDisplay();
              }
            }, 500);
          });
        }
      }
    } else if (count < this.activeSpeciesCount) {
      // Remove excess sections
      for (let i = count; i < this.activeSpeciesCount; i++) {
        // Clean up species audio control first
        const speciesControl = this.speciesControls.get(i);
        if (speciesControl && speciesControl.destroy) {
          speciesControl.destroy();
        }
        this.speciesControls.delete(i);
        
        // Clean up section
        const section = this.sections.get(`species-${i}`);
        if (section && section.destroy) {
          section.destroy();
        }
        this.sections.delete(`species-${i}`);
      }
    }
    
    this.activeSpeciesCount = count;
    
    // Update headers with new colors and names
    if (this.particleSystem) {
      this.updateSpeciesHeaders();
    }
  }
  
  onPresetChanged() {
    // Called when a preset is loaded to sync everything
    if (!this.particleSystem) return;
    
    const newSpeciesCount = this.particleSystem.numSpecies;
    
    // Update species count if changed
    if (newSpeciesCount !== this.activeSpeciesCount) {
      this.updateSpeciesCount(newSpeciesCount);
    }
    
    // Update all species headers with new colors/names
    this.updateSpeciesHeaders();
    
    // Load random audio samples for all species with display refresh
    if (this.audioSystem && this.audioSystem.loadRandomSamplesForAllSpecies) {
      this.audioSystem.loadRandomSamplesForAllSpecies().then(() => {
        setTimeout(() => this.refreshAllSampleDisplays(), 300);
      }).catch(() => {
        setTimeout(() => this.refreshAllSampleDisplays(), 500);
      });
    } else if (this.audioSystem && this.audioSystem.loadRandomSampleForSpecies) {
      const loadPromises = [];
      for (let i = 0; i < newSpeciesCount; i++) {
        loadPromises.push(this.audioSystem.loadRandomSampleForSpecies(i));
      }
      Promise.all(loadPromises.map(p => p.catch(e => e))).then(() => {
        setTimeout(() => this.refreshAllSampleDisplays(), 300);
      });
    }
  }
  
  refreshAllSampleDisplays() {
    // Force refresh all species sample displays
    for (let i = 0; i < this.activeSpeciesCount; i++) {
      const speciesControl = this.speciesControls.get(i);
      if (speciesControl && speciesControl.refreshSampleDisplay) {
        setTimeout(() => speciesControl.refreshSampleDisplay(), i * 50); // Stagger refreshes
      }
    }
  }
  
  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.isVisible = true;
    }
  }
  
  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.isVisible = false;
    }
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  updateAudioState(isInitialized) {
    // Update UI elements to reflect audio initialization state
    if (isInitialized) {
      console.log('Audio system is now initialized - updating UI');
      
      // Add a visual indicator if needed
      if (this.container) {
        this.container.classList.add('audio-initialized');
      }
      
      // Update any status indicators
      const statusElements = this.container.querySelectorAll('.audio-status');
      statusElements.forEach(el => {
        el.textContent = 'Audio Ready';
        el.classList.add('ready');
      });
    }
  }
  
  destroy() {
    // Clean up all components
    if (this.samplingControl) {
      this.samplingControl.destroy();
    }
    if (this.masterAudioControl) {
      this.masterAudioControl.destroy();
    }
    
    for (const control of this.speciesControls.values()) {
      control.destroy();
    }
    
    // Destroy all collapsible sections
    for (const section of this.sections.values()) {
      section.destroy();
    }
    
    // Remove container
    if (this.container) {
      this.container.remove();
    }
  }
}