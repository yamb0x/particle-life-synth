# Particle Life Synth - Sound Synthesis Design Guide

## Project Overview

This guide provides the roadmap for Phase 1: transforming the Particle Life visual synthesizer into a fully-functional audio synthesizer using the JUCE framework. The system will implement granular synthesis as the core sound generation method, controlled by 2 X/Y sliders sampling particles in 2D space.

The JUCE framework serves as the foundation, enabling dual deployment as both a VST plugin for digital audio workstations and a standalone application. Phase 2 will extend this to a physical Intel NUC touchscreen instrument.

## Core Synthesis Approach

**Granular Synthesis with 2D Particle Sampling:**
Granular synthesis operates on the microsound time scale, splitting samples into grains of 1-100ms duration. This mirrors the particle system perfectly—each visual particle can control sonic grains, creating intuitive mapping between visual and auditory elements.

**Two X/Y Control System:**

**Primary X/Y Slider - 2D Particle Sampling:**
- **X-axis**: Samples particle positions horizontally across the canvas
- **Y-axis**: Controls frequency band of generated grains (20Hz-20kHz)
- **Function**: Determines which spatial region of particles triggers grains and at what frequency range

**Secondary X/Y Slider - Grain Parameters:**
- **X-axis**: Grain density (grains per second)
- **Y-axis**: Grain duration (1-100ms)
- **Function**: Controls granular synthesis engine parameters

## Species-Sample Architecture

Each particle species represents its own audio sample. The system supports dynamic species counts—some presets use 4 species, others use 18 species, with maximum support for 20 species.

**Dynamic Sample Assignment:**
Luke assigns samples to active species based on observed particle behaviors and musical intentions. No fixed rules—complete creative flexibility per preset.

**Granular Processing per Species:**
When particles from a species enter the sampling window (X/Y position) they trigger grains from that species' sample at the specified frequency band (Y-axis). Each species maintains independent granular synthesis parameters.

## Particle Behavior Modulation

The particle system provides rich modulation sources that Luke can map to synthesis parameters:

**Available Particle Metrics:**
- **Position**: X,Y location in canvas space
- **Velocity**: Speed and direction vectors  
- **Species**: Particle type (dynamic count per preset)
- **Center of Mass**: Average position per species
- **Cohesion**: How tightly species particles group (0-1)
- **Chaos Level**: System predictability measure (0-1)
- **Orbital Patterns**: Detected circular movements
- **Cluster Count**: Number of distinct particle groups

**Modulation Mapping Options:**
- Center of Mass → stereo panning, grain position within sample
- Velocity → grain playback rate, pitch shifting
- Cohesion → grain overlap amount, filter resonance  
- Chaos Level → parameter randomization, grain timing jitter
- Orbital Patterns → LFO rates, rhythmic grain patterns
- Cluster Count → active voice count, harmony layers

## JUCE Implementation Architecture

**Thread Separation:**
Critical separation of visual particle simulation (30-60fps) from audio processing (44.1kHz). Thread-safe bridge system handles data exchange using lock-free ring buffers to prevent audio dropouts.

**Audio Thread Priority:**
Audio processing maintains highest system priority for consistent low-latency performance. Particle data flows from visual to audio thread non-blocking, with audio engine always producing output regardless of visual frame rate variations.

**Component Structure:**
- **Audio Engine**: Inherits from AudioProcessor, manages granular synthesis
- **Particle Bridge**: Thread-safe data exchange between visual and audio
- **Species Manager**: Dynamic sample loading and processing per active species
- **X/Y Controllers**: 2D sampling position and grain parameter control
- **Parameter Mapper**: Real-time behavior-to-synthesis mapping system

## Luke's Workflow

**JUCE Application Interface:**
1. **Particle Display**: Real-time visualization with sampling window overlay
2. **Species Sample Banks**: Load and assign samples to active species (adapts to preset count)
3. **X/Y Controls**: Primary (2D sampling + frequency) and Secondary (grain parameters)
4. **Parameter Matrix**: Visual mapping of particle behaviors to synthesis parameters
5. **Granular Processors**: Per-species grain controls (size, density, pitch, spatial)

