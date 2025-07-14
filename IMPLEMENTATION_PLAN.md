# Particle Life Synth - MASTER REFACTORING PLAN

## PROJECT STATUS: FLOATING UI REPAIR & REORGANIZATION REQUIRED

### Target User: Sound Engineers
**Goal**: Create presets that become drivers for synthesizer sounds

### Core Workflow
```
1. Floating UI → Test all parameters in real-time
2. Copy Settings → Get current configuration  
3. Configure Panel → Access preset management
4. Paste → Apply tested configuration to selected preset
5. Save → Store preset for synthesizer use
```

### Success Criteria
- **All parameters working** in Floating UI for real-time testing
- **Reorganized UI sections** with logical grouping
- **Simple copy/paste workflow** for preset creation
- **Professional UI styling** with consistent typography and spacing
- **Parameter mapping dictionary** ready for audio synthesis integration

## CURRENT STATE ANALYSIS

### ✅ STRENGTHS (Keep As-Is)
- **Database Layer**: PresetStorage.js + PresetManager.js are excellent
- **Particle Physics**: SimpleParticleSystem.js working perfectly
- **Visual Effects**: Trail, glow, dreamtime effects all functional
- **Performance**: Optimized spatial grids, 60fps with 500+ particles
- **Parameter Coverage**: Floating UI has all needed parameters

### ❌ CRITICAL PROBLEMS (Must Fix)
- **BROKEN PARAMETERS**: Many controls in MainUI.js simply don't work anymore
- **UI ORGANIZATION**: Current sections are confusing and poorly grouped
- **UI STYLING**: Blue texts, inconsistent fonts, poor typography hierarchy
- **MISSING INITIAL DISTRIBUTION**: The only parameter missing from FloatingUI (exists in Configure)
- **LIMITED SPECIES COUNT**: Currently 1-10, needs to be 1-20 for audio synthesis
- **NO PARAMETER MAPPING**: Need documented parameter dictionary for audio integration

## Session Summary & Lessons Learned

### What Went Wrong
1. **Overcomplicated canvas state management** - Broke particle motion with excessive save/restore
2. **Mixed responsibilities** - Trail effects, species glow, and dreamtime all interfering 
3. **Preset auto-loading** - Overrode good default physics with weak preset values
4. **Redundant controls** - Same parameters in both Floating UI and Configure Panel
5. **Incremental patching** - Made things worse instead of systematic approach

### Current Working State (REVERTED TO)
- **Particle motion**: ✅ Perfect physics with strong force interactions
- **Trail effects**: ✅ Working independently 
- **Species glow**: ✅ Basic implementation exists
- **Dreamtime mode**: ✅ Working but may have interactions
- **UI structure**: ✅ Clean, well-organized components

## PHASE 1: FLOATING UI REORGANIZATION & REPAIR (Priority 1)

### NEW UI ORGANIZATION STRUCTURE

Based on sound engineering workflow and audio synthesis best practices:

#### 1. **PRESETS** (Top Section)
```javascript
- Preset Dropdown (all presets) ✓ EXISTS
- Load Preset functionality ✓ EXISTS
```

#### 2. **PARTICLES** (Core Data)  
```javascript
- Amount Scale (particles per species: 0-1000) ✓ EXISTS
- ❌ BROKEN: Fix event listener
- Species Count (1-20, expanded from 1-10) ❌ NEEDS EXPANSION
- ❌ NEW: Initial Distribution (cluster/ring/grid/random pattern)
```

#### 3. **PHYSICS** (Simulation Core)
```javascript
- Force Strength ✓ EXISTS ❌ BROKEN
- Friction ✓ EXISTS ❌ BROKEN  
- Wall Bounce ✓ EXISTS ❌ BROKEN
- Collision Radius ✓ EXISTS ❌ BROKEN
- Social Radius ✓ EXISTS ❌ BROKEN
```

#### 4. **FORCE RELATIONSHIPS** (Keep Current Implementation)
```javascript
- Species From/To selectors ✓ PERFECT
- XY Force Graph ✓ PERFECT
- Clear All Forces button ✓ PERFECT
```

