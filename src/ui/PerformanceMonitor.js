import { DOMHelpers } from '../utils/DOMHelpers.js';

export class PerformanceMonitor {
    constructor(particleSystem, audioSystem = null) {
        this.particleSystem = particleSystem;
        this.audioSystem = audioSystem;
        this.container = null;
        this.isVisible = true;
        this.isCollapsed = false;
        this.updateInterval = 1000; // Update every second
        this.lastUpdate = 0;
        
        // Performance tracking
        this.frameCount = 0;
        this.fpsTime = 0;
        this.currentFPS = 60;
        this.memoryUsage = 0;
        
        this.init();
    }
    
    init() {
        this.createMonitorUI();
        this.setupEventListeners();
        this.startMonitoring();
    }
    
    createMonitorUI() {
        const container = document.createElement('div');
        container.id = 'performance-monitor';
        container.className = 'performance-monitor';
        container.innerHTML = `
            <div class="performance-header">
                <span class="performance-title">Performance</span>
                <button class="performance-toggle" type="button" aria-label="Toggle performance monitor">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                </button>
            </div>
            <div class="performance-content">
                <div class="performance-metrics">
                    <div class="metric-row">
                        <span class="metric-label">FPS:</span>
                        <span class="metric-value" id="fps-value">--</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Frame Time:</span>
                        <span class="metric-value" id="frame-time-value">--</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Particles:</span>
                        <span class="metric-value" id="particles-value">--</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Species:</span>
                        <span class="metric-value" id="species-value">--</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Memory:</span>
                        <span class="metric-value" id="memory-value">--</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Audio:</span>
                        <span class="metric-value" id="audio-status-value">--</span>
                    </div>
                </div>
            </div>
        `;
        
        this.container = container;
        document.body.appendChild(container);
    }
    
    setupEventListeners() {
        const toggleButton = this.container.querySelector('.performance-toggle');
        DOMHelpers.safeAddEventListener(toggleButton, 'click', () => {
            this.toggleCollapse();
        });
        
        // Handle double-click to hide/show entire monitor
        DOMHelpers.safeAddEventListener(this.container, 'dblclick', () => {
            this.toggleVisibility();
        });
    }
    
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        const content = this.container.querySelector('.performance-content');
        const toggleIcon = this.container.querySelector('.performance-toggle svg');
        
        if (this.isCollapsed) {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            toggleIcon.style.transform = 'rotate(-90deg)';
            this.container.classList.add('collapsed');
        } else {
            content.style.maxHeight = 'var(--collapsible-max-height)';
            content.style.opacity = '1';
            toggleIcon.style.transform = 'rotate(0deg)';
            this.container.classList.remove('collapsed');
        }
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    
    startMonitoring() {
        const updateMetrics = (currentTime) => {
            // Calculate FPS
            this.frameCount++;
            if (currentTime >= this.fpsTime + this.updateInterval) {
                this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.fpsTime));
                this.frameCount = 0;
                this.fpsTime = currentTime;
                
                this.updateDisplay();
            }
            
            requestAnimationFrame(updateMetrics);
        };
        
        requestAnimationFrame(updateMetrics);
    }
    
    updateDisplay() {
        if (!this.isVisible) return;
        
        // FPS
        const fpsColor = this.getFPSColor(this.currentFPS);
        DOMHelpers.safeUpdateElement('fps-value', 'textContent', this.currentFPS.toString());
        DOMHelpers.setStyleSafely('fps-value', 'color', fpsColor);
        
        // Frame Time
        const frameTime = this.particleSystem.avgFrameTime || 16.67;
        DOMHelpers.safeUpdateElement('frame-time-value', 'textContent', `${frameTime.toFixed(1)}ms`);
        
        // Particles
        const particleCount = this.particleSystem.particles ? this.particleSystem.particles.length : 0;
        DOMHelpers.safeUpdateElement('particles-value', 'textContent', particleCount.toString());
        
        // Species
        const speciesCount = this.particleSystem.numSpecies || 0;
        DOMHelpers.safeUpdateElement('species-value', 'textContent', speciesCount.toString());
        
        // Memory (if available)
        this.updateMemoryUsage();
        
        // Audio Status
        this.updateAudioStatus();
    }
    
    updateMemoryUsage() {
        if (performance.memory) {
            const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            DOMHelpers.safeUpdateElement('memory-value', 'textContent', `${memoryMB}MB`);
        } else {
            DOMHelpers.safeUpdateElement('memory-value', 'textContent', 'N/A');
        }
    }
    
    updateAudioStatus() {
        let audioStatus = 'Inactive';
        let audioColor = 'var(--text-tertiary)';
        
        if (this.audioSystem && this.audioSystem.isInitialized) {
            if (this.audioSystem.audioEngine && this.audioSystem.audioEngine.audioContext) {
                const contextState = this.audioSystem.audioEngine.audioContext.state;
                switch (contextState) {
                    case 'running':
                        audioStatus = 'Active';
                        audioColor = 'var(--accent-success)';
                        break;
                    case 'suspended':
                        audioStatus = 'Suspended';
                        audioColor = 'var(--accent-secondary)';
                        break;
                    default:
                        audioStatus = contextState;
                        audioColor = 'var(--text-secondary)';
                }
            } else {
                audioStatus = 'Ready';
                audioColor = 'var(--text-secondary)';
            }
        }
        
        DOMHelpers.safeUpdateElement('audio-status-value', 'textContent', audioStatus);
        DOMHelpers.setStyleSafely('audio-status-value', 'color', audioColor);
    }
    
    getFPSColor(fps) {
        if (fps >= 50) return 'var(--accent-success)';
        if (fps >= 30) return 'var(--accent-secondary)';
        if (fps >= 20) return 'var(--text-secondary)';
        return 'var(--accent-danger)';
    }
    
    // Public API methods
    setUpdateInterval(interval) {
        this.updateInterval = Math.max(100, interval); // Minimum 100ms
    }
    
    setAudioSystem(audioSystem) {
        this.audioSystem = audioSystem;
    }
    
    getMetrics() {
        return {
            fps: this.currentFPS,
            frameTime: this.particleSystem.avgFrameTime || 16.67,
            particles: this.particleSystem.particles ? this.particleSystem.particles.length : 0,
            species: this.particleSystem.numSpecies || 0,
            memory: performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024) : 0
        };
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}