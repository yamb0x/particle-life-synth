# CLAUDE.md - AI Collaboration Guidelines

## Project Overview

Particle Life Synth is a visual particle simulation system that will eventually become a synthesizer controlled by emergent particle behaviors. The project uses vanilla JavaScript with ES6 modules, Canvas 2D for rendering, and aims to map particle dynamics to audio synthesis parameters.

## Key Technical Decisions

### Architecture
- **Vanilla JavaScript**: No frameworks, pure ES6 modules
- **Canvas 2D**: Simple, performant rendering
- **Multi-layer Storage**: IndexedDB + localStorage for reliability
- **Modular Design**: Separate concerns (core, UI, utils)

### Code Style
- **No unnecessary comments**: Code should be self-documenting
- **ES6 modules**: Use import/export, not require
- **Async/await**: For all asynchronous operations
- **Early returns**: Reduce nesting, improve readability

## Project Structure

```
src/
├── core/
│   └── SimpleParticleSystem.js    # Main particle physics engine
├── ui/
│   ├── PresetModal.js            # Configuration modal
│   ├── StartPositionEditor.js    # Visual position editor
│   ├── ForceEditor.js            # Force relationship editor
│   └── ColorPicker.js            # Custom color picker
├── utils/
│   ├── PresetManager.js          # Preset management
│   └── PresetStorage.js          # Storage abstraction
└── main.js                       # Application entry point
```

## Important Implementation Details

### Value Conversions

#### Friction
- **UI Range**: 0 to 0.2 (0 = no friction, 0.2 = max friction)
- **Physics Range**: 0.8 to 1.0 (1.0 = no friction, 0.8 = max friction)
- **Conversion**: `physics = 1.0 - ui`

#### Blur (Trail Effect)
- **Range**: 0.5 to 0.99
- **Implementation**: `ctx.globalAlpha = blur`
- **Effect**: Higher value = shorter trails (more fade)

#### Background Color System
- **Mode**: 'solid' (static color) or 'sinusoidal' (animated between two colors)
- **Sinusoidal Parameters**: 
  - `backgroundColor1`: First color (hex format)
  - `backgroundColor2`: Second color (hex format) 
  - `backgroundCycleTime`: Time in seconds to complete full color cycle (0.5 to 30s)
- **Implementation**: Uses `Math.sin()` to interpolate between colors over time
- **Effect**: Creates smooth, organic color transitions in the background

### Storage Strategy
1. **IndexedDB**: Primary storage (async, reliable)
2. **localStorage**: Fallback and immediate persistence
3. **Auto-save**: 2-second debounce after changes
4. **Import/Export**: JSON format for sharing

### Preset System Architecture
- **Built-in presets**: Can be deleted (design decision)
- **Force matrices**: NxN arrays for species interactions
- **Starting positions**: Normalized 0-1 coordinates
- **Auto-save**: Disabled for built-in presets

## Common Pitfalls

1. **Don't use `npm run stop`**: Use `pkill -f "python.*serve.py"`
2. **Clear browser cache**: When CSS/UI changes don't appear
3. **Check console**: For IndexedDB or storage errors
4. **Value ranges**: Always verify UI vs physics ranges

## Testing Approach

1. **Manual testing**: Primary method
2. **Debug files**: Create HTML test files for specific features
3. **Console logging**: Extensive logging for debugging
4. **Browser DevTools**: For storage inspection

## Future Audio Integration

The particle system is designed to map behaviors to synthesis parameters:

```javascript
// Example mapping structure
{
  clustering_coefficient: 0.87  →  filter_cutoff: 8420.0,
  average_velocity: 3.24        →  lfo_rate: 3.24,
  species_separation: 142.5     →  stereo_width: 0.71,
  orbital_period: 2.34          →  delay_time: 234ms,
  chaos_index: 0.23             →  distortion_amt: 23%
}
```

## Development Workflow

1. **Start server**: `python3 serve.py`
2. **Access**: http://localhost:8000
3. **Hot reload**: Manual refresh (no build step)
4. **Debug storage**: Use debug.html
5. **Test parameters**: Use test-parameters.html
6. **Performance testing**: Use performance-test.html

## Key Commands for AI Assistants

When working on this project:
- Always read files before editing
- Use multi-file edits when making related changes
- Test value conversions carefully
- Maintain the vanilla JS approach
- Don't add unnecessary comments to code
- Use helper functions for error handling (safeAddEventListener, safeUpdateElement)
- Test changes using test-all-parameters.html

## AI Collaboration Guidelines
- Never decide that an issue is resolved before the user has tested it
- Always validate preset names before Firebase operations using `isInvalidPresetName()` method
- Use debug-tools.html for Firebase management operations - don't create new utility files
- Remember: Users save as new preset by changing the preset name (no "Save As New" button)

## Cloud Deployment Architecture

The project now runs on:
- **Vercel**: Static site hosting with automatic GitHub deployments
- **Firebase**: Cloud storage for presets with real-time sync
- **Anonymous Auth**: No signup required for collaboration