**Sound Design Process:**
1. Load particle preset from web application
2. Observe particle behaviors and species interactions
3. Assign appropriate samples to each active species
4. Configure X/Y sampling position and frequency bands
5. Map particle behaviors to synthesis parameters based on musical intent
6. Fine-tune granular processing per species
7. Save complete audio+visual preset

## Cross-Reference with Working Application

The existing web application provides the foundation for audio integration:

**Proven Visual Engine:**
The current SimpleParticleSystem.js offers robust particle simulation with exportPreset() functionality that generates complete JSON configurations including particles, physics, visual effects, and species configurations. This export system becomes the bridge to the JUCE application.

**Dynamic Species Architecture:** 
The codebase supports flexible species counts (currently configured for 5 species but architecturally supports more), with each species maintaining individual properties including colors, sizes, starting positions, and glow effects. The HybridPresetManager handles both local and cloud-based preset storage with Firebase integration.

**Real-time Parameter System:**
MainUI.js demonstrates sophisticated real-time control interfaces including XYGraph components, parameter sliders, and dynamic UI updates that mirror what Luke will need in the JUCE application. The existing autoSaveCallback system shows how parameter changes propagate through the application.

## JUCE Application Delivery Pipeline

**Development Environment Setup:**
The JUCE application will be developed within this codebase environment, creating a new `/juce-granular-synth/` directory alongside the existing web application. This ensures direct integration with the particle system architecture and preset formats.

**Build & Distribution Workflow:**
1. **Local Development**: JUCE project built using CMake alongside existing web application
2. **Cross-Platform Compilation**: GitHub Actions CI/CD for automated macOS/Windows builds  
3. **Code Signing**: Automatic signing with developer certificates for both platforms
4. **Installer Creation**: Platform-specific installers that place VST3/AU/AAX plugins in correct system directories
5. **Distribution to Luke**: Direct download links with signed installers for immediate installation

**Luke's Complete Toolkit:**

**Application Bundle:**
- **Standalone JUCE Application**: Complete granular synthesis environment with particle visualization
- **VST3/AU Plugin**: For integration with Luke's existing DAW workflow  
- **Preset Import System**: Direct loading of particle presets from web application export
- **Sample Management**: Built-in browser and trimming tools for species sample assignment
- **Real-time Parameter Mapping**: Visual matrix for connecting particle behaviors to synthesis parameters

**Development Support:**
- **Shared Preset Format**: JSON compatibility between web application and JUCE application
- **Live Development Feedback**: Ability to iterate on builds based on Luke's creative requirements
- **Cross-Platform Compatibility**: Both macOS and Windows versions for maximum flexibility
- **Update Mechanism**: Notification system for new builds and feature updates

**Creative Workflow Integration:**
Luke can use the web application to explore and create particle presets, then export these directly into the JUCE application for sound design work. This workflow leverages the mature web interface for visual exploration while providing professional audio tools for sonic creation.

## Implementation Approach

**Foundation Phase:**
- JUCE project setup with particle system integration  
- Basic granular synthesis engine (single species)
- Thread-safe particle data bridge
- Preset import from web application JSON format

**Core Features Phase:**  
- Dynamic species support (adapts to preset count)
- Species-sample assignment system
- 2D sampling window with frequency band control
- Real-time parameter mapping interface

**Professional Polish Phase:**
- Performance optimization and voice limiting
- Cross-platform installer creation with code signing
- Luke workflow testing and refinement
- VST plugin packaging for DAW integration

**Success Criteria:**
- Working VST plugin and standalone application that loads particle presets
- 2D granular sampling with frequency control matching web interface paradigms
- Dynamic species-sample assignment for complete creative flexibility
- Real-time parameter mapping with visual feedback
- Thread-safe audio performance with no dropouts
- Professional installer package ready for Luke's immediate use

This integrated approach ensures Luke has both visual exploration tools (web application) and professional audio creation tools (JUCE application) working in perfect harmony for creating amazing granular synthesis experiences.