import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';
import { PresetManager } from './utils/PresetManager.js';
import { PresetModal } from './ui/PresetModal.js';

// Initialize the simple particle life system
async function init() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create preset manager
    const presetManager = new PresetManager();
    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create particle system
    const particleSystem = new SimpleParticleSystem(canvas.width, canvas.height);
    particleSystem.setCanvas(canvas);
    
    // Create preset modal
    const presetModal = new PresetModal(particleSystem, presetManager);
    window.presetModal = presetModal; // Make it globally accessible
    
    // Load the last selected preset or default
    const lastSelectedPreset = localStorage.getItem('lastSelectedPreset') || 'predatorPrey';
    const presetToLoad = presetManager.getPreset(lastSelectedPreset) || presetManager.getPreset('predatorPrey');
    if (presetToLoad) {
        particleSystem.loadFullPreset(presetToLoad);
    }
    
    // Create simple UI controls
    createSimpleUI(particleSystem, presetManager, lastSelectedPreset);
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particleSystem.resize(canvas.width, canvas.height);
    });
    
    // Animation loop
    let lastTime = 0;
    function animate(currentTime) {
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        
        particleSystem.update(deltaTime);
        
        requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);
}

function createSimpleUI(particleSystem, presetManager, initialPreset) {
    const ui = document.createElement('div');
    ui.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        min-width: 350px;
        max-height: 90vh;
        overflow-y: auto;
        overflow-x: hidden;
    `;
    
    // Title and presets
    ui.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Particle Life Controls</h3>
        <div style="margin-bottom: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label style="margin-right: 10px;">Preset:</label>
                <select id="preset-selector" style="width: 150px;">
                    <option value="">Custom</option>
                    <option value="predatorPrey">Predator-Prey</option>
                    <option value="crystallization">Crystallization</option>
                    <option value="vortex">Vortex</option>
                    <option value="symbiosis">Symbiosis</option>
                    <option value="random">Randomize</option>
                </select>
                <button id="configure-preset-btn" style="margin-left: 5px; padding: 4px 10px; font-size: 11px; background: #4a9eff; color: white; border: none; border-radius: 3px;">Configure</button>
            </div>
        </div>
    `;
    
    // Particle controls
    const particleControls = document.createElement('div');
    particleControls.innerHTML = `
        <h4>Particle Settings</h4>
        <label>
            Particles per Color: <input type="range" id="particles-per-species" min="0" max="1000" step="10" value="${particleSystem.particlesPerSpecies}">
            <span id="particles-per-species-value">${particleSystem.particlesPerSpecies}</span>
        </label><br>
        <label>
            Number of Colors: <input type="range" id="num-species" min="1" max="5" step="1" value="${particleSystem.numSpecies}">
            <span id="num-species-value">${particleSystem.numSpecies}</span>
        </label><br>
        <div style="font-size: 10px; color: #666; margin: 5px 0 10px 0;">
            Total particles: <span id="total-particles">${particleSystem.numSpecies * particleSystem.particlesPerSpecies}</span>
        </div>
    `;
    ui.appendChild(particleControls);
    
    // Visual controls
    const visualControls = document.createElement('div');
    visualControls.innerHTML = `
        <h4>Visual Settings</h4>
        <label>
            <input type="checkbox" id="trails" ${particleSystem.trailEnabled ? 'checked' : ''}> Enable Trails
        </label><br>
        <label>
            Trail Length: <input type="range" id="blur" min="0.5" max="0.99" step="0.01" value="${particleSystem.blur}">
            <span id="blur-value">${particleSystem.blur.toFixed(2)}</span>
        </label><br>
        <div style="font-size: 10px; color: #666; margin: -5px 0 10px 20px;">
            Lower = longer trails
        </div>
        <label>
            Particle Size: <input type="range" id="particle-size" min="1" max="10" step="0.5" value="${particleSystem.particleSize}">
            <span id="particle-size-value">${particleSystem.particleSize}</span>
        </label><br>
        <h4>Physics Settings</h4>
        <label>
            Force Strength: <input type="range" id="force" min="0.1" max="2" step="0.1" value="${particleSystem.forceFactor}">
            <span id="force-value">${particleSystem.forceFactor.toFixed(1)}</span>
        </label><br>
        <label>
            Friction: <input type="range" id="friction" min="0" max="0.2" step="0.01" value="${1.0 - particleSystem.friction}">
            <span id="friction-value">${(1.0 - particleSystem.friction).toFixed(2)}</span>
        </label><br>
        <label>
            Wall Bounce: <input type="range" id="wall-damping" min="0.5" max="1" step="0.05" value="${particleSystem.wallDamping}">
            <span id="wall-damping-value">${particleSystem.wallDamping.toFixed(2)}</span>
        </label>
    `;
    ui.appendChild(visualControls);
    
    // Force matrix controls with XY graph
    const matrixControls = document.createElement('div');
    matrixControls.innerHTML = '<h4>Force Relationships</h4>';
    
    // Create graph container
    const graphContainer = document.createElement('div');
    graphContainer.id = 'force-graph';
    graphContainer.style.cssText = 'position: relative; width: 280px; height: 280px; background: #0a0a0a; border: 1px solid #333; margin: 10px 0; border-radius: 5px;';
    
    // Create canvas for graph
    const graphCanvas = document.createElement('canvas');
    graphCanvas.width = 280;
    graphCanvas.height = 280;
    graphCanvas.style.cssText = 'position: absolute; top: 0; left: 0; cursor: crosshair; border-radius: 5px;';
    graphContainer.appendChild(graphCanvas);
    
    // Create hover info display
    const hoverInfo = document.createElement('div');
    hoverInfo.style.cssText = 'position: absolute; top: 5px; right: 5px; font-size: 11px; color: #fff; background: rgba(0,0,0,0.8); padding: 3px 6px; border-radius: 3px; display: none;';
    graphContainer.appendChild(hoverInfo);
    
    // Create info display
    const graphInfo = document.createElement('div');
    graphInfo.style.cssText = 'position: absolute; bottom: 5px; left: 5px; font-size: 10px; color: #888;';
    graphInfo.innerHTML = 'Click anywhere to set force';
    graphContainer.appendChild(graphInfo);
    
    // Species selector for graph
    const speciesSelector = document.createElement('div');
    speciesSelector.innerHTML = `
        <label style="font-size: 11px;">
            From: <select id="from-species" style="width: 80px;">
                <option value="0">Red</option>
                <option value="1">Green</option>
                <option value="2">Blue</option>
                <option value="3">Yellow</option>
                <option value="4">Purple</option>
            </select>
            To: <select id="to-species" style="width: 80px;">
                <option value="0">Red</option>
                <option value="1" selected>Green</option>
                <option value="2">Blue</option>
                <option value="3">Yellow</option>
                <option value="4">Purple</option>
            </select>
        </label>
    `;
    
    matrixControls.appendChild(speciesSelector);
    matrixControls.appendChild(graphContainer);
    
    // Add help text
    const helpText = document.createElement('div');
    helpText.style.cssText = 'font-size: 10px; color: #666; margin-top: 5px;';
    helpText.innerHTML = 'Left = Repel | Center = Neutral | Right = Attract';
    matrixControls.appendChild(helpText);
    
    ui.appendChild(matrixControls);
    
    // Append UI to DOM first
    document.body.appendChild(ui);
    
    // Debug: Check if button exists
    console.log('Configure button:', document.getElementById('configure-preset-btn'));
    
    // Graph drawing function
    function updateGraph() {
        const ctx = graphCanvas.getContext('2d');
        const fromSpecies = parseInt(document.getElementById('from-species').value);
        const toSpecies = parseInt(document.getElementById('to-species').value);
        const force = particleSystem.socialForce[fromSpecies][toSpecies];
        
        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 280, 280);
        
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 280, 0);
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.1)'); // Red for repel
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)'); // White for neutral
        gradient.addColorStop(1, 'rgba(100, 255, 100, 0.1)'); // Green for attract
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 280, 280);
        
        // Draw grid lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 70, 0);
            ctx.lineTo(i * 70, 280);
            ctx.stroke();
        }
        
        // Center line (thicker)
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, 0);
        ctx.lineTo(140, 280);
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.fillText('REPEL', 5, 15);
        ctx.fillText('ATTRACT', 225, 15);
        
        // Draw force value markers
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText('-1.0', 5, 270);
        ctx.fillText('0', 135, 270);
        ctx.fillText('+1.0', 255, 270);
        
        // Draw current force position
        const x = (force + 1) * 140; // Map -1 to 1 => 0 to 280
        const y = 140;
        
        // Draw vertical line at current position
        ctx.strokeStyle = force < 0 ? '#ff6666' : '#66ff66';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 280);
        ctx.stroke();
        
        // Draw handle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner circle
        ctx.fillStyle = force < 0 ? '#ff4444' : '#44ff44';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Update info
        const colorNames = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];
        graphInfo.innerHTML = `${colorNames[fromSpecies]} → ${colorNames[toSpecies]}: ${force.toFixed(2)}`;
    }
    
    // Graph interaction
    let isDragging = false;
    
    function setForceFromMouse(e) {
        const rect = graphCanvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(280, e.clientX - rect.left));
        
        // Map x position to force value (-1 to 1)
        const force = Math.max(-1, Math.min(1, (x / 280) * 2 - 1));
        const fromSpecies = parseInt(document.getElementById('from-species').value);
        const toSpecies = parseInt(document.getElementById('to-species').value);
        
        particleSystem.setSocialForce(fromSpecies, toSpecies, force);
        updateGraph();
    }
    
    graphCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        setForceFromMouse(e);
    });
    
    graphCanvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            setForceFromMouse(e);
        }
        
        // Show hover value
        const rect = graphCanvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(280, e.clientX - rect.left));
        const force = ((x / 280) * 2 - 1).toFixed(2);
        hoverInfo.style.display = 'block';
        hoverInfo.textContent = `Force: ${force}`;
    });
    
    graphCanvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    graphCanvas.addEventListener('mouseleave', () => {
        isDragging = false;
        hoverInfo.style.display = 'none';
    });
    
    // Species selector events
    document.getElementById('from-species').addEventListener('change', updateGraph);
    document.getElementById('to-species').addEventListener('change', updateGraph);
    
    // Add clear relationship button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All Forces';
    clearButton.style.cssText = 'margin-top: 10px; width: 100%;';
    clearButton.addEventListener('click', () => {
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                particleSystem.setSocialForce(i, j, 0);
            }
        }
        updateGraph();
    });
    matrixControls.appendChild(clearButton);
    
    // Initial graph update
    updateGraph();
    
    // Event listeners
    document.getElementById('preset-selector').addEventListener('change', (e) => {
        const presetKey = e.target.value;
        
        // Save the selected preset
        if (presetKey && presetKey !== 'random') {
            localStorage.setItem('lastSelectedPreset', presetKey);
        }
        
        if (presetKey === 'random') {
            particleSystem.socialForce = particleSystem.createAsymmetricMatrix();
            updateMatrixDisplay();
        } else if (presetKey) {
            const preset = presetManager.getPreset(presetKey);
            if (preset) {
                particleSystem.loadFullPreset(preset);
                window.updateUIFromPreset(particleSystem);
                updateMatrixDisplay();
            }
        }
    });
    
    document.getElementById('configure-preset-btn').addEventListener('click', () => {
        const currentPresetKey = document.getElementById('preset-selector').value;
        window.presetModal.open(currentPresetKey);
    });
    
    // Function to update preset selector
    window.updatePresetSelector = function() {
        const selector = document.getElementById('preset-selector');
        const currentValue = selector.value;
        
        // Clear all options except the first ones
        while (selector.options.length > 6) {
            selector.remove(6);
        }
        
        // Add custom presets
        const allPresets = presetManager.getAllPresets();
        allPresets.forEach(preset => {
            if (!['predatorPrey', 'crystallization', 'vortex', 'symbiosis'].includes(preset.key)) {
                const option = document.createElement('option');
                option.value = preset.key;
                option.textContent = preset.name;
                selector.appendChild(option);
            }
        });
        
        // Restore selection if possible
        selector.value = currentValue;
    };
    
    // Initial update of preset selector
    window.updatePresetSelector();
    
    // Set the initial preset value
    const selector = document.getElementById('preset-selector');
    if (selector) {
        selector.value = initialPreset || 'predatorPrey';
    }
    
    document.getElementById('particles-per-species').addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        particleSystem.particlesPerSpecies = newCount;
        particleSystem.initializeParticles();
        document.getElementById('particles-per-species-value').textContent = newCount;
        document.getElementById('total-particles').textContent = particleSystem.numSpecies * newCount;
    });
    
    document.getElementById('num-species').addEventListener('input', (e) => {
        const newSpecies = parseInt(e.target.value);
        particleSystem.numSpecies = newSpecies;
        particleSystem.initializeSpecies();
        particleSystem.initializeParticles();
        document.getElementById('num-species-value').textContent = newSpecies;
        document.getElementById('total-particles').textContent = newSpecies * particleSystem.particlesPerSpecies;
        
        // Update species selectors
        const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];
        const fromSelect = document.getElementById('from-species');
        const toSelect = document.getElementById('to-species');
        
        // Clear and rebuild options
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        
        for (let i = 0; i < newSpecies; i++) {
            const fromOption = document.createElement('option');
            fromOption.value = i;
            fromOption.textContent = colors[i];
            fromSelect.appendChild(fromOption);
            
            const toOption = document.createElement('option');
            toOption.value = i;
            toOption.textContent = colors[i];
            toSelect.appendChild(toOption);
        }
        
        // Set default selection
        if (newSpecies > 1) {
            toSelect.value = '1';
        }
        
        updateGraph();
    });
    
    document.getElementById('trails').addEventListener('change', (e) => {
        particleSystem.trailEnabled = e.target.checked;
    });
    
    document.getElementById('blur').addEventListener('input', (e) => {
        particleSystem.blur = parseFloat(e.target.value);
        document.getElementById('blur-value').textContent = particleSystem.blur.toFixed(2);
    });
    
    document.getElementById('particle-size').addEventListener('input', (e) => {
        const newSize = parseFloat(e.target.value);
        particleSystem.particleSize = newSize;
        // Update all species sizes
        for (let i = 0; i < particleSystem.species.length; i++) {
            particleSystem.species[i].size = newSize + (Math.random() - 0.5);
        }
        document.getElementById('particle-size-value').textContent = newSize;
    });
    
    document.getElementById('force').addEventListener('input', (e) => {
        particleSystem.forceFactor = parseFloat(e.target.value);
        document.getElementById('force-value').textContent = particleSystem.forceFactor.toFixed(1);
    });
    
    document.getElementById('friction').addEventListener('input', (e) => {
        const uiFriction = parseFloat(e.target.value);
        particleSystem.friction = 1.0 - uiFriction;
        document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
    });
    
    document.getElementById('wall-damping').addEventListener('input', (e) => {
        particleSystem.wallDamping = parseFloat(e.target.value);
        document.getElementById('wall-damping-value').textContent = particleSystem.wallDamping.toFixed(2);
    });
    
    function updateMatrixDisplay() {
        updateGraph();
    }
    
    window.updateUIFromPreset = function(particleSystem) {
        // Update visual controls
        document.getElementById('trails').checked = particleSystem.trailEnabled;
        document.getElementById('blur').value = particleSystem.blur;
        document.getElementById('blur-value').textContent = particleSystem.blur.toFixed(2);
        document.getElementById('particle-size').value = particleSystem.particleSize;
        document.getElementById('particle-size-value').textContent = particleSystem.particleSize;
        
        // Update physics controls
        document.getElementById('force').value = particleSystem.forceFactor;
        document.getElementById('force-value').textContent = particleSystem.forceFactor.toFixed(1);
        const uiFriction = 1.0 - particleSystem.friction;
        document.getElementById('friction').value = uiFriction;
        document.getElementById('friction-value').textContent = uiFriction.toFixed(2);
        document.getElementById('wall-damping').value = particleSystem.wallDamping;
        document.getElementById('wall-damping-value').textContent = particleSystem.wallDamping.toFixed(2);
        
        // Update particle counts
        const totalParticles = particleSystem.species.reduce((sum, s) => sum + (s.particleCount || particleSystem.particlesPerSpecies), 0);
        const avgParticlesPerSpecies = Math.round(totalParticles / particleSystem.numSpecies);
        document.getElementById('particles-per-species').value = avgParticlesPerSpecies;
        document.getElementById('particles-per-species-value').textContent = avgParticlesPerSpecies;
        document.getElementById('num-species').value = particleSystem.numSpecies;
        document.getElementById('num-species-value').textContent = particleSystem.numSpecies;
        document.getElementById('total-particles').textContent = totalParticles;
        
        // Update species selectors if needed
        const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Cyan', 'Magenta', 'Orange', 'Pink', 'Lime'];
        const fromSelect = document.getElementById('from-species');
        const toSelect = document.getElementById('to-species');
        
        if (fromSelect.options.length !== particleSystem.numSpecies) {
            fromSelect.innerHTML = '';
            toSelect.innerHTML = '';
            
            for (let i = 0; i < particleSystem.numSpecies; i++) {
                const speciesName = particleSystem.species[i].name || colors[i] || `Species ${i+1}`;
                
                const fromOption = document.createElement('option');
                fromOption.value = i;
                fromOption.textContent = speciesName;
                fromSelect.appendChild(fromOption);
                
                const toOption = document.createElement('option');
                toOption.value = i;
                toOption.textContent = speciesName;
                toSelect.appendChild(toOption);
            }
            
            if (particleSystem.numSpecies > 1) {
                toSelect.value = '1';
            }
        }
    }
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}