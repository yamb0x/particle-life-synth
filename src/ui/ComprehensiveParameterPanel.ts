import { ComprehensiveParticleSystem } from '../core/ComprehensiveParticleSystem.js';

export class ComprehensiveParameterPanel {
    private container: HTMLDivElement;
    private system: ComprehensiveParticleSystem;
    private isVisible: boolean = true;
    private selectedColors: number = 4;
    private seed: number = 91651088029;
    
    // UI sections
    private controlsSection: HTMLDivElement;
    private configSection: HTMLDivElement;
    private drawingsSection: HTMLDivElement;
    private exportSection: HTMLDivElement;
    private rulesSection: HTMLDivElement;
    
    // Color names for display
    private colorNames = ['Green', 'Red', 'Orange', 'Cyan', 'Purple'];
    private colorHexes = ['#00FF00', '#FF0000', '#FFA500', '#00FFFF', '#FF00FF'];
    
    constructor(system: ComprehensiveParticleSystem) {
        this.system = system;
        this.createPanel();
        this.setupKeyboardShortcuts();
    }
    
    private createPanel(): void {
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'parameter-panel-comprehensive';
        this.container.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 300px;
            max-height: 90vh;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            color: #fff;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
            font-size: 12px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        `;
        
        // Create sections
        this.createControlsSection();
        this.createConfigSection();
        this.createDrawingsSection();
        this.createExportSection();
        this.createRulesSection();
        
        document.body.appendChild(this.container);
    }
    
    private createSection(title: string, isCollapsible: boolean = true): HTMLDivElement {
        const section = document.createElement('div');
        section.className = 'panel-section';
        section.style.cssText = 'border-bottom: 1px solid #333;';
        
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 15px;
            background: #222;
            cursor: ${isCollapsible ? 'pointer' : 'default'};
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = title;
        header.appendChild(titleSpan);
        
        if (isCollapsible) {
            const arrow = document.createElement('span');
            arrow.textContent = '▼';
            arrow.style.cssText = 'font-size: 10px;';
            header.appendChild(arrow);
            
            header.onclick = () => {
                const content = section.querySelector('.section-content') as HTMLDivElement;
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    arrow.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    arrow.textContent = '▶';
                }
            };
        }
        
        section.appendChild(header);
        
        const content = document.createElement('div');
        content.className = 'section-content';
        content.style.cssText = 'padding: 10px 15px;';
        section.appendChild(content);
        
        return section;
    }
    
    private createControlsSection(): void {
        this.controlsSection = this.createSection('Controls');
        const content = this.controlsSection.querySelector('.section-content') as HTMLDivElement;
        
        // Reset button
        this.createButton(content, 'Reset', () => {
            this.system.resetParticles();
        });
        
        // Random Rules button
        this.createButton(content, 'Random Rules', () => {
            this.randomizeRules();
        });
        
        // Symmetric Rules button
        this.createButton(content, 'Symmetric Rules', () => {
            this.symmetricRules();
        });
        
        this.container.appendChild(this.controlsSection);
    }
    
    private createConfigSection(): void {
        this.configSection = this.createSection('Config');
        const content = this.configSection.querySelector('.section-content') as HTMLDivElement;
        
        // Number of Colors
        this.createSlider(content, 'Number of Colors', 2, 5, this.selectedColors, 1, (value) => {
            this.selectedColors = value;
            this.system.setSpeciesCount(value);
            this.updateRulesSection();
        });
        
        // Seed
        this.createNumberInput(content, 'Seed', this.seed, (value) => {
            this.seed = value;
            this.applySeed();
        });
        
        // FPS display
        const fpsDisplay = document.createElement('div');
        fpsDisplay.style.cssText = 'margin: 5px 0; color: #666;';
        fpsDisplay.id = 'fps-display';
        fpsDisplay.textContent = 'FPS - (Live): 60';
        content.appendChild(fpsDisplay);
        
        // Atoms per-color
        this.createSlider(content, 'Atoms per-color', 50, 500, 200, 10, (value) => {
            this.system.setParticlesPerSpecies(value);
        });
        
        // Time Scale
        this.createSlider(content, 'Time Scale', 0.1, 2.0, 1.0, 0.1, (value) => {
            this.system.physics.timeStep = value * 0.016;
        });
        
        // Viscosity
        this.createSlider(content, 'Viscosity', 0.0, 1.0, this.system.physics.viscosity, 0.01, (value) => {
            this.system.physics.viscosity = value;
        });
        
        // Gravity
        this.createSlider(content, 'Gravity', -1.0, 1.0, this.system.physics.gravity.y, 0.01, (value) => {
            this.system.physics.gravity.y = value;
        });
        
        // Click Pulse Duration
        this.createSlider(content, 'Click Pulse Duration', 0, 1000, 100, 10, (value) => {
            // Implement click pulse functionality
        });
        
        // Wall Repel
        this.createSlider(content, 'Wall Repel', 0.0, 1.0, this.system.physics.boundaryDamping, 0.01, (value) => {
            this.system.physics.boundaryDamping = value;
        });
        
        // Random Exploration
        this.createSlider(content, 'Random Exploration', 0.0, 1.0, this.system.physics.turbulence, 0.01, (value) => {
            this.system.physics.turbulence = value;
        });
        
        this.container.appendChild(this.configSection);
    }
    
    private createDrawingsSection(): void {
        this.drawingsSection = this.createSection('Drawings');
        const content = this.drawingsSection.querySelector('.section-content') as HTMLDivElement;
        
        // Radius
        this.createSlider(content, 'Radius', 1, 10, 3, 0.5, (value) => {
            for (let i = 0; i < 5; i++) {
                this.system.rendering.particleSize[i] = value;
            }
            this.system.updateVisualParams();
        });
        
        // Circle Shape checkbox
        this.createCheckbox(content, 'Circle Shape', true, (checked) => {
            for (let i = 0; i < 5; i++) {
                this.system.rendering.particleShape[i] = checked ? 'circle' : 'square';
            }
        });
        
        // Track Clusters checkbox
        this.createCheckbox(content, 'Track Clusters', false, (checked) => {
            // Implement cluster tracking visualization
        });
        
        // Draw Lines checkbox
        this.createCheckbox(content, 'Draw Lines', false, (checked) => {
            // Implement line drawing between particles
        });
        
        // Background Color
        this.createColorPicker(content, 'Background Color', '#000000', (color) => {
            document.body.style.backgroundColor = color;
        });
        
        this.container.appendChild(this.drawingsSection);
    }
    
    private createExportSection(): void {
        this.exportSection = this.createSection('Export');
        const content = this.exportSection.querySelector('.section-content') as HTMLDivElement;
        
        // Image export button
        this.createButton(content, 'Image', () => {
            this.exportImage();
        });
        
        // Video controls
        const videoControls = document.createElement('div');
        videoControls.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';
        
        this.createButton(videoControls, 'Video: Start', () => {
            // Implement video recording
        });
        
        this.createButton(videoControls, 'Stop', () => {
            // Stop video recording
        });
        
        content.appendChild(videoControls);
        
        this.container.appendChild(this.exportSection);
    }
    
    private createRulesSection(): void {
        this.rulesSection = document.createElement('div');
        this.rulesSection.style.cssText = 'padding-bottom: 20px;';
        this.updateRulesSection();
        this.container.appendChild(this.rulesSection);
    }
    
    private updateRulesSection(): void {
        this.rulesSection.innerHTML = '';
        
        // Create rule controls for each active species
        for (let i = 0; i < this.selectedColors; i++) {
            const speciesSection = this.createSection(`Rules: ${this.colorNames[i]}`);
            const content = speciesSection.querySelector('.section-content') as HTMLDivElement;
            
            // Attraction/repulsion sliders for each other species
            for (let j = 0; j < this.selectedColors; j++) {
                const label = document.createElement('div');
                label.style.cssText = 'display: flex; align-items: center; margin-bottom: 5px;';
                
                const arrow = document.createElement('span');
                arrow.textContent = '<<>>';
                arrow.style.cssText = 'color: #666; margin-right: 10px; font-family: monospace;';
                label.appendChild(arrow);
                
                const colorLabel = document.createElement('span');
                colorLabel.textContent = this.colorNames[j];
                colorLabel.style.cssText = `color: ${this.colorHexes[j]};`;
                label.appendChild(colorLabel);
                
                content.appendChild(label);
                
                const currentValue = this.system.physics.attractionMatrix[i] && this.system.physics.attractionMatrix[i][j] 
                    ? this.system.physics.attractionMatrix[i][j] 
                    : 0;
                this.createSlider(content, '', -1.0, 1.0, currentValue, 0.01, (value) => {
                    this.system.setAttractionMatrix(i, j, value);
                }, false);
            }
            
            // Radius control for this species
            const radiusLabel = document.createElement('div');
            radiusLabel.textContent = 'Radius';
            radiusLabel.style.cssText = 'margin-top: 10px; margin-bottom: 5px; color: #888;';
            content.appendChild(radiusLabel);
            
            this.createSlider(content, '', 10, 300, 100, 1, (value) => {
                for (let j = 0; j < 5; j++) {
                    this.system.physics.maxRadius[i][j] = value;
                }
            }, false);
            
            this.rulesSection.appendChild(speciesSection);
        }
    }
    
    private createSlider(
        parent: HTMLElement, 
        label: string, 
        min: number, 
        max: number, 
        value: number, 
        step: number,
        onChange: (value: number) => void,
        showLabel: boolean = true
    ): void {
        const container = document.createElement('div');
        container.style.cssText = 'margin: 10px 0;';
        
        if (showLabel && label) {
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #ccc;';
            container.appendChild(labelEl);
        }
        
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min.toString();
        slider.max = max.toString();
        slider.value = value.toString();
        slider.step = step.toString();
        slider.style.cssText = `
            flex: 1;
            height: 4px;
            background: #333;
            outline: none;
            -webkit-appearance: none;
            cursor: pointer;
        `;
        
        // Custom slider styling
        const styleId = `slider-style-${Math.random().toString(36).substr(2, 9)}`;
        slider.className = styleId;
        
        const style = document.createElement('style');
        style.textContent = `
            .${styleId}::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: #00FFFF;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 0 3px rgba(0,255,255,0.5);
            }
            .${styleId}::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: #00FFFF;
                cursor: pointer;
                border-radius: 50%;
                border: none;
                box-shadow: 0 0 3px rgba(0,255,255,0.5);
            }
        `;
        document.head.appendChild(style);
        
        const valueDisplay = document.createElement('span');
        valueDisplay.style.cssText = 'min-width: 50px; text-align: right; color: #888;';
        valueDisplay.textContent = value.toFixed(step < 1 ? 2 : 0);
        
        slider.oninput = () => {
            const val = parseFloat(slider.value);
            valueDisplay.textContent = val.toFixed(step < 1 ? 2 : 0);
            onChange(val);
        };
        
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        container.appendChild(sliderContainer);
        parent.appendChild(container);
    }
    
    private createButton(parent: HTMLElement, text: string, onClick: () => void): void {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            width: 100%;
            padding: 8px;
            margin: 5px 0;
            background: #333;
            border: 1px solid #555;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
        `;
        
        button.onmouseover = () => {
            button.style.background = '#444';
        };
        
        button.onmouseout = () => {
            button.style.background = '#333';
        };
        
        button.onclick = onClick;
        parent.appendChild(button);
    }
    
    private createCheckbox(parent: HTMLElement, label: string, checked: boolean, onChange: (checked: boolean) => void): void {
        const container = document.createElement('div');
        container.style.cssText = 'margin: 10px 0; display: flex; align-items: center;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        checkbox.style.cssText = 'margin-right: 10px;';
        checkbox.onchange = () => onChange(checkbox.checked);
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = 'color: #ccc; cursor: pointer;';
        labelEl.onclick = () => {
            checkbox.checked = !checkbox.checked;
            onChange(checkbox.checked);
        };
        
        container.appendChild(checkbox);
        container.appendChild(labelEl);
        parent.appendChild(container);
    }
    
    private createNumberInput(parent: HTMLElement, label: string, value: number, onChange: (value: number) => void): void {
        const container = document.createElement('div');
        container.style.cssText = 'margin: 10px 0;';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #ccc;';
        container.appendChild(labelEl);
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = value.toString();
        input.style.cssText = `
            width: 100%;
            padding: 5px;
            background: #333;
            border: 1px solid #555;
            color: #fff;
            border-radius: 4px;
            font-family: inherit;
            font-size: 12px;
        `;
        
        input.onchange = () => {
            onChange(parseInt(input.value));
        };
        
        container.appendChild(input);
        parent.appendChild(container);
    }
    
    private createColorPicker(parent: HTMLElement, label: string, value: string, onChange: (color: string) => void): void {
        const container = document.createElement('div');
        container.style.cssText = 'margin: 10px 0;';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cssText = 'display: block; margin-bottom: 5px; color: #ccc;';
        container.appendChild(labelEl);
        
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.value = value;
        picker.style.cssText = `
            width: 100%;
            height: 30px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        picker.onchange = () => {
            onChange(picker.value);
        };
        
        container.appendChild(picker);
        parent.appendChild(container);
    }
    
    private randomizeRules(): void {
        for (let i = 0; i < this.selectedColors; i++) {
            for (let j = 0; j < this.selectedColors; j++) {
                const value = Math.random() * 2 - 1; // -1 to 1
                this.system.setAttractionMatrix(i, j, value);
            }
        }
        this.updateRulesSection();
    }
    
    private symmetricRules(): void {
        for (let i = 0; i < this.selectedColors; i++) {
            for (let j = i; j < this.selectedColors; j++) {
                const value = Math.random() * 2 - 1;
                this.system.setAttractionMatrix(i, j, value);
                this.system.setAttractionMatrix(j, i, value);
            }
        }
        this.updateRulesSection();
    }
    
    private applySeed(): void {
        // Use seed to generate deterministic random values
        let seed = this.seed;
        const random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        for (let i = 0; i < this.selectedColors; i++) {
            for (let j = 0; j < this.selectedColors; j++) {
                const value = random() * 2 - 1;
                this.system.setAttractionMatrix(i, j, value);
            }
        }
        this.updateRulesSection();
    }
    
    private exportImage(): void {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `particle-life-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }
    
    private setupKeyboardShortcuts(): void {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.toggleVisibility();
            }
        });
    }
    
    private toggleVisibility(): void {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    
    public updateFPS(fps: number): void {
        const display = document.getElementById('fps-display');
        if (display) {
            display.textContent = `FPS - (Live): ${fps.toFixed(0)}`;
        }
    }
    
    public destroy(): void {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}