#### 5. **EFFECTS** (Multi-effect Support)
```javascript
// Trail Effect
- Enable Trails (checkbox) ✓ EXISTS
- Trail Length (slider) ✓ EXISTS

// Halo Effect (renamed from Dreamtime)
- Enable Halo (checkbox) ✓ EXISTS AS DREAMTIME
- Halo Intensity (slider) ❌ MISSING
- Halo Radius (slider) ❌ MISSING

// Species Glow Effect  
- Enable Species Glow (checkbox) ❌ MISSING
- Glow Species Selector ❌ MISSING
- Glow Size (slider) ❌ MISSING
- Glow Intensity (slider) ❌ MISSING
```

#### 6. **COLORS** (Visual Identity)
```javascript
- Background Color ✓ EXISTS
- Species Colors (per-species color picker) ❌ MISSING
- Species Amount (individual counts 0-1000) ❌ MISSING
```

#### 7. **ACTIONS** (Workflow Buttons)
```javascript
- Copy Settings ❌ MISSING
- Configure Presets (current Configure button) ✓ EXISTS
- Clear All Forces ✓ EXISTS (move to Force Relationships section)
```

### PARAMETER MAPPING DICTIONARY

Following audio synthesis industry standards (Ableton/Serum/Massive conventions):

```javascript
// PARAMETER NAMING CONVENTION: category_parameter_modifier
const PARAMETER_MAP = {
    // Core Particle Data
    "particles_amount_scale": "particlesPerSpecies",     // 0-1000
    "particles_species_count": "numSpecies",             // 1-20
    "particles_distribution_pattern": "startPattern",    // cluster/ring/grid/random
    
    // Physics Engine
    "physics_force_strength": "forceFactor",             // 0.1-10.0
    "physics_friction_amount": "friction",               // 0.0-1.0 (UI) -> 1.0-0.0 (engine)
    "physics_wall_bounce": "wallDamping",                // 0.0-2.0
    "physics_collision_radius": "collisionRadius",       // 1-100
    "physics_social_radius": "socialRadius",             // 1-500
    
    // Force Relationships (Matrix-based)
    "forces_social_matrix": "socialForce",               // NxN matrix -1.0 to 1.0
    "forces_collision_matrix": "collisionForce",         // NxN matrix -1.0 to 1.0
    
    // Visual Effects
    "effects_trail_enabled": "trailEnabled",             // boolean
    "effects_trail_length": "blur",                      // 0.5-0.99
    "effects_halo_enabled": "dreamtimeEnabled",          // boolean  
    "effects_halo_intensity": "glowIntensity",           // 0.0-1.0
    "effects_halo_radius": "glowRadius",                 // 1.0-5.0
    "effects_species_glow_enabled": "speciesGlowEnabled", // boolean
    "effects_species_glow_target": "selectedGlowSpecies", // 0-19
    "effects_species_glow_size": "speciesGlowSize[i]",   // 0.5-3.0 per species
    "effects_species_glow_intensity": "speciesGlowIntensity[i]", // 0.0-1.0 per species
    
    // Visual Identity
    "visual_background_color": "backgroundColor",        // hex color
    "visual_particle_size": "particleSize",             // 0.5-20.0 (visual only)
    "visual_species_colors": "species[i].color",        // RGB per species
    "visual_species_amounts": "species[i].particleCount" // 0-1000 per species
};

// AUDIO SYNTHESIS MAPPING TARGETS
const SYNTH_MAPPING = {
    // Modulation Sources (for LFOs, Envelopes)
    "clustering_coefficient": "physics_force_strength",
    "average_velocity": "physics_friction_amount", 
    "species_separation": "physics_social_radius",
    "orbital_period": "effects_trail_length",
    "chaos_index": "forces_social_matrix[random]",
    
    // Filter Targets
    "filter_cutoff": "effects_halo_intensity",
    "filter_resonance": "effects_halo_radius", 
    
    // Synthesis Parameters
    "oscillator_detune": "visual_species_colors[hue]",
    "lfo_rate": "particles_amount_scale",
    "envelope_attack": "physics_wall_bounce"
};
```

## PHASE 2: UI STYLING & TYPOGRAPHY FIX (Priority 2)

### Current UI Styling Problems

