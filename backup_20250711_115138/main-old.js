import { ParticleSystem } from './core/ParticleSystem.js';
import { WebGLRenderer } from './rendering/WebGLRenderer.js';
import { ParameterPanel } from './ui/ParameterPanel.js';
class ParticleLifeSynth {
    constructor() {
        this.isRunning = true;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.fpsUpdateTime = 0;
        this.canvas = document.getElementById('canvas');
        this.initializeCanvas();
        this.particleSystem = new ParticleSystem(this.canvas);
        this.renderer = new WebGLRenderer(this.canvas);
        this.parameterPanel = new ParameterPanel(this.particleSystem);
        this.setupEventListeners();
        this.startMainLoop();
    }
    initializeCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) {
            this.renderer.resize(this.canvas.width, this.canvas.height);
        }
        if (this.particleSystem) {
            this.particleSystem.resize(this.canvas.width, this.canvas.height);
        }
    }
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'c':
                    this.parameterPanel.toggle();
                    break;
                case ' ':
                    this.isRunning = !this.isRunning;
                    break;
                case 'r':
                    this.particleSystem.resetParticles();
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const speciesIndex = parseInt(event.key) - 1;
                    this.toggleSpecies(speciesIndex);
                    break;
            }
        });
    }
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        }
        else {
            document.exitFullscreen();
        }
    }
    toggleSpecies(index) {
        // Toggle visibility of particles of a specific species
        const particles = this.particleSystem.getParticles();
        let isActive = false;
        particles.forEach(particle => {
            if (particle.species === index) {
                // Toggle by setting size to 0 or restoring it
                if (particle.size > 0) {
                    particle.size = 0;
                }
                else {
                    particle.size = particle.isRunner ?
                        this.particleSystem.visual.particleSize * 1.5 :
                        this.particleSystem.visual.particleSize;
                    isActive = true;
                }
            }
        });
        // Update UI indicator
        const speciesIndicator = document.querySelector(`#activeSpecies span:nth-child(${index + 1})`);
        if (speciesIndicator) {
            speciesIndicator.style.opacity = isActive ? '1' : '0.2';
        }
    }
    startMainLoop() {
        const loop = (currentTime) => {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            if (this.isRunning) {
                this.update(deltaTime);
                this.render();
            }
            this.updateFPS(currentTime);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    update(deltaTime) {
        // Limit deltaTime to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 1 / 30);
        this.particleSystem.update(clampedDeltaTime);
    }
    render() {
        this.renderer.render(this.particleSystem);
    }
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            // Update UI stats
            const particleCount = this.particleSystem.getParticles().length;
            const speciesCount = 5; // TODO: Get from particle system
            this.parameterPanel.updateStats(this.fps, particleCount, speciesCount);
        }
    }
}
// Initialize the application
const app = new ParticleLifeSynth();
