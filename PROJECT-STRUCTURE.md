# 📁 Clean Project Structure

## Core Files

### 🎯 Entry Points
- `index.html` - Single page application
- `src/main.ts/.js` - Application initialization
- `start.sh` - Simple launch script

### 🧬 Particle System Core
- `src/core/ComprehensiveParticleSystem.ts` - Main particle system (100+ parameters)
- `src/core/NonLinearForceField.ts` - Advanced force calculations
- `src/core/ParticleStateMachine.ts` - Behavioral AI states
- `src/core/Particle.ts` - Individual particle class

### 🎛️ User Interface
- `src/ui/ComprehensiveParameterPanel.ts` - Full parameter control UI

### 📚 Documentation
- `README.md` - Main project documentation
- `docs/` - Technical documentation and specs
- `START-HERE.md` - Quick start guide
- `LICENSE` - MIT license

### 🛠️ Configuration
- `package.json` - Project metadata
- `tsconfig.json` - TypeScript configuration
- `.gitignore` - Git ignore rules

## What Was Removed

✅ **Removed Duplicates:**
- Old particle system files (using Comprehensive versions)
- Multiple start scripts (consolidated to one)
- Old HTML and README versions
- Duplicate TypeScript configs

✅ **Moved to Backup:**
- WebGL renderers (not currently used)
- Old implementation files
- Test and reference files

## Running the App

```bash
# Simple start
./start.sh

# Or manually
python3 -m http.server 8080
```

## Key Features Retained

- ✨ 100+ parameters for particle behavior
- 🧠 State machine AI (hunting, fleeing, mating, etc.)
- 🧪 Chemical signaling via pheromones
- 🌍 Environmental effects and resources
- 🎨 Beautiful particle visualization
- 🎛️ Comprehensive UI controls

The project is now clean, focused, and ready for further development!