#### ❌ TYPOGRAPHY ISSUES
```css
/* Current Problems in MainUI.js styles */
❌ Blue text colors (.info-text: var(--text-tertiary))  
❌ Large value font sizes (.value-display oversized)
❌ Inconsistent capitalization (some UPPERCASE, some lowercase)
❌ Poor spacing hierarchy (sections too cramped)
❌ Inconsistent font weights
```

#### ✅ PROFESSIONAL UI STYLING SOLUTION
```css
/* NEW TYPOGRAPHY SYSTEM */
:root {
    /* Consistent Color Palette */
    --text-primary: #ffffff;           /* Main text */
    --text-secondary: #cccccc;         /* Secondary text */ 
    --text-tertiary: #999999;          /* Subtle text (not blue!) */
    --text-accent: #4a9eff;            /* Accent blue (sparingly) */
    
    /* Typography Scale */
    --font-size-xs: 11px;              /* Small labels */
    --font-size-sm: 12px;              /* Value displays */
    --font-size-md: 14px;              /* Main text */
    --font-size-lg: 16px;              /* Section headers */
    --font-size-xl: 18px;              /* Panel title */
    
    /* Font Weights */
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    
    /* Spacing System */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 24px;
}

/* Section Headers */
.section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    text-transform: none; /* Remove uppercase */
    margin-bottom: var(--space-md);
}

/* Value Displays */
.value-display {
    font-size: var(--font-size-sm);  /* Smaller, not oversized */
    font-weight: var(--font-weight-medium);
    color: var(--text-accent);
    margin-left: var(--space-sm);
}

/* Labels */
.control-group label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-normal);
    color: var(--text-secondary);
    text-transform: none; /* Consistent capitalization */
}

/* Info Text */
.info-text {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary); /* Gray, not blue */
    font-style: italic;
    margin-top: var(--space-xs);
}

/* Sections */
.section {
    margin-bottom: var(--space-xl);
    padding: var(--space-md);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
}
```

### KEYBOARD SHORTCUT ENHANCEMENT

#### Current: "C" toggles UI visibility ✓ KEEP
#### Add: Parameter shortcuts
```javascript
// ADD to MainUI.js setupKeyboardShortcuts()
setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Existing: Toggle UI visibility
        if (e.key === 'c' || e.key === 'C') {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                this.toggleVisibility();
                e.preventDefault();
            }
        }
        
        // NEW: Copy settings
        if (e.key === 'x' || e.key === 'X') {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                this.copySettings();
                e.preventDefault();
            }
        }
        
        // NEW: Randomize forces  
        if (e.key === 'r' || e.key === 'R') {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                this.randomizeForces();
                e.preventDefault();
            }
        }
    });
}
```

## PHASE 3: COMPLETE MISSING FLOATING UI CONTROLS (Priority 3)

### Database Status: ✅ ALREADY EXCELLENT
**PresetStorage.js + PresetManager.js are production-ready**
- Multi-layer storage (IndexedDB + localStorage)
- Validation, error handling, migration support
- Import/export functionality complete
- Auto-save with 2-second debounce
- **NO CHANGES NEEDED**

### Missing Species & Position Controls in Floating UI

#### Problem: Advanced Controls Still Missing
```javascript
// These are ONLY in PresetModal, need to add to MainUI:
❌ Individual species color editing
❌ Individual species name editing  
❌ Individual species particle counts
❌ Starting position patterns (cluster/ring/grid/random)
❌ Starting position coordinates
```