### Key Changes from Local to Cloud

1. **Preset Storage**: 
   - Was: Local IndexedDB + localStorage only
   - Now: Hybrid system with automatic cloud sync
   
2. **Sharing**: 
   - Was: Manual JSON export/import
   - Now: Share links + real-time sync
   
3. **UI Updates**:
   - Automatic cloud connection on page load
   - Cloud status integrated into info panel
   - Share button in preset modal

### Firebase Integration Points

- `src/config/firebase.config.js` - Firebase configuration
- `src/utils/CloudStorage.js` - Firestore integration with robust preset management
- `src/utils/HybridPresetManager.js` - Local + cloud preset management with cleanup
- `src/ui/CloudSyncUI.js` - Share modal and URL import handling

### Recent Firebase Improvements (Latest Update)

**Robust Preset Management:**
- **Fixed Duplicate Creation**: Now uses consistent IDs (`userId_presetName`) for proper updates instead of creating new entries
- **Test Artifact Prevention**: Blocks "AutomaticSaveAsNew" and other test presets from being uploaded to Firebase
- **Smart Save Logic**: Automatically detects name changes to create new presets vs. updating existing ones
- **Cleanup Methods**: Added `cleanupTestPresets()` and `cleanupCloudPresets()` for maintaining database hygiene
- **Error Recovery**: Graceful handling of network issues and validation failures

**UI Improvements:**
- **Removed "Save As New"**: Simplified interface - users change names to save as new presets
- **Better User Feedback**: Clear indication of save vs. save-as-new behavior
- **Consistent Experience**: Single "Save" button with intelligent behavior based on context

**Data Integrity:**
- **Validation**: Comprehensive preset name validation prevents invalid entries
- **Version Control**: Proper version numbering for preset updates
- **Conflict Resolution**: Handles concurrent edits and duplicate prevention

## Performance Characteristics

- **500 particles**: 60+ FPS consistently
- **1000 particles**: 45-60 FPS 
- **2000+ particles**: Playable framerates for complex audio synthesis
- **Dreamtime mode**: Optimized gradient caching for glow effects

### Performance Monitoring
- Built-in FPS tracking with `avgFrameTime` property
- Console warnings when performance drops below 30 FPS
- Performance test page at `/performance-test.html`

## Bug Tracking

The `/issues` folder contains all documented bugs and improvements:
- When user asks to "tackle an open issue" or mentions bugs, check the `/issues` folder
- Read `/issues/README.md` for current issue list and status
- Open issues are in the main `/issues` folder (e.g., `01.md`, `02.md`)
- Resolved issues are in `/issues/completed/` subfolder
- After fixing an issue:
  1. Update the issue .md file with resolution details
  2. Move the file to `/issues/completed/`
  3. Update `/issues/README.md` to reflect the new location
- Common user phrases that should trigger checking issues:
  - "fix a bug"
  - "tackle an issue"
  - "what issues are there"
  - "open issues"
  - "known bugs"

## Testing

The project uses a **consolidated testing system** - DO NOT create new test files:

- **Master Test Suite**: `http://localhost:8000/test-suite.html`
  - Automated parameter testing
  - Trail rendering validation
  - UI state manager tests
  - Species count validation
  - **UPDATE THIS FILE** when adding new features or tests

- **Developer Debug Tools**: `http://localhost:8000/debug-tools.html`
  - System diagnostics
  - Species debugging (including glow performance testing)
  - UI state debugging
  - Performance monitoring with real-time metrics
  - Storage and memory analysis
  - Comprehensive fix validation for all resolved issues

- **Performance Testing**: `http://localhost:8000/performance-test.html`
  - High particle count testing
  - FPS monitoring and optimization analysis

### Testing Guidelines for AI Assistants

#### Core Testing Workflow
- **Self-Testing First**: Always implement automated tests in `test-suite.html` for any new feature or fix
- **Debug-First Development**: Use `debug-tools.html` for all development debugging and diagnostic needs
- **Test-Then-Implement**: Wait for user confirmation that tests pass before implementing full solutions
- **Self-Debug Capability**: Add new debugging tools to `debug-tools.html` rather than creating separate utilities

#### File Management Rules
- **NEVER create new test-*.html files** - extend existing consolidated testing system
- **ALWAYS update test-suite.html** when implementing new features or bug fixes
- **Use debug-tools.html** for all development debugging and system diagnostics
- **Reference existing test patterns** in test-suite.html for consistency and performance
- **Clean up any temporary test files** created during development

#### Integration Requirements
- **Extend, Don't Create**: Add new test cases and debug tools to existing files unless explicitly requested
- **Performance-Aware Testing**: Leverage existing performance monitoring in debug-tools.html
- **User Preference Respect**: Follow established testing patterns that align with project's vanilla JS approach

## Next Steps

1. Implement Web Audio API integration
2. Create synthesis engines (Analog, FM, Wavetable, Granular, Physical)
3. Map particle behaviors to synthesis parameters
4. Build VST/AU plugin wrapper
5. Add MPE support