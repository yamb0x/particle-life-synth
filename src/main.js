import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';
import { HybridPresetManager } from './utils/HybridPresetManager.js';
import { MainUI } from './ui/MainUI.js';
import { UIStateManager } from './utils/UIStateManager.js';
import { CollapsibleUIIntegration } from './ui/CollapsibleUIIntegration.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { CloudSyncUI } from './ui/CloudSyncUI.js';
import { Logger } from './utils/Logger.js';
import { AspectRatioManager } from './utils/AspectRatioManager.js';
import { EnvironmentManager } from './utils/EnvironmentManager.js';

// Initialize the simple particle life system
async function init() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        Logger.error('Canvas element not found');
        return;
    }
    
    // Create aspect ratio manager
    const aspectRatioManager = new AspectRatioManager(canvas);
    
    // Set initial canvas size
    aspectRatioManager.updateCanvas();
    
    // Create hybrid preset manager (local + cloud)
    const presetManager = new HybridPresetManager();
    // Wait for async initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    // Expose cleanup method for debugging when in debug mode
    if (EnvironmentManager.isDebugMode()) {
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
    const particleSystem = new SimpleParticleSystem(aspectRatioManager.canvas.width, aspectRatioManager.canvas.height);
    particleSystem.setCanvas(canvas);
    // Make particle system globally accessible for species synchronization
    window.particleSystem = particleSystem;
    window.aspectRatioManager = aspectRatioManager;
    
    // Store pending modulations from localStorage if any
    let pendingModulations = null;
    
    // Sync initial state
    uiStateManager.syncFromParticleSystem(particleSystem);
    
    // PresetModal removed - preset configuration now integrated directly in MainUI
    
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
                    // Scene saved to localStorage
                    Logger.debug('Auto-saved current scene');
                } else {
                    // Invalid scene data, skipping auto-save
                    Logger.warn('Invalid scene data, skipping auto-save');
                }
            } catch (error) {
                // Failed to auto-save scene
                Logger.warn('Failed to auto-save scene:', error);
            }
        }, 2000); // 2-second debounce
    };
    
    // Validation function for scene data
    const validateSceneData = (sceneData) => {
        if (!sceneData || typeof sceneData !== 'object') return false;
        
        // Handle both old format (top-level) and new format (nested)
        const numSpecies = sceneData.numSpecies || sceneData.particles?.numSpecies || sceneData.species?.count;
        const particlesPerSpecies = sceneData.particlesPerSpecies || sceneData.particles?.particlesPerSpecies;
        
        // Check for reasonable species count
        if (numSpecies && (numSpecies < 1 || numSpecies > 20)) {
            // Invalid species count
            Logger.warn('Invalid species count in scene data:', numSpecies);
            return false;
        }
        
        // Check for reasonable particle count
        if (particlesPerSpecies && (particlesPerSpecies < 0 || particlesPerSpecies > 2000)) {
            // Invalid particles per species
            Logger.warn('Invalid particles per species in scene data:', particlesPerSpecies);
            return false;
        }
        
        // If we have the new format, it's valid
        if (sceneData.particles || sceneData.species) {
            return true;
        }
        
        // For old format, check if we have at least some expected properties
        return !!(sceneData.numSpecies || sceneData.particlesPerSpecies || sceneData.socialForce);
    };
    
    // Load the last scene or default preset
    try {
        // Checking for lastScene in localStorage
        const lastScene = localStorage.getItem('lastScene');
        if (lastScene) {
            // Found lastScene, parsing
            const sceneData = JSON.parse(lastScene);
            
            // Validate the scene data before loading
            if (validateSceneData(sceneData)) {
                // Scene data is valid, loading preset
                // Store modulations to load after UI is created
                if (sceneData.modulations) {
                    pendingModulations = sceneData.modulations;
                }
                // Load preset without modulations (they'll be loaded after UI creation)
                const sceneWithoutModulations = { ...sceneData };
                delete sceneWithoutModulations.modulations;
                particleSystem.loadFullPreset(sceneWithoutModulations);
                Logger.debug('Loaded valid last scene from localStorage');
            } else {
                // Invalid scene data found, clearing localStorage
                Logger.warn('Invalid scene data found, clearing localStorage');
                localStorage.removeItem('lastScene');
                localStorage.removeItem('lastSelectedPreset');
                // No default preset to load - system will use default parameters
            }
        } else {
            // No lastScene found in localStorage
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
    const mainUI = new MainUI(particleSystem, presetManager, autoSaveScene, null, aspectRatioManager);
    // Make main UI globally accessible for keyboard shortcuts
    window.mainUI = mainUI;
    
    // Load pending modulations if any
    if (pendingModulations && mainUI.modulationManager) {
        try {
            mainUI.modulationManager.importConfig(pendingModulations);
            mainUI.updateModulationList();
        } catch (error) {
            // Failed to restore modulations
        }
    }
    
    // Initialize collapsible UI integration
    const collapsibleUI = new CollapsibleUIIntegration(mainUI);
    await collapsibleUI.initialize();
    
    // Debug mode: Make collapsibleUI globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.collapsibleUI = collapsibleUI;
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
    
    
    // Global functions for preset integration (always available)
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
        aspectRatioManager.updateCanvas();
        particleSystem.resize(aspectRatioManager.canvas.width, aspectRatioManager.canvas.height);
    });
    
    // Performance monitor completely removed - using integrated overlay instead
    const performanceMonitor = null; // Removed floating performance monitor
    
    // Create combined shortcuts and performance overlay
    function createCombinedOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'combined-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            color: white;
            font-family: monospace;
            font-size: 11px;
            text-align: left;
            pointer-events: none;
            z-index: var(--z-overlay);
            mix-blend-mode: difference;
            line-height: 1.4;
            display: flex;
            gap: 20px;
            align-items: flex-end;
        `;
        
        // Create shortcuts section
        const shortcutsSection = document.createElement('div');
        shortcutsSection.innerHTML = `
            C - Toggle controls<br>
            V - Randomize values<br>
            R - Randomize forces<br>
            M - Mute/freeze<br>
            Shift + - Next preset<br>
            Shift - - Previous preset
        `;
        
        // Create performance section
        const performanceSection = document.createElement('div');
        performanceSection.id = 'performance-section';
        performanceSection.innerHTML = `
            FPS: <span id="overlay-fps">--</span><br>
            Particles: <span id="overlay-particles">--</span><br>
            Species: <span id="overlay-species">--</span>
        `;
        
        overlay.appendChild(shortcutsSection);
        overlay.appendChild(performanceSection);
        
        document.body.appendChild(overlay);
        return overlay;
    }
    
    const combinedOverlay = createCombinedOverlay();
    
    // Animation loop
    let lastTime = 0;
    let frameCount = 0;
    let fpsTime = 0;
    let currentFPS = 60;
    
    function updateOverlayPerformanceData() {
        // Update FPS
        const fpsElement = document.getElementById('overlay-fps');
        if (fpsElement) {
            fpsElement.textContent = currentFPS.toString();
        }
        
        // Update particles count
        const particlesElement = document.getElementById('overlay-particles');
        if (particlesElement) {
            const particleCount = particleSystem.particles ? particleSystem.particles.length : 0;
            particlesElement.textContent = particleCount.toString();
        }
        
        // Update species count
        const speciesElement = document.getElementById('overlay-species');
        if (speciesElement) {
            const speciesCount = particleSystem.numSpecies || 0;
            speciesElement.textContent = speciesCount.toString();
        }
        
        // MUTED status display has been removed
    }
    
    function animate(currentTime) {
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        
        // Calculate FPS
        frameCount++;
        if (currentTime >= fpsTime + 1000) {
            currentFPS = Math.round((frameCount * 1000) / (currentTime - fpsTime));
            frameCount = 0;
            fpsTime = currentTime;
            
            // Performance monitor removed - no longer needed
            
            // Update overlay performance data
            updateOverlayPerformanceData();
        }
        
        // Update modulations if they exist
        if (window.mainUI && window.mainUI.modulationManager) {
            window.mainUI.modulationManager.update();
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