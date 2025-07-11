# Particle Life Synth

A revolutionary MIDI-controlled synthesizer where living particle ecosystems shape your sound in real-time. Play notes on your keyboard while emergent behaviors from particle populations create evolving, organic synthesis.

![Particle Life Synth](https://github.com/yourusername/particle-life-synth/assets/demo.gif)

## 🎹 Vision: The Living Synthesizer

This is NOT another generative music system. This is a **playable instrument** where:
- You play the notes (via MIDI keyboard)
- Particle populations control HOW those notes sound
- Every note is shaped by a living, breathing ecosystem
- Visual beauty and sonic innovation unite in one instrument

## 🌟 Core Innovation

### Five Species, Five Synthesis Engines
Each particle species controls a different synthesis type:

- 🔴 **Red → Analog**: Warm bass, classic leads, evolving pads
- 🟢 **Green → FM**: Crystalline bells, metallic textures, digital precision  
- 🔵 **Blue → Wavetable**: Morphing timbres, flowing soundscapes
- 🟡 **Yellow → Granular**: Textural clouds, microsound atmospheres
- 🟣 **Purple → Physical Modeling**: Organic strings, living resonances

### Emergent Behaviors Drive Sound
Population dynamics directly control synthesis parameters:
- **Clustering** → Unison voices & chorus
- **Orbiting** → LFO rates & phasing
- **Swarming** → Filter modulation & harmonics
- **Crystallization** → Resonance peaks & harmonics
- **Chaos** → Distortion & noise

## 🎮 Current Visual Prototype

The visual engine is complete and demonstrates:
- Interactive force relationship editor
- Real-time particle simulation (1000+ particles @ 60FPS)
- Smooth trail rendering
- Behavioral presets (Predator-Prey, Crystallization, Vortex, Symbiosis)
- Full parameter control

**Try it now**: [Live Demo](https://yourusername.github.io/particle-life-synth)

## 🔊 Sound Engine (In Development)

### Planned Audio Architecture
- **128-voice polyphony** with population-based allocation
- **5 synthesis engines** running in parallel
- **32-slot modulation matrix** connecting particles to parameters
- **Professional effects chain** with particle-driven control
- **DAW integration** as VST3/AU plugin

### Technical Stack
- **Audio**: JUCE Framework + Surge XT synthesis engine
- **Visual**: Canvas 2D (current) → WebGL (planned)
- **Performance**: Multi-threaded architecture for <10ms latency

## 🚀 Quick Start (Visual Prototype)

```bash
# Clone repository
git clone https://github.com/yourusername/particle-life-synth.git
cd particle-life-synth

# Run local server
python3 serve.py
# or
npx http-server

# Open in browser
http://localhost:8000
```

## 📚 Documentation

For sound engineers and developers:
- [Particle System Core](docs/PARTICLE-SYSTEM-CORE.md) - Understanding the simulation
- [Parameter Mapping Guide](docs/PARAMETER-MAPPING-GUIDE.md) - Connecting particles to sound
- [Synth Architecture](docs/SYNTH-ARCHITECTURE.md) - Technical audio implementation

## 🎯 Project Roadmap

### Phase 1: Visual Prototype ✅
- Particle simulation engine
- Interactive parameter control
- Behavioral presets
- Performance optimization

### Phase 2: Audio Integration (Current)
- JUCE framework setup
- Synthesis engine implementation
- Parameter mapping pipeline
- MIDI integration

### Phase 3: Production Ready
- VST3/AU plugin build
- Preset management system
- DAW automation support
- User manual & tutorials

### Phase 4: Advanced Features
- MPE support
- Network collaboration
- AI-assisted preset generation
- Mobile companion app

## 🎼 Who Is This For?

- **Electronic Musicians**: Seeking organic, evolving sounds
- **Live Performers**: Wanting visual feedback with their instrument
- **Sound Designers**: Exploring new sonic territories
- **Producers**: Adding unique textures to productions

## 🤝 Contributing

We're building something revolutionary. Join us!

- **Sound Engineers**: Help implement the synthesis engine
- **DSP Developers**: Optimize audio algorithms
- **UI/UX Designers**: Refine the interface
- **Musicians**: Test and create presets

## 📄 License

MIT License - Use freely in your music and projects

## 🙏 Acknowledgments

- [Jeffrey Ventrella](https://ventrella.com/) - Original Clusters particle life concept
- [Surge Synth Team](https://surge-synthesizer.github.io/) - Open-source synthesis engine
- JUCE Framework - Professional audio development platform
- The particle life community - Ongoing inspiration

---

**The future of synthesis is alive.** 🧬🎹✨

*Join the revolution where music meets artificial life.*