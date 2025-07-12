export class StartPositionEditor {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.species = [];
    this.selectedSpecies = null;
    this.draggingSpecies = null;
    this.mousePos = { x: 0, y: 0 };
    this.onChange = onChange;
    
    this.patterns = ['cluster', 'ring', 'grid', 'random'];
    this.patternIcons = {
      cluster: '○',
      ring: '⊙',
      grid: '⊞',
      random: '∴'
    };
    
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const clickedSpecies = this.getSpeciesAtPosition(x, y);
    if (clickedSpecies !== null) {
      this.draggingSpecies = clickedSpecies;
      this.selectedSpecies = clickedSpecies;
    } else {
      this.selectedSpecies = null;
    }
    
    this.updatePatternControls();
    this.render();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = (e.clientX - rect.left) / rect.width;
    this.mousePos.y = (e.clientY - rect.top) / rect.height;
    
    if (this.draggingSpecies !== null) {
      this.species[this.draggingSpecies].startPosition.center = {
        x: Math.max(0.05, Math.min(0.95, this.mousePos.x)),
        y: Math.max(0.05, Math.min(0.95, this.mousePos.y))
      };
      this.render();
    }
    
    const hoveredSpecies = this.getSpeciesAtPosition(this.mousePos.x, this.mousePos.y);
    this.canvas.style.cursor = hoveredSpecies !== null ? 'move' : 'default';
  }

  handleMouseUp() {
    if (this.draggingSpecies !== null && this.onChange) {
      this.onChange();
    }
    this.draggingSpecies = null;
  }

  getSpeciesAtPosition(x, y) {
    for (let i = this.species.length - 1; i >= 0; i--) {
      const species = this.species[i];
      const center = species.startPosition.center;
      const distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
      if (distance <= species.startPosition.radius) {
        return i;
      }
    }
    return null;
  }

  setSpecies(speciesDefinitions) {
    this.species = speciesDefinitions;
    this.selectedSpecies = null;
    this.render();
    this.updatePatternControls();
  }

  updatePatternControls() {
    const container = document.getElementById('position-pattern-controls');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.selectedSpecies === null) {
      container.innerHTML = '<p class="info-text">Select a species on the canvas to configure its spawn pattern.</p>';
      return;
    }
    
    const species = this.species[this.selectedSpecies];
    const currentPattern = species.startPosition.type;
    
    const patternDiv = document.createElement('div');
    patternDiv.className = 'pattern-selector';
    patternDiv.innerHTML = `
      <h4 class="section-title">${species.name} Spawn Pattern</h4>
      <div class="pattern-buttons">
        ${this.patterns.map(pattern => `
          <button class="btn btn-secondary btn-sm pattern-btn ${currentPattern === pattern ? 'active' : ''}" 
                  data-pattern="${pattern}">
            <span class="pattern-icon">${this.patternIcons[pattern]}</span>
            <span class="pattern-name">${pattern.charAt(0).toUpperCase() + pattern.slice(1)}</span>
          </button>
        `).join('')}
      </div>
      <div class="control-group">
        <label>
          Radius
          <span class="value-display" id="pattern-radius-value">${(species.startPosition.radius * 100).toFixed(0)}%</span>
        </label>
        <input type="range" class="range-slider" id="pattern-radius" min="5" max="40" value="${species.startPosition.radius * 100}">
      </div>
    `;
    
    container.appendChild(patternDiv);
    
    container.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pattern = e.currentTarget.dataset.pattern;
        species.startPosition.type = pattern;
        this.updatePatternControls();
        this.render();
        if (this.onChange) this.onChange();
      });
    });
    
    const radiusSlider = container.querySelector('#pattern-radius');
    if (radiusSlider) {
      radiusSlider.addEventListener('input', (e) => {
        const radius = parseFloat(e.target.value) / 100;
        species.startPosition.radius = radius;
        container.querySelector('#pattern-radius-value').textContent = `${e.target.value}%`;
        this.render();
        if (this.onChange) this.onChange();
      });
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#0c0c0c';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawGrid();
    
    this.species.forEach((species, index) => {
      this.drawSpeciesPosition(species, index === this.selectedSpecies);
    });
  }

  drawGrid() {
    this.ctx.strokeStyle = '#2a2a2a';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 4]);
    
    for (let i = 0; i <= 10; i++) {
      const pos = (i / 10) * this.canvas.width;
      
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }

  drawSpeciesPosition(species, isSelected) {
    const center = species.startPosition.center;
    const radius = species.startPosition.radius;
    const x = center.x * this.canvas.width;
    const y = center.y * this.canvas.height;
    const r = radius * Math.min(this.canvas.width, this.canvas.height);
    
    const color = species.color;
    const rgbColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
    
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = rgbColor;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (isSelected) {
      this.ctx.strokeStyle = '#d1d1d1';
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 1;
      this.ctx.stroke();
    }
    
    this.drawPattern(species, x, y, r);
    
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = rgbColor;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    if (isSelected) {
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    this.ctx.fillStyle = '#d1d1d1';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.patternIcons[species.startPosition.type], x, y);
    
    this.ctx.fillStyle = isSelected ? '#d1d1d1' : '#999999';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(species.name, x, y + r + 10);
  }

  drawPattern(species, x, y, r) {
    const pattern = species.startPosition.type;
    this.ctx.strokeStyle = `rgba(${species.color.r}, ${species.color.g}, ${species.color.b}, 0.5)`;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);
    
    switch (pattern) {
      case 'cluster':
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const px = x + Math.cos(angle) * r * 0.6;
          const py = y + Math.sin(angle) * r * 0.6;
          this.ctx.beginPath();
          this.ctx.arc(px, py, 3, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        break;
        
      case 'ring':
        this.ctx.beginPath();
        this.ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
        
      case 'grid':
        const gridSize = 5;
        const spacing = (r * 1.6) / gridSize;
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const gx = x - r * 0.8 + i * spacing;
            const gy = y - r * 0.8 + j * spacing;
            if (Math.sqrt(Math.pow(gx - x, 2) + Math.pow(gy - y, 2)) <= r) {
              this.ctx.beginPath();
              this.ctx.arc(gx, gy, 2, 0, Math.PI * 2);
              this.ctx.stroke();
            }
          }
        }
        break;
        
      case 'random':
        for (let i = 0; i < 12; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * r * 0.9;
          const px = x + Math.cos(angle) * dist;
          const py = y + Math.sin(angle) * dist;
          this.ctx.beginPath();
          this.ctx.arc(px, py, 2, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        break;
    }
    
    this.ctx.setLineDash([]);
  }

  getPositions() {
    return this.species.map(s => s.startPosition);
  }
}