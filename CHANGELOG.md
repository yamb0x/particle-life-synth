# Changelog

All notable changes to the Particle Life Synth project will be documented in this file.

## [2025-07-21] - Firebase Improvements & Code Cleanup

### Fixed
- **Firebase Preset Duplication**: Fixed duplicate preset creation in Firebase
  - Now uses consistent IDs (`userId_presetName`) for proper updates vs. new entries
  - Prevents multiple versions of the same preset in cloud storage
  - Preserves creation timestamps when updating existing presets

- **Test Artifact Prevention**: Blocked test presets from uploading to Firebase
  - Added comprehensive `isInvalidPresetName()` validation
  - Prevents "AutomaticSaveAsNew" and other test artifacts from reaching cloud storage
  - Protects production database from test pollution

### Removed
- **"Save As New" Button**: Simplified preset saving interface
  - Removed separate "Save As New" button from PresetModal
  - Single "Save" button now intelligently detects name changes
  - Users change preset names to save as new presets (more intuitive)
  - Updated test suite to remove `testSaveAsNew()` test

### Added
- **Cleanup Methods**: Added database hygiene utilities
  - `CloudStorage.cleanupTestPresets()` - removes invalid presets and duplicates
  - `HybridPresetManager.cleanupCloudPresets()` - wrapper with error handling
  - `window.cleanupCloudPresets()` - global method for manual cleanup
  - Automatic version control for preset updates

### Improved
- **Error Handling**: Enhanced robustness across Firebase operations
  - Graceful degradation when cloud services are unavailable
  - Better user feedback for save operations
  - Comprehensive validation before cloud uploads

- **Code Cleanup**: Removed excessive debugging console.log statements
  - Cleaned up Firebase-related logging while preserving important messages
  - Removed temporary backup files and artifacts
  - Improved code maintainability

### Documentation
- **Updated README.md**: Added Firebase improvements and deployment info
- **Enhanced CLAUDE.md**: Documented implementation details and recent changes
- **Comprehensive Documentation**: All recent changes properly documented

## [2025-07-19] - Master Development Plan Implementation

### Fixed
- **Issue #14: Trail Rendering Gray Residue**
  - Replaced complex image data manipulation with clean alpha blending approach
  - Eliminated quantization errors that caused gray residue accumulation
  - Now uses `globalAlpha` with `fillRect` for smooth trail decay

- **Issue #15: Color Picker Reset on Modal Open**
  - Added `isLoadingPreset` flag to prevent particle system updates during initialization
  - Fixed ColorPicker callback to respect loading state
  - Preserved user colors when opening configuration modal

### Added
- **UIStateManager**: Centralized state management system
  - Event-driven architecture for parameter synchronization
  - Prevents circular updates and state conflicts
  - Maps for species-specific settings (colors, glow)
  - Auto-detection of parameter categories

- **DOMHelpers**: Utility library for safe DOM operations
  - `safeAddEventListener`, `safeUpdateElement` for error handling
  - Slider management helpers with automatic display updates
  - Debounce/throttle utilities for performance
  - Input validation and type conversion helpers

- **Consolidated Test Suite**: Reduced from 9 to 3 test files
  - `test-suite.html`: Comprehensive automated parameter testing
  - `debug-tools.html`: Interactive debugging and diagnostics
  - `performance-test.html`: Performance profiling and benchmarking
  - Removed: 7 redundant test files

### Changed
- **Documentation Consolidation**: Streamlined from 8 to 4 core files
  - Merged FIXES_SUMMARY.md content into CHANGELOG.md
  - Essential INSTRUCTIONS.md content moved to README.md
  - Removed redundant documentation files

### Architecture Improvements
- **Clean File Structure**: Organized utilities in `/src/utils/`
- **Modular Design**: Separated concerns between state, DOM, and core logic
- **Error Recovery**: Robust error handling throughout the system

### Historical UI Parameter Fixes
- **ID Mismatches**: Fixed synth assignment field IDs (`glow-size-synth` → `species-glow-size-synth`)
- **Missing Initialization**: Added `loadSynthAssignments()` call after UI initialization
- **Enhanced Error Handling**: Created `safeAddEventListener` and `safeUpdateElement` helpers
- **Species Amount Synchronization**: Fixed global slider not updating individual species inputs
- **Preset Copy/Paste**: Fixed pasted settings not updating PresetModal's internal state

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