#### Solution: Add Collapsible Advanced Section to MainUI.js
```javascript
// INSERT before Force Relationships section (line 167)
<!-- Advanced Species Controls -->
<div class="section">
    <h4 class="section-title">
        Species Configuration
        <button class="btn btn-icon btn-ghost" id="species-toggle">▼</button>
    </h4>
    <div id="species-advanced" class="species-advanced" style="display: none;">
        <div class="control-group">
            <label>Configure Species</label>
            <select class="select select-sm" id="species-selector">
                <option value="0">Red</option>
                <option value="1">Green</option>
                <option value="2">Blue</option>
                <option value="3">Yellow</option>
                <option value="4">Purple</option>
            </select>
        </div>
        <div class="control-group">
            <label>Species Name</label>
            <input type="text" class="input input-sm" id="species-name" value="Red">
        </div>
        <div class="control-group">
            <label>Species Color</label>
            <input type="color" id="species-color" value="#ff6464">
        </div>
        <div class="control-group">
            <label>
                Particle Count
                <span class="value-display" id="species-count-value">150</span>
            </label>
            <input type="range" class="range-slider" id="species-count-slider" 
                   min="0" max="1000" step="10" value="150">
        </div>
        <div class="control-group">
            <label>Start Pattern</label>
            <select class="select select-sm" id="start-pattern">
                <option value="cluster">Cluster</option>
                <option value="ring">Ring</option>
                <option value="grid">Grid</option>
                <option value="random">Random</option>
            </select>
        </div>
    </div>
</div>
```

#### Species Glow Controls for MainUI.js
```javascript
// INSERT after Dreamtime controls
<div class="control-group">
    <label>
        <input type="checkbox" id="species-glow-enabled">
        Species Glow
    </label>
</div>
<div class="control-group" id="species-glow-controls" style="display: none;">
    <label>Glow Species</label>
    <select class="select select-sm" id="glow-species-selector">
        <option value="0">Red</option>
        <option value="1">Green</option>
        <option value="2">Blue</option>
        <option value="3">Yellow</option>
        <option value="4">Purple</option>
    </select>
</div>
<div class="control-group" id="species-glow-size-control" style="display: none;">
    <label>
        Glow Size
        <span class="value-display" id="species-glow-size-value">1.0</span>
    </label>
    <input type="range" class="range-slider" id="species-glow-size" 
           min="0.5" max="3.0" step="0.1" value="1.0">
</div>
```

## PHASE 4: WORKFLOW OPTIMIZATION (Priority 4)

### Add Quick Actions to MainUI.js
```javascript
// INSERT after Copy Settings button
<div class="quick-actions">
    <button class="btn btn-secondary btn-sm btn-block" id="randomize-forces">
        🎲 Randomize Forces
    </button>
    <button class="btn btn-secondary btn-sm btn-block" id="reset-defaults">
        🔄 Reset to Defaults
    </button>
</div>
```

### Performance Monitoring Display
```javascript
// INSERT at top of MainUI panel content
<div class="performance-display">
    <div class="perf-item">
        <span class="label">FPS:</span>
        <span id="fps-display">60</span>
    </div>
    <div class="perf-item">
        <span class="label">Particles:</span>
        <span id="particle-count-display">750</span>
    </div>
    <div class="perf-warning" id="performance-warning" style="display: none;">
        ⚠️ Performance impact detected
    </div>
</div>
```

### Keyboard Shortcuts Enhancement
```javascript
// ADD to MainUI.js setupKeyboardShortcuts()
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        this.copySettings();
    }
    if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
        if (window.presetModal && window.presetModal.isOpen) {
            window.presetModal.pasteSettings();
        }
    }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        this.randomizeForces();
    }
});
```

## PHASE 5: Final Validation & Polish (Priority 5)

### Sound Engineer Testing Checklist
```
🎛️ FLOATING UI TESTING
□ All parameters respond in real-time
□ No lag or stuttering during parameter changes
□ Visual effects work independently  
□ Physics parameters affect motion correctly
□ Force relationships update smoothly

📋 COPY/PASTE TESTING  
□ Copy captures all current settings
□ Paste restores exact state
□ Visual feedback confirms actions
□ No data loss between copy/paste cycles

💾 PRESET SYSTEM TESTING
□ Save preserves complete configuration
□ Load restores exact saved state  
□ Delete removes presets properly
□ Browser refresh doesn't lose presets
□ Import/export works across devices

🔄 WORKFLOW TESTING
□ Floating UI → Configure Panel flow is smooth
□ No redundant controls between panels  
□ Preset creation is intuitive
□ Batch preset creation is efficient
```

### Performance Targets
- **60 FPS** with 500+ particles
- **<100ms** preset load time
- **<50ms** parameter response time
- **Zero crashes** during extended use
- **Reliable saves** (99.9% success rate)

## Implementation Notes

