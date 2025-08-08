/**
 * Advanced noise generation system for particle motion
 * Provides multiple noise patterns with configurable parameters
 */

export class NoiseGenerator {
    constructor() {
        // Noise configuration for each pattern - optimized for flocking behavior
        this.patterns = {
            perlin: {
                name: 'Perlin',
                scale: 0.003,  // Much larger scale for smoother gradients
                timeScale: 0.0002,  // Slower evolution
                amplitude: 1.0,
                octaves: 2,  // Fewer octaves for simpler patterns
                persistence: 0.7,  // Higher persistence for smoother flow
                lacunarity: 2.0
            },
            simplex: {
                name: 'Simplex',
                scale: 0.0025,  // Larger scale patterns
                timeScale: 0.00015,  // Very slow evolution
                amplitude: 1.0,
                octaves: 2,  // Simpler patterns
                persistence: 0.8  // Smoother transitions
            },
            voronoi: {
                name: 'Voronoi',
                scale: 0.002,  // Larger cells
                timeScale: 0.0001,  // Very slow movement
                amplitude: 1.0,
                cellCount: 8,  // Fewer cells for clearer regions
                distanceFunction: 'euclidean'
            },
            cubic: {
                name: 'Cubic',
                scale: 0.004,  // Larger wave patterns
                timeScale: 0.0002,  // Slow evolution
                amplitude: 1.0,
                frequency: 1.5  // Lower frequency for broader waves
            },
            turbulence: {
                name: 'Turbulence',
                scale: 0.0035,  // Larger turbulence patterns
                timeScale: 0.00025,  // Moderate evolution
                amplitude: 1.0,
                octaves: 2,  // Simpler turbulence
                roughness: 0.6  // Smoother turbulence
            },
            flow: {
                name: 'Flow Field',
                scale: 0.0025,  // Larger flow patterns
                timeScale: 0.00008,  // Very slow rotation
                amplitude: 1.0,
                vortexCount: 3,  // Fewer, clearer vortices
                vortexStrength: 1.5  // Moderate strength
            },
            waves: {
                name: 'Wave Interference',
                scale: 0.005,  // Larger wave patterns
                timeScale: 0.0003,  // Slow wave evolution
                amplitude: 1.0,
                waveCount: 2,  // Fewer wave sources
                frequency: 1.0  // Lower frequency
            },
            cellular: {
                name: 'Cellular',
                scale: 0.003,  // Larger cells
                timeScale: 0.00015,  // Slow transitions
                amplitude: 1.0,
                cellSize: 30,  // Larger cell size
                threshold: 0.5
            }
        };
        
        // Active pattern
        this.activePattern = 'perlin';
        
        // Global noise parameters
        this.globalScale = 1.0;
        this.globalTimeScale = 1.0;
        this.globalAmplitude = 0.0; // Start with no noise
        
        // Performance optimization
        this.cache = new Map();
        this.cacheSize = 1000;
        this.frameCount = 0;
        
        // Precomputed values for performance
        this.permutation = this.generatePermutation();
        this.gradients3D = this.generateGradients3D();
        
        // Voronoi seed points
        this.voronoiSeeds = this.generateVoronoiSeeds(30);
        
        // Flow field vortices
        this.vortices = this.generateVortices(8);
        
        // Wave sources
        this.waveSources = this.generateWaveSources(5);
        
        // Time tracking for evolution
        this.time = 0;
        
        // Smoothing parameters for flow-like behavior
        this.smoothingFactor = 0.85;  // How much to smooth between frames
        this.previousNoiseValues = new Map();  // Store previous noise values for smoothing
    }
    
    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        
        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplicate for wrapping
        for (let i = 0; i < 256; i++) {
            p[256 + i] = p[i];
        }
        
