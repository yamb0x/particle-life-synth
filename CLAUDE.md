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

## Key Commands for AI Assistants

When working on this project:
- Always read files before editing
- Use multi-file edits when making related changes
- Test value conversions carefully
- Maintain the ASCII art aesthetic in docs
- Keep the vanilla JS approach
- Don't add unnecessary comments to code

## Current State

- Visual engine: 100% complete
- Preset system: 100% complete
- Audio engine: 20% complete (next phase)
- Documentation: In progress

## Bug Tracking

The `/issues` folder contains all documented bugs and improvements:
- When user asks to "tackle an open issue" or mentions bugs, check the `/issues` folder
- Read `/issues/README.md` for current issue list and status
- Each issue is a numbered .md file with full details
- After fixing an issue, update the .md file with resolution and mark as resolved in README.md
- Common user phrases that should trigger checking issues:
  - "fix a bug"
  - "tackle an issue"
  - "what issues are there"
  - "open issues"
  - "known bugs"

## Next Steps

1. Fix open issues in `/issues` folder
2. Implement Web Audio API integration
3. Create synthesis engines (Analog, FM, Wavetable, Granular, Physical)
4. Map particle behaviors to synthesis parameters
5. Build VST/AU plugin wrapper
6. Add MPE support