### Key Principles for Sound Engineer Workflow
1. **Single Source of Truth** - Floating UI controls everything
2. **Zero Redundancy** - No duplicate controls between panels
3. **Copy/Paste Workflow** - Smooth parameter transfer
4. **Bulletproof Storage** - Never lose a preset
5. **Real-time Feedback** - Immediate visual response

### Anti-Patterns to Avoid
1. **Parameter duplication** - Same control in both UIs
2. **Complex modal interactions** - Keep Configure Panel simple
3. **Unreliable saves** - Sound engineers need trust
4. **Canvas state mixing** - Keep effects isolated
5. **Preset auto-loading** - Let users control their workflow

### Sound Engineer Success Metrics
```
✅ Can test any parameter combination in real-time
✅ Can copy settings with one click
✅ Can save presets reliably every time
✅ Can share presets with colleagues easily
✅ Can create 10+ presets in one session
✅ Never loses work due to crashes/bugs
✅ Workflow feels natural and efficient
```

## EXECUTION SUMMARY - SINGLE SESSION SOLUTION

### 🎯 PRIMARY GOAL: FIX BROKEN FLOATING UI + REORGANIZE SECTIONS

**Corrected Focus**: Repair existing parameters + reorganize sections (NO removal of PresetModal redundancy)

### 📁 SINGLE FILE TO MODIFY: MainUI.js

```bash
📁 File: src/ui/MainUI.js  
📊 Current: ~400 lines
📈 Target: ~500 lines (+100 lines)
🎯 Action: REBUILD UI structure, FIX broken parameters, ADD missing controls

SPECIFIC CHANGES:
1. Line 17-201: COMPLETE innerHTML rebuild with new 7-section structure
2. Event listeners: FIX broken parameter connections  
3. Methods: ADD copySettings(), species management, keyboard shortcuts
4. Styling: UPDATE typography system with consistent fonts/colors
5. Species count: EXPAND from 1-10 to 1-20
```

### 🗂️ NEW MAINUI.JS STRUCTURE (7 Sections)

```javascript
// 1. PRESETS (improved dropdown with save/update behavior)
// 2. PARTICLES (amount + species count + distribution pattern)  
// 3. PHYSICS (all 5 physics parameters)
// 4. FORCE RELATIONSHIPS (keep existing perfect implementation)
// 5. EFFECTS (trails + halo + species glow with multi-effect support)
// 6. COLORS (background + dynamic species colors based on count)
// 7. ACTIONS (copy settings + configure presets + synth assignments)
```

### 🎛️ ENHANCED PRESET SYSTEM WORKFLOW

#### Problem: Previous Bad Experience with Save Behavior
```javascript
// CURRENT ISSUE: Always creates new presets instead of updating existing
// TARGET WORKFLOW: Smooth preset management with proper save/update logic
```

#### ✅ IMPROVED PRESET SYSTEM SOLUTION
```javascript
// 1. TWEAK PARAMETERS in Floating UI (real-time feedback)
// 2. COPY SETTINGS once satisfied (X key or button)  
// 3. OPEN CONFIGURE PANEL (paste + minor tweaks if needed)
// 4. SAVE AS PRESET with proper save/update logic:
//    - If editing existing preset → UPDATE existing
//    - If creating new → SAVE AS NEW with unique name
//    - Clear visual feedback for save status

// Enhanced preset dropdown behavior:
presetDropdown.addEventListener('change', (e) => {
    const presetKey = e.target.value;
    if (presetKey && presetKey !== 'custom') {
        // Load preset and mark as "currently editing [preset name]"
        this.currentEditingPreset = presetKey;
        this.loadPreset(presetKey);
        this.updateSaveButton(`Update ${preset.name}`);
    } else {
        // Custom mode - any saves create new presets
        this.currentEditingPreset = null;
        this.updateSaveButton('Save as New');
    }
});
```

### 🎨 CORRECTED COLORS SECTION (Dynamic)

