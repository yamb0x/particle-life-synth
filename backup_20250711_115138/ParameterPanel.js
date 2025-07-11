import { naturePresets, applyPreset } from '../core/presets.js';
export class ParameterPanel {
    constructor(particleSystem) {
        this.isVisible = false;
        this.particleSystem = particleSystem;
        this.panel = document.getElementById('parameterPanel');
        this.initializeControls();
    }
    initializeControls() {
        // Initialize attraction matrix
        this.initializeAttractionMatrix();
        // Initialize sliders
        this.initializeSliders();
        // Initialize buttons
        this.initializeButtons();
        // Initialize preset selector
        this.initializePresetSelector();
        // Update display values
        this.updateDisplayValues();
    }
    initializeAttractionMatrix() {
        const matrixContainer = document.getElementById('attractionMatrix');
        matrixContainer.innerHTML = '';
        const species = ['R', 'B', 'G', 'Y', 'P'];
        const matrix = this.particleSystem.getAttractionMatrix();
        // Create header row
        const headerCell = document.createElement('div');
        headerCell.className = 'matrix-cell matrix-header';
        headerCell.textContent = '';
        matrixContainer.appendChild(headerCell);
        for (const species1 of species) {
            const headerCell = document.createElement('div');
            headerCell.className = 'matrix-cell matrix-header';
            headerCell.textContent = species1;
            matrixContainer.appendChild(headerCell);
        }
        // Create matrix rows
        for (let i = 0; i < 5; i++) {
            // Row header
            const rowHeader = document.createElement('div');
            rowHeader.className = 'matrix-cell matrix-header';
            rowHeader.textContent = species[i];
            matrixContainer.appendChild(rowHeader);
            // Matrix cells
            for (let j = 0; j < 5; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'matrix-input';
                input.min = '-2';
                input.max = '2';
                input.step = '0.1';
                input.value = matrix[i][j].toFixed(1);
                input.addEventListener('change', () => {
                    const value = parseFloat(input.value);
                    this.particleSystem.setAttractionValue(i, j, value);
                });
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                cell.appendChild(input);
                matrixContainer.appendChild(cell);
            }
        }
    }
    initializeSliders() {
        // Particles per species
        const particlesPerSpeciesSlider = document.getElementById('particlesPerSpeciesSlider');
        const particlesPerSpeciesValue = document.getElementById('particlesPerSpeciesValue');
        particlesPerSpeciesSlider.addEventListener('input', () => {
            const value = parseInt(particlesPerSpeciesSlider.value);
            particlesPerSpeciesValue.textContent = value.toString();
            this.particleSystem.setParticlesPerSpecies(value);
        });
        // Physics parameters
        const maxForceSlider = document.getElementById('maxForceSlider');
        const maxForceValue = document.getElementById('maxForceValue');
        maxForceSlider.addEventListener('input', () => {
            const value = parseFloat(maxForceSlider.value) / 100;
            maxForceValue.textContent = value.toFixed(1);
            this.particleSystem.physics.maxForce = value;
        });
        const maxSpeedSlider = document.getElementById('maxSpeedSlider');
        const maxSpeedValue = document.getElementById('maxSpeedValue');
        maxSpeedSlider.addEventListener('input', () => {
            const value = parseFloat(maxSpeedSlider.value) / 100;
            maxSpeedValue.textContent = value.toFixed(1);
            this.particleSystem.physics.maxSpeed = value;
        });
        const frictionSlider = document.getElementById('frictionSlider');
        const frictionValue = document.getElementById('frictionValue');
        frictionSlider.addEventListener('input', () => {
            const value = parseFloat(frictionSlider.value) / 100;
            frictionValue.textContent = value.toFixed(2);
            this.particleSystem.physics.friction = value;
        });
        const minDistanceSlider = document.getElementById('minDistanceSlider');
        const minDistanceValue = document.getElementById('minDistanceValue');
        minDistanceSlider.addEventListener('input', () => {
            const value = parseInt(minDistanceSlider.value);
            minDistanceValue.textContent = value.toString();
            this.particleSystem.physics.minDistance = value;
        });
        const maxDistanceSlider = document.getElementById('maxDistanceSlider');
        const maxDistanceValue = document.getElementById('maxDistanceValue');
        maxDistanceSlider.addEventListener('input', () => {
            const value = parseInt(maxDistanceSlider.value);
            maxDistanceValue.textContent = value.toString();
            this.particleSystem.physics.maxDistance = value;
        });
        // Visual parameters
        const trailLengthSlider = document.getElementById('trailLengthSlider');
        const trailLengthValue = document.getElementById('trailLengthValue');
        trailLengthSlider.addEventListener('input', () => {
            const value = parseInt(trailLengthSlider.value);
            trailLengthValue.textContent = value.toString();
            this.particleSystem.visual.trailLength = value;
            this.particleSystem.updateVisualParams();
        });
        const particleSizeSlider = document.getElementById('particleSizeSlider');
        const particleSizeValue = document.getElementById('particleSizeValue');
        particleSizeSlider.addEventListener('input', () => {
            const value = parseInt(particleSizeSlider.value);
            particleSizeValue.textContent = value.toString();
            this.particleSystem.visual.particleSize = value;
            this.particleSystem.updateVisualParams();
        });
        const glowIntensitySlider = document.getElementById('glowIntensitySlider');
        const glowIntensityValue = document.getElementById('glowIntensityValue');
        glowIntensitySlider.addEventListener('input', () => {
            const value = parseFloat(glowIntensitySlider.value) / 100;
            glowIntensityValue.textContent = value.toFixed(1);
            this.particleSystem.visual.glowIntensity = value;
        });
    }
    initializeButtons() {
        document.getElementById('savePreset').addEventListener('click', () => {
            this.savePreset();
        });
        document.getElementById('loadPreset').addEventListener('click', () => {
            this.loadPreset();
        });
        document.getElementById('reset').addEventListener('click', () => {
            this.particleSystem.resetParticles();
        });
        document.getElementById('randomize').addEventListener('click', () => {
            this.randomizeParameters();
        });
    }
    initializePresetSelector() {
        // Find the ecosystems section by ID
        const ecosystemSection = document.getElementById('ecosystemsSection');
        if (!ecosystemSection)
            return;
        // Keep the existing header
        ecosystemSection.innerHTML = '<h4>ECOSYSTEM PRESETS</h4>';
        // Combine all presets into one list
        const allPresets = [
            // Ventrella-inspired presets (using ForceField system)
            { type: 'ventrella', value: 'pollack', name: 'Pollack', desc: 'Chaotic paint-splatter patterns' },
            { type: 'ventrella', value: 'gems', name: 'Gems', desc: 'Crystalline structures' },
            { type: 'ventrella', value: 'alliances', name: 'Alliances', desc: 'Groups form strategic partnerships' },
            { type: 'ventrella', value: 'red_menace', name: 'Red Menace', desc: 'Red particles hunt others' },
            { type: 'ventrella', value: 'acrobats', name: 'Acrobats', desc: 'Dynamic acrobatic movements' },
            { type: 'ventrella', value: 'mitosis', name: 'Mitosis', desc: 'Cell-like division behavior' },
            { type: 'ventrella', value: 'planets', name: 'Planets', desc: 'Orbital mechanics' },
            { type: 'ventrella', value: 'stigmergy', name: 'Stigmergy', desc: 'Ant-like trail following' },
            { type: 'ventrella', value: 'field', name: 'Field', desc: 'Uniform field effects' },
            { type: 'ventrella', value: 'simplify', name: 'Simplify', desc: 'Minimalist interactions' },
            { type: 'ventrella', value: 'dreamtime', name: 'Dreamtime', desc: 'Surreal dreamlike behavior' },
            // Nature-inspired presets (using attraction matrix)
            { type: 'nature', value: '0', name: 'Predator-Prey', desc: naturePresets[0].description },
            { type: 'nature', value: '1', name: 'Cellular Automata', desc: naturePresets[1].description },
            { type: 'nature', value: '2', name: 'Coral Reef', desc: naturePresets[2].description },
            { type: 'nature', value: '3', name: 'Magnetic Fields', desc: naturePresets[3].description },
            { type: 'nature', value: '4', name: 'Flocking Birds', desc: naturePresets[4].description },
            { type: 'nature', value: '5', name: 'Chemical Reaction', desc: naturePresets[5].description },
            { type: 'nature', value: '6', name: 'Galaxy Formation', desc: naturePresets[6].description },
            { type: 'nature', value: '7', name: 'Neural Network', desc: naturePresets[7].description }
        ];
        // Create single unified dropdown
        const presetSelect = document.createElement('select');
        presetSelect.id = 'unifiedPresetSelector';
        presetSelect.className = 'preset-select';
        presetSelect.innerHTML = `
            <option value="">-- Choose Ecosystem --</option>
            <optgroup label="Ventrella Physics">
                ${allPresets.filter(p => p.type === 'ventrella').map(preset => `<option value="${preset.type}:${preset.value}">${preset.name}</option>`).join('')}
            </optgroup>
            <optgroup label="Nature Behaviors">
                ${allPresets.filter(p => p.type === 'nature').map(preset => `<option value="${preset.type}:${preset.value}">${preset.name}</option>`).join('')}
            </optgroup>
        `;
        const presetDesc = document.createElement('p');
        presetDesc.id = 'presetDescription';
        presetDesc.style.cssText = 'font-size: 0.85em; color: #666; margin: 5px 0;';
        // Add elements to section
        ecosystemSection.appendChild(presetSelect);
        ecosystemSection.appendChild(presetDesc);
        // Unified preset selector handler
        presetSelect.addEventListener('change', () => {
            const value = presetSelect.value;
            if (!value) {
                presetDesc.textContent = '';
                return;
            }
            const [type, presetValue] = value.split(':');
            const preset = allPresets.find(p => p.type === type && p.value === presetValue);
            if (preset) {
                presetDesc.textContent = preset.desc;
                if (type === 'ventrella') {
                    // Use ForceField system
                    this.particleSystem.loadEcosystemPreset(presetValue);
                }
                else if (type === 'nature') {
                    // Use attraction matrix system
                    const index = parseInt(presetValue);
                    applyPreset(this.particleSystem, naturePresets[index]);
                    this.updateDisplayValues();
                    this.initializeAttractionMatrix();
                }
            }
        });
    }
    updateDisplayValues() {
        // Update all display values to match current system state
        const physics = this.particleSystem.physics;
        const visual = this.particleSystem.visual;
        document.getElementById('maxForceSlider').value = (physics.maxForce * 100).toString();
        document.getElementById('maxForceValue').textContent = physics.maxForce.toFixed(1);
        document.getElementById('maxSpeedSlider').value = (physics.maxSpeed * 100).toString();
        document.getElementById('maxSpeedValue').textContent = physics.maxSpeed.toFixed(1);
        document.getElementById('frictionSlider').value = (physics.friction * 100).toString();
        document.getElementById('frictionValue').textContent = physics.friction.toFixed(2);
        document.getElementById('minDistanceSlider').value = physics.minDistance.toString();
        document.getElementById('minDistanceValue').textContent = physics.minDistance.toString();
        document.getElementById('maxDistanceSlider').value = physics.maxDistance.toString();
        document.getElementById('maxDistanceValue').textContent = physics.maxDistance.toString();
        document.getElementById('trailLengthSlider').value = visual.trailLength.toString();
        document.getElementById('trailLengthValue').textContent = visual.trailLength.toString();
        document.getElementById('particleSizeSlider').value = visual.particleSize.toString();
        document.getElementById('particleSizeValue').textContent = visual.particleSize.toString();
        document.getElementById('glowIntensitySlider').value = (visual.glowIntensity * 100).toString();
        document.getElementById('glowIntensityValue').textContent = visual.glowIntensity.toFixed(1);
    }
    savePreset() {
        const preset = {
            physics: this.particleSystem.physics,
            visual: this.particleSystem.visual,
            attractionMatrix: this.particleSystem.getAttractionMatrix(),
            timestamp: Date.now()
        };
        const presetData = JSON.stringify(preset, null, 2);
        const blob = new Blob([presetData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `particle-preset-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    loadPreset() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const preset = JSON.parse(e.target?.result);
                        this.applyPreset(preset);
                    }
                    catch (error) {
                        console.error('Error loading preset:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    applyPreset(preset) {
        if (preset.physics) {
            this.particleSystem.physics = { ...preset.physics };
        }
        if (preset.visual) {
            this.particleSystem.visual = { ...preset.visual };
        }
        if (preset.attractionMatrix) {
            this.particleSystem.setAttractionMatrix(preset.attractionMatrix);
        }
        this.updateDisplayValues();
        this.initializeAttractionMatrix();
        this.particleSystem.updateVisualParams();
    }
    randomizeParameters() {
        // Randomize attraction matrix
        const matrix = this.particleSystem.getAttractionMatrix();
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 2; // -1 to 1
            }
        }
        this.particleSystem.setAttractionMatrix(matrix);
        // Randomize physics parameters
        this.particleSystem.physics.maxForce = Math.random() * 2;
        this.particleSystem.physics.maxSpeed = Math.random() * 5;
        this.particleSystem.physics.friction = Math.random() * 0.5;
        this.particleSystem.physics.minDistance = Math.random() * 20 + 5;
        this.particleSystem.physics.maxDistance = Math.random() * 300 + 100;
        this.updateDisplayValues();
        this.initializeAttractionMatrix();
    }
    toggle() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
    }
    updateStats(fps, particleCount, speciesCount) {
        document.getElementById('fps').textContent = fps.toString();
        document.getElementById('particleCount').textContent = particleCount.toString();
        document.getElementById('speciesCount').textContent = speciesCount.toString();
    }
}
