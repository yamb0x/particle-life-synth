/**
 * MasterAudioControl.js - Master audio controls UI
 * Controls global audio parameters like master volume, grain density, etc.
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

export class MasterAudioControl {
  constructor(audioSystem) {
    this.audioSystem = audioSystem;
    this.element = null;
    
    // Current values
    this.masterVolume = -6; // dB
    this.globalGrainDensity = 1.0;
    this.globalGrainSize = 1.0;
    
    // UI elements
    this.volumeSlider = null;
    this.densitySlider = null;
    this.sizeSlider = null;
    this.muteButton = null;
    this.levelMeter = null;
  }
  
  createElement() {
    this.element = document.createElement('div');
    this.element.className = 'master-audio-control';
    
    // Master Volume
    this.createVolumeControl();
    
    // Global Grain Settings
    this.createGlobalGrainControls();
    
    // Dynamics Processing
    this.createDynamicsControls();
    
    // Level Meter
    this.createLevelMeter();
    
    return this.element;
  }
  
  createVolumeControl() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.innerHTML = 'Master Volume <span class="value-display" id="master-volume-value">-6dB</span>';
    group.appendChild(label);
    
    const volumeContainer = document.createElement('div');
    volumeContainer.style.display = 'flex';
    volumeContainer.style.gap = '10px';
    volumeContainer.style.alignItems = 'center';
    
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.className = 'range-slider';
    this.volumeSlider.min = '-60';
    this.volumeSlider.max = '6';
    this.volumeSlider.value = '-6';
    this.volumeSlider.style.flex = '1';
    
    this.volumeSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.masterVolume = value;
      if (this.audioSystem && this.audioSystem.setMasterVolume) {
        this.audioSystem.setMasterVolume(value);
      }
      const valueDisplay = document.getElementById('master-volume-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toFixed(1);
      }
    });
    
    volumeContainer.appendChild(this.volumeSlider);
    
    // Mute button
    this.muteButton = document.createElement('button');
    this.muteButton.className = 'btn';
    this.muteButton.textContent = '🔇';
    this.muteButton.title = 'Mute';
    this.muteButton.style.width = '40px';
    this.muteButton.style.fontSize = '16px';
    
    this.muteButton.addEventListener('click', () => {
      if (this.audioSystem && this.audioSystem.toggleMute) {
        this.audioSystem.toggleMute();
      }
      this.muteButton.classList.toggle('active');
      if (this.muteButton.classList.contains('active')) {
        this.muteButton.textContent = '🔊';
      } else {
        this.muteButton.textContent = '🔇';
      }
    });
    
    volumeContainer.appendChild(this.muteButton);
    
    group.appendChild(volumeContainer);
    this.element.appendChild(group);
  }
  
  createGlobalGrainControls() {
    // Global Grain Density
    const densityGroup = document.createElement('div');
    densityGroup.className = 'audio-control-group';
    
    const densityLabel = document.createElement('label');
    densityLabel.className = 'audio-control-label';
    densityLabel.innerHTML = 'Global Grain Density <span class="value-display" id="global-density-value">1.0x</span>';
    densityGroup.appendChild(densityLabel);
    
    this.densitySlider = document.createElement('input');
    this.densitySlider.type = 'range';
    this.densitySlider.className = 'range-slider';
    this.densitySlider.min = '0.5';
    this.densitySlider.max = '2.0';
    this.densitySlider.step = '0.1';
    this.densitySlider.value = '1.0';
    
    this.densitySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.globalGrainDensity = value;
      if (this.audioSystem && this.audioSystem.setGlobalGrainDensity) {
        this.audioSystem.setGlobalGrainDensity(value);
      }
      const valueDisplay = document.getElementById('global-density-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toFixed(1);
      }
    });
    
    densityGroup.appendChild(this.densitySlider);
    this.element.appendChild(densityGroup);
    
    // Global Grain Size
    const sizeGroup = document.createElement('div');
    sizeGroup.className = 'audio-control-group';
    
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'audio-control-label';
    sizeLabel.innerHTML = 'Global Grain Size <span class="value-display" id="global-size-value">1.0x</span>';
    sizeGroup.appendChild(sizeLabel);
    
    this.sizeSlider = document.createElement('input');
    this.sizeSlider.type = 'range';
    this.sizeSlider.className = 'range-slider';
    this.sizeSlider.min = '0.5';
    this.sizeSlider.max = '2.0';
    this.sizeSlider.step = '0.1';
    this.sizeSlider.value = '1.0';
    
    this.sizeSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.globalGrainSize = value;
      if (this.audioSystem && this.audioSystem.setGlobalGrainSize) {
        this.audioSystem.setGlobalGrainSize(value);
      }
      const valueDisplay = document.getElementById('global-size-value');
      if (valueDisplay) {
        valueDisplay.textContent = value.toFixed(1);
      }
    });
    
    sizeGroup.appendChild(this.sizeSlider);
    this.element.appendChild(sizeGroup);
  }
  
  createDynamicsControls() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = 'Dynamics Processing';
    group.appendChild(label);
    
    // Simplified controls - just presets for now
    const presetButtons = document.createElement('div');
    presetButtons.className = 'audio-control-buttons';
    
    const presets = [
      { name: 'Soft', threshold: -30, ratio: 2 },
      { name: 'Normal', threshold: -24, ratio: 4 },
      { name: 'Hard', threshold: -18, ratio: 8 },
      { name: 'Limit', threshold: -12, ratio: 20 }
    ];
    
    presets.forEach((preset, index) => {
      const button = document.createElement('button');
      button.className = 'audio-control-button';
      if (index === 1) button.classList.add('active'); // Normal is default
      button.textContent = preset.name;
      button.style.fontSize = '11px';
      
      button.addEventListener('click', () => {
        // Remove active from all buttons
        presetButtons.querySelectorAll('.audio-control-button').forEach(btn => {
          btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Apply preset
        if (this.audioSystem && this.audioSystem.audioEngine && this.audioSystem.audioEngine.setCompressorSettings) {
          this.audioSystem.audioEngine.setCompressorSettings({
            threshold: preset.threshold,
            ratio: preset.ratio
          });
        }
      });
      
      presetButtons.appendChild(button);
    });
    
    group.appendChild(presetButtons);
    this.element.appendChild(group);
  }
  
  createLevelMeter() {
    const group = document.createElement('div');
    group.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = 'Output Level';
    group.appendChild(label);
    
    // Level meter container
    const meterContainer = document.createElement('div');
    meterContainer.style.height = '20px';
    meterContainer.style.background = 'rgba(0, 0, 0, 0.5)';
    meterContainer.style.border = '1px solid rgba(100, 100, 120, 0.3)';
    meterContainer.style.borderRadius = '2px';
    meterContainer.style.position = 'relative';
    meterContainer.style.overflow = 'hidden';
    
    // Peak meter
    const peakMeter = document.createElement('div');
    peakMeter.id = 'peak-meter';
    peakMeter.style.position = 'absolute';
    peakMeter.style.left = '0';
    peakMeter.style.top = '0';
    peakMeter.style.height = '50%';
    peakMeter.style.width = '0%';
    peakMeter.style.background = 'linear-gradient(to right, #4ECDC4, #45B7D1, #FFA07A, #FF6B6B)';
    peakMeter.style.transition = 'width 0.05s';
    meterContainer.appendChild(peakMeter);
    
    // RMS meter
    const rmsMeter = document.createElement('div');
    rmsMeter.id = 'rms-meter';
    rmsMeter.style.position = 'absolute';
    rmsMeter.style.left = '0';
    rmsMeter.style.bottom = '0';
    rmsMeter.style.height = '50%';
    rmsMeter.style.width = '0%';
    rmsMeter.style.background = 'rgba(78, 205, 196, 0.5)';
    rmsMeter.style.transition = 'width 0.1s';
    meterContainer.appendChild(rmsMeter);
    
    // Level text
    const levelText = document.createElement('div');
    levelText.id = 'level-text';
    levelText.style.position = 'absolute';
    levelText.style.right = '5px';
    levelText.style.top = '50%';
    levelText.style.transform = 'translateY(-50%)';
    levelText.style.fontSize = '10px';
    levelText.style.color = 'rgba(255, 255, 255, 0.7)';
    levelText.textContent = '-∞ dB';
    meterContainer.appendChild(levelText);
    
    group.appendChild(meterContainer);
    this.element.appendChild(group);
    
    // Start level meter updates
    this.startLevelMeterUpdates();
  }
  
  startLevelMeterUpdates() {
    setInterval(() => {
      if (!this.audioSystem || !this.audioSystem.audioEngine) return;
      
      const levels = this.audioSystem.audioEngine.getLevel();
      
      // Update peak meter
      const peakMeter = document.getElementById('peak-meter');
      if (peakMeter) {
        const peakPercent = Math.max(0, Math.min(100, (levels.peak + 60) / 66 * 100));
        peakMeter.style.width = peakPercent + '%';
      }
      
      // Update RMS meter
      const rmsMeter = document.getElementById('rms-meter');
      if (rmsMeter) {
        const rmsPercent = Math.max(0, Math.min(100, (levels.rms + 60) / 66 * 100));
        rmsMeter.style.width = rmsPercent + '%';
      }
      
      // Update level text
      const levelText = document.getElementById('level-text');
      if (levelText) {
        if (levels.peak > -60) {
          levelText.textContent = levels.peak.toFixed(1) + ' dB';
        } else {
          levelText.textContent = '-∞ dB';
        }
      }
    }, 50); // 20 FPS update rate
  }
  
  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}