#### Section 6: COLORS (Corrected Order & Dynamic Behavior)
```javascript
<!-- 6. COLORS Section -->
<div class="section">
    <h4 class="section-title">Colors</h4>
    
    <!-- Background Color (First) -->
    <div class="control-group">
        <label>Background Color</label>
        <input type="color" id="background-color" value="#000000">
    </div>
    
    <!-- Species Amount/Count (Second - Controls Dynamic Colors) -->
    <div class="control-group">
        <label>
            Species Count
            <span class="value-display" id="species-count-display">5</span>
        </label>
        <input type="range" class="range-slider" id="species-count" 
               min="1" max="20" step="1" value="5">
    </div>
    
    <!-- Dynamic Species Colors (Third - Generated based on count) -->
    <div class="control-group">
        <label>Species Colors</label>
        <div id="species-colors-container">
            <!-- Dynamically generated color pickers based on species count -->
            <!-- Example for 5 species: -->
            <div class="species-color-row">
                <span class="species-label">Species 1</span>
                <input type="color" class="species-color" data-species="0" value="#ff6464">
                <input type="number" class="species-amount" data-species="0" min="0" max="1000" value="150">
            </div>
            <!-- ... repeat for each species based on count -->
        </div>
    </div>
</div>

// Dynamic color picker generation:
updateSpeciesColors(count) {
    const container = document.getElementById('species-colors-container');
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'species-color-row';
        row.innerHTML = `
            <span class="species-label">Species ${i + 1}</span>
            <input type="color" class="species-color" data-species="${i}" 
                   value="${this.particleSystem.species[i]?.color || this.generateSpeciesColor(i)}">
            <input type="number" class="species-amount" data-species="${i}" 
                   min="0" max="1000" step="10" 
                   value="${this.particleSystem.species[i]?.particleCount || 150}">
        `;
        container.appendChild(row);
    }
    
    // Add event listeners for real-time updates
    this.attachSpeciesColorListeners();
}
```

### 🎵 SYNTH ASSIGNMENT TEXT FIELDS

#### Enhanced UI with Synth Module Assignment
```javascript
// Each parameter gets a small text field for synth assignment
<div class="control-group">
    <label>
        Force Strength
        <span class="value-display" id="force-strength-value">0.5</span>
    </label>
    <input type="range" class="range-slider" id="force-strength" 
           min="0.1" max="10" step="0.1" value="0.5">
    
    <!-- NEW: Synth Assignment Field -->
    <div class="synth-assignment">
        <input type="text" class="synth-field" id="force-strength-synth" 
               placeholder="e.g. Filter Cutoff, LFO Amount" 
               data-parameter="physics_force_strength">
        <span class="synth-hint">Synth Module</span>
    </div>
</div>

// Synth assignment storage and retrieval:
saveSynthAssignments() {
    const assignments = {};
    document.querySelectorAll('.synth-field').forEach(field => {
        const parameter = field.dataset.parameter;
        const assignment = field.value.trim();
        if (assignment) {
            assignments[parameter] = assignment;
        }
    });
    return assignments;
}

loadSynthAssignments(assignments) {
    Object.entries(assignments || {}).forEach(([parameter, assignment]) => {
        const field = document.querySelector(`[data-parameter="${parameter}"]`);
        if (field) {
            field.value = assignment;
        }
    });
}
```

### 🔧 CRITICAL FIXES NEEDED

#### ❌ BROKEN PARAMETERS (Fix Event Listeners)
```javascript
// These exist but don't work - fix addEventListener calls:
- particles-per-species slider
- force strength slider  
- friction slider
- wall bounce slider
- collision radius slider
- social radius slider
```

#### ➕ MISSING PARAMETERS (Add These)
```javascript
- Initial Distribution selector (cluster/ring/grid/random)
- Halo Intensity slider (rename from dreamtime glow intensity)
- Halo Radius slider (rename from dreamtime glow radius)  
- Species Glow Enable checkbox
- Species Glow Target selector
- Species Glow Size slider
- Species Colors (per-species color pickers)
- Species Amounts (individual particle counts)
```

### 🎨 TYPOGRAPHY & STYLING FIXES

```css
/* Replace ALL MainUI.js styles with professional system */
- Remove blue .info-text colors → use #999999
- Reduce .value-display font size → 12px instead of oversized
- Standardize capitalization → no random UPPERCASE
- Add section backgrounds → rgba(255,255,255,0.02)  
- Consistent spacing → 4px/8px/12px/16px/24px scale
```

