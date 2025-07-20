import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';
import { PresetManager } from './utils/PresetManager.js';
import { PresetModal } from './ui/PresetModal.js';
import { MainUI } from './ui/MainUI.js';
import { UIStateManager } from './utils/UIStateManager.js';
import { DOMHelpers } from './utils/DOMHelpers.js';

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
    
    // Create UI state manager
    const uiStateManager = new UIStateManager();
    window.UIStateManager = UIStateManager; // Make class available globally
    window.uiStateManager = uiStateManager; // Make instance available globally
    
    // Make DOMHelpers available globally
    window.DOMHelpers = DOMHelpers;
    
    // Create particle system
    const particleSystem = new SimpleParticleSystem(canvas.width, canvas.height);
    particleSystem.setCanvas(canvas);
    window.particleSystem = particleSystem; // Make it globally accessible for testing
    
    // Sync initial state
    uiStateManager.syncFromParticleSystem(particleSystem);
    
    // Create preset modal
    const presetModal = new PresetModal(particleSystem, presetManager);
    window.presetModal = presetModal; // Make it globally accessible
    
    // Auto-save scene state on changes
    let saveTimeout;
    const autoSaveScene = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            try {
                const currentScene = particleSystem.exportPreset();
                
                // Validate before saving
                if (validateSceneData(currentScene)) {
                    localStorage.setItem('lastScene', JSON.stringify(currentScene));
                    console.log('Auto-saved current scene');
                } else {
                    console.warn('Invalid scene data, skipping auto-save');
                }
            } catch (error) {
                console.warn('Failed to auto-save scene:', error);
            }
        }, 2000); // 2-second debounce
    };
    
    // Validation function for scene data
    const validateSceneData = (sceneData) => {
        if (!sceneData || typeof sceneData !== 'object') return false;
        
        // Check for reasonable species count
        if (sceneData.numSpecies && (sceneData.numSpecies < 1 || sceneData.numSpecies > 20)) {
            console.warn('Invalid species count in scene data:', sceneData.numSpecies);
            return false;
        }
        
        // Check for reasonable particle count
        if (sceneData.particlesPerSpecies && (sceneData.particlesPerSpecies < 0 || sceneData.particlesPerSpecies > 2000)) {
            console.warn('Invalid particles per species in scene data:', sceneData.particlesPerSpecies);
            return false;
        }
        
        return true;
    };
    
    // Load the last scene or default preset
    try {
        const lastScene = localStorage.getItem('lastScene');
        if (lastScene) {
            const sceneData = JSON.parse(lastScene);
            
            // Validate the scene data before loading
            if (validateSceneData(sceneData)) {
                particleSystem.loadFullPreset(sceneData);
                console.log('Loaded valid last scene from localStorage');
            } else {
                console.warn('Invalid scene data found, clearing localStorage');
                localStorage.removeItem('lastScene');
                localStorage.removeItem('lastSelectedPreset');
                // No default preset to load - system will use default parameters
            }
        } else {
            // Fallback to last selected preset if available
            const lastSelectedPreset = localStorage.getItem('lastSelectedPreset');
            if (lastSelectedPreset) {
                const presetToLoad = presetManager.getPreset(lastSelectedPreset);
                if (presetToLoad) {
                    particleSystem.loadFullPreset(presetToLoad);
                }
            }
            // If no preset available, system will use default parameters
        }
    } catch (error) {
        console.warn('Failed to load last scene, clearing localStorage:', error);
        localStorage.removeItem('lastScene');
        localStorage.removeItem('lastSelectedPreset');
        // No default preset to load - system will use default parameters
    }
    
    // Create main UI with new design system
    const mainUI = new MainUI(particleSystem, presetManager, autoSaveScene);
    window.mainUI = mainUI; // Make it globally accessible
    
    // Update the preset selector to include saved presets
    mainUI.updatePresetSelector();
    
    // Make emergency reset available globally for console access
    window.emergencyReset = () => mainUI.emergencyReset();
    
    
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
            left: 10px;
            color: #ff6666;
            font-family: monospace;
            font-size: 11px;
            text-align: left;
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
            const totalParticles = particleSystem.particles.length;
            const organisms = particleSystem.numSpecies;
            perfOverlay.innerHTML = `FPS: ${currentFPS}<br>Particles: ${totalParticles}<br>Organisms: ${organisms}`;
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