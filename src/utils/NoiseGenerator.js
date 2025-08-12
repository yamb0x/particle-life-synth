/**
 * Advanced noise generation system for particle motion
 * Provides multiple noise patterns with clear, distinct visual characteristics
 */

export class NoiseGenerator {
    constructor(seed = null) {
        // Use provided seed or generate a random one
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this.rng = this.createSeededRandom(this.seed);
        // Noise configuration - optimized for clear, large-scale patterns
        this.patterns = {
            perlin: {
                name: 'Perlin',
                scale: 2.5,       // Smooth, organic flow
                timeScale: 0.3,   // Slow evolution
                amplitude: 1.0,
                octaves: 3,
                persistence: 0.5,
                lacunarity: 2.0
            },
            simplex: {
                name: 'Simplex',
                scale: 1.8,       // Larger, smoother patterns
                timeScale: 0.4,
                amplitude: 1.0,
                octaves: 2,       // Fewer octaves for cleaner look
                persistence: 0.6
            },
            voronoi: {
                name: 'Voronoi',
                scale: 4.0,       // Clear cell regions
                timeScale: 0.2,   // Slow cell movement
                amplitude: 1.0,
                cellCount: 8,     // Fewer, larger cells
                jitter: 0.5       // Less randomness
            },
            worley: {
                name: 'Worley',
                scale: 3.5,       // Distinct cellular structure
                timeScale: 0.25,
                amplitude: 1.0,
                cellsPerAxis: 4,  // 4x4 grid for larger cells
                distanceFunction: 'euclidean',
                featurePoint: 1
            },
            fbm: {
                name: 'FBM',
                scale: 2.0,       // Multi-scale detail
                timeScale: 0.35,
                amplitude: 1.0,
                octaves: 5,       // More octaves for fractal detail
                lacunarity: 2.3,  // Higher frequency ratio
                gain: 0.45        // Slightly less amplitude decay
            },
            ridged: {
                name: 'Ridged',
                scale: 2.8,       // Mountain ridge patterns
                timeScale: 0.3,
                amplitude: 1.0,
                octaves: 3,
                lacunarity: 2.5,  // Sharp frequency jumps
                gain: 0.4,
                offset: 1.0       // More pronounced ridges
            },
            turbulence: {
                name: 'Turbulence',
                scale: 3.2,       // Chaotic swirls
                timeScale: 0.5,   // Faster animation
                amplitude: 1.0,
                octaves: 4,
                roughness: 0.65   // More turbulent
            },
            curl: {
                name: 'Curl',
                scale: 2.2,       // Swirling vortices
                timeScale: 0.35,
                amplitude: 1.0,
                epsilon: 0.02     // Larger gradient sampling
            },
            flow: {
                name: 'Flow Field',
                scale: 1.5,       // Large flow patterns
                timeScale: 0.25,
                amplitude: 1.0,
                vortexCount: 3,   // Fewer, stronger vortices
                vortexStrength: 3.0
            },
            waves: {
                name: 'Wave Interference',
                scale: 4.5,       // Wave frequency
                timeScale: 0.6,   // Wave speed
                amplitude: 1.0,
                waveCount: 4,     // More wave sources
                frequency: 3.0    // Higher frequency
            },
            cubic: {
                name: 'Cubic',
                scale: 3.0,       // Smooth interpolation
                timeScale: 0.45,
                amplitude: 1.0,
                frequency: 1.5    // More variation
            },
            cellular: {
                name: 'Cellular',
                scale: 5.0,       // Binary cell patterns
                timeScale: 0.15,  // Very slow evolution
                amplitude: 1.0,
                cellSize: 6,      // Medium cells
                threshold: 0.4    // More filled cells
            }
        };
        
        // Active pattern
        this.activePattern = 'perlin';
        
        // Global parameters
        this.globalScale = 1.0;
        this.globalTimeScale = 1.0;
        this.globalAmplitude = 0.0;
        this.contrast = 1.0;
        this.globalOctaves = 3;  // Default octaves for patterns that support it
        
        // Time tracking - reasonable increment for visible evolution
        this.time = 0;
        this.timeIncrement = 0.01; // Visible animation speed
        
        // Precomputed values for Perlin/Simplex
        this.permutation = this.generatePermutation();
        this.gradients = this.generateGradients();
        
        // Seeds for cellular patterns
        this.voronoiSeeds = [];
        this.worleyGrid = new Map();
        this.cellularGrid = [];
        this.generateVoronoiSeeds();
        this.generateWorleyGrid();
        this.generateCellularGrid();
        
        // Flow field vortices
        this.vortices = this.generateVortices();
        
        // Wave sources
        this.waveSources = this.generateWaveSources();
    }
    