### ⌨️ KEYBOARD SHORTCUTS (Enhanced)

```javascript
// Keep existing + add new:
- 'C' → Toggle UI visibility ✓ KEEP
- 'X' → Copy Settings (NEW)
- 'R' → Randomize Forces (NEW)
```

### 📋 ENHANCED PARAMETER MAPPING WITH SYNTH ASSIGNMENTS

**Create separate file**: `src/utils/ParameterMapping.js`

```javascript
// Enhanced parameter system with synth module assignments
export const PARAMETER_MAP = {
    // Core Particle Data
    "particles_amount_scale": {
        property: "particlesPerSpecies",
        range: [0, 1000],
        synthAssignment: "", // User-assignable text field
        description: "Number of particles per species group"
    },
    "particles_species_count": {
        property: "numSpecies", 
        range: [1, 20],
        synthAssignment: "", // e.g. "Oscillator Count", "Poly Voices"
        description: "Total number of species groups"
    },
    "particles_distribution_pattern": {
        property: "startPattern",
        range: ["cluster", "ring", "grid", "random"],
        synthAssignment: "", // e.g. "Wave Shape", "Sample Start"
        description: "Initial positioning pattern for particles"
    },
    
    // Physics Engine
    "physics_force_strength": {
        property: "forceFactor",
        range: [0.1, 10.0],
        synthAssignment: "", // e.g. "Filter Cutoff", "LFO Amount"
        description: "Overall strength of inter-particle forces"
    },
    "physics_friction_amount": {
        property: "friction",
        range: [0.0, 1.0], // UI range, inverted in engine
        synthAssignment: "", // e.g. "Envelope Decay", "Reverb Damping"
        description: "Resistance to particle movement"
    },
    "physics_wall_bounce": {
        property: "wallDamping", 
        range: [0.0, 2.0],
        synthAssignment: "", // e.g. "Distortion Drive", "Compression Ratio"
        description: "Energy retention on boundary collisions"
    },
    "physics_collision_radius": {
        property: "collisionRadius",
        range: [1, 100],
        synthAssignment: "", // e.g. "Filter Resonance", "Delay Feedback"
        description: "Distance threshold for collision forces"
    },
    "physics_social_radius": {
        property: "socialRadius",
        range: [1, 500], 
        synthAssignment: "", // e.g. "Chorus Width", "Stereo Spread"
        description: "Distance threshold for attraction/repulsion"
    },
    
    // Visual Effects
    "effects_trail_enabled": {
        property: "trailEnabled",
        range: [true, false],
        synthAssignment: "", // e.g. "Reverb On/Off", "Chorus Enable"
        description: "Enable particle motion trails"
    },
    "effects_trail_length": {
        property: "blur",
        range: [0.5, 0.99],
        synthAssignment: "", // e.g. "Reverb Size", "Delay Time"
        description: "Duration of particle trails (higher = shorter)"
    },
    "effects_halo_enabled": {
        property: "dreamtimeEnabled",
        range: [true, false],
        synthAssignment: "", // e.g. "Ambient Layer", "Pad Enable"
        description: "Enable ethereal glow effect"
    },
    "effects_halo_intensity": {
        property: "glowIntensity", 
        range: [0.0, 1.0],
        synthAssignment: "", // e.g. "Ambient Level", "Saturation"
        description: "Strength of halo glow effect"
    },
    "effects_halo_radius": {
        property: "glowRadius",
        range: [1.0, 5.0],
        synthAssignment: "", // e.g. "Ambient Spread", "Chorus Depth"
        description: "Size of halo glow effect"
    }
};

// Preset structure with synth assignments
export const PRESET_STRUCTURE = {
    name: "User Preset Name",
    version: "1.0",
    created: "ISO timestamp",
    modified: "ISO timestamp", 
    
    // Core particle data
    particles: {
        amount_scale: 150,
        species_count: 5,
        distribution_pattern: "cluster"
    },
    
    // Physics parameters
    physics: {
        force_strength: 0.5,
        friction_amount: 0.05,
        wall_bounce: 0.9,
        collision_radius: 15,
        social_radius: 50
    },
    
    // Force matrices
    forces: {
        social_matrix: [], // NxN array
        collision_matrix: [] // NxN array
    },
    
    // Visual effects
    effects: {
        trail_enabled: true,
        trail_length: 0.97,
        halo_enabled: false,
        halo_intensity: 0.5,
        halo_radius: 2.0,
        species_glow_enabled: false,
        species_glow_target: 0,
        species_glow_size: 1.0,
        species_glow_intensity: 0.0
    },
    
    // Visual identity
    visual: {
        background_color: "#000000",
        particle_size: 3.0,
        species_colors: [], // Array of RGB objects
        species_amounts: [] // Individual particle counts
    },
    
    // *** NEW: Synth Assignment Mapping ***
    synthAssignments: {
        "particles_amount_scale": "LFO Rate",
        "physics_force_strength": "Filter Cutoff", 
        "physics_friction_amount": "Envelope Decay",
        "effects_trail_length": "Reverb Size",
        "effects_halo_intensity": "Ambient Level",
        // ... all parameters can have user-defined synth assignments
    }
};
```

