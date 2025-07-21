export class ColorPicker {
  constructor(onChange) {
    this.onChange = onChange;
    this.color = { r: 255, g: 100, b: 100 };
    this.isOpen = false;
    this.isDragging = false;
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.element = this.createElement();
    this.gradientCache = null;
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'color-picker-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Color picker');
    
    this.colorDisplay = document.createElement('button');
    this.colorDisplay.className = 'color-picker-display';
    this.colorDisplay.setAttribute('aria-label', 'Open color picker');
    this.colorDisplay.setAttribute('aria-expanded', 'false');
    this.colorDisplay.setAttribute('aria-haspopup', 'true');
    this.updateDisplay();
    
    this.picker = document.createElement('div');
    this.picker.className = 'color-picker-dropdown';
    this.picker.style.display = 'none';
    this.picker.setAttribute('role', 'dialog');
    this.picker.setAttribute('aria-label', 'Color selection dialog');
    
    this.picker.innerHTML = `
      <div class="color-picker-content">
        <canvas class="color-picker-canvas" width="200" height="150" tabindex="0" role="img" aria-label="Color gradient selector"></canvas>
        <div class="color-picker-indicator" style="display: none;"></div>
        <div class="color-picker-sliders">
          <div class="color-slider-group">
            <label for="slider-r-${Date.now()}">R</label>
            <input type="range" class="range-slider color-slider" id="slider-r-${Date.now()}" min="0" max="255" value="${this.color.r}" aria-label="Red channel">
            <span class="value-display" aria-live="polite">${this.color.r}</span>
          </div>
          <div class="color-slider-group">
            <label for="slider-g-${Date.now()}">G</label>
            <input type="range" class="range-slider color-slider" id="slider-g-${Date.now()}" min="0" max="255" value="${this.color.g}" aria-label="Green channel">
            <span class="value-display" aria-live="polite">${this.color.g}</span>
          </div>
          <div class="color-slider-group">
            <label for="slider-b-${Date.now()}">B</label>
            <input type="range" class="range-slider color-slider" id="slider-b-${Date.now()}" min="0" max="255" value="${this.color.b}" aria-label="Blue channel">
            <span class="value-display" aria-live="polite">${this.color.b}</span>
          </div>
        </div>
        <div class="color-picker-hex">
          <input type="text" class="input hex-input" value="${this.rgbToHex(this.color)}" aria-label="Hex color value" placeholder="#RRGGBB">
        </div>
      </div>
    `;
    
    container.appendChild(this.colorDisplay);
    container.appendChild(this.picker);
    
    this.canvas = this.picker.querySelector('.color-picker-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.colorDisplay.addEventListener('click', () => this.toggle());
    this.colorDisplay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
    
    this.setupCanvas();
    this.setupSliders();
    this.setupHexInput();
    
    return container;
  }

  setupCanvas() {
    this.drawGradient();
    this.indicator = this.picker.querySelector('.color-picker-indicator');
    
    const handleColorSelect = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, this.canvas.width - 1));
      const y = Math.max(0, Math.min(e.clientY - rect.top, this.canvas.height - 1));
      
      const imageData = this.ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      
      this.setColor({ r, g, b });
      this.updateIndicatorPosition(x, y);
    };
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      handleColorSelect(e);
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        handleColorSelect(e);
      }
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
    
    this.canvas.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 1;
      const rect = this.canvas.getBoundingClientRect();
      let x = parseInt(this.indicator.style.left) || 0;
      let y = parseInt(this.indicator.style.top) || 0;
      
      switch(e.key) {
        case 'ArrowLeft':
          x = Math.max(0, x - step);
          break;
        case 'ArrowRight':
          x = Math.min(this.canvas.width - 1, x + step);
          break;
        case 'ArrowUp':
          y = Math.max(0, y - step);
          break;
        case 'ArrowDown':
          y = Math.min(this.canvas.height - 1, y + step);
          break;
        default:
          return;
      }
      
      e.preventDefault();
      const imageData = this.ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      this.setColor({ r, g, b });
      this.updateIndicatorPosition(x, y);
    });
  }

  drawGradient() {
    if (this.gradientCache) {
      this.ctx.putImageData(this.gradientCache, 0, 0);
      return;
    }
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Use offscreen canvas for better performance
    const offscreen = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : document.createElement('canvas');
    if (typeof OffscreenCanvas === 'undefined') {
      offscreen.width = width;
      offscreen.height = height;
    }
    const offCtx = offscreen.getContext('2d');
    
    const hueGradient = offCtx.createLinearGradient(0, 0, width, 0);
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const hue = (i / steps) * 360;
      hueGradient.addColorStop(i / steps, `hsl(${hue}, 100%, 50%)`);
    }
    
    offCtx.fillStyle = hueGradient;
    offCtx.fillRect(0, 0, width, height);
    
    const whiteGradient = offCtx.createLinearGradient(0, 0, 0, height);
    whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    whiteGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    whiteGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    offCtx.fillStyle = whiteGradient;
    offCtx.fillRect(0, 0, width, height);
    
    this.gradientCache = offCtx.getImageData(0, 0, width, height);
    this.ctx.putImageData(this.gradientCache, 0, 0);
  }

  setupSliders() {
    ['r', 'g', 'b'].forEach(channel => {
      const slider = this.picker.querySelector(`[id^="slider-${channel}"]`);
      const valueSpan = slider.parentElement.querySelector('.value-display');
      
      slider.addEventListener('input', () => {
        const value = parseInt(slider.value);
        if (!isNaN(value) && value >= 0 && value <= 255) {
          this.color[channel] = value;
          valueSpan.textContent = value;
          this.updateDisplay();
          this.updateHexInput();
          this.updateIndicatorFromColor();
          if (this.onChange) this.onChange(this.color);
        }
      });
    });
  }

  setupHexInput() {
    const hexInput = this.picker.querySelector('.hex-input');
    
    const validateAndSetHex = () => {
      const hex = hexInput.value.trim();
      if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
        const color = this.hexToRgb(hex);
        if (color) {
          this.setColor(color);
          this.updateIndicatorFromColor();
        }
      } else {
        hexInput.value = this.rgbToHex(this.color);
      }
    };
    
    hexInput.addEventListener('change', validateAndSetHex);
    hexInput.addEventListener('paste', (e) => {
      setTimeout(validateAndSetHex, 0);
    });
  }

  setColor(color, silent = false) {
    this.color = { ...color };
    this.updateDisplay();
    this.updateSliders();
    this.updateHexInput();
    if (!silent && this.onChange) this.onChange(this.color);
  }

  updateDisplay() {
    this.colorDisplay.style.backgroundColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
  }

  updateSliders() {
    ['r', 'g', 'b'].forEach(channel => {
      const slider = this.picker.querySelector(`[id^="slider-${channel}"]`);
      const valueSpan = slider?.parentElement?.querySelector('.value-display');
      if (slider) {
        slider.value = this.color[channel];
      }
      if (valueSpan) {
        valueSpan.textContent = this.color[channel];
      }
    });
  }

  updateHexInput() {
    const hexInput = this.picker.querySelector('.hex-input');
    if (hexInput && hexInput !== document.activeElement) {
      hexInput.value = this.rgbToHex(this.color);
    }
  }

  rgbToHex(color) {
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.picker.style.display = 'block';
    this.isOpen = true;
    this.colorDisplay.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', this.boundHandleOutsideClick);
    document.addEventListener('keydown', this.boundHandleKeydown);
    this.updateIndicatorFromColor();
    
    requestAnimationFrame(() => {
      this.canvas.focus();
    });
  }

  close() {
    this.picker.style.display = 'none';
    this.isOpen = false;
    this.colorDisplay.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', this.boundHandleOutsideClick);
    document.removeEventListener('keydown', this.boundHandleKeydown);
  }
  
  handleOutsideClick(e) {
    if (!this.element.contains(e.target) && this.isOpen) {
      this.close();
    }
  }
  
  handleKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
      this.colorDisplay.focus();
    }
  }
  
  updateIndicatorPosition(x, y) {
    this.indicator.style.display = 'block';
    this.indicator.style.left = `${x}px`;
    this.indicator.style.top = `${y}px`;
  }
  
  updateIndicatorFromColor() {
    const { h, s, l } = this.rgbToHsl(this.color);
    const x = (h / 360) * this.canvas.width;
    const y = ((100 - l) / 100) * this.canvas.height;
    this.updateIndicatorPosition(x, y);
  }
  
  rgbToHsl(color) {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  destroy() {
    document.removeEventListener('click', this.boundHandleOutsideClick);
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.element.remove();
  }
}