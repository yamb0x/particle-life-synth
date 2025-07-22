export class SpeciesSelector {
    constructor(container, particleSystem, onChange) {
        this.container = container;
        this.particleSystem = particleSystem;
        this.onChange = onChange || (() => {});
        this.selectedSpecies = 0;
        
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.container.innerHTML = '';
        
        // Create species buttons container
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'species-selector-enhanced';
        selectorDiv.innerHTML = `
            <style>
                .species-selector-enhanced {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                
                .species-btn-enhanced {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 13px;
                    color: white;
                    text-shadow: 0 0 2px rgba(0,0,0,0.8);
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                
                .species-btn-enhanced:hover {
                    transform: scale(1.1);
                    border-color: rgba(255,255,255,0.4);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                }
                
                .species-btn-enhanced.active {
                    border-color: white;
                    box-shadow: 0 0 12px rgba(255,255,255,0.6), 0 4px 8px rgba(0,0,0,0.4);
                    transform: scale(1.05);
                }
                
                .species-btn-enhanced::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                    z-index: -1;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .species-btn-enhanced:hover::after {
                    opacity: 1;
                }
                
                .species-info {
                    font-size: 11px;
                    color: #999;
                    margin-left: 10px;
                    white-space: nowrap;
                }
                
                .add-species-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px dashed #555;
                    background: transparent;
                    color: #888;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: all 0.2s ease;
                }
                
                .add-species-btn:hover {
                    border-color: #4CAF50;
                    color: #4CAF50;
                    transform: scale(1.05);
                }
                
                .quick-actions {
                    display: flex;
                    gap: 5px;
                    margin-left: 10px;
                }
                
                .quick-action-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    border: 1px solid #555;
                    background: #2a2a2a;
                    color: #ccc;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }
                
                .quick-action-btn:hover {
                    background: #3a3a3a;
                    border-color: #666;
                }
                
                .quick-action-btn.danger:hover {
                    background: #dc3545;
                    border-color: #dc3545;
                    color: white;
                }
                
                .species-count-display {
                    font-size: 12px;
                    color: #999;
                    margin-left: 10px;
                    padding: 4px 8px;
                    background: #2a2a2a;
                    border-radius: 4px;
                    border: 1px solid #444;
                }
            </style>
        `;
        
        this.container.appendChild(selectorDiv);
        this.updateSpeciesButtons();
    }
    
    updateSpeciesButtons() {
        const selectorDiv = this.container.querySelector('.species-selector-enhanced');
        
        // Clear existing buttons
        selectorDiv.innerHTML = '';
        
        // Add species buttons
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            const btn = document.createElement('button');
            btn.className = `species-btn-enhanced ${i === this.selectedSpecies ? 'active' : ''}`;
            btn.style.background = `rgb(${species.color.r}, ${species.color.g}, ${species.color.b})`;
            btn.textContent = String.fromCharCode(65 + i); // A, B, C, etc.
            btn.title = `Species ${String.fromCharCode(65 + i)} (${i + 1}/${this.particleSystem.numSpecies})`;
            btn.dataset.speciesId = i;
            
            selectorDiv.appendChild(btn);
        }
        
        // Add "add species" button if we can add more
        if (this.particleSystem.numSpecies < this.particleSystem.maxSpecies) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-species-btn';
            addBtn.innerHTML = '+';
            addBtn.title = 'Add new species';
            addBtn.addEventListener('click', () => this.addSpecies());
            selectorDiv.appendChild(addBtn);
        }
        
        // Add species count display
        const countDisplay = document.createElement('div');
        countDisplay.className = 'species-count-display';
        countDisplay.textContent = `${this.particleSystem.numSpecies}/${this.particleSystem.maxSpecies} species`;
        selectorDiv.appendChild(countDisplay);
        
        // Add quick actions
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions';
        
        // Random colors button
        const randomColorsBtn = document.createElement('button');
        randomColorsBtn.className = 'quick-action-btn';
        randomColorsBtn.innerHTML = '🎨';
        randomColorsBtn.title = 'Randomize all colors';
        randomColorsBtn.addEventListener('click', () => this.randomizeColors());
        quickActions.appendChild(randomColorsBtn);
        
        // Remove species button (only if we have more than 1 species)
        if (this.particleSystem.numSpecies > 1) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'quick-action-btn danger';
            removeBtn.innerHTML = '−';
            removeBtn.title = 'Remove current species';
            removeBtn.addEventListener('click', () => this.removeCurrentSpecies());
            quickActions.appendChild(removeBtn);
        }
        
        selectorDiv.appendChild(quickActions);
    }
    
    setupEventListeners() {
        // Event delegation for species buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('species-btn-enhanced')) {
                const speciesId = parseInt(e.target.dataset.speciesId);
                this.selectSpecies(speciesId);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Number keys 1-9 for species selection
            if (e.key >= '1' && e.key <= '9') {
                const speciesId = parseInt(e.key) - 1;
                if (speciesId < this.particleSystem.numSpecies && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    e.preventDefault();
                    this.selectSpecies(speciesId);
                }
            }
            // Plus/Minus keys for adding/removing species
            else if (e.key === '+' && e.shiftKey) {
                e.preventDefault();
                this.addSpecies();
            }
            else if (e.key === '-' && e.shiftKey) {
                e.preventDefault();
                this.removeCurrentSpecies();
            }
        });
    }
    
    selectSpecies(speciesId) {
        if (speciesId >= 0 && speciesId < this.particleSystem.numSpecies) {
            this.selectedSpecies = speciesId;
            
            // Update visual state
            this.container.querySelectorAll('.species-btn-enhanced').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const selectedBtn = this.container.querySelector(`[data-species-id="${speciesId}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('active');
            }
            
            // Trigger callback
            this.onChange(speciesId);
        }
    }
    
    addSpecies() {
        if (this.particleSystem.numSpecies < this.particleSystem.maxSpecies) {
            // Generate a random color for the new species
            const newColor = {
                r: Math.floor(Math.random() * 200) + 55,
                g: Math.floor(Math.random() * 200) + 55,
                b: Math.floor(Math.random() * 200) + 55
            };
            
            // Add species through the particle system
            this.particleSystem.addSpecies(newColor);
            
            // Update UI
            this.updateSpeciesButtons();
            
            // Select the new species
            this.selectSpecies(this.particleSystem.numSpecies - 1);
            
            // Trigger change event
            if (this.onSpeciesCountChange) {
                this.onSpeciesCountChange(this.particleSystem.numSpecies);
            }
        }
    }
    
    removeCurrentSpecies() {
        if (this.particleSystem.numSpecies > 1) {
            // Remove species through the particle system
            this.particleSystem.removeSpecies(this.selectedSpecies);
            
            // Adjust selected species if needed
            if (this.selectedSpecies >= this.particleSystem.numSpecies) {
                this.selectedSpecies = this.particleSystem.numSpecies - 1;
            }
            
            // Update UI
            this.updateSpeciesButtons();
            
            // Select the adjusted species
            this.selectSpecies(this.selectedSpecies);
            
            // Trigger change event
            if (this.onSpeciesCountChange) {
                this.onSpeciesCountChange(this.particleSystem.numSpecies);
            }
        }
    }
    
    randomizeColors() {
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            species.color = {
                r: Math.floor(Math.random() * 200) + 55,
                g: Math.floor(Math.random() * 200) + 55,
                b: Math.floor(Math.random() * 200) + 55
            };
        }
        
        // Update UI
        this.updateSpeciesButtons();
        
        // Trigger color change event
        if (this.onColorChange) {
            this.onColorChange();
        }
    }
    
    // Event handlers that can be set externally
    setOnSpeciesCountChange(callback) {
        this.onSpeciesCountChange = callback;
    }
    
    setOnColorChange(callback) {
        this.onColorChange = callback;
    }
    
    // Public API
    getSelectedSpecies() {
        return this.selectedSpecies;
    }
    
    setSelectedSpecies(speciesId) {
        this.selectSpecies(speciesId);
    }
    
    refresh() {
        this.updateSpeciesButtons();
    }
    
    // Update when particle system changes
    onParticleSystemUpdate() {
        // Adjust selected species if needed
        if (this.selectedSpecies >= this.particleSystem.numSpecies) {
            this.selectedSpecies = Math.max(0, this.particleSystem.numSpecies - 1);
        }
        
        this.updateSpeciesButtons();
        this.selectSpecies(this.selectedSpecies);
    }
}