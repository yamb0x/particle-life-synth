export class XYGraph {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || 280,
            height: options.height || 200,
            minX: options.minX || 0,
            maxX: options.maxX || 1,
            minY: options.minY || 0,
            maxY: options.maxY || 1,
            labelX: options.labelX || 'X',
            labelY: options.labelY || 'Y',
            gradientColors: options.gradientColors || null,
            gridLines: options.gridLines || 5,
            showTooltip: options.showTooltip !== false,
            onChange: options.onChange || null,
            is1D: options.minY === options.maxY || options.is1D === true
        };
        
        this.value = this.options.is1D ? this.options.minX : { x: this.options.minX, y: this.options.minY };
        this.isDragging = false;
        
        this.init();
    }
    
    init() {
        // Create graph container
        this.graphContainer = document.createElement('div');
        this.graphContainer.className = 'graph-container';
        this.graphContainer.style.width = `${this.options.width}px`;
        this.graphContainer.style.height = `${this.options.height}px`;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.className = 'graph-canvas';
        this.graphContainer.appendChild(this.canvas);
        
        // Create tooltip
        if (this.options.showTooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'graph-tooltip';
            this.tooltip.style.display = 'none';
            this.graphContainer.appendChild(this.tooltip);
        }
        
        // Create info display
        this.infoDisplay = document.createElement('div');
        this.infoDisplay.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 5px;
            font-size: var(--font-size-xs);
            color: var(--text-tertiary);
        `;
        this.graphContainer.appendChild(this.infoDisplay);
        
        this.container.appendChild(this.graphContainer);
        
        this.ctx = this.canvas.getContext('2d');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial draw
        this.draw();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.updateValueFromMouse(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.updateValueFromMouse(e);
            }
            
            if (this.options.showTooltip) {
                this.updateTooltip(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            if (this.tooltip) {
                this.tooltip.style.display = 'none';
            }
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.updateValueFromTouch(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                this.updateValueFromTouch(e);
            }
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }
    
    updateValueFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(this.options.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(this.options.height, e.clientY - rect.top));
        
        this.updateValue(x, y);
    }
    
    updateValueFromTouch(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = Math.max(0, Math.min(this.options.width, touch.clientX - rect.left));
        const y = Math.max(0, Math.min(this.options.height, touch.clientY - rect.top));
        
        this.updateValue(x, y);
    }
    
    updateValue(pixelX, pixelY) {
        if (this.options.is1D) {
            // Map pixel to value for 1D graph
            const normalizedX = pixelX / this.options.width;
            this.value = this.options.minX + normalizedX * (this.options.maxX - this.options.minX);
        } else {
            // Map pixels to values for 2D graph
            const normalizedX = pixelX / this.options.width;
            const normalizedY = 1 - (pixelY / this.options.height); // Invert Y
            
            this.value = {
                x: this.options.minX + normalizedX * (this.options.maxX - this.options.minX),
                y: this.options.minY + normalizedY * (this.options.maxY - this.options.minY)
            };
        }
        
        this.draw();
        
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }
    
    updateTooltip(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(this.options.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(this.options.height, e.clientY - rect.top));
        
        let tooltipText;
        if (this.options.is1D) {
            const normalizedX = x / this.options.width;
            const value = this.options.minX + normalizedX * (this.options.maxX - this.options.minX);
            tooltipText = `${this.options.labelX}: ${value.toFixed(2)}`;
        } else {
            const normalizedX = x / this.options.width;
            const normalizedY = 1 - (y / this.options.height);
            const valueX = this.options.minX + normalizedX * (this.options.maxX - this.options.minX);
            const valueY = this.options.minY + normalizedY * (this.options.maxY - this.options.minY);
            tooltipText = `${this.options.labelX}: ${valueX.toFixed(2)}, ${this.options.labelY}: ${valueY.toFixed(2)}`;
        }
        
        this.tooltip.textContent = tooltipText;
        this.tooltip.style.display = 'block';
        
        // Position tooltip
        const tooltipX = Math.min(x + 10, this.options.width - this.tooltip.offsetWidth - 5);
        const tooltipY = Math.max(y - 30, 5);
        this.tooltip.style.left = `${tooltipX}px`;
        this.tooltip.style.top = `${tooltipY}px`;
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.options.width;
        const height = this.options.height;
        
        // Clear canvas
        ctx.fillStyle = '#0c0c0c';
        ctx.fillRect(0, 0, width, height);
        
        // Draw gradient background if specified
        if (this.options.gradientColors) {
            if (this.options.is1D) {
                const gradient = ctx.createLinearGradient(0, 0, width, 0);
                this.options.gradientColors.forEach((color, i) => {
                    gradient.addColorStop(i / (this.options.gradientColors.length - 1), color + '20');
                });
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            } else {
                // 2D gradient (radial or custom)
                const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
                gradient.addColorStop(0, this.options.gradientColors[0] + '40');
                gradient.addColorStop(1, this.options.gradientColors[1] + '10');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
        }
        
        // Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= this.options.gridLines; i++) {
            const x = (i / this.options.gridLines) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        if (!this.options.is1D) {
            // Horizontal lines for 2D
            for (let i = 0; i <= this.options.gridLines; i++) {
                const y = (i / this.options.gridLines) * height;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
        }
        
        // Draw center lines (thicker)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        
        if (this.options.minX < 0 && this.options.maxX > 0) {
            const centerX = width * (-this.options.minX / (this.options.maxX - this.options.minX));
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.stroke();
        }
        
        if (!this.options.is1D && this.options.minY < 0 && this.options.maxY > 0) {
            const centerY = height * (1 - (-this.options.minY / (this.options.maxY - this.options.minY)));
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
        }
        
        // Draw labels
        ctx.fillStyle = '#999999';
        ctx.font = '10px var(--font-mono)';
        
        // X axis labels
        ctx.fillText(this.options.minX.toFixed(1), 5, height - 5);
        ctx.fillText(this.options.maxX.toFixed(1), width - 25, height - 5);
        
        if (!this.options.is1D) {
            // Y axis labels
            ctx.fillText(this.options.maxY.toFixed(1), 5, 15);
            ctx.fillText(this.options.minY.toFixed(1), 5, height - 15);
        }
        
        // Draw current value
        if (this.options.is1D) {
            const x = ((this.value - this.options.minX) / (this.options.maxX - this.options.minX)) * width;
            const y = height / 2;
            
            // Draw vertical line
            ctx.strokeStyle = this.value < 0 ? '#cc6666' : (this.value > 0 ? '#66cc66' : '#999999');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            // Draw handle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = this.value < 0 ? '#cc6666' : (this.value > 0 ? '#66cc66' : '#999999');
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const x = ((this.value.x - this.options.minX) / (this.options.maxX - this.options.minX)) * width;
            const y = (1 - ((this.value.y - this.options.minY) / (this.options.maxY - this.options.minY))) * height;
            
            // Draw crosshair
            ctx.strokeStyle = '#66666640';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            // Draw handle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    setValue(value) {
        this.value = value;
        this.draw();
    }
    
    getValue() {
        return this.value;
    }
    
    setInfo(text) {
        this.infoDisplay.textContent = text;
    }
    
    setOptions(options) {
        this.options = { ...this.options, ...options };
        this.draw();
    }
}