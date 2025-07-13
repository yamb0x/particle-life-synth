# Changelog

All notable changes to the Particle Life Synth project will be documented in this file.

## [2025-07-13] - Session Summary

### Added
- **Per-Species Glow Effects** 
  - Replaced inefficient blur system with high-performance glow/halo effects
  - Added dual controls: Glow Size (0.5-3.0x) and Glow Intensity (0-1)
  - Integrated into both Main UI and Configuration Panel
  - Full preset save/load support
  
- **Glow Test Page** (`test-glow.html`)
  - Compare glow effects across different presets
  - Multiple intensity options for testing
  - Real-time FPS monitoring

- **Enhanced Built-in Presets**
  - Predator-Prey: No glow (baseline)
  - Crystallization: Subtle glow (1.2x, 0.3 intensity)
  - Vortex: Dynamic glow (1.5x, 0.4 intensity)  
  - Symbiosis: Light glow (1.3x, 0.2 intensity)
  - Dreamtime: Ethereal per-species glow variations

### Fixed
- **Configuration Panel Modal IDs** (#826)
  - Fixed incorrect element IDs causing null reference errors
  - Modal now opens without errors
  - All sliders and controls work properly

### Changed
- **Removed Blur Implementation**
  - Eliminated multi-pass rendering that caused performance issues
  - Removed all blur-related test files
  - Cleaned up codebase

### Performance
- Maintains 60+ FPS with heavy glow on all species
- Single-pass rendering for non-glowing particles
- Efficient layered glow rendering using additive blending

### Documentation
- Added new issues for next session:
  - #09: Floating configuration panel
  - #10: Copy/Paste settings feature
  - #11: Preset selector in configuration panel
  - #12: Future glow optimization opportunities
- Updated issues README with current status

## Next Session Goals
1. Convert configuration panel to floating, draggable window
2. Implement copy/paste settings between UI panels
3. Add preset selector to configuration panel header
4. Continue with audio synthesis integration