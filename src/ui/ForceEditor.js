export class ForceEditor {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onChange = onChange;
    this.forceMatrix = [];
    this.species = [];
    this.selectedFrom = 0;
    this.selectedTo = 0;
    this.isDragging = false;
    
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
    this.isDragging = true;
    this.updateForceFromMouse(e);
  }
  
  handleMouseMove(e) {
    if (this.isDragging) {
      this.updateForceFromMouse(e);
    }
    
    // Update hover display
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const force = (x / this.canvas.width) * 2 - 1;
    
    if (this.infoElement) {
      this.infoElement.textContent = `Force: ${force.toFixed(2)}`;
    }
  }
  
  handleMouseUp() {
    this.isDragging = false;
  }
  
  updateForceFromMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(this.canvas.width, e.clientX - rect.left));
    const force = Math.max(-1, Math.min(1, (x / this.canvas.width) * 2 - 1));
    
    if (this.forceMatrix[this.selectedFrom] && this.forceMatrix[this.selectedFrom][this.selectedTo] !== undefined) {
      this.forceMatrix[this.selectedFrom][this.selectedTo] = force;
      this.render();
      
      if (this.onChange) {
        this.onChange(this.forceMatrix);
      }
    }
  }
  
  setForceMatrix(matrix) {
    this.forceMatrix = matrix;
    this.render();
  }
  
  setSpecies(species) {
    this.species = species;
    this.updateSpeciesSelectors();
  }
  
  setSelected(from, to) {
    this.selectedFrom = from;
    this.selectedTo = to;
    this.render();
  }
  
  updateSpeciesSelectors() {
    const fromSelect = document.getElementById('force-from-species');
    const toSelect = document.getElementById('force-to-species');
    
    if (!fromSelect || !toSelect) return;
    
    // Clear existing options
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Add species options
    this.species.forEach((species, index) => {
      const fromOption = document.createElement('option');
      fromOption.value = index;
      fromOption.textContent = species.name || `Species ${index + 1}`;
      fromSelect.appendChild(fromOption);
      
      const toOption = document.createElement('option');
      toOption.value = index;
      toOption.textContent = species.name || `Species ${index + 1}`;
      toSelect.appendChild(toOption);
    });
    
    // Set default selection
    fromSelect.value = this.selectedFrom;
    toSelect.value = this.selectedTo;
    
    // Add event listeners
    fromSelect.addEventListener('change', () => {
      this.selectedFrom = parseInt(fromSelect.value);
      this.render();
    });
    
    toSelect.addEventListener('change', () => {
      this.selectedTo = parseInt(toSelect.value);
      this.render();
    });
  }
  
  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(0, 0, width, height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(204, 102, 102, 0.15)');   // Muted red for repel
    gradient.addColorStop(0.5, 'rgba(153, 153, 153, 0.1)'); // Gray for neutral
    gradient.addColorStop(1, 'rgba(102, 204, 102, 0.15)');   // Muted green for attract
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    
    // Vertical lines at -1, -0.5, 0, 0.5, 1
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Center line (thicker)
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#999999';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('REPEL', width * 0.25, 20);
    ctx.fillText('NEUTRAL', width * 0.5, 20);
    ctx.fillText('ATTRACT', width * 0.75, 20);
    
    // Draw force values
    ctx.fillStyle = '#666666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-1.0', 10, height - 10);
    ctx.fillText('0', width / 2, height - 10);
    ctx.fillText('+1.0', width - 10, height - 10);
    
    // Draw current force value
    if (this.forceMatrix[this.selectedFrom] && this.forceMatrix[this.selectedFrom][this.selectedTo] !== undefined) {
      const force = this.forceMatrix[this.selectedFrom][this.selectedTo];
      const x = (force + 1) / 2 * width;
      
      // Draw vertical line at current position
      ctx.strokeStyle = force < 0 ? '#cc6666' : force > 0 ? '#66cc66' : '#999999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Draw handle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw inner circle
      ctx.fillStyle = force < 0 ? '#cc6666' : force > 0 ? '#66cc66' : '#999999';
      ctx.beginPath();
      ctx.arc(x, height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw force value
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(force.toFixed(2), x, height / 2);
    }
  }
  
  setInfoElement(element) {
    this.infoElement = element;
  }
  
  applyForcePreset(preset) {
    const n = this.species.length;
    
    switch (preset) {
      case 'neutral':
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            this.forceMatrix[i][j] = 0;
          }
        }
        break;
        
      case 'repel-all':
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            this.forceMatrix[i][j] = -0.5;
          }
        }
        break;
        
      case 'attract-same':
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            this.forceMatrix[i][j] = i === j ? 0.5 : -0.2;
          }
        }
        break;
        
      case 'chain':
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (j === (i + 1) % n) {
              this.forceMatrix[i][j] = 0.7; // Attract next
            } else if (j === (i - 1 + n) % n) {
              this.forceMatrix[i][j] = -0.7; // Repel previous
            } else {
              this.forceMatrix[i][j] = 0;
            }
          }
        }
        break;
        
      case 'random':
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            this.forceMatrix[i][j] = Math.random() * 2 - 1;
          }
        }
        break;
    }
    
    this.render();
    if (this.onChange) {
      this.onChange(this.forceMatrix);
    }
  }
  
  updateMatrixView() {
    const container = document.getElementById('force-matrix-view');
    if (!container) return;
    
    let html = '<table style="border-collapse: collapse; width: 100%;">';
    
    // Header row
    html += '<tr><td style="padding: 4px;"></td>';
    this.species.forEach((species, i) => {
      html += `<td style="padding: 4px; text-align: center; font-weight: bold; color: ${this.getSpeciesColor(species)}">
        ${species.name ? species.name.charAt(0) : (i + 1)}
      </td>`;
    });
    html += '</tr>';
    
    // Data rows
    this.forceMatrix.forEach((row, i) => {
      const species = this.species[i];
      html += `<tr>
        <td style="padding: 4px; font-weight: bold; color: ${this.getSpeciesColor(species)}">
          ${species.name || `S${i + 1}`}
        </td>`;
      
      row.forEach((force, j) => {
        const color = force < 0 ? '#ff6666' : force > 0 ? '#66ff66' : '#888';
        const bgOpacity = Math.abs(force) * 0.3;
        const bgColor = force < 0 ? `rgba(255,100,100,${bgOpacity})` : force > 0 ? `rgba(100,255,100,${bgOpacity})` : 'transparent';
        
        html += `<td style="padding: 4px; text-align: center; color: ${color}; background: ${bgColor}; border: 1px solid #333;">
          ${force.toFixed(2)}
        </td>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';
    container.innerHTML = html;
  }
  
  getSpeciesColor(species) {
    if (species.color) {
      return `rgb(${species.color.r}, ${species.color.g}, ${species.color.b})`;
    }
    return '#aaa';
  }
}