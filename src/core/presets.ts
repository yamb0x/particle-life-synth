export interface Preset {
    name: string;
    description: string;
    attractionMatrix: number[][];
    physics: {
        maxForce: number;
        maxSpeed: number;
        friction: number;
        minDistance: number;
        maxDistance: number;
    };
    particlesPerSpecies: number;
}

export const naturePresets: Preset[] = [
    {
        name: "Predator-Prey Ecosystem",
        description: "Red hunts Blue, Blue escapes to Green sanctuaries, Green feeds Yellow, Yellow avoids Red",
        attractionMatrix: [
            // Red (Predator)
            [0.0, 1.5, -0.3, -0.5, 0.2],
            // Blue (Prey)
            [-1.8, 0.3, 0.8, 0.0, -0.2],
            // Green (Sanctuary)
            [0.0, -0.8, 0.5, 0.6, 0.0],
            // Yellow (Scavenger)
            [-1.2, 0.0, 0.4, 0.3, 0.0],
            // Purple (Neutral)
            [0.0, 0.0, 0.0, 0.0, 0.2]
        ],
        physics: {
            maxForce: 1.2,
            maxSpeed: 5.0,
            friction: 0.03,
            minDistance: 12,
            maxDistance: 350
        },
        particlesPerSpecies: 150
    },
    {
        name: "Cellular Automata",
        description: "Particles form complex, self-organizing patterns like living cells",
        attractionMatrix: [
            [0.5, -0.8, 1.2, -0.3, 0.7],
            [-0.8, 0.8, -0.5, 1.0, -0.6],
            [1.2, -0.5, 0.3, -0.7, 0.9],
            [-0.3, 1.0, -0.7, 0.6, -0.4],
            [0.7, -0.6, 0.9, -0.4, 0.4]
        ],
        physics: {
            maxForce: 0.8,
            maxSpeed: 3.0,
            friction: 0.08,
            minDistance: 8,
            maxDistance: 200
        },
        particlesPerSpecies: 200
    },
    {
        name: "Coral Reef",
        description: "Symbiotic relationships create colorful, dynamic structures",
        attractionMatrix: [
            // Red (Coral)
            [0.8, 0.2, 0.4, -0.1, 0.3],
            // Blue (Fish)
            [0.3, 0.4, -0.2, 0.6, -0.3],
            // Green (Algae)
            [0.5, -0.1, 0.6, 0.2, 0.0],
            // Yellow (Cleaner)
            [0.0, 0.7, 0.3, 0.2, -0.1],
            // Purple (Predator)
            [-0.2, 0.9, -0.3, 0.8, 0.1]
        ],
        physics: {
            maxForce: 0.6,
            maxSpeed: 2.5,
            friction: 0.12,
            minDistance: 10,
            maxDistance: 250
        },
        particlesPerSpecies: 180
    },
    {
        name: "Magnetic Fields",
        description: "Particles behave like magnetic dipoles with attraction and repulsion zones",
        attractionMatrix: [
            [0.0, -1.5, 1.5, -1.5, 1.5],
            [1.5, 0.0, -1.5, 1.5, -1.5],
            [-1.5, 1.5, 0.0, -1.5, 1.5],
            [1.5, -1.5, 1.5, 0.0, -1.5],
            [-1.5, 1.5, -1.5, 1.5, 0.0]
        ],
        physics: {
            maxForce: 1.5,
            maxSpeed: 6.0,
            friction: 0.02,
            minDistance: 15,
            maxDistance: 400
        },
        particlesPerSpecies: 120
    },
    {
        name: "Flocking Birds",
        description: "Emergent flocking behavior with leaders and followers",
        attractionMatrix: [
            // Red (Leaders)
            [0.2, 0.1, 0.1, 0.1, 0.1],
            // Others (Followers)
            [1.2, 0.6, 0.3, 0.3, 0.3],
            [1.2, 0.3, 0.6, 0.3, 0.3],
            [1.2, 0.3, 0.3, 0.6, 0.3],
            [1.2, 0.3, 0.3, 0.3, 0.6]
        ],
        physics: {
            maxForce: 1.0,
            maxSpeed: 4.5,
            friction: 0.04,
            minDistance: 20,
            maxDistance: 300
        },
        particlesPerSpecies: 160
    },
    {
        name: "Chemical Reaction",
        description: "Particles react and transform like molecules in solution",
        attractionMatrix: [
            [0.3, 1.8, -0.9, 0.0, 0.5],
            [-1.8, 0.3, 1.8, -0.9, 0.0],
            [0.0, -1.8, 0.3, 1.8, -0.9],
            [0.5, 0.0, -1.8, 0.3, 1.8],
            [1.8, 0.5, 0.0, -1.8, 0.3]
        ],
        physics: {
            maxForce: 1.3,
            maxSpeed: 5.5,
            friction: 0.06,
            minDistance: 10,
            maxDistance: 280
        },
        particlesPerSpecies: 170
    },
    {
        name: "Galaxy Formation",
        description: "Gravitational dynamics create spiral galaxy patterns",
        attractionMatrix: [
            // Center (Black hole)
            [0.0, 2.0, 2.0, 2.0, 2.0],
            // Inner stars
            [-0.3, 0.4, 0.6, 0.5, 0.4],
            // Middle stars
            [-0.3, 0.5, 0.4, 0.6, 0.5],
            // Outer stars
            [-0.3, 0.4, 0.5, 0.4, 0.6],
            // Gas clouds
            [-0.2, 0.3, 0.3, 0.3, 0.2]
        ],
        physics: {
            maxForce: 0.7,
            maxSpeed: 3.5,
            friction: 0.01,
            minDistance: 25,
            maxDistance: 500
        },
        particlesPerSpecies: 140
    },
    {
        name: "Neural Network",
        description: "Information flows through interconnected nodes like neurons",
        attractionMatrix: [
            // Input neurons
            [0.1, 1.5, 0.0, 0.0, -0.5],
            // Hidden layer 1
            [-0.2, 0.1, 1.5, 0.0, -0.5],
            // Hidden layer 2
            [0.0, -0.2, 0.1, 1.5, -0.5],
            // Output neurons
            [0.0, 0.0, -0.2, 0.1, -0.5],
            // Inhibitory
            [-0.8, -0.8, -0.8, -0.8, 0.1]
        ],
        physics: {
            maxForce: 1.1,
            maxSpeed: 4.0,
            friction: 0.1,
            minDistance: 15,
            maxDistance: 250
        },
        particlesPerSpecies: 160
    }
];

export function applyPreset(particleSystem: any, preset: Preset): void {
    // Apply attraction matrix
    particleSystem.attractionMatrix = preset.attractionMatrix.map(row => [...row]);
    
    // Apply physics parameters
    Object.assign(particleSystem.physics, preset.physics);
    
    // Reinitialize particles if count differs
    const currentCount = particleSystem.particles.length / 5;
    if (Math.abs(currentCount - preset.particlesPerSpecies) > 10) {
        particleSystem.particles = [];
        particleSystem.initializeParticles(preset.particlesPerSpecies);
    }
}