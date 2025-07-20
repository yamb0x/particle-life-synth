export class ColorPicker {
  constructor(onChange) {
    this.onChange = onChange;
    this.color = { r: 255, g: 100, b: 100 };
    this.isOpen = false;
    this.element = this.createElement();
  }

  createElement() {
    const container = document.createElement('div');
    container.className = 'color-picker-container';
    
    this.colorDisplay = document.createElement('div');
    this.colorDisplay.className = 'color-picker-display';
    this.updateDisplay();
    
    this.picker = document.createElement('div');
    this.picker.className = 'color-picker-dropdown';
    this.picker.style.display = 'none';
    
    this.picker.innerHTML = `
      <div class="color-picker-content">
        <canvas class="color-picker-canvas" width="200" height="150"></canvas>
        <div class="color-picker-sliders">
          <div class="color-slider-group">
            <label>R</label>
            <input type="range" class="range-slider color-slider" id="slider-r" min="0" max="255" value="${this.color.r}">
            <span class="value-display">${this.color.r}</span>
          </div>
          <div class="color-slider-group">
            <label>G</label>
            <input type="range" class="range-slider color-slider" id="slider-g" min="0" max="255" value="${this.color.g}">
            <span class="value-display">${this.color.g}</span>
          </div>
          <div class="color-slider-group">
            <label>B</label>
            <input type="range" class="range-slider color-slider" id="slider-b" min="0" max="255" value="${this.color.b}">
            <span class="value-display">${this.color.b}</span>
          </div>
        </div>
        <div class="color-picker-hex">
          <input type="text" class="input hex-input" value="${this.rgbToHex(this.color)}">
        </div>
      </div>
    `;
    
    container.appendChild(this.colorDisplay);
    container.appendChild(this.picker);
    
    this.canvas = this.picker.querySelector('.color-picker-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.colorDisplay.addEventListener('click', () => this.toggle());
    
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target) && this.isOpen) {
        this.close();
      }
    });
    
    this.setupCanvas();
    this.setupSliders();
    this.setupHexInput();
    
    return container;
  }

  setupCanvas() {
    this.drawGradient();
    
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const imageData = this.ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      
      this.setColor({ r, g, b });
    });
  }

  drawGradient() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    for (let i = 0; i < width; i++) {
      const hue = (i / width) * 360;
      for (let j = 0; j < height; j++) {
        const saturation = 100;
        const lightness = 100 - (j / height) * 100;
        
        this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        this.ctx.fillRect(i, j, 1, 1);
      }
    }
    
    const gradientWhite = this.ctx.createLinearGradient(0, 0, 0, height);
    gradientWhite.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientWhite.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    gradientWhite.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = gradientWhite;
    this.ctx.fillRect(0, 0, width, height / 2);
    
    const gradientBlack = this.ctx.createLinearGradient(0, height / 2, 0, height);
    gradientBlack.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradientBlack.addColorStop(1, 'rgba(0, 0, 0, 1)');
    this.ctx.fillStyle = gradientBlack;
    this.ctx.fillRect(0, height / 2, width, height / 2);
  }

  setupSliders() {
    ['r', 'g', 'b'].forEach(channel => {
      const slider = this.picker.querySelector(`#slider-${channel}`);
      const valueSpan = slider.parentElement.querySelector('.value-display');
      
      slider.addEventListener('input', () => {
        this.color[channel] = parseInt(slider.value);
        valueSpan.textContent = slider.value;
        this.updateDisplay();
        this.updateHexInput();
        if (this.onChange) this.onChange(this.color);
      });
    });
  }

  setupHexInput() {
    const hexInput = this.picker.querySelector('.hex-input');
    
    hexInput.addEventListener('change', () => {
      const hex = hexInput.value.trim();
      if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
        const color = this.hexToRgb(hex);
        if (color) {
          this.setColor(color);
        }
      } else {
        hexInput.value = this.rgbToHex(this.color);
      }
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
      const slider = this.picker.querySelector(`#slider-${channel}`);
      const valueSpan = slider.parentElement.querySelector('.value-display');
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
    hexInput.value = this.rgbToHex(this.color);
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
  }

  close() {
    this.picker.style.display = 'none';
    this.isOpen = false;
  }
}