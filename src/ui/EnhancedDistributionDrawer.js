export class EnhancedDistributionDrawer {
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
        
        // Random pattern types
        this.randomPatterns = ['organic', 'geometric', 'spiral', 'fractal', 'noise'];
        this.currentRandomPattern = 'organic';
        
        // Distribution data: Map<speciesId, Array<{x, y, size, opacity}>>
        this.distributions = new Map();
        
        this.setupCanvas();
        this.setupEventListeners();
        
        this.updateFromParticleSystem();
        this.render();
        
        setTimeout(() => {
            this.initializeWithDemoData();
        }, 100);
    }
    
    setupCanvas() {
        try {
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            
            if (rect.width <= 0 || rect.height <= 0) {
                console.warn('EnhancedDistributionDrawer: Invalid canvas dimensions, using defaults');
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
            console.error('EnhancedDistributionDrawer: Error setting up canvas:', error);
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
                this.addDistributionPoint(pos);
                break;
                
            case 'circles':
                this.handleCircleMode(pos);
                break;
                
            case 'random':
                this.generateRandomPattern(pos);
                break;
        }
        
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        this.mousePos = this.getMousePosition(e);
        
        if (this.isDrawing && (this.currentMode === 'draw' || this.currentMode === 'erase')) {
            this.addDistributionPoint(this.mousePos);
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
                break;
                
            case 'setting-radius':
                this.generateCirclePattern();
                this.circleState = 'inactive';
                this.circleCenter = null;
                this.circleRadius = 0;
                break;
        }
    }
    
    generateCirclePattern() {
        if (!this.circleCenter || this.circleRadius < 10) return;
        
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        const numPoints = Math.floor(this.circleRadius / 5) + 8;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const r = this.circleRadius * (0.8 + Math.random() * 0.4);
            const x = this.circleCenter.x + Math.cos(angle) * r;
            const y = this.circleCenter.y + Math.sin(angle) * r;
            
            if (x >= 0 && x <= this.width && y >= 0 && y <= this.height) {
                points.push({
                    x: x / this.width,
                    y: y / this.height,
                    size: (this.brushSize / Math.min(this.width, this.height)) * 0.3,
                    opacity: 0.7 + Math.random() * 0.3
                });
            }
        }
    }
    
    generateRandomPattern(pos) {
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        const centerX = pos.x / this.width;
        const centerY = pos.y / this.height;
        const radius = (this.brushSize * 3) / Math.min(this.width, this.height);
        
        this.generatePatternPoints(this.currentRandomPattern, centerX, centerY, radius, points);
    }
    
    generatePatternPoints(pattern, centerX, centerY, radius, points) {
        const baseSize = (this.brushSize / Math.min(this.width, this.height)) * 0.2;
        
        switch (pattern) {
            case 'organic':
                this.generateOrganicPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'geometric':
                this.generateGeometricPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'spiral':
                this.generateSpiralPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'fractal':
                this.generateFractalPattern(centerX, centerY, radius, points, baseSize);
                break;
            case 'noise':
                this.generateNoisePattern(centerX, centerY, radius, points, baseSize);
                break;
        }
    }
    
    generateOrganicPattern(centerX, centerY, radius, points, baseSize) {
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
    
    generateGeometricPattern(centerX, centerY, radius, points, baseSize) {
        const shapes = ['triangle', 'square', 'hexagon'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        let numPoints;
        switch (shape) {
            case 'triangle': numPoints = 3; break;
            case 'square': numPoints = 4; break;
            case 'hexagon': numPoints = 6; break;
        }
        
        const layers = 2 + Math.floor(Math.random() * 2);
        for (let layer = 0; layer < layers; layer++) {
            const layerRadius = radius * (0.3 + (layer / layers) * 0.7);
            const pointsInLayer = numPoints * (layer + 1);
            
            for (let i = 0; i < pointsInLayer; i++) {
                const angle = (i / pointsInLayer) * Math.PI * 2;
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * layerRadius));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * layerRadius));
                
                points.push({
                    x, y,
                    size: baseSize * (0.8 - layer * 0.1),
                    opacity: 0.8 - layer * 0.1
                });
            }
        }
    }
    
    generateSpiralPattern(centerX, centerY, radius, points, baseSize) {
        const numSpirals = 1 + Math.floor(Math.random() * 2);
        const pointsPerSpiral = 20 + Math.floor(Math.random() * 15);
        
        for (let s = 0; s < numSpirals; s++) {
            const spiralOffset = (s / numSpirals) * Math.PI * 2;
            
            for (let i = 0; i < pointsPerSpiral; i++) {
                const t = i / pointsPerSpiral;
                const angle = spiralOffset + t * Math.PI * 6;
                const r = t * radius;
                const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
                const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
                
                points.push({
                    x, y,
                    size: baseSize * (1 - t * 0.5),
                    opacity: 0.9 - t * 0.4
                });
            }
        }
    }
    
    generateFractalPattern(centerX, centerY, radius, points, baseSize) {
        this.addFractalBranch(centerX, centerY, radius, 0, 4, points, baseSize);
    }
    
    addFractalBranch(x, y, length, angle, depth, points, baseSize) {
        if (depth <= 0 || length < 0.01) return;
        
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        const numPoints = Math.max(2, Math.floor(length * 20));
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const px = Math.max(0, Math.min(1, x + (endX - x) * t));
            const py = Math.max(0, Math.min(1, y + (endY - y) * t));
            
            points.push({
                x: px, y: py,
                size: baseSize * (1 - t * 0.3) * (depth / 4),
                opacity: 0.6 + (depth / 4) * 0.4
            });
        }
        
        const branchAngle = Math.PI / 6 + Math.random() * Math.PI / 12;
        this.addFractalBranch(endX, endY, length * 0.7, angle + branchAngle, depth - 1, points, baseSize);
        this.addFractalBranch(endX, endY, length * 0.7, angle - branchAngle, depth - 1, points, baseSize);
    }
    
    generateNoisePattern(centerX, centerY, radius, points, baseSize) {
        const numPoints = 30 + Math.floor(Math.random() * 30);
        
        for (let i = 0; i < numPoints; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius * (0.5 + 0.5 * Math.sin(angle * 3) * Math.cos(angle * 5));
            const x = Math.max(0, Math.min(1, centerX + Math.cos(angle) * r));
            const y = Math.max(0, Math.min(1, centerY + Math.sin(angle) * r));
            
            points.push({
                x, y,
                size: baseSize * (0.3 + Math.random() * 0.7),
                opacity: 0.4 + Math.random() * 0.6
            });
        }
    }
    
    addDistributionPoint(pos) {
        const x = pos.x / this.width;
        const y = pos.y / this.height;
        
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        
        if (!this.distributions.has(this.currentSpecies)) {
            this.distributions.set(this.currentSpecies, []);
        }
        
        const points = this.distributions.get(this.currentSpecies);
        
        if (this.currentMode === 'erase') {
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
    
    // Public API methods
    setMode(mode) {
        const validModes = ['draw', 'circles', 'random', 'erase'];
        if (validModes.includes(mode)) {
            this.currentMode = mode;
            
            // Reset circle state when changing modes
            if (mode !== 'circles') {
                this.circleState = 'inactive';
                this.circleCenter = null;
                this.circleRadius = 0;
            }
            
            this.canvas.style.cursor = mode === 'erase' ? 'crosshair' : 'default';
        }
    }
    
    setRandomPattern(pattern) {
        if (this.randomPatterns.includes(pattern)) {
            this.currentRandomPattern = pattern;
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
    
    getCircleState() {
        return {
            state: this.circleState,
            center: this.circleCenter,
            radius: this.circleRadius
        };
    }
    
    // Inherit existing methods from DistributionDrawer
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
            console.error('EnhancedDistributionDrawer: Invalid particle system');
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
}