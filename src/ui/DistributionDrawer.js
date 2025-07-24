export class DistributionDrawer {
    constructor(canvas, particleSystem, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particleSystem = particleSystem;
        this.isCompact = options.compact || false;
        this.onChange = options.onChange || (() => {});
        
        // Drawing state
        this.currentSpecies = 0;
        this.brushSize = this.isCompact ? 20 : 25;
        this.opacity = 0.7;
        this.currentMode = 'draw'; // 'draw', 'circles', 'random', 'erase'
        this.isDrawing = false;
        this.mousePos = { x: 0, y: 0 };
        this.showBrushPreview = false;
        
        // Circle mode state
        this.circleState = 'inactive'; // 'inactive', 'setting-center', 'setting-radius'
        this.circleCenter = null;
        this.circleRadius = 0;
        
        // Random pattern types for species-responsive generation
        this.randomPatterns = {
            0: 'quantum_interference',    // Red - aggressive patterns
            1: 'neural_noise',           // Green - organic patterns  
            2: 'data_corruption',        // Blue - digital patterns
            3: 'temporal_distortion',    // Yellow - flowing patterns
            4: 'electromagnetic_pulse'   // Purple - geometric patterns
        };
        
        // Distribution data: Map<speciesId, Array<{x, y, size, opacity}>>
        this.distributions = new Map();
        
        // Glitch mode state
        this.glitchPatterns = new Map();
        this.glitchTime = 0;
        this.isAnimatingGlitch = false;
        
        this.setupCanvas();
        this.setupEventListeners();
        
        this.updateFromParticleSystem();
        this.render();
        
        // Initialize indicators
        setTimeout(() => {
            this.updateModeIndicator();
            this.updateCircleIndicator();
            this.initializeWithDemoData();
        }, 100);
    }
    
    setupCanvas() {
        try {
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            
            if (rect.width <= 0 || rect.height <= 0) {
                console.warn('DistributionDrawer: Invalid canvas dimensions, using defaults');
                this.width = 200;
                this.height = 120;
                this.canvas.width = this.width * dpr;
                this.canvas.height = this.height * dpr;
                this.canvas.style.width = this.width + 'px';
                this.canvas.style.height = this.height + 'px';
            } else {
                this.canvas.width = rect.width * dpr;
                this.canvas.height = rect.height * dpr;
                this.canvas.style.width = rect.width + 'px';
                this.canvas.style.height = rect.height + 'px';
                this.width = rect.width;
                this.height = rect.height;
            }
            
            this.ctx.scale(dpr, dpr);
        } catch (error) {
            console.error('DistributionDrawer: Error setting up canvas:', error);
            this.width = 200;
            this.height = 120;
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePosition(e);
        
        switch (this.currentMode) {
            case 'draw':
            case 'erase':
                this.isDrawing = true;
                this.addDistributionPoint(pos, e);
                break;
                
            case 'circles':
                this.handleCircleMode(pos);
                break;
                
            case 'random':
                this.generateSpeciesResponsivePattern(pos);
                break;
                
            case 'glitch':
                this.generateGlitchPatterns(pos);
                break;
                
            // Maintain backward compatibility with old pattern names
            case 'cluster':
            case 'ring':
            case 'grid':
                this.addPresetPattern(e);
                break;
        }
        
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        this.mousePos = this.getMousePosition(e);
        
        if (this.isDrawing && (this.currentMode === 'draw' || this.currentMode === 'erase')) {
            this.addDistributionPoint(this.mousePos, e);
        }
        
        if (this.currentMode === 'circles' && this.circleState === 'setting-radius') {
            this.circleRadius = Math.sqrt(
                Math.pow(this.mousePos.x - this.circleCenter.x, 2) +
                Math.pow(this.mousePos.y - this.circleCenter.y, 2)
            );
        }
        
        this.render();
    }
    
    handleMouseUp() {
        this.isDrawing = false;
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    handleMouseLeave() {
        this.isDrawing = false;
        this.showBrushPreview = false;
        this.render();
    }
    
    handleMouseEnter() {
        this.showBrushPreview = true;
    }
    
    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleCircleMode(pos) {
        switch (this.circleState) {
            case 'inactive':
                this.circleCenter = pos;
                this.circleState = 'setting-radius';
                this.circleRadius = 0;
                this.updateCircleIndicator();
                break;
                
            case 'setting-radius':
                this.generateCirclePattern();
                this.circleState = 'inactive';
                this.circleCenter = null;
                this.circleRadius = 0;
                this.updateCircleIndicator();
                if (this.onChange) {
                    this.onChange(this.exportDistribution());
                }
                break;
        }
    }
    
    generateCirclePattern() {
        if (!this.circleCenter || this.circleRadius < 10) return;
        
        // Clear all distributions for new mathematical pattern
        this.distributions.clear();
        
        // Generate a mathematical circle pattern for ALL species
        const numSpecies = this.particleSystem.numSpecies;
        const patterns = ['fibonacci', 'fractal', 'sinusoidal', 'golden', 'phyllotaxis'];
        const patternIndex = Math.floor(Math.random() * patterns.length);
        const pattern = patterns[patternIndex];
        
        switch (pattern) {
            case 'fibonacci':
                this.generateFibonacciCircles();
                break;
            case 'fractal':
                this.generateFractalCircles();
                break;
            case 'sinusoidal':
                this.generateSinusoidalCircles();
                break;
            case 'golden':
                this.generateGoldenRatioCircles();
                break;
            case 'phyllotaxis':
                this.generatePhyllotaxisCircles();
                break;
        }
    }
    
    generateSpeciesResponsivePattern(pos) {
        // Clear all distributions first
        this.distributions.clear();
        
        // Generate random areas for EACH species based on current species count
        const numSpecies = this.particleSystem.numSpecies;
        
        for (let speciesId = 0; speciesId < numSpecies; speciesId++) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            
            const points = this.distributions.get(speciesId);
            
            // Generate 1-3 random areas per species
            const numAreas = 1 + Math.floor(Math.random() * 3);
            
            for (let area = 0; area < numAreas; area++) {
                // Random position for each area
                const centerX = 0.1 + Math.random() * 0.8;
                const centerY = 0.1 + Math.random() * 0.8;
                const radius = (0.05 + Math.random() * 0.15);
                
                // Get pattern type based on species ID
                const patternType = this.randomPatterns[speciesId % 5] || 'neural_noise';
                this.generateAdvancedPattern(patternType, centerX, centerY, radius, points);
            }
        }
        
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    generateAdvancedPattern(pattern, centerX, centerY, radius, points) {
        const baseSize = (this.brushSize / Math.min(this.width, this.height)) * 0.2;
        
        switch (pattern) {
            case 'quantum_interference':
                this.generateQuantumPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'neural_noise':
                this.generateNeuralPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'data_corruption':
                this.generateDigitalPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'temporal_distortion':
                this.generateFlowingPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'electromagnetic_pulse':
                this.generateGeometricPattern(centerX, centerY, radius, points, baseSize);
                break;
            default:
                this.generateOrganicPattern(centerX, centerY, radius, points, baseSize);
                break;
        }
    }
    
    generateQuantumPattern(centerX, centerY, radius, points, baseSize) {
        // Aggressive interference patterns for red species
        const numInterferenceRings = 3 + Math.floor(Math.random() * 3);
        for (let ring = 0; ring < numInterferenceRings; ring++) {
            const ringRadius = radius * (0.3 + (ring / numInterferenceRings) * 0.7);
            const pointsInRing = 12 + ring * 8;
            
            for (let i = 0; i < pointsInRing; i++) {
                const angle = (i / pointsInRing) * Math.PI * 2;
                const interference = Math.sin(angle * 5) * 0.3;
                const r = ringRadius * (1 + interference);
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: baseSize * (1.2 - ring * 0.2),
                    opacity: 0.9 - ring * 0.15
                });
            }
        }
    }
    
    generateNeuralPattern(centerX, centerY, radius, points, baseSize) {
        // Organic neural-like patterns for green species
        const numBranches = 4 + Math.floor(Math.random() * 3);
        for (let b = 0; b < numBranches; b++) {
            const branchAngle = (b / numBranches) * Math.PI * 2 + Math.random() * 0.5;
            const branchLength = radius * (0.6 + Math.random() * 0.4);
            
            const numNodes = 6 + Math.floor(Math.random() * 8);
            for (let n = 0; n < numNodes; n++) {
                const t = n / numNodes;
                const deviation = Math.sin(t * Math.PI * 3) * 0.3;
                const r = t * branchLength;
                const angle = branchAngle + deviation;
                
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: baseSize * (1.1 - t * 0.4),
                    opacity: 0.8 - t * 0.3
                });
                
                // Add synaptic connections
                if (Math.random() < 0.4) {
                    const synapseAngle = angle + Math.PI / 2;
                    const synapseR = baseSize * 3;
                    const sx = Math.max(0, Math.min(1, x + Math.cos(synapseAngle) * synapseR));
                    const sy = Math.max(0, Math.min(1, y + Math.sin(synapseAngle) * synapseR));
                    
                    points.push({
                        x: sx, y: sy,
                        size: baseSize * 0.6,
                        opacity: 0.5
                    });
                }
            }
        }
    }
    
    generateDigitalPattern(centerX, centerY, radius, points, baseSize) {
        // Digital corruption patterns for blue species
        const gridRes = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < gridRes; i++) {
            for (let j = 0; j < gridRes; j++) {
                if (Math.random() < 0.7) { // Create corruption gaps
                    const gx = centerX + (i - gridRes/2 + 0.5) * radius * 2 / gridRes;
                    const gy = centerY + (j - gridRes/2 + 0.5) * radius * 2 / gridRes;
                    
                    // Add digital noise
                    const noiseX = gx + (Math.random() - 0.5) * baseSize * 2;
                    const noiseY = gy + (Math.random() - 0.5) * baseSize * 2;
                    
                    if (noiseX >= 0 && noiseX <= 1 && noiseY >= 0 && noiseY <= 1) {
                        points.push({
                            x: noiseX,
                            y: noiseY,
                            size: baseSize * (0.5 + Math.random() * 0.8),
                            opacity: Math.random() < 0.3 ? 1.0 : 0.6 // Digital flickering
                        });
                    }
                }
            }
        }
    }
    
    generateFlowingPattern(centerX, centerY, radius, points, baseSize) {
        // Temporal flowing patterns for yellow species
        const numFlows = 2 + Math.floor(Math.random() * 2);
        for (let f = 0; f < numFlows; f++) {
            const flowAngle = f * Math.PI + Math.random() * Math.PI;
            const numPoints = 20 + Math.floor(Math.random() * 15);
            
            for (let i = 0; i < numPoints; i++) {
                const t = i / numPoints;
                const flowR = t * radius * 1.2;
                const wave = Math.sin(t * Math.PI * 4) * radius * 0.3;
                
                const x = Math.max(0, Math.min(1, centerX + Math.cos(flowAngle) * flowR + Math.cos(flowAngle + Math.PI/2) * wave));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(flowAngle) * flowR + Math.sin(flowAngle + Math.PI/2) * wave));
                
                points.push({
                    x, y,
                    size: baseSize * (1 - t * 0.3),
                    opacity: 0.9 - t * 0.4
                });
            }
        }
    }
    
    generateGeometricPattern(centerX, centerY, radius, points, baseSize) {
        // Geometric electromagnetic patterns for purple species
        const shapes = ['triangle', 'square', 'hexagon', 'octagon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        let numSides;
        switch (shape) {
            case 'triangle': numSides = 3; break;
            case 'square': numSides = 4; break;
            case 'hexagon': numSides = 6; break;
            case 'octagon': numSides = 8; break;
        }
        
        const layers = 2 + Math.floor(Math.random() * 2);
        for (let layer = 0; layer < layers; layer++) {
            const layerRadius = radius * (0.3 + (layer / layers) * 0.7);
            const pointsPerSide = 3 + layer;
            
            for (let side = 0; side < numSides; side++) {
                const startAngle = (side / numSides) * Math.PI * 2;
                const endAngle = ((side + 1) / numSides) * Math.PI * 2;
                
                for (let p = 0; p < pointsPerSide; p++) {
                    const t = p / pointsPerSide;
                    const angle = startAngle + (endAngle - startAngle) * t;
                    const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * layerRadius));
                    const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * layerRadius));
                    
                    points.push({
                        x, y,
                        size: baseSize * (1.1 - layer * 0.2),
                        opacity: 0.9 - layer * 0.15
                    });
                }
            }
        }
    }
    
    generateOrganicPattern(centerX, centerY, radius, points, baseSize) {
        // Fallback organic pattern
        const numClusters = 3 + Math.floor(Math.random() * 3);
        for (let c = 0; c < numClusters; c++) {
            const clusterAngle = Math.random() * Math.PI * 2;
            const clusterDist = Math.random() * radius * 0.6;
            const clusterX = centerX + Math.cos(clusterAngle) * clusterDist;
            const clusterY = centerY + Math.sin(clusterAngle) * clusterDist;
            
            const clusterSize = 8 + Math.floor(Math.random() * 12);
            for (let i = 0; i < clusterSize; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * radius * 0.3;
                const x = Math.max(0, Math.min(1, clusterX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, clusterY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: baseSize * (0.6 + Math.random() * 0.8),
                    opacity: 0.5 + Math.random() * 0.5
                });
            }
        }
    }
    
    addDistributionPoint(pos, event = null) {
        const x = pos.x / this.width;
        const y = pos.y / this.height;
        
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        
        if (this.currentMode === 'erase') {
            this.erasePoints(x, y, points, event);
        } else {
            this.addDrawPoint(x, y, points);
        }
    }
    
    erasePoints(x, y, points, event = null) {
        const eraseRadius = (this.brushSize / Math.min(this.width, this.height)) * 0.5;
        
        // Smart erase: Cmd+Click erases all species in brush area
        if (event && (event.metaKey || event.ctrlKey)) {
            // Erase all species within brush area
            for (const [speciesId, speciesPoints] of this.distributions) {
                for (let i = speciesPoints.length - 1; i >= 0; i--) {
                    const point = speciesPoints[i];
                    const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
                    if (dist < eraseRadius + point.size * 0.5) {
                        speciesPoints.splice(i, 1);
                    }
                }
            }
        } else {
            // Erase only selected species
            for (let i = points.length - 1; i >= 0; i--) {
                const point = points[i];
                const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
                if (dist < eraseRadius + point.size * 0.5) {
                    points.splice(i, 1);
                }
            }
        }
    }
    
    addDrawPoint(x, y, points) {
        const size = (this.brushSize / Math.min(this.width, this.height)) * 0.3;
        
        const minDistance = size * 0.3;
        const tooClose = points.some(point => {
            const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            return dist < minDistance;
        });
        
        if (!tooClose) {
            points.push({
                x, y, size,
                opacity: this.opacity
            });
        }
    }
    
    // Backward compatibility method
    addPresetPattern(e) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = (e.clientX - rect.left) / this.width;
        const centerY = (e.clientY - rect.top) / this.height;
        
        if (centerX < 0 || centerX > 1 || centerY < 0 || centerY > 1) return;
        
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        const patternSize = this.brushSize * (this.isCompact ? 2 : 3);
        const radius = (patternSize / Math.min(this.width, this.height)) * 0.5;
        
        this.generatePatternPoints(this.currentMode, centerX, centerY, radius, points);
        
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    generatePatternPoints(pattern, centerX, centerY, radius, points) {
        const baseSize = (this.brushSize / Math.min(this.width, this.height)) * 0.2;
        
        switch (pattern) {
            case 'cluster':
                for (let i = 0; i < (this.isCompact ? 15 : 25); i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius * 0.8;
                    const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                    const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                    
                    points.push({
                        x, y,
                        size: baseSize * (0.8 + Math.random() * 0.4),
                        opacity: this.opacity * (0.7 + Math.random() * 0.3)
                    });
                }
                break;
                
            case 'ring':
                const ringPoints = this.isCompact ? 12 : 20;
                for (let i = 0; i < ringPoints; i++) {
                    const angle = (i / ringPoints) * Math.PI * 2;
                    const radiusX = radius * 0.7;
                    const radiusY = radius * 0.7;
                    const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * radiusX));
                    const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * radiusY));
                    
                    points.push({
                        x, y,
                        size: baseSize * 0.8,
                        opacity: this.opacity
                    });
                }
                break;
                
            case 'grid':
                const gridSize = this.isCompact ? 4 : 6;
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const spacing = radius * 2 / gridSize;
                        const gx = centerX + (i - gridSize/2 + 0.5) * spacing;
                        const gy = centerY + (j - gridSize/2 + 0.5) * spacing;
                        
                        const distFromCenter = Math.sqrt((gx - centerX) ** 2 + (gy - centerY) ** 2);
                        if (distFromCenter <= radius && gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1) {
                            points.push({
                                x: gx, y: gy,
                                size: baseSize * 0.6,
                                opacity: this.opacity
                            });
                        }
                    }
                }
                break;
        }
    }
    
    render() {
        this.ctx.fillStyle = '#0c0c0c';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawGrid();
        this.drawDistributions();
        this.drawCirclePreview();
        this.drawBrushPreview();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#2a2a2a';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 4]);
        
        const gridLines = this.isCompact ? 5 : 10;
        for (let i = 0; i <= gridLines; i++) {
            const pos = (i / gridLines) * this.width;
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.width, pos);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawDistributions() {
        for (const [speciesId, points] of this.distributions) {
            if (speciesId >= this.particleSystem.numSpecies) continue;
            
            const species = this.particleSystem.species[speciesId];
            if (!species) continue;
            
            const color = species.color;
            
            for (const point of points) {
                const x = point.x * this.width;
                const y = point.y * this.height;
                const size = point.size * Math.min(this.width, this.height);
                
                // Glow effect
                this.ctx.globalAlpha = point.opacity * 0.3;
                this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Main point
                this.ctx.globalAlpha = point.opacity;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawCirclePreview() {
        if (this.currentMode !== 'circles' || this.circleState === 'inactive') return;
        
        if (this.circleCenter && this.circleState === 'setting-radius') {
            const species = this.particleSystem.species[this.currentSpecies];
            const color = species.color;
            
            this.ctx.globalAlpha = 0.3;
            this.ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            this.ctx.beginPath();
            this.ctx.arc(this.circleCenter.x, this.circleCenter.y, this.circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Center point
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            this.ctx.beginPath();
            this.ctx.arc(this.circleCenter.x, this.circleCenter.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.setLineDash([]);
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawBrushPreview() {
        if (!this.showBrushPreview || this.currentMode === 'circles') return;
        
        const species = this.particleSystem.species[this.currentSpecies];
        if (!species) return;
        
        const color = species.color;
        
        this.ctx.globalAlpha = 0.3;
        if (this.currentMode === 'erase') {
            this.ctx.strokeStyle = '#ff6666';
            this.ctx.fillStyle = 'rgba(255, 102, 102, 0.1)';
        } else {
            this.ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`;
        }
        
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.arc(this.mousePos.x, this.mousePos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    }
    
    // Public API methods (enhanced)
    setMode(mode) {
        const validModes = ['draw', 'circles', 'random', 'glitch', 'erase', 'cluster', 'ring', 'grid'];
        if (validModes.includes(mode)) {
            this.currentMode = mode;
            
            // Reset circle state when changing modes
            if (mode !== 'circles') {
                this.circleState = 'inactive';
                this.circleCenter = null;
                this.circleRadius = 0;
            }
            
            this.canvas.style.cursor = mode === 'erase' ? 'crosshair' : 'default';
            
            // Update mode indicator
            this.updateModeIndicator();
            this.updateCircleIndicator();
        }
    }
    
    setSpecies(speciesId) {
        if (speciesId >= 0 && speciesId < this.particleSystem.numSpecies) {
            this.currentSpecies = speciesId;
            this.render();
        }
    }
    
    setBrushSize(size) {
        this.brushSize = Math.max(5, Math.min(this.isCompact ? 50 : 80, size));
        this.render();
    }
    
    setOpacity(opacity) {
        this.opacity = Math.max(0.1, Math.min(1.0, opacity));
    }
    
    // Backward compatibility alias
    setPattern(pattern) {
        this.setMode(pattern);
    }
    
    getSelectedSpecies() {
        return this.currentSpecies;
    }
    
    getCircleState() {
        return {
            state: this.circleState,
            center: this.circleCenter,
            radius: this.circleRadius
        };
    }
    
    clear(speciesId = null) {
        if (speciesId !== null) {
            this.distributions.delete(speciesId);
        } else {
            this.distributions.clear();
        }
        this.render();
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    updateFromParticleSystem() {
        if (this.currentSpecies >= this.particleSystem.numSpecies) {
            this.currentSpecies = 0;
        }
        
        const validSpecies = new Set();
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            validSpecies.add(i);
        }
        
        for (const speciesId of this.distributions.keys()) {
            if (!validSpecies.has(speciesId)) {
                this.distributions.delete(speciesId);
            }
        }
        
        this.loadExistingDistributions();
        this.render();
    }
    
    initializeWithDemoData() {
        if (this.particleSystem.numSpecies >= 3) {
            let hasExistingDistributions = false;
            
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                const species = this.particleSystem.species[i];
                if (species && species.startPosition && species.startPosition.type === 'custom') {
                    hasExistingDistributions = true;
                    break;
                }
            }
            
            if (this.distributions.size > 0) {
                hasExistingDistributions = true;
            }
            
            if (!hasExistingDistributions) {
                const demoDistributions = {
                    0: [
                        {x: 0.2, y: 0.2, size: 0.05, opacity: 0.8},
                        {x: 0.25, y: 0.18, size: 0.04, opacity: 0.7},
                        {x: 0.15, y: 0.25, size: 0.04, opacity: 0.6}
                    ],
                    1: [
                        {x: 0.5, y: 0.4, size: 0.03, opacity: 0.8},
                        {x: 0.6, y: 0.5, size: 0.03, opacity: 0.8},
                        {x: 0.5, y: 0.6, size: 0.03, opacity: 0.8},
                        {x: 0.4, y: 0.5, size: 0.03, opacity: 0.8}
                    ],
                    2: [
                        {x: 0.7, y: 0.7, size: 0.025, opacity: 0.7},
                        {x: 0.8, y: 0.7, size: 0.025, opacity: 0.7},
                        {x: 0.7, y: 0.8, size: 0.025, opacity: 0.7},
                        {x: 0.8, y: 0.8, size: 0.025, opacity: 0.7}
                    ]
                };
                this.importDistribution(demoDistributions);
            }
        }
    }
    
    loadExistingDistributions() {
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            if (species && species.startPosition && species.startPosition.type === 'custom' && species.startPosition.customPoints) {
                this.distributions.set(i, [...species.startPosition.customPoints]);
            }
        }
    }
    
    exportDistribution() {
        const result = {};
        for (const [speciesId, points] of this.distributions) {
            if (points.length > 0) {
                result[speciesId] = [...points];
            }
        }
        return result;
    }
    
    importDistribution(data) {
        this.distributions.clear();
        
        for (const [speciesId, points] of Object.entries(data)) {
            const id = parseInt(speciesId);
            if (id >= 0 && id < this.particleSystem.numSpecies && Array.isArray(points)) {
                this.distributions.set(id, [...points]);
            }
        }
        
        this.render();
        this.applyToParticleSystem();
        
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    applyToParticleSystem() {
        if (!this.particleSystem || !this.particleSystem.species) {
            console.error('DistributionDrawer: Invalid particle system');
            return;
        }
        
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            if (!species) continue;
            
            const points = this.distributions.get(i);
            if (points && points.length > 0) {
                let centerX = 0, centerY = 0, totalWeight = 0;
                
                for (const point of points) {
                    const weight = point.opacity;
                    centerX += point.x * weight;
                    centerY += point.y * weight;
                    totalWeight += weight;
                }
                
                if (totalWeight > 0) {
                    centerX /= totalWeight;
                    centerY /= totalWeight;
                    
                    let avgRadius = 0;
                    for (const point of points) {
                        const dist = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
                        avgRadius += dist;
                    }
                    avgRadius /= points.length;
                    avgRadius = Math.max(0.05, Math.min(0.4, avgRadius));
                    
                    species.startPosition = {
                        type: 'custom',
                        center: { x: centerX, y: centerY },
                        radius: avgRadius,
                        customPoints: points
                    };
                }
            } else {
                if (!species.startPosition || species.startPosition.type === 'custom') {
                    species.startPosition = {
                        type: 'cluster',
                        center: { x: 0.5, y: 0.5 },
                        radius: 0.1
                    };
                }
            }
        }
        
        this.particleSystem.initializeParticlesWithPositions();
    }
    
    resize() {
        this.setupCanvas();
        this.render();
    }
    
    generateGlitchPatterns(pos) {
        // Clear existing patterns and distributions
        this.glitchPatterns.clear();
        this.distributions.clear();
        
        const clickX = pos.x / this.width;
        const clickY = pos.y / this.height;
        
        // Generate sci-fi glitch patterns for all species
        for (let speciesId = 0; speciesId < this.particleSystem.numSpecies; speciesId++) {
            if (!this.glitchPatterns.has(speciesId)) {
                this.glitchPatterns.set(speciesId, []);
            }
            
            const patterns = this.glitchPatterns.get(speciesId);
            const glitchTypes = ['quantum_interference', 'data_corruption', 'neural_noise', 'temporal_distortion', 'electromagnetic_pulse'];
            const glitchType = glitchTypes[speciesId % glitchTypes.length];
            
            patterns.push({
                type: 'glitch_pattern',
                center: { x: clickX, y: clickY },
                glitchType: glitchType,
                intensity: 0.3 + Math.random() * 0.7,
                frequency: 2 + Math.random() * 8,
                phase: Math.random() * Math.PI * 2,
                species: speciesId
            });
        }
        
        this.startGlitchAnimation();
        this.regenerateDistributions();
        
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    startGlitchAnimation() {
        this.glitchTime = 0;
        this.isAnimatingGlitch = true;
        
        const animate = () => {
            this.glitchTime += 0.02;
            this.regenerateDistributions();
            this.render();
            
            if (this.glitchTime < 5 && this.isAnimatingGlitch) { // Animate for 5 seconds
                requestAnimationFrame(animate);
            } else {
                this.isAnimatingGlitch = false;
            }
        };
        animate();
    }
    
    regenerateDistributions() {
        this.distributions.clear();
        
        for (const [speciesId, patterns] of this.glitchPatterns) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            
            const points = this.distributions.get(speciesId);
            
            for (const pattern of patterns) {
                if (pattern.type === 'glitch_pattern') {
                    this.generateGlitchPoints(pattern, points);
                }
            }
        }
    }
    
    generateGlitchPoints(pattern, points) {
        const centerX = pattern.center.x;
        const centerY = pattern.center.y;
        const intensity = pattern.intensity;
        const frequency = pattern.frequency;
        const phase = pattern.phase + this.glitchTime;
        
        switch (pattern.glitchType) {
            case 'quantum_interference':
                this.generateQuantumInterference(centerX, centerY, intensity, frequency, phase, points);
                break;
            case 'data_corruption':
                this.generateDataCorruption(centerX, centerY, intensity, frequency, phase, points);
                break;
            case 'neural_noise':
                this.generateNeuralNoise(centerX, centerY, intensity, frequency, phase, points);
                break;
            case 'temporal_distortion':
                this.generateTemporalDistortion(centerX, centerY, intensity, frequency, phase, points);
                break;
            case 'electromagnetic_pulse':
                this.generateEMPulse(centerX, centerY, intensity, frequency, phase, points);
                break;
        }
    }
    
    generateQuantumInterference(centerX, centerY, intensity, frequency, phase, points) {
        // Wave interference pattern
        const gridRes = 20;
        for (let i = 0; i < gridRes; i++) {
            for (let j = 0; j < gridRes; j++) {
                const x = i / gridRes;
                const y = j / gridRes;
                
                const wave1 = Math.sin((x - centerX) * frequency * Math.PI + phase);
                const wave2 = Math.cos((y - centerY) * frequency * Math.PI + phase);
                const interference = (wave1 + wave2) * intensity;
                
                if (Math.abs(interference) > 0.3) {
                    points.push({
                        x, y,
                        size: (this.brushSize / Math.min(this.width, this.height)) * 0.2,
                        opacity: Math.abs(interference)
                    });
                }
            }
        }
    }
    
    generateDataCorruption(centerX, centerY, intensity, frequency, phase, points) {
        // Pixelated corruption effect
        const chunkSize = 0.05;
        const numChunks = Math.floor(20 * intensity);
        
        for (let i = 0; i < numChunks; i++) {
            const chunkX = centerX + (Math.random() - 0.5) * 0.4;
            const chunkY = centerY + (Math.random() - 0.5) * 0.4;
            
            const corruption = Math.sin(phase + i) * intensity;
            if (Math.abs(corruption) > 0.2) {
                const pixelsInChunk = 4 + Math.floor(Math.abs(corruption) * 8);
                for (let p = 0; p < pixelsInChunk; p++) {
                    points.push({
                        x: Math.max(0, Math.min(1, chunkX + (Math.random() - 0.5) * chunkSize)),
                        y: Math.max(0, Math.min(1, chunkY + (Math.random() - 0.5) * chunkSize)),
                        size: (this.brushSize / Math.min(this.width, this.height)) * 0.15,
                        opacity: Math.abs(corruption)
                    });
                }
            }
        }
    }
    
    generateNeuralNoise(centerX, centerY, intensity, frequency, phase, points) {
        // Neural network-like connections with noise
        const nodes = [];
        const numNodes = 8 + Math.floor(intensity * 12);
        
        // Create nodes
        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2 + phase;
            const radius = 0.1 + Math.random() * 0.2;
            nodes.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
        
        // Create connections with noise
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const noise = Math.sin(phase + i + j) * intensity;
                if (Math.abs(noise) > 0.4) {
                    const steps = Math.floor(10 + Math.abs(noise) * 20);
                    for (let s = 0; s <= steps; s++) {
                        const t = s / steps;
                        const x = nodes[i].x + (nodes[j].x - nodes[i].x) * t;
                        const y = nodes[i].y + (nodes[j].y - nodes[i].y) * t;
                        
                        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                            points.push({
                                x, y,
                                size: (this.brushSize / Math.min(this.width, this.height)) * 0.1,
                                opacity: Math.abs(noise) * 0.8
                            });
                        }
                    }
                }
            }
        }
    }
    
    generateTemporalDistortion(centerX, centerY, intensity, frequency, phase, points) {
        // Time-warped spiral patterns
        const numSpirals = 3;
        const pointsPerSpiral = Math.floor(30 * intensity);
        
        for (let s = 0; s < numSpirals; s++) {
            const spiralOffset = (s / numSpirals) * Math.PI * 2;
            
            for (let i = 0; i < pointsPerSpiral; i++) {
                const t = i / pointsPerSpiral;
                const distortion = Math.sin(phase + t * frequency) * intensity;
                const angle = spiralOffset + t * Math.PI * 6 + distortion;
                const r = t * 0.3 * (1 + distortion * 0.5);
                
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: (this.brushSize / Math.min(this.width, this.height)) * (0.15 + Math.abs(distortion) * 0.1),
                    opacity: 0.6 + Math.abs(distortion) * 0.4
                });
            }
        }
    }
    
    generateEMPulse(centerX, centerY, intensity, frequency, phase, points) {
        // Electromagnetic pulse rings
        const numRings = Math.floor(5 + intensity * 10);
        
        for (let ring = 0; ring < numRings; ring++) {
            const ringPhase = phase + ring * 0.5;
            const ringRadius = (ring / numRings) * 0.4 * (1 + Math.sin(ringPhase) * intensity * 0.3);
            const pointsInRing = Math.floor(12 + ring * 4);
            
            for (let i = 0; i < pointsInRing; i++) {
                const angle = (i / pointsInRing) * Math.PI * 2;
                const pulse = Math.sin(ringPhase + angle * frequency) * intensity;
                
                if (Math.abs(pulse) > 0.2) {
                    const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * ringRadius));
                    const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * ringRadius));
                    
                    points.push({
                        x, y,
                        size: (this.brushSize / Math.min(this.width, this.height)) * (0.1 + Math.abs(pulse) * 0.2),
                        opacity: Math.abs(pulse)
                    });
                }
            }
        }
    }
    
    // New mathematical circle pattern generators
    generateFibonacciCircles() {
        const numSpecies = this.particleSystem.numSpecies;
        const centerX = this.circleCenter.x / this.width;
        const centerY = this.circleCenter.y / this.height;
        const baseRadius = this.circleRadius / Math.min(this.width, this.height);
        
        // Fibonacci sequence
        const fib = [1, 1];
        for (let i = 2; i < numSpecies + 10; i++) {
            fib.push(fib[i-1] + fib[i-2]);
        }
        
        for (let speciesId = 0; speciesId < numSpecies; speciesId++) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            const points = this.distributions.get(speciesId);
            
            // Create circles based on Fibonacci ratios
            const fibIndex = speciesId % fib.length;
            const radius = baseRadius * (fib[fibIndex] / fib[Math.min(fibIndex + 3, fib.length - 1)]);
            const numPoints = fib[fibIndex % 5] + 8;
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2 + speciesId * 0.5;
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * radius));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * radius));
                
                points.push({
                    x, y,
                    size: (this.brushSize / Math.min(this.width, this.height)) * 0.2,
                    opacity: 0.8
                });
            }
        }
    }
    
    generateFractalCircles() {
        const numSpecies = this.particleSystem.numSpecies;
        const centerX = this.circleCenter.x / this.width;
        const centerY = this.circleCenter.y / this.height;
        const baseRadius = this.circleRadius / Math.min(this.width, this.height);
        
        // Fractal recursion depth based on species count
        const maxDepth = Math.min(3, Math.ceil(Math.log2(numSpecies)));
        
        for (let speciesId = 0; speciesId < numSpecies; speciesId++) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            const points = this.distributions.get(speciesId);
            
            // Recursive fractal circles
            this.addFractalCircle(centerX, centerY, baseRadius, speciesId, numSpecies, 0, maxDepth, points);
        }
    }
    
    addFractalCircle(x, y, radius, speciesId, totalSpecies, depth, maxDepth, points) {
        if (depth > maxDepth || radius < 0.02) return;
        
        // Add circle points
        const numPoints = Math.max(8, Math.floor(20 - depth * 4));
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const px = Math.max(0, Math.min(1, x + Math.cos(angle) * radius));
            const py = Math.max(0, Math.min(1, y + Math.sin(angle) * radius));
            
            points.push({
                x: px, y: py,
                size: (this.brushSize / Math.min(this.width, this.height)) * (0.3 - depth * 0.1),
                opacity: 0.9 - depth * 0.2
            });
        }
        
        // Recursively add smaller circles
        if (depth < maxDepth) {
            const numSubCircles = 3 + (speciesId % 3);
            for (let i = 0; i < numSubCircles; i++) {
                const angle = (i / numSubCircles) * Math.PI * 2 + speciesId * 0.7;
                const subX = x + Math.cos(angle) * radius * 0.6;
                const subY = y + Math.sin(angle) * radius * 0.6;
                this.addFractalCircle(subX, subY, radius * 0.4, speciesId, totalSpecies, depth + 1, maxDepth, points);
            }
        }
    }
    
    generateSinusoidalCircles() {
        const numSpecies = this.particleSystem.numSpecies;
        const centerX = this.circleCenter.x / this.width;
        const centerY = this.circleCenter.y / this.height;
        const baseRadius = this.circleRadius / Math.min(this.width, this.height);
        
        for (let speciesId = 0; speciesId < numSpecies; speciesId++) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            const points = this.distributions.get(speciesId);
            
            // Sinusoidal wave circles
            const frequency = 2 + (speciesId % 5);
            const amplitude = 0.1 + (speciesId % 3) * 0.05;
            const phase = (speciesId / numSpecies) * Math.PI * 2;
            const numPoints = 30 + speciesId * 2;
            
            for (let i = 0; i < numPoints; i++) {
                const t = i / numPoints;
                const angle = t * Math.PI * 2;
                const r = baseRadius * (1 + Math.sin(angle * frequency + phase) * amplitude);
                
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: (this.brushSize / Math.min(this.width, this.height)) * 0.2,
                    opacity: 0.7 + Math.sin(angle * frequency) * 0.3
                });
            }
        }
    }
    
    generateGoldenRatioCircles() {
        const numSpecies = this.particleSystem.numSpecies;
        const centerX = this.circleCenter.x / this.width;
        const centerY = this.circleCenter.y / this.height;
        const baseRadius = this.circleRadius / Math.min(this.width, this.height);
        
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
        
        for (let speciesId = 0; speciesId < numSpecies; speciesId++) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            const points = this.distributions.get(speciesId);
            
            // Golden spiral distribution
            const numPoints = 13 + speciesId * 5;
            const offset = speciesId * goldenAngle;
            
            for (let i = 0; i < numPoints; i++) {
                const angle = i * goldenAngle + offset;
                const r = baseRadius * Math.sqrt(i / numPoints) * 0.8;
                
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: (this.brushSize / Math.min(this.width, this.height)) * (0.15 + (1 - i/numPoints) * 0.1),
                    opacity: 0.6 + (1 - i/numPoints) * 0.4
                });
            }
        }
    }
    
    generatePhyllotaxisCircles() {
        const numSpecies = this.particleSystem.numSpecies;
        const centerX = this.circleCenter.x / this.width;
        const centerY = this.circleCenter.y / this.height;
        const baseRadius = this.circleRadius / Math.min(this.width, this.height);
        
        // Phyllotaxis pattern (sunflower seed arrangement)
        const c = 0.5; // Scaling constant
        
        for (let speciesId = 0; speciesId < numSpecies; speciesId++) {
            if (!this.distributions.has(speciesId)) {
                this.distributions.set(speciesId, []);
            }
            const points = this.distributions.get(speciesId);
            
            const numSeeds = 20 + speciesId * 8;
            const angleOffset = (speciesId / numSpecies) * Math.PI * 2;
            
            for (let i = 0; i < numSeeds; i++) {
                const angle = i * 137.5 * Math.PI / 180 + angleOffset; // 137.5 degrees is golden angle
                const r = c * Math.sqrt(i) * baseRadius / Math.sqrt(numSeeds);
                
                if (r <= baseRadius) {
                    const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                    const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                    
                    points.push({
                        x, y,
                        size: (this.brushSize / Math.min(this.width, this.height)) * 0.15,
                        opacity: 0.8
                    });
                }
            }
        }
    }
    
    updateModeIndicator() {
        const modeIndicator = document.getElementById('mode-indicator');
        if (!modeIndicator) return;
        
        const modeTexts = {
            draw: 'Draw Mode',
            circles: 'Precision Circles',
            random: 'Species AI',
            glitch: 'Sci-Fi Glitch',
            erase: 'Erase Mode',
            cluster: 'Cluster Pattern',
            ring: 'Ring Pattern', 
            grid: 'Grid Pattern'
        };
        
        modeIndicator.textContent = modeTexts[this.currentMode] || 'Unknown Mode';
    }
    
    updateCircleIndicator() {
        const circleIndicator = document.getElementById('circle-indicator');
        if (!circleIndicator) return;
        
        if (this.currentMode === 'circles') {
            circleIndicator.classList.add('visible');
            
            switch (this.circleState) {
                case 'inactive':
                    circleIndicator.textContent = 'Click to set center';
                    break;
                case 'setting-radius':
                    circleIndicator.textContent = 'Click to set radius';
                    break;
                default:
                    circleIndicator.textContent = 'Circle Mode';
            }
        } else if (this.currentMode === 'glitch') {
            circleIndicator.classList.add('visible');
            circleIndicator.textContent = 'Click for sci-fi glitch patterns';
        } else {
            circleIndicator.classList.remove('visible');
        }
    }
}