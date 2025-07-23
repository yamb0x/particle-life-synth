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
    },
    "effects_species_glow_enabled": {
        property: "speciesGlowEnabled",
        range: [true, false],
        synthAssignment: "", // e.g. "Lead Layer", "Solo Enable"
        description: "Enable per-species glow effect"
    },
    "effects_species_glow_target": {
        property: "selectedGlowSpecies",
        range: [0, 19],
        synthAssignment: "", // e.g. "Voice Select", "OSC Target"
        description: "Species to apply glow effect to"
    },
    "effects_species_glow_size": {
        property: "speciesGlowSize",
        range: [0.5, 3.0],
        synthAssignment: "", // e.g. "Lead Width", "Voice Spread"
        description: "Size of species glow effect"
    },
    "effects_species_glow_intensity": {
        property: "speciesGlowIntensity",
        range: [0.0, 1.0],
        synthAssignment: "", // e.g. "Lead Level", "Solo Volume"
        description: "Intensity of species glow effect"
    },
    
    // Visual Identity
    "visual_background_color": {
        property: "backgroundColor",
        range: "#000000",
        synthAssignment: "", // e.g. "Pad Color", "Visual Theme"
        description: "Canvas background color"
    },
    "visual_particle_size": {
        property: "particleSize",
        range: [0.5, 30.0],
        synthAssignment: "", // e.g. "Note Size", "Grain Size"
        description: "Visual size of particles (doesn't affect physics)"
    },
    "visual_species_size": {
        property: "species.size",
        range: [0.5, 30.0],
        synthAssignment: "", // e.g. "Voice Size", "OSC Width"
        description: "Individual size for selected species"
    },
    "visual_species_colors": {
        property: "species.colors",
        range: "RGB",
        synthAssignment: "", // e.g. "Voice Colors", "OSC Colors"
        description: "Color for each species"
    },
    "visual_species_amounts": {
        property: "species.particleCount",
        range: [0, 1000],
        synthAssignment: "", // e.g. "Voice Level", "OSC Mix"
        description: "Individual particle count per species"
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
        per_species_size: false,
        species_size: 3.0,
        species_colors: [], // Array of RGB objects
        species_amounts: [] // Individual particle counts
    },
    
    // *** NEW: Synth Assignment Mapping ***
    synthAssignments: {
        "particles_amount_scale": "",
        "physics_force_strength": "", 
        "physics_friction_amount": "",
        "effects_trail_length": "",
        "effects_halo_intensity": "",
        // ... all parameters can have user-defined synth assignments
    }
};

// Audio synthesis mapping suggestions
export const SYNTH_MAPPING_SUGGESTIONS = {
    // Modulation Sources (for LFOs, Envelopes)
    "clustering_coefficient": ["physics_force_strength", "physics_social_radius"],
    "average_velocity": ["physics_friction_amount", "effects_trail_length"], 
    "species_separation": ["physics_social_radius", "effects_halo_radius"],
    "orbital_period": ["effects_trail_length", "physics_force_strength"],
    "chaos_index": ["forces_social_matrix", "physics_wall_bounce"],
    
    // Common Synth Targets
    "filter_cutoff": ["effects_halo_intensity", "physics_force_strength"],
    "filter_resonance": ["effects_halo_radius", "physics_collision_radius"], 
    "oscillator_detune": ["visual_species_colors", "particles_species_count"],
    "lfo_rate": ["particles_amount_scale", "average_velocity"],
    "envelope_attack": ["physics_wall_bounce", "physics_friction_amount"],
    "reverb_size": ["effects_trail_length", "physics_social_radius"],
    "delay_time": ["orbital_period", "effects_trail_length"],
    "distortion_amount": ["chaos_index", "physics_wall_bounce"]
};

// Helper function to generate default synth assignments
export function generateDefaultSynthAssignments() {
    const assignments = {};
    Object.keys(PARAMETER_MAP).forEach(key => {
        assignments[key] = "";
    });
    return assignments;
}

// Helper function to validate synth assignment
export function validateSynthAssignment(paramKey, synthModule) {
    const param = PARAMETER_MAP[paramKey];
    if (!param) return false;
    
    // Allow empty assignments
    if (!synthModule || synthModule.trim() === "") return true;
    
    // Basic validation - just check it's a reasonable string
    return synthModule.length > 0 && synthModule.length < 100;
}

// Export all particle behavior metrics that can be mapped to synth
export const PARTICLE_METRICS = {
    // Real-time metrics calculated from particle system
    clustering_coefficient: {
        description: "How tightly particles cluster together",
        range: [0.0, 1.0],
        calculation: "Average nearest neighbor distance normalized"
    },
    average_velocity: {
        description: "Average speed of all particles",
        range: [0.0, 10.0],
        calculation: "Mean of all particle velocities"
    },
    species_separation: {
        description: "Average distance between different species",
        range: [0.0, 1000.0],
        calculation: "Mean inter-species distance"
    },
    orbital_period: {
        description: "Average time for orbital patterns",
        range: [0.0, 10.0],
        calculation: "FFT analysis of position changes"
    },
    chaos_index: {
        description: "Measure of system chaos/randomness",
        range: [0.0, 1.0],
        calculation: "Entropy of velocity directions"
    },
    pattern_stability: {
        description: "How stable current patterns are",
        range: [0.0, 1.0],
        calculation: "Variance of positions over time"
    },
    energy_level: {
        description: "Total kinetic energy in system",
        range: [0.0, 100.0],
        calculation: "Sum of all particle kinetic energies"
    },
    formation_count: {
        description: "Number of distinct formations",
        range: [0, 20],
        calculation: "Cluster analysis of positions"
    }
};