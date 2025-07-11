import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';

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
    
    // Create particle system
    const particleSystem = new SimpleParticleSystem(canvas.width, canvas.height);
    particleSystem.setCanvas(canvas);
    particleSystem.initializeParticles();
    
    // Load an interesting preset
    particleSystem.loadPreset('predatorPrey');
    
    // Create simple UI controls
    createSimpleUI(particleSystem);
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particleSystem.width = canvas.width;
        particleSystem.height = canvas.height;
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

function createSimpleUI(particleSystem) {
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
        min-width: 300px;
        max-height: 90vh;
        overflow-y: auto;
    `;
    
    // Title
    ui.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">Particle Life Controls</h3>
        <div style="margin-bottom: 15px;">
            <button id="preset-predator" style="margin: 2px;">Predator-Prey</button>
            <button id="preset-crystal" style="margin: 2px;">Crystallization</button>
            <button id="preset-vortex" style="margin: 2px;">Vortex</button>
            <button id="preset-symbiosis" style="margin: 2px;">Symbiosis</button>
            <button id="randomize" style="margin: 2px;">Randomize</button>
        </div>
    `;
    
    // Visual controls
    const visualControls = document.createElement('div');
    visualControls.innerHTML = `
        <h4>Visual Settings</h4>
        <label>
            Trail Length: <input type="range" id="blur" min="0.01" max="0.5" step="0.01" value="${particleSystem.blur}">
            <span id="blur-value">${particleSystem.blur.toFixed(2)}</span>
        </label><br>
        <label>
            <input type="checkbox" id="halos" ${particleSystem.showHalos ? 'checked' : ''}> Show Halos
        </label><br>
        <label>
            Force Factor: <input type="range" id="force" min="0.1" max="2" step="0.1" value="${particleSystem.forceFactor}">
            <span id="force-value">${particleSystem.forceFactor.toFixed(1)}</span>
        </label><br>
        <label>
            Friction: <input type="range" id="friction" min="0.9" max="0.99" step="0.01" value="${particleSystem.friction}">
            <span id="friction-value">${particleSystem.friction.toFixed(2)}</span>
        </label>
    `;
    ui.appendChild(visualControls);
    
    // Force matrix controls
    const matrixControls = document.createElement('div');
    matrixControls.innerHTML = '<h4>Force Matrix (Row affects Column)</h4>';
    
    // Create matrix grid
    const matrixGrid = document.createElement('div');
    matrixGrid.style.cssText = 'display: grid; grid-template-columns: repeat(6, 40px); gap: 2px; margin-top: 10px;';
    
    // Headers
    matrixGrid.innerHTML = '<div></div>'; // Empty corner
    const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];
    for (let i = 0; i < 5; i++) {
        const header = document.createElement('div');
        header.style.cssText = 'text-align: center; font-size: 10px;';
        header.textContent = colors[i].substr(0, 1);
        matrixGrid.appendChild(header);
    }
    
    // Matrix cells
    for (let i = 0; i < 5; i++) {
        // Row header
        const rowHeader = document.createElement('div');
        rowHeader.style.cssText = 'text-align: center; font-size: 10px;';
        rowHeader.textContent = colors[i].substr(0, 1);
        matrixGrid.appendChild(rowHeader);
        
        // Force values
        for (let j = 0; j < 5; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '-1';
            input.max = '1';
            input.step = '0.1';
            input.value = particleSystem.socialForce[i][j].toFixed(1);
            input.style.cssText = 'width: 35px; font-size: 10px;';
            input.id = `force-${i}-${j}`;
            
            input.addEventListener('change', (e) => {
                particleSystem.setSocialForce(i, j, parseFloat(e.target.value));
            });
            
            matrixGrid.appendChild(input);
        }
    }
    
    matrixControls.appendChild(matrixGrid);
    ui.appendChild(matrixControls);
    
    document.body.appendChild(ui);
    
    // Event listeners
    document.getElementById('preset-predator').addEventListener('click', () => {
        particleSystem.loadPreset('predatorPrey');
        updateMatrixDisplay();
    });
    
    document.getElementById('preset-crystal').addEventListener('click', () => {
        particleSystem.loadPreset('crystallization');
        updateMatrixDisplay();
    });
    
    document.getElementById('preset-vortex').addEventListener('click', () => {
        particleSystem.loadPreset('vortex');
        updateMatrixDisplay();
    });
    
    document.getElementById('preset-symbiosis').addEventListener('click', () => {
        particleSystem.loadPreset('symbiosis');
        updateMatrixDisplay();
    });
    
    document.getElementById('randomize').addEventListener('click', () => {
        particleSystem.socialForce = particleSystem.createAsymmetricMatrix();
        updateMatrixDisplay();
    });
    
    document.getElementById('blur').addEventListener('input', (e) => {
        particleSystem.blur = parseFloat(e.target.value);
        document.getElementById('blur-value').textContent = e.target.value;
    });
    
    document.getElementById('halos').addEventListener('change', (e) => {
        particleSystem.showHalos = e.target.checked;
    });
    
    document.getElementById('force').addEventListener('input', (e) => {
        particleSystem.forceFactor = parseFloat(e.target.value);
        document.getElementById('force-value').textContent = e.target.value;
    });
    
    document.getElementById('friction').addEventListener('input', (e) => {
        particleSystem.friction = parseFloat(e.target.value);
        document.getElementById('friction-value').textContent = e.target.value;
    });
    
    function updateMatrixDisplay() {
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                document.getElementById(`force-${i}-${j}`).value = particleSystem.socialForce[i][j].toFixed(1);
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