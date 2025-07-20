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
        this.currentPattern = 'draw';
        this.isDrawing = false;
        this.mousePos = { x: 0, y: 0 };
        this.showBrushPreview = false;
        
        // Distribution data: Map<speciesId, Array<{x, y, size, opacity}>>
        // Coordinates are stored in normalized 0-1 space to be independent of canvas size
        this.distributions = new Map();
        
        this.setupCanvas();
        this.setupEventListeners();
        
        this.updateFromParticleSystem();
        this.render();
        
        // Initialize with demo data after a delay to ensure all other initialization is complete
        setTimeout(() => {
            this.initializeWithDemoData();
        }, 100);
    }
    
    setupCanvas() {
        try {
            // High DPI support
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            
            // Ensure we have valid dimensions
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
            // Fallback to minimal setup
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
        if (this.currentPattern === 'draw' || this.currentPattern === 'erase') {
            this.isDrawing = true;
            this.addDistributionPoint(e);
        } else {
            this.addPresetPattern(e);
        }
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        this.updateMousePosition(e);
        
        if (this.isDrawing && (this.currentPattern === 'draw' || this.currentPattern === 'erase')) {
            this.addDistributionPoint(e);
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
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }
    
    addDistributionPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.width;
        const y = (e.clientY - rect.top) / this.height;
        
        // Clamp to canvas bounds
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        
        if (this.currentPattern === 'erase') {
            this.erasePoints(x, y, points);
        } else {
            this.addDrawPoint(x, y, points);
        }
    }
    
    erasePoints(x, y, points) {
        const eraseRadius = (this.brushSize / Math.min(this.width, this.height)) * 0.5;
        
        for (let i = points.length - 1; i >= 0; i--) {
            const point = points[i];
            const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            if (dist < eraseRadius + point.size * 0.5) {
                points.splice(i, 1);
            }
        }
    }
    
    addDrawPoint(x, y, points) {
        const size = (this.brushSize / Math.min(this.width, this.height)) * 0.3;
        
        // Check if point is too close to existing points (avoid clustering)
        const minDistance = size * 0.3;
        const tooClose = points.some(point => {
            const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            return dist < minDistance;
        });
        
        if (!tooClose) {
            points.push({
                x,
                y,
                size,
                opacity: this.opacity
            });
        }
    }
    
    addPresetPattern(e) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = (e.clientX - rect.left) / this.width;
        const centerY = (e.clientY - rect.top) / this.height;
        
        // Clamp to canvas bounds
        if (centerX < 0 || centerX > 1 || centerY < 0 || centerY > 1) return;
        
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        const patternSize = this.brushSize * (this.isCompact ? 2 : 3);
        const radius = (patternSize / Math.min(this.width, this.height)) * 0.5;
        
        this.generatePatternPoints(this.currentPattern, centerX, centerY, radius, points);
        
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
                        x,
                        y,
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
                        x,
                        y,
                        size: baseSize * 0.8,
                        opacity: this.opacity
                    });
                }
                break;
                
            case 'grid':
                const gridSize = this.isCompact ? 4 : 6;
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        // Maintain square grid spacing in normalized coordinates
                        const spacing = radius * 2 / gridSize;
                        const gx = centerX + (i - gridSize/2 + 0.5) * spacing;
                        const gy = centerY + (j - gridSize/2 + 0.5) * spacing;
                        
                        // Check if point is within circular bounds
                        const distFromCenter = Math.sqrt((gx - centerX) ** 2 + (gy - centerY) ** 2);
                        if (distFromCenter <= radius && gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1) {
                            points.push({
                                x: gx,
                                y: gy,
                                size: baseSize * 0.6,
                                opacity: this.opacity
                            });
                        }
                    }
                }
                break;
                
            case 'random':
                const randomPoints = this.isCompact ? 20 : 35;
                for (let i = 0; i < randomPoints; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius;
                    const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                    const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                    
                    points.push({
                        x,
                        y,
                        size: baseSize * (0.3 + Math.random() * 0.7),
                        opacity: this.opacity * (0.5 + Math.random() * 0.5)
                    });
                }
                break;
        }
    }
    
    render() {
        // Use same background as test page
        this.ctx.fillStyle = '#0c0c0c';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawGrid();
        this.drawDistributions();
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
                
                // Draw glow effect for better visibility
                this.ctx.globalAlpha = point.opacity * 0.3;
                this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw main point
                this.ctx.globalAlpha = point.opacity;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawBrushPreview() {
        if (!this.showBrushPreview || this.mousePos.x === undefined) return;
        
        const species = this.particleSystem.species[this.currentSpecies];
        if (!species) return;
        
        const color = species.color;
        const alpha = this.currentPattern === 'erase' ? 0.5 : 0.3;
        
        this.ctx.globalAlpha = alpha;
        if (this.currentPattern === 'erase') {
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
    
    updateFromParticleSystem() {
        // Update current species if it's out of bounds
        if (this.currentSpecies >= this.particleSystem.numSpecies) {
            this.currentSpecies = 0;
        }
        
        // Clean up distributions for removed species
        const validSpecies = new Set();
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            validSpecies.add(i);
        }
        
        for (const speciesId of this.distributions.keys()) {
            if (!validSpecies.has(speciesId)) {
                this.distributions.delete(speciesId);
            }
        }
        
        // Load existing custom distributions from particle system
        this.loadExistingDistributions();
        
        // Re-render to show current state
        this.render();
    }
    
    initializeWithDemoData() {
        // Only add demo distributions if there are no existing custom distributions
        // and if we have enough species (like the test page)
        if (this.particleSystem.numSpecies >= 3) {
            let hasExistingDistributions = false;
            
            // Check if any species already has custom distributions
            for (let i = 0; i < this.particleSystem.numSpecies; i++) {
                const species = this.particleSystem.species[i];
                if (species && species.startPosition && species.startPosition.type === 'custom') {
                    hasExistingDistributions = true;
                    break;
                }
            }
            
            // Also check if the drawing interface already has distributions
            if (this.distributions.size > 0) {
                hasExistingDistributions = true;
            }
            
            
            if (!hasExistingDistributions) {
                const demoDistributions = {
                    0: [ // Red - cluster in top-left
                        {x: 0.2, y: 0.2, size: 0.05, opacity: 0.8},
                        {x: 0.25, y: 0.18, size: 0.04, opacity: 0.7},
                        {x: 0.15, y: 0.25, size: 0.04, opacity: 0.6}
                    ],
                    1: [ // Green - ring in center
                        {x: 0.5, y: 0.4, size: 0.03, opacity: 0.8},
                        {x: 0.6, y: 0.5, size: 0.03, opacity: 0.8},
                        {x: 0.5, y: 0.6, size: 0.03, opacity: 0.8},
                        {x: 0.4, y: 0.5, size: 0.03, opacity: 0.8}
                    ],
                    2: [ // Blue - grid in bottom-right
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
        // Convert existing custom startPositions to distribution points
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            if (species && species.startPosition && species.startPosition.type === 'custom' && species.startPosition.customPoints) {
                this.distributions.set(i, [...species.startPosition.customPoints]);
            }
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
    
    setPattern(pattern) {
        const validPatterns = ['draw', 'erase', 'cluster', 'ring', 'grid', 'random'];
        if (validPatterns.includes(pattern)) {
            this.currentPattern = pattern;
            this.canvas.style.cursor = pattern === 'erase' ? 'crosshair' : 'default';
        }
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
    
    exportDistribution() {
        const result = {};
        for (const [speciesId, points] of this.distributions) {
            if (points.length > 0) {
                result[speciesId] = [...points]; // Deep copy
            }
        }
        return result;
    }
    
    importDistribution(data) {
        this.distributions.clear();
        
        for (const [speciesId, points] of Object.entries(data)) {
            const id = parseInt(speciesId);
            if (id >= 0 && id < this.particleSystem.numSpecies && Array.isArray(points)) {
                this.distributions.set(id, [...points]); // Deep copy
            }
        }
        
        this.render();
        
        // Apply the imported distribution to the particle system
        this.applyToParticleSystem();
        
        // Trigger onChange callback if provided
        if (this.onChange) {
            this.onChange(this.exportDistribution());
        }
    }
    
    applyToParticleSystem() {
        if (!this.particleSystem || !this.particleSystem.species) {
            console.error('DistributionDrawer: Invalid particle system');
            return;
        }
        
        // Convert drawn distributions to particle system startPositions
        for (let i = 0; i < this.particleSystem.numSpecies; i++) {
            const species = this.particleSystem.species[i];
            if (!species) continue;
            
            const points = this.distributions.get(i);
            if (points && points.length > 0) {
                // Calculate center of mass and average radius
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
                    
                    // Calculate average distance from center as radius
                    let avgRadius = 0;
                    for (const point of points) {
                        const dist = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
                        avgRadius += dist;
                    }
                    avgRadius /= points.length;
                    avgRadius = Math.max(0.05, Math.min(0.4, avgRadius)); // Clamp radius
                    
                    species.startPosition = {
                        type: 'custom',
                        center: { x: centerX, y: centerY },
                        radius: avgRadius,
                        customPoints: points
                    };
                }
            } else {
                // No custom distribution, keep existing or set default
                if (!species.startPosition || species.startPosition.type === 'custom') {
                    species.startPosition = {
                        type: 'cluster',
                        center: { x: 0.5, y: 0.5 },
                        radius: 0.1
                    };
                }
            }
        }
        
        // Reinitialize particles with new positions
        this.particleSystem.initializeParticlesWithPositions();
    }
    
    resize() {
        this.setupCanvas();
        this.render();
    }
}