### 🚀 ENHANCED SINGLE SESSION EXECUTION PLAN

#### STEP 1: Backup & Setup (5 min)
```bash
- Read current MainUI.js completely  
- Backup to MainUI.js.backup
- Create new ParameterMapping.js file with synth assignments
```

#### STEP 2: Rebuild MainUI.js Structure (35 min)
```bash
- Replace innerHTML with 7-section structure
- Add professional typography CSS (fix blue text, font sizes)
- Implement enhanced preset dropdown with save/update logic
- Add dynamic species colors based on count
- Implement new keyboard shortcuts (C/X/R)
```

#### STEP 3: Fix Broken Parameters (20 min)  
```bash
- Repair all broken addEventListener calls
- Test each slider/control in real-time
- Verify physics parameter connections work properly
- Fix preset loading/saving behavior
```

#### STEP 4: Add Missing Controls + Synth Fields (30 min)
```bash
- Add Initial Distribution selector (cluster/ring/grid/random)
- Add Halo controls (rename from dreamtime)
- Add Species Glow controls  
- Add dynamic Species Colors + individual amounts
- Add synth assignment text fields to each parameter
- Implement synth assignment save/load in presets
```

#### STEP 5: Enhanced Preset System (15 min)
```bash
- Fix preset dropdown save/update behavior
- Test copy settings functionality thoroughly
- Implement proper "Update existing" vs "Save as new" logic
- Test preset workflow: Tweak → Copy → Configure → Paste → Save
```

#### STEP 6: Test & Validate (15 min)
```bash
- Test every parameter works in real-time
- Test dynamic species colors (change count, verify colors update)
- Test synth assignment fields save/load properly
- Test keyboard shortcuts (C/X/R)
- Verify complete workflow end-to-end
```

### ✅ SUCCESS METRICS (120 Minutes Total)

**Session Complete When:**
- ✅ All 7 sections organized logically with professional styling
- ✅ Every parameter works in real-time (no more broken controls)
- ✅ Dynamic species colors based on species count (1-20)
- ✅ Synth assignment text fields on every parameter
- ✅ Enhanced preset system with proper save/update behavior
- ✅ Copy settings workflow functional (Tweak → Copy → Configure → Save)
- ✅ Parameter mapping dictionary with synth assignments created
- ✅ Keyboard shortcuts enhanced (C/X/R)
- ✅ Professional typography (no blue text, consistent fonts)

### 🎛️ ENHANCED WORKFLOW TARGET

**Perfect Sound Engineer Experience:**
1. **TWEAK** parameters in Floating UI (real-time visual feedback)
2. **ASSIGN** synth modules using text fields (e.g. "Filter Cutoff", "LFO Rate")
3. **COPY** settings when satisfied (X key or button)
4. **CONFIGURE** panel opens → paste settings → minor tweaks
5. **SAVE** preset with proper update/new logic
6. **REPEAT** workflow efficiently for multiple presets

**🎯 Core Result**: Professional floating UI + synth mapping + perfect preset workflow

**🎵 End Goal**: Sound engineer can create production-ready presets with clear synth module assignments