# Master Configuration Reference

This document maps all configuration parameters, their UI controls, and implementation details for the Particle Life Synth system.

## Visual Effects System

### Trail Effect
- **Purpose**: Creates motion trails by fading previous frames
- **UI Control**: Trail Length slider (Main UI) / Trail Effect slider (Config Modal)
- **Parameter**: `this.blur` (0.5-0.99)
- **UI Range**: 0.5 = longer trails, 0.99 = shorter trails  
- **Implementation**: `globalAlpha = blur` when drawing background fade
- **Toggle**: `this.trailEnabled` (boolean)
- **File**: `src/core/SimpleParticleSystem.js:395`

### Species Glow Effect  
- **Purpose**: Per-species glow/halo effects independent of particles
- **UI Control**: Enable Species Glow checkbox (Main UI & Config Modal)
- **Master Toggle**: `this.speciesGlowEnabled` (boolean)
- **Per-Species Parameters**:
  - `this.speciesGlowSize[speciesId]` (0.5-3.0) - size multiplier
  - `this.speciesGlowIntensity[speciesId]` (0-1) - intensity
- **Implementation**: Multiple glow layers with `globalCompositeOperation = 'lighter'`
- **File**: `src/core/SimpleParticleSystem.js:461`

### Global Dreamtime Glow
- **Purpose**: Overall glow intensity for dreamtime render mode
- **UI Control**: Dreamtime Mode checkbox
- **Parameters**:
  - `this.glowIntensity` (0-1) - global glow strength
  - `this.glowRadius` (multiplier) - glow size relative to particle
- **Implementation**: Uses `globalCompositeOperation = 'screen'`
- **File**: `src/core/SimpleParticleSystem.js:368`

## UI Parameter Mapping

### Main UI Controls → Particle System Properties

| UI Element ID | Property | Range | Conversion |
|---------------|----------|-------|------------|
| `trails` | `trailEnabled` | boolean | direct |
| `blur` | `blur` | 0.5-0.99 | direct |
| `species-glow-enabled` | `speciesGlowEnabled` | boolean | direct |
| `particle-size` | `particleSize` | 0.5-20 | direct |
| `background-color-main` | `backgroundColor` | color | direct |
| `dreamtime-mode` | `renderMode` | boolean | 'normal'/'dreamtime' |
| `force` | `forceFactor` | number | direct |
| `friction` | `friction` | 0-0.2 | `physics = 1.0 - ui` |
| `wall-damping` | `wallDamping` | number | direct |
| `collision-radius` | `collisionRadius` | number | matrix update |
| `social-radius` | `socialRadius` | number | matrix update |

### Config Modal Controls → Particle System Properties

| Modal Element ID | Main UI Equivalent | Sync ID |
|------------------|-------------------|---------|
| `modal-blur` | `blur` | `blur` |
| `trail-enabled` | `trails` | `trail-enabled` |
| `species-glow-enabled` | `species-glow-enabled` | `species-glow-enabled` |
| `particle-size` | `particle-size` | `particle-size` |
| `background-color` | `background-color-main` | `background-color` |
| `modal-friction` | `friction` | `modal-friction` |
| `modal-wall-damping` | `wall-damping` | `modal-wall-damping` |
| `force-factor` | `force` | `force-factor` |
| `modal-collision-radius` | `collision-radius` | `modal-collision-radius` |
| `modal-social-radius` | `social-radius` | `modal-social-radius` |

## Render Pipeline Order

### Frame Rendering Sequence
1. **Trail Effect** (`handleTrailEffect()`)
   - Applied first to create background fade
   - Uses `globalAlpha = blur` if trails enabled
   - Canvas cleared if trails disabled
   
2. **Canvas State Reset**
   - `globalAlpha = 1.0`
   - `globalCompositeOperation = 'source-over'`
   - Ensures no trail alpha bleeding
   
3. **Species Glow Rendering** (if `speciesGlowEnabled`)
   - For each species with `speciesGlowIntensity > 0`
   - Multiple glow layers with different alphas
   - Each layer wrapped in save/restore
   
4. **Particle Core Rendering**
   - Standard particle circles
   - Uses species colors and sizes
   - Isolated canvas state

## Critical Implementation Details

### Canvas State Isolation
- Each effect wrapped in `ctx.save()` / `ctx.restore()`
- Explicit `globalAlpha = 1.0` resets between effects
- Manual canvas state restoration to prevent bleed-through

### Value Conversion Rules
- **Friction**: UI range 0-0.2 → Physics range 0.8-1.0 (`physics = 1.0 - ui`)
- **Trail Blur**: Higher values = shorter trails (more background fade)
- **Species Glow**: Completely independent of trail and global glow

### Gradient Caching
- Cache key includes all relevant parameters
- `${speciesId}-${glowSize}-${this.glowIntensity}-${speciesGlowSize}-${speciesGlowIntensity}-${species.opacity}`
- Cache cleared when blur changes to prevent contamination

## Known Interaction Patterns

### Trail Effect ↔ Species Glow
- **Problem**: Trail `globalAlpha` was bleeding into species glow rendering
- **Solution**: Complete canvas state isolation with manual resets
- **File**: `src/core/SimpleParticleSystem.js:425-429`

### Parameter Synchronization
- Main UI changes sync to Config Modal via `syncToModal()`
- Config Modal changes sync to Main UI via `syncToMainUI()`  
- Both update `particleSystem` properties directly

## Troubleshooting Guide

### Trail Effect Not Working
1. Check `this.trailEnabled` is true
2. Verify `this.blur` value (0.5-0.99)
3. Ensure canvas state isolation is working
4. Test with species glow disabled

### Species Glow Affecting Trail
1. Check canvas state save/restore calls
2. Verify `globalAlpha` reset after trail effect
3. Ensure gradient cache includes all parameters

### Parameter Sync Issues
1. Check UI element IDs match sync functions
2. Verify modal/main UI ID consistency  
3. Check conversion functions for friction

## File Locations

- **Core System**: `src/core/SimpleParticleSystem.js`
- **Main UI**: `src/ui/MainUI.js`  
- **Config Modal**: `src/ui/PresetModal.js`
- **Preset Storage**: `src/utils/PresetManager.js`