    // Create a seeded random number generator
    createSeededRandom(seed) {
        let s = seed;
        return function() {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    }
    
    setSeed(seed) {
        this.seed = seed;
        this.rng = this.createSeededRandom(seed);
        
        // Regenerate all random elements with new seed
        this.permutation = this.generatePermutation();
        this.generateVoronoiSeeds();
        this.generateWorleyGrid();
        this.generateCellularGrid();
        this.vortices = this.generateVortices();
        this.waveSources = this.generateWaveSources();
    }
    
    generatePermutation() {
        const p = new Uint8Array(512);
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        
        // Fisher-Yates shuffle with seeded random
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(this.rng() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplicate for overflow
        for (let i = 0; i < 256; i++) {
            p[256 + i] = p[i];
        }
        
        return p;
    }
    
    generateGradients() {
        // 3D gradient vectors for Perlin noise - normalized vectors to cube edges
        const gradients = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];
        
        // Normalize
        return gradients.map(g => {
            const len = Math.sqrt(g[0]*g[0] + g[1]*g[1] + g[2]*g[2]);
            return [g[0]/len, g[1]/len, g[2]/len];
        });
    }
    
    generateVoronoiSeeds() {
        const config = this.patterns.voronoi;
        this.voronoiSeeds = [];
        
        // Create a grid of cells with jittered points
        const gridSize = Math.ceil(Math.sqrt(config.cellCount));
        const cellSize = 1.0 / gridSize;
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (this.voronoiSeeds.length >= config.cellCount) break;
                
                // Jittered grid position with seeded random
                const jitterX = (this.rng() - 0.5) * config.jitter;
                const jitterY = (this.rng() - 0.5) * config.jitter;
                
                this.voronoiSeeds.push({
                    x: (x + 0.5) * cellSize + jitterX * cellSize,
                    y: (y + 0.5) * cellSize + jitterY * cellSize,
                    vx: (this.rng() - 0.5) * 0.001,
                    vy: (this.rng() - 0.5) * 0.001
                });
            }
        }
    }
    
    generateWorleyGrid() {
        const config = this.patterns.worley;
        this.worleyGrid.clear();
        
        // Generate points in a grid
        const cellSize = 1.0 / config.cellsPerAxis;
        
        for (let cy = 0; cy < config.cellsPerAxis; cy++) {
            for (let cx = 0; cx < config.cellsPerAxis; cx++) {
                const key = `${cx},${cy}`;
                this.worleyGrid.set(key, {
                    x: (cx + this.rng()) * cellSize,
                    y: (cy + this.rng()) * cellSize
                });
            }
        }
    }
    
    generateVortices() {
        const config = this.patterns.flow;
        const vortices = [];
        
        for (let i = 0; i < config.vortexCount; i++) {
            vortices.push({
                x: this.rng(),
                y: this.rng(),
                strength: (this.rng() - 0.5) * config.vortexStrength,
                radius: 0.2 + this.rng() * 0.3
            });
        }
        
        return vortices;
    }
    
    generateWaveSources() {
        const config = this.patterns.waves;
        const sources = [];
        
        for (let i = 0; i < config.waveCount; i++) {
            sources.push({
                x: this.rng(),
                y: this.rng(),
                frequency: 0.5 + this.rng() * 2,
                amplitude: 0.5 + this.rng() * 0.5,
                phase: this.rng() * Math.PI * 2
            });
        }
        
        return sources;
    }
    
    generateCellularGrid() {
        // Generate random cellular automata-like grid
        this.cellularGrid = [];
        const gridSize = 20;
        for (let y = 0; y < gridSize; y++) {
            this.cellularGrid[y] = [];
            for (let x = 0; x < gridSize; x++) {
                this.cellularGrid[y][x] = this.rng() > 0.5 ? 1 : 0;
            }
        }
    }
    
    // Improved fade function for smoother interpolation
    fade(t) {
        // 6t^5 - 15t^4 + 10t^3 (Perlin's improved fade)
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    dot3(g, x, y, z) {
        return g[0] * x + g[1] * y + g[2] * z;
    }
    
    // Improved Perlin noise with proper gradients
    perlinNoise(x, y, t) {
        const config = this.patterns.perlin;
        
        // Apply scale
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale ; // Slower time
        
        let total = 0;
        let amplitude = config.amplitude;
        let frequency = 1;
        let maxValue = 0;
        
        for (let octave = 0; octave < config.octaves; octave++) {
            const fx = x * frequency;
            const fy = y * frequency;
            const fz = t;
            
            // Integer coordinates
            const X = Math.floor(fx) & 255;
            const Y = Math.floor(fy) & 255;
            const Z = Math.floor(fz) & 255;
            
            // Fractional coordinates
            const xf = fx - Math.floor(fx);
            const yf = fy - Math.floor(fy);
            const zf = fz - Math.floor(fz);
            
            // Fade curves
            const u = this.fade(xf);
            const v = this.fade(yf);
            const w = this.fade(zf);
            
            // Hash coordinates
            const p = this.permutation;
            const A = p[X] + Y;
            const AA = p[A] + Z;
            const AB = p[A + 1] + Z;
            const B = p[X + 1] + Y;
            const BA = p[B] + Z;
            const BB = p[B + 1] + Z;
            
            // Get gradients
            const g = this.gradients;
            
            // Calculate dot products and interpolate
            const x1 = this.lerp(
                this.dot3(g[p[AA] % 12], xf, yf, zf),
                this.dot3(g[p[BA] % 12], xf - 1, yf, zf),
                u
            );
            const x2 = this.lerp(
                this.dot3(g[p[AB] % 12], xf, yf - 1, zf),
                this.dot3(g[p[BB] % 12], xf - 1, yf - 1, zf),
                u
            );
            const y1 = this.lerp(x1, x2, v);
            
            const x3 = this.lerp(
                this.dot3(g[p[AA + 1] % 12], xf, yf, zf - 1),
                this.dot3(g[p[BA + 1] % 12], xf - 1, yf, zf - 1),
                u
            );
            const x4 = this.lerp(
                this.dot3(g[p[AB + 1] % 12], xf, yf - 1, zf - 1),
                this.dot3(g[p[BB + 1] % 12], xf - 1, yf - 1, zf - 1),
                u
            );
            const y2 = this.lerp(x3, x4, v);
            
            const result = this.lerp(y1, y2, w);
            
            total += result * amplitude;
            maxValue += amplitude;
            
            amplitude *= config.persistence;
            frequency *= config.lacunarity;
        }
        
        return total / maxValue;
    }
    
    // Simplex noise (2D)
    simplexNoise(x, y, t) {
        const config = this.patterns.simplex;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale ;
        
        // Use time to create a 3D coordinate
        const z = t;
        
        // Skewing factors for 2D
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        
        // Skew the input space
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const t0 = (i + j) * G2;
        const X0 = i - t0;
        const Y0 = j - t0;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        // Determine simplex
        let i1, j1;
        if (x0 > y0) {
            i1 = 1; j1 = 0;
        } else {
            i1 = 0; j1 = 1;
        }
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        
        // Hash
        const ii = i & 255;
        const jj = j & 255;
        const p = this.permutation;
        const gi0 = p[ii + p[jj]] % 12;
        const gi1 = p[ii + i1 + p[jj + j1]] % 12;
        const gi2 = p[ii + 1 + p[jj + 1]] % 12;
        
        // Calculate contributions
        const g = this.gradients;
        let n0 = 0, n1 = 0, n2 = 0;
        
        let t1 = 0.5 - x0*x0 - y0*y0;
        if (t1 >= 0) {
            t1 *= t1;
            n0 = t1 * t1 * this.dot3(g[gi0], x0, y0, 0);
        }
        
        let t2 = 0.5 - x1*x1 - y1*y1;
        if (t2 >= 0) {
            t2 *= t2;
            n1 = t2 * t2 * this.dot3(g[gi1], x1, y1, 0);
        }
        
        let t3 = 0.5 - x2*x2 - y2*y2;
        if (t3 >= 0) {
            t3 *= t3;
            n2 = t3 * t3 * this.dot3(g[gi2], x2, y2, 0);
        }
        
        // Scale output to [-1, 1]
        return 70.0 * (n0 + n1 + n2) / 70.0; // Normalize properly
    }
    
    // Proper Voronoi noise with cellular structure
    voronoiNoise(x, y, t) {
        const config = this.patterns.voronoi;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale ;
        
        // Animate seeds slightly
        const animatedSeeds = this.voronoiSeeds.map(seed => ({
            x: seed.x + Math.sin(t + seed.x * 10) * 0.02,
            y: seed.y + Math.cos(t + seed.y * 10) * 0.02
        }));
        
        // Find closest seed
        let minDist = Infinity;
        let secondMinDist = Infinity;
        
        // Check main space and wrapped positions for seamless tiling
        for (let wx = -1; wx <= 1; wx++) {
            for (let wy = -1; wy <= 1; wy++) {
                for (const seed of animatedSeeds) {
                    const sx = seed.x + wx;
                    const sy = seed.y + wy;
                    
                    const dx = x - sx;
                    const dy = y - sy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < minDist) {
                        secondMinDist = minDist;
                        minDist = dist;
                    } else if (dist < secondMinDist) {
                        secondMinDist = dist;
                    }
                }
            }
        }
        
        // Use difference between closest and second closest for edge detection
        const edgeDist = secondMinDist - minDist;
        
        // Create clear cellular pattern
        return 1.0 - minDist * 2; // Invert and scale for clear cells
    }
    
    // Proper Worley noise
    worleyNoise(x, y, t) {
        const config = this.patterns.worley;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale ;
        
        // Determine which cell we're in
        const cellSize = 1.0 / config.cellsPerAxis;
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        
        // Find distances to points in neighboring cells
        const distances = [];
        
        for (let cy = cellY - 1; cy <= cellY + 1; cy++) {
            for (let cx = cellX - 1; cx <= cellX + 1; cx++) {
                // Wrap cells
                const wcx = ((cx % config.cellsPerAxis) + config.cellsPerAxis) % config.cellsPerAxis;
                const wcy = ((cy % config.cellsPerAxis) + config.cellsPerAxis) % config.cellsPerAxis;
                
                const key = `${wcx},${wcy}`;
                const point = this.worleyGrid.get(key);
                
                if (point) {
                    // Adjust point position for wrapped cells
                    const px = point.x + (cx - wcx) * cellSize;
                    const py = point.y + (cy - wcy) * cellSize;
                    
                    // Animate slightly
                    const apx = px + Math.sin(t + px * 10) * 0.01;
                    const apy = py + Math.cos(t + py * 10) * 0.01;
                    
                    const dx = x - apx;
                    const dy = y - apy;
                    
                    let dist;
                    if (config.distanceFunction === 'manhattan') {
                        dist = Math.abs(dx) + Math.abs(dy);
                    } else if (config.distanceFunction === 'chebyshev') {
                        dist = Math.max(Math.abs(dx), Math.abs(dy));
                    } else {
                        dist = Math.sqrt(dx * dx + dy * dy);
                    }
                    
                    distances.push(dist);
                }
            }
        }
        
        // Sort distances
        distances.sort((a, b) => a - b);
        
        // Use nth closest point
        const n = Math.min(config.featurePoint - 1, distances.length - 1);
        const value = distances[n] || 0;
        
        // Normalize and invert for clear pattern
        return 1.0 - Math.min(1.0, value * 3);
    }
    
    // Fractal Brownian Motion
    fbmNoise(x, y, t) {
        const config = this.patterns.fbm;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < config.octaves; i++) {
            total += this.perlinNoise(x * frequency, y * frequency, t) * amplitude;
            maxValue += amplitude;
            frequency *= config.lacunarity;
            amplitude *= config.gain;
        }
        
        return total / maxValue;
    }
    
    // Ridged noise - creates ridge-like patterns
    ridgedNoise(x, y, t) {
        const config = this.patterns.ridged;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let weight = 1;
        let maxValue = 0;
        
        for (let i = 0; i < config.octaves; i++) {
            const noise = this.perlinNoise(x * frequency, y * frequency, t);
            
            // Create ridges
            const ridge = config.offset - Math.abs(noise);
            const sharpRidge = ridge * ridge * weight;
            
            total += sharpRidge * amplitude;
            maxValue += amplitude;
            
            // Update weight based on current octave
            weight = Math.max(0, Math.min(1, sharpRidge));
            
            frequency *= config.lacunarity;
            amplitude *= config.gain;
        }
        
        return (total / maxValue) * 2 - 1;
    }
    
    // Turbulence noise
    turbulenceNoise(x, y, t) {
        const config = this.patterns.turbulence;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < config.octaves; i++) {
            const noise = this.perlinNoise(x * frequency, y * frequency, t);
            total += Math.abs(noise) * amplitude; // Absolute value creates turbulence
            maxValue += amplitude;
            amplitude *= config.roughness;
            frequency *= 2;
        }
        
        return (total / maxValue) * 2 - 1;
    }
    
    // Curl noise - divergence-free field
    curlNoise(x, y, t) {
        const config = this.patterns.curl;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        const epsilon = config.epsilon;
        
        // Sample noise at offset positions
        const n1 = this.perlinNoise(x, y + epsilon, t);
        const n2 = this.perlinNoise(x, y - epsilon, t);
        const n3 = this.perlinNoise(x + epsilon, y, t);
        const n4 = this.perlinNoise(x - epsilon, y, t);
        
        // Compute curl (2D rotation of gradient)
        const curlX = (n1 - n2) / (2 * epsilon);
        const curlY = -(n3 - n4) / (2 * epsilon);
        
        // Normalize
        const len = Math.sqrt(curlX * curlX + curlY * curlY);
        if (len > 0) {
            return { x: curlX / len, y: curlY / len };
        }
        return { x: 0, y: 0 };
    }
    
    // Flow field noise
    flowFieldNoise(x, y, t) {
        const config = this.patterns.flow;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let flowX = 0;
        let flowY = 0;
        
        // Calculate influence from vortices
        for (const vortex of this.vortices) {
            const dx = x - vortex.x;
            const dy = y - vortex.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < vortex.radius) {
                const influence = Math.exp(-dist / (vortex.radius * 0.3));
                const angle = Math.atan2(dy, dx) + Math.PI / 2;
                
                flowX += Math.cos(angle) * influence * vortex.strength;
                flowY += Math.sin(angle) * influence * vortex.strength;
            }
        }
        
        // Add base flow
        flowX += Math.sin(t * 0.5) * 0.3;
        flowY += Math.cos(t * 0.3) * 0.2;
        
        // Normalize
        const len = Math.sqrt(flowX * flowX + flowY * flowY);
        if (len > 0) {
            return { x: flowX / len, y: flowY / len };
        }
        return { x: 0, y: 0 };
    }
    
    // Wave interference noise
    waveNoise(x, y, t) {
        const config = this.patterns.waves;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let total = 0;
        
        for (const source of this.waveSources) {
            const dx = x - source.x;
            const dy = y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const wave = Math.sin(
                dist * config.frequency * source.frequency - 
                t * 10 + 
                source.phase
            ) * source.amplitude;
            
            total += wave;
        }
        
        return total / this.waveSources.length;
    }
    
    // Cubic noise
    cubicNoise(x, y, t) {
        const config = this.patterns.cubic;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        // Cubic interpolation
        const cubic = (v) => {
            const v2 = v * v;
            const v3 = v2 * v;
            return -2 * v3 + 3 * v2;
        };
        
        const fx = x * config.frequency;
        const fy = y * config.frequency;
        
        const nx = cubic((Math.sin(fx + t) + 1) * 0.5);
        const ny = cubic((Math.cos(fy - t * 0.7) + 1) * 0.5);
        
        return nx * ny * 2 - 1;
    }
    
    // Cellular noise
    cellularNoise(x, y, t) {
        const config = this.patterns.cellular;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        const cellX = Math.floor(x * config.cellSize);
        const cellY = Math.floor(y * config.cellSize);
        
        // Hash cell coordinates
        let h = cellX * 374761393 + cellY * 668265263 + Math.floor(t * 10) * 1274126177;
        h = ((h ^ (h >>> 13)) * 1274126177) ^ (h >>> 16);
        const value = (Math.abs(h) % 1000) / 1000;
        
        return value < config.threshold ? -1 : 1;
    }
    
    // Update time (should be called once per frame, not per particle)
    updateTime() {
        this.time += this.timeIncrement;
    }
    
    // Main noise function
    getNoise(x, y, particleIndex = 0) {
        // Time is now updated externally, once per frame
        
        let noiseX = 0;
        let noiseY = 0;
        
        // Get noise based on active pattern
        switch (this.activePattern) {
            case 'perlin':
                noiseX = this.perlinNoise(x, y, this.time);
                noiseY = this.perlinNoise(x + 100, y + 100, this.time);
                break;
                
            case 'simplex':
                noiseX = this.simplexNoise(x, y, this.time);
                noiseY = this.simplexNoise(x + 100, y + 100, this.time);
                break;
                
            case 'voronoi':
                noiseX = this.voronoiNoise(x, y, this.time);
                noiseY = this.voronoiNoise(x + 0.5, y + 0.5, this.time);
                break;
                
            case 'worley':
                noiseX = this.worleyNoise(x, y, this.time);
                noiseY = this.worleyNoise(x + 0.5, y + 0.5, this.time);
                break;
                
            case 'fbm':
                noiseX = this.fbmNoise(x, y, this.time);
                noiseY = this.fbmNoise(x + 100, y + 100, this.time);
                break;
                
            case 'ridged':
                noiseX = this.ridgedNoise(x, y, this.time);
                noiseY = this.ridgedNoise(x + 100, y + 100, this.time);
                break;
                
            case 'turbulence':
                noiseX = this.turbulenceNoise(x, y, this.time);
                noiseY = this.turbulenceNoise(x + 100, y + 100, this.time);
                break;
                
            case 'curl':
                const curlResult = this.curlNoise(x, y, this.time);
                noiseX = curlResult.x;
                noiseY = curlResult.y;
                break;
                
            case 'flow':
                const flowResult = this.flowFieldNoise(x, y, this.time);
                noiseX = flowResult.x;
                noiseY = flowResult.y;
                break;
                
            case 'waves':
                noiseX = this.waveNoise(x, y, this.time);
                noiseY = this.waveNoise(x + 0.1, y + 0.1, this.time);
                break;
                
            case 'cubic':
                noiseX = this.cubicNoise(x, y, this.time);
                noiseY = this.cubicNoise(x + 100, y + 100, this.time);
                break;
                
            case 'cellular':
                noiseX = this.cellularNoise(x, y, this.time);
                noiseY = this.cellularNoise(x + 0.5, y + 0.5, this.time);
                break;
                
            default:
                noiseX = 0;
                noiseY = 0;
        }
        
        // Apply contrast
        if (this.contrast !== 1.0) {
            const sign_x = Math.sign(noiseX);
            const sign_y = Math.sign(noiseY);
            noiseX = sign_x * Math.pow(Math.abs(noiseX), 1 / this.contrast);
            noiseY = sign_y * Math.pow(Math.abs(noiseY), 1 / this.contrast);
        }
        
        // Apply global amplitude
        return {
            x: noiseX * this.globalAmplitude,
            y: noiseY * this.globalAmplitude
        };
    }
    
    // Control methods
    setPattern(patternName) {
        if (this.patterns[patternName]) {
            this.activePattern = patternName;
            // Regenerate seeds for cellular patterns
            if (patternName === 'voronoi') {
                this.generateVoronoiSeeds();
            } else if (patternName === 'worley') {
                this.generateWorleyGrid();
            }
        }
    }
    
    setGlobalScale(scale) {
        this.globalScale = scale;
    }
    
    setGlobalTimeScale(timeScale) {
        this.globalTimeScale = timeScale;
    }
    
    setGlobalAmplitude(amplitude) {
        this.globalAmplitude = amplitude;
    }
    
    setContrast(contrast) {
        this.contrast = Math.max(0.1, Math.min(5.0, contrast));
    }
    
    setGlobalOctaves(octaves) {
        this.globalOctaves = Math.max(1, Math.min(8, octaves));
    }
    
    setTimeIncrement(increment) {
        this.timeIncrement = Math.max(0, Math.min(0.05, increment));
    }
    
    getConfig() {
        return {
            seed: this.seed,
            activePattern: this.activePattern,
            patterns: this.patterns,
            globalScale: this.globalScale,
            globalTimeScale: this.globalTimeScale,
            globalAmplitude: this.globalAmplitude,
            contrast: this.contrast,
            globalOctaves: this.globalOctaves,
            timeIncrement: this.timeIncrement
        };
    }
    
    reset() {
        this.activePattern = 'perlin';
        this.globalScale = 1.0;
        this.globalTimeScale = 1.0;
        this.globalAmplitude = 0.0;
        this.contrast = 1.0;
        this.globalOctaves = 3;
        this.timeIncrement = 0.01;
        this.time = 0;
        
        // Regenerate random elements
        this.generateVoronoiSeeds();
        this.generateWorleyGrid();
        this.generateCellularGrid();
        this.vortices = this.generateVortices();
        this.waveSources = this.generateWaveSources();
    }
}