import { ComprehensiveParticleSystem } from './core/ComprehensiveParticleSystem.js';
import { ComprehensiveParameterPanel } from './ui/ComprehensiveParameterPanel.js';
// import { WebGLRenderer } from './rendering/WebGLRenderer.js';
// import { TrailRenderer } from './rendering/TrailRenderer.js';

// Initialize the comprehensive particle life system
async function init() {
    // Get canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create comprehensive particle system
    const particleSystem = new ComprehensiveParticleSystem(canvas.width, canvas.height);
    particleSystem.setCanvas(canvas);
    
    // Initialize with default parameters matching the screenshot
    particleSystem.setSpeciesCount(4); // Start with 4 colors
    particleSystem.setParticlesPerSpecies(200);
    
    // Initialize particles after canvas is set
    particleSystem.resetParticles();
    
    // Set initial attraction matrix for interesting behavior
    particleSystem.physics.attractionMatrix = [
        [0.3, -0.5, 0.2, -0.3],   // Green
        [-0.4, 0.5, -0.2, 0.6],   // Red
        [0.2, -0.3, 0.4, -0.1],   // Orange
        [-0.3, 0.4, -0.1, 0.3]    // Cyan
    ];
    
    // Create parameter panel
    const parameterPanel = new ComprehensiveParameterPanel(particleSystem);
    
    // We'll use Canvas 2D for now instead of WebGL
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        particleSystem.resize(canvas.width, canvas.height);
    });
    
    // Animation variables
    let lastTime = 0;
    let frameCount = 0;
    let fpsTime = 0;
    
    // Main render loop
    function render(currentTime: number) {
        // Calculate delta time
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
        lastTime = currentTime;
        
        // Update FPS counter
        frameCount++;
        if (currentTime - fpsTime >= 1000) {
            const fps = frameCount * 1000 / (currentTime - fpsTime);
            parameterPanel.updateFPS(fps);
            frameCount = 0;
            fpsTime = currentTime;
        }
        
        // Update particle system
        particleSystem.update(deltaTime);
        
        // Canvas is cleared in the rendering section below
        
        // Get particles
        const particles = particleSystem.getParticles();
        
        // Render trails if enabled
        if (particleSystem.rendering.trailLength > 0) {
            for (const particle of particles) {
                if (particle.trailX.length > 1) {
                    // Trail rendering would go here
                    // trailRenderer.renderTrail(particle);
                }
            }
        }
        
        // Prepare particle data for rendering
        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];
        
        for (const particle of particles) {
            positions.push(particle.x, particle.y);
            
            // Apply glow intensity to color
            const glowIntensity = particleSystem.rendering.glowIntensity[particle.species];
            colors.push(
                particle.color[0] * (1 + glowIntensity),
                particle.color[1] * (1 + glowIntensity),
                particle.color[2] * (1 + glowIntensity),
                1.0
            );
            
            sizes.push(particle.size);
        }
        
        // Render particles using the particle system
        // Note: The existing WebGLRenderer expects a ParticleSystem, not our ComprehensiveParticleSystem
        // For now, we'll render particles directly to canvas
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw particles
        for (let i = 0; i < positions.length; i += 2) {
            const x = positions[i];
            const y = positions[i + 1];
            const r = colors[i * 2] * 255;
            const g = colors[i * 2 + 1] * 255;
            const b = colors[i * 2 + 2] * 255;
            const size = sizes[i / 2];
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fill();
        }
        
        // Optional: Render pheromone field visualization
        if (particleSystem.chemical.pheromoneTypes > 0) {
            // Could add pheromone visualization here
        }
        
        // Optional: Render resource field visualization
        // Could add resource field visualization here
        
        // Continue animation
        requestAnimationFrame(render);
    }
    
    // Start animation
    requestAnimationFrame(render);
    
    // Add interaction handlers
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Create a pulse effect at click location
        // This could affect nearby particles or create temporary forces
        const particles = particleSystem.getParticles();
        for (const particle of particles) {
            const dx = particle.x - x;
            const dy = particle.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                // Push particles away from click
                const force = 50 / (distance + 1);
                particle.vx += (dx / distance) * force;
                particle.vy += (dy / distance) * force;
            }
        }
    });
    
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'r':
            case 'R':
                particleSystem.resetParticles();
                break;
            case 'p':
            case 'P':
                // Pause/unpause
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                // Load preset
                const presets = [
                    'biological_ecosystem',
                    'quantum_foam',
                    'neural_network',
                    'fluid_dynamics',
                    'crystalline_growth'
                ];
                const presetIndex = parseInt(e.key) - 1;
                if (presetIndex < presets.length) {
                    particleSystem.loadPreset(presets[presetIndex]);
                }
                break;
        }
    });
    
    // Log system info
    console.log('Comprehensive Particle Life System initialized');
    console.log('Press C to toggle parameter panel');
    console.log('Press R to reset particles');
    console.log('Press 1-5 to load presets');
    console.log('Click to create pulse effects');
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}