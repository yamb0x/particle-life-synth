export class SpeciesGlowControl {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.selectedSpecies = 0;
        this.container = null;
        this.sizeSlider = null;
        this.intensitySlider = null;
        this.sizeValueDisplay = null;
        this.intensityValueDisplay = null;
        this.speciesSelector = null;
    }
    
    createElement() {
        this.container = document.createElement('div');
        this.container.className = 'control-group species-glow-control';
        this.container.innerHTML = `
            <label>
                Species Glow Effect
            </label>
            <div class="species-glow-selector-group">
                <select class="select select-sm" id="glow-species-selector">
                    ${this.getSpeciesOptions()}
                </select>
            </div>
            <div class="glow-controls">
                <div class="control-group">
                    <label>
                        Glow Size
                        <span class="value-display" id="species-glow-size-value">1.0</span>
                    </label>
                    <input type="range" class="range-slider" id="species-glow-size-slider" 
                           min="0.5" max="3" step="0.1" value="1.0">
                </div>
                <div class="control-group">
                    <label>
                        Glow Intensity
                        <span class="value-display" id="species-glow-intensity-value">0.0</span>
                    </label>
                    <input type="range" class="range-slider" id="species-glow-intensity-slider" 
                           min="0" max="1" step="0.05" value="0">
                </div>
            </div>
            <div class="info-text">Apply enhanced glow effect to individual particle groups</div>
        `;
        
        this.speciesSelector = this.container.querySelector('#glow-species-selector');
        this.sizeSlider = this.container.querySelector('#species-glow-size-slider');
        this.intensitySlider = this.container.querySelector('#species-glow-intensity-slider');
        this.sizeValueDisplay = this.container.querySelector('#species-glow-size-value');
        this.intensityValueDisplay = this.container.querySelector('#species-glow-intensity-value');
        
        this.attachEventListeners();
        this.updateUI();
        
        return this.container;
    }
    
    getSpeciesOptions() {
        const speciesNames = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Cyan', 'Orange', 'Pink', 'White', 'Gray'];
        let options = '';
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const name = this.particleSystem.species[i]?.name || speciesNames[i] || `Species ${i + 1}`;
            options += `<option value="${i}">${name}</option>`;
        }
        return options;
    }
    
    attachEventListeners() {
        this.speciesSelector.addEventListener('change', (e) => {
            this.selectedSpecies = parseInt(e.target.value);
            this.updateUI();
        });
        
        this.sizeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.setSpeciesGlowSize(this.selectedSpecies, value);
            this.sizeValueDisplay.textContent = value.toFixed(1);
            
            // Trigger auto-save if available
            if (window.presetModal && window.presetModal.markChanged) {
                window.presetModal.markChanged();
            }
        });
        
        this.intensitySlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.particleSystem.setSpeciesGlowIntensity(this.selectedSpecies, value);
            this.intensityValueDisplay.textContent = value.toFixed(2);
            
            // Trigger auto-save if available
            if (window.presetModal && window.presetModal.markChanged) {
                window.presetModal.markChanged();
            }
        });
    }
    
    updateUI() {
        const currentSize = this.particleSystem.getSpeciesGlowSize(this.selectedSpecies);
        const currentIntensity = this.particleSystem.getSpeciesGlowIntensity(this.selectedSpecies);
        
        this.sizeSlider.value = currentSize;
        this.sizeValueDisplay.textContent = currentSize.toFixed(1);
        
        this.intensitySlider.value = currentIntensity;
        this.intensityValueDisplay.textContent = currentIntensity.toFixed(2);
    }
    
    updateSpeciesList() {
        this.speciesSelector.innerHTML = this.getSpeciesOptions();
        if (this.selectedSpecies >= this.particleSystem.numSpecies) {
            this.selectedSpecies = 0;
        }
        this.speciesSelector.value = this.selectedSpecies;
        this.updateUI();
    }
    
    updateFromParticleSystem() {
        this.updateSpeciesList();
        this.updateUI();
    }
}