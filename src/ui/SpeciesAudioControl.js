/**
 * SpeciesAudioControl.js - Per-species audio controls UI
 * Controls granular synthesis parameters for each species
 */

// Direct event handling - no helper imports needed

// Helper functions to replace DOMHelpers
const safeAddEventListener = (element, event, handler) => {
  if (element && element.addEventListener) {
    element.addEventListener(event, handler);
  }
};

const safeUpdateElement = (id, content) => {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = content;
  }
};

export class SpeciesAudioControl {
  constructor(audioSystem, speciesIndex) {
    this.audioSystem = audioSystem;
    this.speciesIndex = speciesIndex;
    this.element = null;
    
    // Get synthesizer for this species (with null check)
    this.synth = (audioSystem && audioSystem.getSynthesizer) ? audioSystem.getSynthesizer(speciesIndex) : null;
    
    // Current sample info
    this.currentSampleName = null;
    
    // UI elements
    this.elements = {};
    
    // Set up periodic synth check if not available yet
    if (!this.synth && this.audioSystem) {
      this.synthCheckInterval = setInterval(() => {
        this.checkAndConnectSynth();
      }, 500);
    }
  }
  
  checkAndConnectSynth() {
    if (!this.audioSystem || !this.audioSystem.getSynthesizer) return;
    
    const synth = this.audioSystem.getSynthesizer(this.speciesIndex);
    if (synth && !this.synth) {
      this.synth = synth;
      // Connected to synthesizer
      
      // Update UI to match synth state
      this.updateFromSynth();
      
      // Clear the check interval
      if (this.synthCheckInterval) {
        clearInterval(this.synthCheckInterval);
        this.synthCheckInterval = null;
      }
    }
  }
  
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'species-audio-control';
    
    // Sample loader section
    this.createSampleLoader();
    
    // Waveform display (placeholder)
    this.createWaveformDisplay();
    
    // Grain parameters
    this.createGrainParameters();
    
    // Pitch and tuning
    this.createPitchControls();
    
    // Output controls
    this.createOutputControls();
    
