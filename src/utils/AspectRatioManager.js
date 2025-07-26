export class AspectRatioManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = null;
        this.enabled = false;
        this.strokeEnabled = false;
        this.ratioWidth = 16;
        this.ratioHeight = 9;
        this.canvasSize = 'fit';
        this.customWidth = 1280;
        this.customHeight = 720;
        
        // Create container and wrap canvas
        this.createContainer();
    }
    
    createContainer() {
        // Create container div
        this.container = document.createElement('div');
        this.container.id = 'canvas-container';
        
        // Wrap the canvas
        this.canvas.parentNode.insertBefore(this.container, this.canvas);
        this.container.appendChild(this.canvas);
        
        // Add styles dynamically
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #canvas-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                transition: all 0.3s ease-in-out;
                z-index: 0;
            }
            
            #canvas-container.aspect-ratio-enabled {
                /* Container stays full screen for centering */
            }
            
            #canvas-container #canvas {
                display: block;
                position: relative;
            }
            
            #canvas-container.with-stroke #canvas {
                border: 1px solid white;
                box-sizing: border-box;
            }
        `;
        document.head.appendChild(style);
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        this.updateCanvas();
        this.updateStroke();
        
        if (enabled) {
            this.container.classList.add('aspect-ratio-enabled');
        } else {
            this.container.classList.remove('aspect-ratio-enabled');
        }
    }
    
    setStrokeEnabled(enabled) {
        this.strokeEnabled = enabled;
        this.updateStroke();
    }
    
    updateStroke() {
        if (this.enabled && this.strokeEnabled) {
            this.container.classList.add('with-stroke');
        } else {
            this.container.classList.remove('with-stroke');
        }
    }
    
    setRatio(width, height) {
        this.ratioWidth = width;
        this.ratioHeight = height;
        this.updateCanvas();
    }
    
    setCanvasSize(size) {
        this.canvasSize = size;
        this.updateCanvas();
    }
    
    setCustomSize(width, height) {
        this.customWidth = width;
        this.customHeight = height;
        if (this.canvasSize === 'custom-size') {
            this.updateCanvas();
        }
    }
    
    updateCanvas() {
        if (!this.enabled) {
            // Full window mode
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            // Calculate dimensions based on settings
            let targetWidth, targetHeight;
            
            // Determine target size
            switch (this.canvasSize) {
                case '720p':
                    targetWidth = 1280;
                    targetHeight = 720;
                    break;
                case '1080p':
                    targetWidth = 1920;
                    targetHeight = 1080;
                    break;
                case 'custom-size':
                    targetWidth = this.customWidth;
                    targetHeight = this.customHeight;
                    break;
                case 'fit':
                default:
                    // Fit to window while maintaining aspect ratio
                    const windowRatio = window.innerWidth / window.innerHeight;
                    const targetRatio = this.ratioWidth / this.ratioHeight;
                    
                    if (windowRatio > targetRatio) {
                        // Window is wider than target ratio
                        targetHeight = window.innerHeight * 0.9;
                        targetWidth = targetHeight * targetRatio;
                    } else {
                        // Window is taller than target ratio
                        targetWidth = window.innerWidth * 0.9;
                        targetHeight = targetWidth / targetRatio;
                    }
                    break;
            }
            
            // Apply aspect ratio constraint
            const targetRatio = this.ratioWidth / this.ratioHeight;
            const currentRatio = targetWidth / targetHeight;
            
            if (currentRatio > targetRatio) {
                // Width is too large, adjust it
                targetWidth = targetHeight * targetRatio;
            } else if (currentRatio < targetRatio) {
                // Height is too large, adjust it
                targetHeight = targetWidth / targetRatio;
            }
            
            // Set canvas dimensions - the container's flex will center it
            this.canvas.style.width = `${targetWidth}px`;
            this.canvas.style.height = `${targetHeight}px`;
            this.canvas.width = targetWidth;
            this.canvas.height = targetHeight;
        }
    }
    
    getCanvasDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
}