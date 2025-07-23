import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';
import { HybridPresetManager } from './utils/HybridPresetManager.js';
import { PresetModal } from './ui/PresetModal.js';
import { MainUI } from './ui/MainUI.js';
import { UIStateManager } from './utils/UIStateManager.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { CloudSyncUI } from './ui/CloudSyncUI.js';
import { Logger } from './utils/Logger.js';

// Initialize the simple particle life system
async function init() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        Logger.error('Canvas element not found');
        return;
    }
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create hybrid preset manager (local + cloud)
    const presetManager = new HybridPresetManager();
    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    // Debug mode: Expose cleanup method globally for testing/debugging
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.cleanupCloudPresets = async () => {
          try {
            if (!presetManager.isCloudEnabled()) {
              Logger.info('Cloud sync not enabled');
              return 0;
            }
            return await presetManager.cleanupCloudPresets();
          } catch (error) {
            Logger.error('Cleanup failed:', error);
            throw error;
          }
        };
    }
    
    // Create cloud sync UI
    const cloudSyncUI = new CloudSyncUI(presetManager);
    cloudSyncUI.initialize(document.body);
    // Debug mode: Make cloudSyncUI globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.cloudSyncUI = cloudSyncUI;
    }
    
    // Create UI state manager
    const uiStateManager = new UIStateManager();
    // Debug mode: Make UI state manager globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.UIStateManager = UIStateManager;
        window.uiStateManager = uiStateManager;
    }
    
    // Debug mode: Make DOMHelpers available globally
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.DOMHelpers = DOMHelpers;
    }
    
    // Create particle system
    const particleSystem = new SimpleParticleSystem(canvas.width, canvas.height);
    particleSystem.setCanvas(canvas);
    // Debug mode: Make particle system globally accessible for testing
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.particleSystem = particleSystem;
    }
    
    // Sync initial state
    uiStateManager.syncFromParticleSystem(particleSystem);
    
    // Create preset modal
    const presetModal = new PresetModal(particleSystem, presetManager);
    // Debug mode: Make preset modal globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.presetModal = presetModal;
    }
    
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
                    Logger.debug('Auto-saved current scene');
                } else {
                    Logger.warn('Invalid scene data, skipping auto-save');
                }
            } catch (error) {
                Logger.warn('Failed to auto-save scene:', error);
            }
        }, 2000); // 2-second debounce
    };
    
    // Validation function for scene data
    const validateSceneData = (sceneData) => {
        if (!sceneData || typeof sceneData !== 'object') return false;
        
        // Check for reasonable species count
        if (sceneData.numSpecies && (sceneData.numSpecies < 1 || sceneData.numSpecies > 20)) {
            Logger.warn('Invalid species count in scene data:', sceneData.numSpecies);
            return false;
        }
        
        // Check for reasonable particle count
        if (sceneData.particlesPerSpecies && (sceneData.particlesPerSpecies < 0 || sceneData.particlesPerSpecies > 2000)) {
            Logger.warn('Invalid particles per species in scene data:', sceneData.particlesPerSpecies);
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
                Logger.debug('Loaded valid last scene from localStorage');
            } else {
                Logger.warn('Invalid scene data found, clearing localStorage');
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
        Logger.warn('Failed to load last scene, clearing localStorage:', error);
        localStorage.removeItem('lastScene');
        localStorage.removeItem('lastSelectedPreset');
        // No default preset to load - system will use default parameters
    }
    
    // Create main UI with new design system
    const mainUI = new MainUI(particleSystem, presetManager, autoSaveScene);
    // Debug mode: Make main UI globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.mainUI = mainUI;
    }
    
    // Automatically enable cloud sync
    setTimeout(async () => {
        try {
            await presetManager.enableCloudSync();
            Logger.info('Cloud sync automatically enabled');
            // Now update preset selector with both local and cloud presets
            mainUI.updatePresetSelector();
        } catch (error) {
            Logger.warn('Cloud sync failed to initialize:', error);
            // Continue without cloud sync - show local presets only
            mainUI.updatePresetSelector();
        }
    }, 1000); // Small delay to ensure UI is ready
    
    // Debug mode: Make emergency reset available globally for console access
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.emergencyReset = () => mainUI.emergencyReset();
    }
    
    
    // Global functions needed for PresetModal integration (always available)
    window.updateUIFromPreset = function(particleSystem) {
        mainUI.updateUIFromPreset();
    };
    
    window.updatePresetSelector = function() {
        mainUI.updatePresetSelector();
    };
    
    // Listen for cloud preset updates
    window.addEventListener('presetsUpdated', (event) => {
        Logger.debug('Presets updated event:', event.detail);
        mainUI.updatePresetSelector();
    });
    
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
            const cloudStatus = cloudSyncUI ? cloudSyncUI.getCloudStatus() : 'Cloud: Initializing...';
            perfOverlay.innerHTML = `FPS: ${currentFPS}<br>Particles: ${totalParticles}<br>Organisms: ${organisms}<br>${cloudStatus}`;
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