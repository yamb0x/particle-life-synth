import { SimpleParticleSystem } from './core/SimpleParticleSystem.js';
import { HybridPresetManager } from './utils/HybridPresetManager.js';
import { PresetModal } from './ui/PresetModal.js';
import { MainUI } from './ui/MainUI.js';
import { UIStateManager } from './utils/UIStateManager.js';
import { CollapsibleUIIntegration } from './ui/CollapsibleUIIntegration.js';
import { DOMHelpers } from './utils/DOMHelpers.js';
import { CloudSyncUI } from './ui/CloudSyncUI.js';
import { Logger } from './utils/Logger.js';
import { AspectRatioManager } from './utils/AspectRatioManager.js';
import { getAudioSystem } from './audio/AudioSystem.js';
import { LeftPanel } from './ui/LeftPanel.js';
import { PerformanceMonitor } from './ui/PerformanceMonitor.js';

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
    const particleSystem = new SimpleParticleSystem(aspectRatioManager.canvas.width, aspectRatioManager.canvas.height);
    particleSystem.setCanvas(canvas);
    // Debug mode: Make particle system globally accessible for testing
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.particleSystem = particleSystem;
        window.aspectRatioManager = aspectRatioManager;
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
    const mainUI = new MainUI(particleSystem, presetManager, autoSaveScene, presetModal, aspectRatioManager);
    // Debug mode: Make main UI globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.mainUI = mainUI;
    }
    
    // Initialize collapsible UI integration
    const collapsibleUI = new CollapsibleUIIntegration(mainUI);
    await collapsibleUI.initialize();
    
    // Debug mode: Make collapsibleUI globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.collapsibleUI = collapsibleUI;
    }
    
    // Initialize audio system and left panel with improved initialization
    const audioSystem = getAudioSystem();
    let audioInitialized = false;
    let leftPanel = null;
    
    // Create and initialize left panel immediately (before audio is enabled)
    leftPanel = new LeftPanel(audioSystem, particleSystem);
    leftPanel.initialize();
    
    // Ensure it's visible
    setTimeout(() => {
        leftPanel.show();
    }, 100);
    
    // Debug mode: Make audio system and left panel globally accessible
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.audioSystem = audioSystem;
        window.leftPanel = leftPanel;
    }
    
    // Function to initialize audio after user interaction
    const initializeAudio = async () => {
        if (audioInitialized) {
            // Audio already initialized
            return true;
        }
        
        // Attempting to initialize audio system
        
        try {
            await audioSystem.initialize(aspectRatioManager.canvas.width, aspectRatioManager.canvas.height);
            
            // Ensure audio context is resumed (handles Chrome autoplay policy)
            if (audioSystem.audioEngine && audioSystem.audioEngine.audioContext) {
                const state = audioSystem.audioEngine.audioContext.state;
                // Check audio context state
                
                if (state === 'suspended') {
                    // Attempting to resume suspended AudioContext
                    const resumed = await audioSystem.audioEngine.resume();
                    if (resumed) {
                        // Audio context resumed successfully
                    } else {
                        // Audio context still suspended - will resume on interaction
                    }
                }
                
                // Final state check
                const finalState = audioSystem.audioEngine.audioContext.state;
                // Audio context state checked
            }
            
            Logger.info('Audio system initialized successfully');
            audioInitialized = true;
            
            // Update UI to reflect audio state
            if (leftPanel) {
                leftPanel.updateAudioState(true);
            }
            
            return true;
        } catch (error) {
            Logger.error('Failed to initialize audio system:', error);
            console.error('Audio initialization error details:', error);
            return false;
        }
    };
    
    // Make initializeAudio globally available for keyboard shortcut
    window.initializeAudio = initializeAudio;
    window.isAudioInitialized = () => audioInitialized;
    
    // Multi-layered approach to audio initialization
    
    // 1. Try to initialize on any user interaction with the document (more aggressive)
    let initializationInProgress = false;
    const initOnInteraction = async (e) => {
        // Prevent multiple simultaneous initialization attempts
        if (initializationInProgress) {
            return;
        }
        
        console.log('User interaction detected:', e.type);
        
        // Always try to initialize or resume audio
        if (!audioInitialized) {
            initializationInProgress = true;
            const success = await initializeAudio();
            initializationInProgress = false;
            
            if (success) {
                // Remove listeners only if audio is fully running
                if (audioSystem.audioEngine.audioContext.state === 'running') {
                    document.removeEventListener('click', initOnInteraction);
                    document.removeEventListener('touchstart', initOnInteraction);
                    document.removeEventListener('keydown', initOnInteraction);
                    canvas.removeEventListener('click', initOnInteraction);
                    canvas.removeEventListener('touchstart', initOnInteraction);
                    // Audio fully active - removing initialization listeners
                } else {
                    // Audio initialized but suspended - keeping listeners
                }
            }
        } else if (audioSystem && audioSystem.audioEngine && audioSystem.audioEngine.audioContext) {
            // If already initialized but suspended, try to resume
            if (audioSystem.audioEngine.audioContext.state === 'suspended') {
                // Audio suspended - attempting to resume
                const resumed = await audioSystem.audioEngine.resume();
                if (resumed) {
                    // Audio resumed from suspended state
                    // Now remove listeners since audio is running
                    document.removeEventListener('click', initOnInteraction);
                    document.removeEventListener('touchstart', initOnInteraction);
                    document.removeEventListener('keydown', initOnInteraction);
                    canvas.removeEventListener('click', initOnInteraction);
                    canvas.removeEventListener('touchstart', initOnInteraction);
                }
            }
        }
    };
    
    // 2. Listen on document level (catches more interactions)
    document.addEventListener('click', initOnInteraction, { once: false });
    document.addEventListener('touchstart', initOnInteraction, { once: false });
    document.addEventListener('keydown', initOnInteraction, { once: false });
    
    // 3. Also keep canvas-specific listeners as backup
    canvas.addEventListener('click', initOnInteraction, { once: false });
    canvas.addEventListener('touchstart', initOnInteraction, { once: false });
    
    // 4. Don't auto-initialize - Chrome's autoplay policy requires user gesture
    // Just log a message to inform the user
    setTimeout(() => {
        if (!audioInitialized) {
            // Audio system ready - waiting for user interaction
        }
    }, 500);
    
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
        aspectRatioManager.updateCanvas();
        particleSystem.resize(aspectRatioManager.canvas.width, aspectRatioManager.canvas.height);
    });
    
    // Create performance monitor
    const performanceMonitor = new PerformanceMonitor(particleSystem);
    
    // Create shortcuts overlay
    function createShortcutsOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'shortcuts-overlay';
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
        `;
        overlay.innerHTML = `
            C - Toggle controls & audio<br>
            V - Randomize values<br>
            R - Randomize forces<br>
            M - Mute/freeze<br>
            Shift + - Next preset<br>
            Shift - - Previous preset
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    const shortcutsOverlay = createShortcutsOverlay();
    
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
            
            // Update performance monitor with audio system reference
            if (audioSystem && !performanceMonitor.audioSystem) {
                performanceMonitor.setAudioSystem(audioSystem);
            }
        }
        
        particleSystem.update(deltaTime);
        
        // Update audio system with particle data
        if (audioSystem && audioSystem.isInitialized) {
            audioSystem.updateParticles(particleSystem.particles);
            
            // Draw sampling area overlay on canvas
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.save();
                audioSystem.drawOverlay(ctx);
                ctx.restore();
            }
        }
        
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