    return this.element;
  }
  
  createSampleLoader() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = 'Sample';
    group.appendChild(label);
    
    // Current sample display
    const sampleDisplay = document.createElement('div');
    sampleDisplay.id = `sample-display-${this.speciesIndex}`;
    sampleDisplay.style.fontSize = '11px';
    sampleDisplay.style.color = 'rgba(255, 255, 255, 0.6)';
    sampleDisplay.style.marginBottom = '8px';
    sampleDisplay.style.wordBreak = 'break-all';
    sampleDisplay.textContent = 'No sample loaded';
    group.appendChild(sampleDisplay);
    
    // Buttons container
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = 'var(--space-xs)';
    
    // Random sample button
    const randomButton = document.createElement('button');
    randomButton.className = 'btn';
    randomButton.textContent = '🎲 Random';
    randomButton.title = 'Load random sample';
    safeAddEventListener(randomButton, 'click', async () => {
      randomButton.disabled = true;
      randomButton.textContent = 'Loading...';
      
      try {
        if (this.audioSystem && this.audioSystem.loadRandomSampleForSpecies) {
          await this.audioSystem.loadRandomSampleForSpecies(this.speciesIndex);
          const sampleData = this.audioSystem.sampleManager?.getSampleForSpecies?.(this.speciesIndex);
          if (sampleData) {
            this.currentSampleName = sampleData.name;
            sampleDisplay.textContent = sampleData.name;
            
            // Update waveform display
            if (sampleData.buffer) {
              this.updateWaveformDisplay(sampleData.buffer);
            }
          }
        } else {
          sampleDisplay.textContent = 'Audio system not ready';
        }
      } catch (error) {
        console.error('Failed to load random sample:', error);
        sampleDisplay.textContent = 'Error loading sample';
      }
      
      randomButton.disabled = false;
      randomButton.textContent = '🎲 Random';
    });
    buttons.appendChild(randomButton);
    
    // Load sample button (file input)
    const loadButton = document.createElement('button');
    loadButton.className = 'btn';
    loadButton.textContent = '📁 Load';
    loadButton.title = 'Load sample from file';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    fileInput.id = `file-input-${this.speciesIndex}`;
    
    safeAddEventListener(loadButton, 'click', () => {
      fileInput.click();
    });
    
    safeAddEventListener(fileInput, 'change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      loadButton.disabled = true;
      loadButton.textContent = 'Loading...';
      
      try {
        if (this.audioSystem && this.audioSystem.sampleManager && this.audioSystem.sampleManager.loadSampleFromFile) {
          await this.audioSystem.sampleManager.loadSampleFromFile(this.speciesIndex, file);
          const sampleData = this.audioSystem.sampleManager.getSampleForSpecies(this.speciesIndex);
          if (sampleData) {
            this.currentSampleName = sampleData.name;
            sampleDisplay.textContent = sampleData.name;
            
            // Update synthesizer
            const synth = this.audioSystem.getSynthesizer ? this.audioSystem.getSynthesizer(this.speciesIndex) : null;
            if (synth && sampleData.buffer) {
              await synth.loadSample(sampleData.buffer, sampleData.name, sampleData.path);
            }
            
            // Update waveform display
            if (sampleData.buffer) {
              this.updateWaveformDisplay(sampleData.buffer);
            }
          }
        } else {
          sampleDisplay.textContent = 'Audio system not ready';
        }
      } catch (error) {
        console.error('Failed to load sample file:', error);
        sampleDisplay.textContent = 'Error: ' + error.message;
      }
      
      loadButton.disabled = false;
      loadButton.textContent = '📁 Load';
      fileInput.value = ''; // Reset file input
    });
    
    buttons.appendChild(loadButton);
    group.appendChild(fileInput);
    
    // Clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'btn';
    clearButton.textContent = '✕';
    clearButton.title = 'Clear sample';
    clearButton.style.width = '40px';
    safeAddEventListener(clearButton, 'click', () => {
      if (this.audioSystem && this.audioSystem.sampleManager) {
        this.audioSystem.sampleManager.clearSampleForSpecies(this.speciesIndex);
        const synth = this.audioSystem.getSynthesizer ? this.audioSystem.getSynthesizer(this.speciesIndex) : null;
        if (synth) {
          synth.clearSample();
        }
      }
      this.currentSampleName = null;
      sampleDisplay.textContent = 'No sample loaded';
      
      // Clear waveform display
      this.clearWaveformDisplay();
    });
    buttons.appendChild(clearButton);
    
    group.appendChild(buttons);
    this.element.appendChild(group);
    
    // Try to display current sample if loaded (with null checks)
    if (this.audioSystem && this.audioSystem.sampleManager && this.audioSystem.sampleManager.getSampleForSpecies) {
      const currentSample = this.audioSystem.sampleManager.getSampleForSpecies(this.speciesIndex);
      if (currentSample) {
        this.currentSampleName = currentSample.name;
        sampleDisplay.textContent = currentSample.name;
        
        // Show waveform if buffer is available
        if (currentSample.buffer) {
          // Delay to ensure canvas is rendered
          setTimeout(() => {
            this.updateWaveformDisplay(currentSample.buffer);
          }, 100);
        }
      }
    }
  }
  
  createWaveformDisplay() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    // Waveform canvas container
    const waveformContainer = document.createElement('div');
    waveformContainer.style.position = 'relative';
    waveformContainer.style.height = '60px';
    waveformContainer.style.background = 'rgba(0, 0, 0, 0.3)';
    waveformContainer.style.border = '1px solid rgba(100, 100, 120, 0.3)';
    waveformContainer.style.borderRadius = '2px';
    waveformContainer.style.overflow = 'hidden';
    
    // Canvas for waveform drawing
    const canvas = document.createElement('canvas');
    canvas.id = `waveform-canvas-${this.speciesIndex}`;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    waveformContainer.appendChild(canvas);
    
    // Placeholder text overlay
    const placeholder = document.createElement('div');
    placeholder.id = `waveform-placeholder-${this.speciesIndex}`;
    placeholder.style.position = 'absolute';
    placeholder.style.top = '50%';
    placeholder.style.left = '50%';
    placeholder.style.transform = 'translate(-50%, -50%)';
    placeholder.style.fontSize = '10px';
    placeholder.style.color = 'rgba(255, 255, 255, 0.3)';
    placeholder.textContent = 'No waveform';
    waveformContainer.appendChild(placeholder);
    
    group.appendChild(waveformContainer);
    this.element.appendChild(group);
    
    // Store canvas reference for updates
    this.waveformCanvas = canvas;
    this.waveformPlaceholder = placeholder;
  }
  
  updateWaveformDisplay(audioBuffer) {
    if (!this.waveformCanvas || !audioBuffer) return;
    
    // Hide placeholder
    if (this.waveformPlaceholder) {
      this.waveformPlaceholder.style.display = 'none';
    }
    
    // Set canvas size
    const rect = this.waveformCanvas.getBoundingClientRect();
    this.waveformCanvas.width = rect.width * window.devicePixelRatio;
    this.waveformCanvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = this.waveformCanvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Get audio data
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / rect.width);
    const amp = rect.height / 2;
    
    // Get species color
    const speciesColors = [
      { r: 255, g: 100, b: 100 },
      { r: 100, g: 255, b: 100 },
      { r: 100, g: 150, b: 255 },
      { r: 255, g: 200, b: 100 },
      { r: 255, g: 100, b: 255 }
    ];
    const color = speciesColors[this.speciesIndex % speciesColors.length];
    
    // Draw waveform
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < rect.width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      const y1 = (1 + min) * amp;
      const y2 = (1 + max) * amp;
      
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    
    ctx.stroke();
    
    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(rect.width, amp);
    ctx.stroke();
  }
  
  clearWaveformDisplay() {
    if (!this.waveformCanvas) return;
    
    const ctx = this.waveformCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
    
    // Show placeholder again
    if (this.waveformPlaceholder) {
      this.waveformPlaceholder.style.display = 'block';
    }
  }
  
  createGrainParameters() {
    // Grain Size
    this.createSliderControl(
      'grain-size',
      'Grain Size',
      10, 500, 100,
      'ms',
      (value) => {
        // Get fresh synth reference on each call
        const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
        if (synth && synth.setGrainSize) {
          synth.setGrainSize(value);
        }
      }
    );
    
    // Grain Density
    this.createSliderControl(
      'grain-density',
      'Grain Density',
      1, 100, 20,
      'gr/s',
      (value) => {
        // Get fresh synth reference on each call
        const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
        if (synth && synth.setGrainDensity) {
          synth.setGrainDensity(value);
        }
      }
    );
    
    // Grain Overlap
    this.createSliderControl(
      'grain-overlap',
      'Grain Overlap',
      10, 90, 50,
      '%',
      (value) => {
        // Get fresh synth reference on each call
        const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
        if (synth && synth.setGrainOverlap) {
          synth.setGrainOverlap(value / 100);
        }
      },
      1
    );
  }
  
  createPitchControls() {
    // Pitch Shift
    this.createSliderControl(
      'pitch-shift',
      'Pitch Shift',
      -24, 24, 0,
      'st',
      (value) => {
        // Get fresh synth reference on each call
        const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
        if (synth && synth.setPitchShift) {
          synth.setPitchShift(value);
        }
      }
    );
    
    // Detune Random
    this.createSliderControl(
      'detune',
      'Detune Random',
      0, 100, 0,
      '¢',
      (value) => {
        // Get fresh synth reference on each call
        const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
        if (synth && synth.setDetune) {
          synth.setDetune(value);
        }
      }
    );
  }
  
  createOutputControls() {
    // Volume control with mute/solo
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.className = 'audio-control-label';
    label.innerHTML = `Volume: <span id="species-volume-${this.speciesIndex}">0</span> dB`;  // Start at 0dB
    group.appendChild(label);
    
    const volumeContainer = document.createElement('div');
    volumeContainer.style.display = 'flex';
    volumeContainer.style.gap = '5px';
    volumeContainer.style.alignItems = 'center';
    
    // Volume slider
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.className = 'range-slider';
    volumeSlider.min = '-60';
    volumeSlider.max = '6';
    volumeSlider.value = '0';  // Start at 0dB to match synth default
    volumeSlider.style.flex = '1';
    
    safeAddEventListener(volumeSlider, 'input', (e) => {
      const value = parseFloat(e.target.value);
      // Get fresh synth reference on each call
      const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
      if (synth && synth.setVolume) {
        synth.setVolume(value);
      }
      safeUpdateElement(`species-volume-${this.speciesIndex}`, value.toFixed(1));
    });
    
    volumeContainer.appendChild(volumeSlider);
    
    // Mute button
    const muteButton = document.createElement('button');
    muteButton.className = 'btn';
    muteButton.textContent = 'M';
    muteButton.title = 'Mute';
    muteButton.style.width = '30px';
    muteButton.style.fontSize = '11px';
    
    safeAddEventListener(muteButton, 'click', () => {
      // Get fresh synth reference on each call
      const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
      if (synth && synth.setMute) {
        const isMuted = muteButton.classList.contains('active');
        synth.setMute(!isMuted);
        muteButton.classList.toggle('active');
      }
    });
    
    volumeContainer.appendChild(muteButton);
    
    // Solo button
    const soloButton = document.createElement('button');
    soloButton.className = 'btn';
    soloButton.textContent = 'S';
    soloButton.title = 'Solo';
    soloButton.style.width = '30px';
    soloButton.style.fontSize = '11px';
    
    safeAddEventListener(soloButton, 'click', () => {
      // Get fresh synth reference on each call
      const synth = this.audioSystem?.getSynthesizer?.(this.speciesIndex);
      if (synth && synth.setSolo) {
        const isSoloed = soloButton.classList.contains('active');
        synth.setSolo(!isSoloed);
        soloButton.classList.toggle('active');
        
        // Handle solo logic (mute all others if soloed)
        if (!isSoloed && this.audioSystem?.synthesizers) {
          // Solo this, mute others
          for (const [index, otherSynth] of this.audioSystem.synthesizers) {
            if (index !== this.speciesIndex) {
              otherSynth.setMute(true);
            }
          }
        } else if (isSoloed && this.audioSystem?.synthesizers) {
          // Unsolo, unmute all
          for (const [index, otherSynth] of this.audioSystem.synthesizers) {
            otherSynth.setMute(false);
          }
        }
      }
    });
    
    volumeContainer.appendChild(soloButton);
    
    group.appendChild(volumeContainer);
    this.element.appendChild(group);
    
    // Store volume slider reference for updates
    this.elements['volume'] = volumeSlider;
  }
  
  createSliderControl(id, label, min, max, defaultValue, unit, onChange, step = 1) {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const labelEl = document.createElement('label');
    labelEl.innerHTML = `
      ${label}
      <span class="value-display" id="${id}-${this.speciesIndex}">${defaultValue}${unit}</span>
    `;
    group.appendChild(labelEl);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'range-slider';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = defaultValue.toString();
    
    safeAddEventListener(slider, 'input', (e) => {
      const value = parseFloat(e.target.value);
      onChange(value);
      const displayValue = step < 1 ? value.toFixed(1) : value.toFixed(0);
      safeUpdateElement(`${id}-${this.speciesIndex}`, `${displayValue}${unit}`);
    });
    
    group.appendChild(slider);
    this.element.appendChild(group);
    
    this.elements[id] = slider;
  }
  
  updateFromSynth() {
    if (!this.audioSystem || !this.audioSystem.getSynthesizer) return;
    const synth = this.audioSystem.getSynthesizer(this.speciesIndex);
    if (!synth) return;
    
    const state = synth.getState();
    
    // Update sliders if they exist
    if (this.elements['grain-size']) {
      this.elements['grain-size'].value = state.grainSize;
      safeUpdateElement(`grain-size-${this.speciesIndex}`, `${state.grainSize}ms`);
    }
    
    if (this.elements['grain-density']) {
      this.elements['grain-density'].value = state.grainDensity;
      safeUpdateElement(`grain-density-${this.speciesIndex}`, `${state.grainDensity}gr/s`);
    }
    
    if (this.elements['grain-overlap']) {
      this.elements['grain-overlap'].value = state.grainOverlap * 100;
      safeUpdateElement(`grain-overlap-${this.speciesIndex}`, `${Math.round(state.grainOverlap * 100)}%`);
    }
    
    if (this.elements['pitch-shift']) {
      this.elements['pitch-shift'].value = state.pitchShift;
      safeUpdateElement(`pitch-shift-${this.speciesIndex}`, `${state.pitchShift}st`);
    }
    
    if (this.elements['detune']) {
      this.elements['detune'].value = state.detune;
      safeUpdateElement(`detune-${this.speciesIndex}`, `${state.detune}¢`);
    }
    
    // Update volume slider if it exists
    if (this.elements['volume']) {
      this.elements['volume'].value = state.volume;
      safeUpdateElement(`species-volume-${this.speciesIndex}`, state.volume.toFixed(1));
    }
  }
  
  destroy() {
    // Clear synth check interval if running
    if (this.synthCheckInterval) {
      clearInterval(this.synthCheckInterval);
      this.synthCheckInterval = null;
    }
    
    if (this.element) {
      this.element.remove();
    }
  }
}