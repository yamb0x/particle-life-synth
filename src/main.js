import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';
import { PresetManager } from './utils/PresetManager.js';
import { PresetModal } from './ui/PresetModal.js';
import { MainUI } from './ui/MainUI.js';

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
    
    // Create main UI with new design system
    const mainUI = new MainUI(particleSystem, presetManager);
    window.mainUI = mainUI; // Make it globally accessible
    
    
    // Make updateUIFromPreset available globally for PresetModal
    window.updateUIFromPreset = function(particleSystem) {
        mainUI.updateUIFromPreset();
    };
    
    // Make updatePresetSelector available globally for PresetModal
    window.updatePresetSelector = function() {
        mainUI.updatePresetSelector();
    };
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particleSystem.resize(canvas.width, canvas.height);
    });
    
    // Create performance overlay
    function createPerformanceOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'performance-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            color: #ff6666;
            font-family: monospace;
            font-size: 11px;
            text-align: right;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    const perfOverlay = createPerformanceOverlay();
    
    // Animation loop
    let lastTime = 0;
    let frameCount = 0;
    let fpsTime = 0;
    let currentFPS = 60;
    
    function animate(currentTime) {
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        
        // Calculate FPS
        frameCount++;
        if (currentTime >= fpsTime + 1000) {
            currentFPS = Math.round((frameCount * 1000) / (currentTime - fpsTime));
            frameCount = 0;
            fpsTime = currentTime;
            
            // Update performance overlay
            const totalParticles = particleSystem.species.reduce((sum, s) => sum + (s.particleCount || 0), 0);
            perfOverlay.innerHTML = `FPS: ${currentFPS}<br>Particles: ${totalParticles}`;
        }
        
        particleSystem.update(deltaTime);
        
        requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}