        return p;
    }
    
    generateGradients3D() {
        const gradients = [];
        const vectors = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];
        
        for (const v of vectors) {
            const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
            gradients.push([v[0]/len, v[1]/len, v[2]/len]);
        }
        
        return gradients;
    }
    
    generateVoronoiSeeds(count) {
        const seeds = [];
        for (let i = 0; i < count; i++) {
            seeds.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.001,
                vy: (Math.random() - 0.5) * 0.001
            });
        }
        return seeds;
    }
    
    generateVortices(count) {
        const vortices = [];
        for (let i = 0; i < count; i++) {
            vortices.push({
                x: Math.random(),
                y: Math.random(),
                strength: (Math.random() - 0.5) * 3,
                radius: 0.1 + Math.random() * 0.2,
                angleOffset: Math.random() * Math.PI * 2
            });
        }
        return vortices;
    }
    
    generateWaveSources(count) {
        const sources = [];
        for (let i = 0; i < count; i++) {
            sources.push({
                x: Math.random(),
                y: Math.random(),
                frequency: 1 + Math.random() * 3,
                amplitude: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
        return sources;
    }
    
    // Fade function for smooth interpolation
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    // Linear interpolation
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    // Dot product for gradient and distance vector
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    // Perlin noise implementation - simplified for clearer patterns
    perlinNoise(x, y, t) {
        const p = this.permutation;
        const config = this.patterns.perlin;
        
        // Apply scales
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let total = 0;
        let amplitude = config.amplitude;
        let maxValue = 0;
        
        for (let octave = 0; octave < config.octaves; octave++) {
            const freq = Math.pow(config.lacunarity, octave);
            const px = x * freq;
            const py = y * freq;
            const pz = t;
            
            // Find unit cube
            const X = Math.floor(px) & 255;
            const Y = Math.floor(py) & 255;
            const Z = Math.floor(pz) & 255;
            
            // Find relative position in cube
            const xf = px - Math.floor(px);
            const yf = py - Math.floor(py);
            const zf = pz - Math.floor(pz);
            
            // Compute fade curves with stronger contrast
            const u = this.fade(xf);
            const v = this.fade(yf);
            const w = this.fade(zf);
            
            // Hash coordinates
            const A = p[X] + Y;
            const AA = p[A] + Z;
            const AB = p[A + 1] + Z;
            const B = p[X + 1] + Y;
            const BA = p[B] + Z;
            const BB = p[B + 1] + Z;
            
            // Blend results
            const res = this.lerp(
                this.lerp(
                    this.lerp(this.grad(p[AA], xf, yf, zf),
                             this.grad(p[BA], xf - 1, yf, zf), u),
                    this.lerp(this.grad(p[AB], xf, yf - 1, zf),
                             this.grad(p[BB], xf - 1, yf - 1, zf), u),
                    v
                ),
                this.lerp(
                    this.lerp(this.grad(p[AA + 1], xf, yf, zf - 1),
                             this.grad(p[BA + 1], xf - 1, yf, zf - 1), u),
                    this.lerp(this.grad(p[AB + 1], xf, yf - 1, zf - 1),
                             this.grad(p[BB + 1], xf - 1, yf - 1, zf - 1), u),
                    v
                ),
                w
            );
            
            total += res * amplitude;
            maxValue += amplitude;
            amplitude *= config.persistence;
        }
        
        // Apply contrast enhancement for clearer patterns
        const result = total / maxValue;
        return Math.sign(result) * Math.pow(Math.abs(result), 0.7);  // Power curve for contrast
    }
    
    // Simplex noise (2D simplified version)
    simplexNoise(x, y, t) {
        const config = this.patterns.simplex;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        // Add time as a third dimension for evolution
        const x3 = x + t;
        const y3 = y + t * 0.7;
        
        // Skewing factors for 2D
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        
        let n0, n1, n2;
        
        // Skew the input space
        const s = (x3 + y3) * F2;
        const i = Math.floor(x3 + s);
        const j = Math.floor(y3 + s);
        
        const t0 = (i + j) * G2;
        const X0 = i - t0;
        const Y0 = j - t0;
        const x0 = x3 - X0;
        const y0 = y3 - Y0;
        
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
        const gi0 = this.permutation[ii + this.permutation[jj]] % 12;
        const gi1 = this.permutation[ii + i1 + this.permutation[jj + j1]] % 12;
        const gi2 = this.permutation[ii + 1 + this.permutation[jj + 1]] % 12;
        
        // Calculate contributions
        let t1 = 0.5 - x0*x0 - y0*y0;
        if (t1 < 0) {
            n0 = 0;
        } else {
            t1 *= t1;
            n0 = t1 * t1 * this.dot2D(this.gradients3D[gi0], x0, y0);
        }
        
        let t2 = 0.5 - x1*x1 - y1*y1;
        if (t2 < 0) {
            n1 = 0;
        } else {
            t2 *= t2;
            n1 = t2 * t2 * this.dot2D(this.gradients3D[gi1], x1, y1);
        }
        
        let t3 = 0.5 - x2*x2 - y2*y2;
        if (t3 < 0) {
            n2 = 0;
        } else {
            t3 *= t3;
            n2 = t3 * t3 * this.dot2D(this.gradients3D[gi2], x2, y2);
        }
        
        // Scale output
        return 70.0 * (n0 + n1 + n2);
    }
    
    dot2D(g, x, y) {
        return g[0] * x + g[1] * y;
    }
    
    // Voronoi noise - simplified for clear cellular regions
    voronoiNoise(x, y, t) {
        const config = this.patterns.voronoi;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        // Slowly rotate seed positions for organic movement
        const rotationSpeed = t * 0.1;
        
        // Find closest seed point with clear regions
        let minDist = Infinity;
        let closestSeedIndex = -1;
        
        for (let i = 0; i < this.voronoiSeeds.length; i++) {
            const seed = this.voronoiSeeds[i];
            
            // Apply slow rotation to seed positions
            const angle = rotationSpeed + i * (Math.PI * 2 / this.voronoiSeeds.length);
            const rotatedX = seed.x + Math.cos(angle) * 0.05;
            const rotatedY = seed.y + Math.sin(angle) * 0.05;
            
            const dx = x - rotatedX;
            const dy = y - rotatedY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
                closestSeedIndex = i;
            }
        }
        
        // Create clear regional patterns based on seed index
        const regionAngle = (closestSeedIndex / this.voronoiSeeds.length) * Math.PI * 2;
        const regionValue = Math.sin(regionAngle + t * 0.5);
        
        // Add edge detection for more contrast
        const edgeStrength = Math.exp(-minDist * 10) * 0.5;
        
        return regionValue * (1 - edgeStrength);  // Clear regions with defined edges
    }
    
    // Cubic noise (smooth interpolated noise)
    cubicNoise(x, y, t) {
        const config = this.patterns.cubic;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        // Create a cubic wave pattern
        const fx = x * config.frequency;
        const fy = y * config.frequency;
        
        // Cubic interpolation function
        const cubic = (v) => {
            const v2 = v * v;
            const v3 = v2 * v;
            return -2 * v3 + 3 * v2;
        };
        
        // Generate smooth noise using cubic interpolation
        const nx = cubic((Math.sin(fx + t) + 1) * 0.5);
        const ny = cubic((Math.cos(fy - t * 0.7) + 1) * 0.5);
        
        // Combine for interesting patterns
        const combined = nx * ny + Math.sin(fx * fy + t * 2) * 0.3;
        
        return combined * 2 - 1;
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
    
    // Flow field noise - improved for clear directional flow
    flowFieldNoise(x, y, t) {
        const config = this.patterns.flow;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let flowX = 0;
        let flowY = 0;
        
        // Calculate influence from each vortex with clearer patterns
        for (const vortex of this.vortices) {
            const dx = x - vortex.x;
            const dy = y - vortex.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < vortex.radius * 2) {  // Larger influence radius
                const angle = Math.atan2(dy, dx) + vortex.angleOffset + t * vortex.strength * 0.5;
                const influence = Math.exp(-dist / vortex.radius) * vortex.strength;  // Exponential falloff
                
                // Create clear rotational flow
                flowX += Math.cos(angle + Math.PI / 2) * influence;
                flowY += Math.sin(angle + Math.PI / 2) * influence;
            }
        }
        
        // Add a global flow direction for more coherent movement
        const globalFlow = Math.sin(t * 0.5) * 0.3;
        flowX += globalFlow;
        flowY += Math.cos(t * 0.3) * 0.2;
        
        // Return normalized directional flow
        const magnitude = Math.sqrt(flowX * flowX + flowY * flowY);
        if (magnitude > 0) {
            return Math.atan2(flowY, flowX) / Math.PI;  // Normalized angle
        }
        return 0;
    }
    
    // Wave interference noise
    waveNoise(x, y, t) {
        const config = this.patterns.waves;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        let total = 0;
        
        // Calculate wave interference from multiple sources
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
        
        // Normalize
        return total / this.waveSources.length;
    }
    
    // Cellular noise
    cellularNoise(x, y, t) {
        const config = this.patterns.cellular;
        
        x *= config.scale * this.globalScale;
        y *= config.scale * this.globalScale;
        t *= config.timeScale * this.globalTimeScale;
        
        // Create cellular automaton-like pattern
        const cellX = Math.floor(x * config.cellSize);
        const cellY = Math.floor(y * config.cellSize);
        
        // Hash cell coordinates
        const hash = this.hashCell(cellX, cellY, Math.floor(t * 10));
        
        // Create threshold-based pattern
        const value = (hash % 1000) / 1000;
        
        if (value < config.threshold) {
            return -1;
        } else {
            return 1;
        }
    }
    
    hashCell(x, y, t) {
        // Simple hash function for cell coordinates
        let h = x * 374761393 + y * 668265263 + t * 1274126177;
        h = ((h ^ (h >>> 13)) * 1274126177) ^ (h >>> 16);
        return Math.abs(h);
    }
    
    // Main noise function that routes to the appropriate pattern
    getNoise(x, y, particleIndex = 0) {
        // Update time with slower increment for smoother evolution
        this.time += 0.008; // Half speed for smoother motion
        
        // Check cache
        const cacheKey = `${this.activePattern}_${Math.floor(x*100)}_${Math.floor(y*100)}_${Math.floor(this.time*10)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        let noiseX = 0;
        let noiseY = 0;
        
        // Get noise based on active pattern
        switch (this.activePattern) {
            case 'perlin':
                noiseX = this.perlinNoise(x, y, this.time);
                noiseY = this.perlinNoise(x + 1000, y + 1000, this.time);
                break;
                
            case 'simplex':
                noiseX = this.simplexNoise(x, y, this.time);
                noiseY = this.simplexNoise(x + 1000, y + 1000, this.time);
                break;
                
            case 'voronoi':
                noiseX = this.voronoiNoise(x, y, this.time);
                noiseY = this.voronoiNoise(x + 0.1, y + 0.1, this.time);
                break;
                
            case 'cubic':
                noiseX = this.cubicNoise(x, y, this.time);
                noiseY = this.cubicNoise(x + 1000, y + 1000, this.time);
                break;
                
            case 'turbulence':
                noiseX = this.turbulenceNoise(x, y, this.time);
                noiseY = this.turbulenceNoise(x + 1000, y + 1000, this.time);
                break;
                
            case 'flow':
                const flowNoise = this.flowFieldNoise(x, y, this.time);
                noiseX = Math.cos(flowNoise);
                noiseY = Math.sin(flowNoise);
                break;
                
            case 'waves':
                noiseX = this.waveNoise(x, y, this.time);
                noiseY = this.waveNoise(x + 0.1, y + 0.1, this.time);
                break;
                
            case 'cellular':
                noiseX = this.cellularNoise(x, y, this.time);
                noiseY = this.cellularNoise(x + 0.05, y + 0.05, this.time);
                break;
                
            default:
                noiseX = 0;
                noiseY = 0;
        }
        
        // Apply smoothing for flow-like behavior
        const particleKey = `p_${particleIndex}`;
        const prevNoise = this.previousNoiseValues.get(particleKey) || { x: 0, y: 0 };
        
        // Smooth the noise values
        const smoothedX = prevNoise.x * this.smoothingFactor + noiseX * (1 - this.smoothingFactor);
        const smoothedY = prevNoise.y * this.smoothingFactor + noiseY * (1 - this.smoothingFactor);
        
        // Store for next frame
        this.previousNoiseValues.set(particleKey, { x: smoothedX, y: smoothedY });
        
        // Clean up old entries if too many
        if (this.previousNoiseValues.size > 2000) {
            const firstKey = this.previousNoiseValues.keys().next().value;
            this.previousNoiseValues.delete(firstKey);
        }
        
        // Apply global amplitude with contrast enhancement
        const contrast = 1.5;  // Increase contrast for clearer patterns
        const result = {
            x: Math.tanh(smoothedX * contrast) * this.globalAmplitude,
            y: Math.tanh(smoothedY * contrast) * this.globalAmplitude
        };
        
        // Cache result
        if (this.cache.size > this.cacheSize) {
            // Clear oldest entries
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, result);
        
        return result;
    }
    
    // Set active noise pattern
    setPattern(patternName) {
        if (this.patterns[patternName]) {
            this.activePattern = patternName;
            this.cache.clear(); // Clear cache when pattern changes
        }
    }
    
    // Update pattern configuration
    updatePatternConfig(patternName, config) {
        if (this.patterns[patternName]) {
            Object.assign(this.patterns[patternName], config);
            if (patternName === this.activePattern) {
                this.cache.clear();
            }
        }
    }
    
    // Set global parameters
    setGlobalScale(scale) {
        this.globalScale = scale;
        this.cache.clear();
    }
    
    setGlobalTimeScale(timeScale) {
        this.globalTimeScale = timeScale;
        this.cache.clear();
    }
    
    setGlobalAmplitude(amplitude) {
        this.globalAmplitude = amplitude;
    }
    
    // Get current configuration for UI
    getConfig() {
        return {
            activePattern: this.activePattern,
            patterns: this.patterns,
            globalScale: this.globalScale,
            globalTimeScale: this.globalTimeScale,
            globalAmplitude: this.globalAmplitude
        };
    }
    
    // Reset to defaults
    reset() {
        this.activePattern = 'perlin';
        this.globalScale = 1.0;
        this.globalTimeScale = 1.0;
        this.globalAmplitude = 0.0;
        this.time = 0;
        this.cache.clear();
        
        // Regenerate random elements
        this.voronoiSeeds = this.generateVoronoiSeeds(30);
        this.vortices = this.generateVortices(8);
        this.waveSources = this.generateWaveSources(5);
    }
}