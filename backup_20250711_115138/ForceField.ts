export interface ForceFieldParams {
    r1: number; // Inner radius where force is f1
    r2: number; // Outer radius where force is f2
    f1: number; // Force at inner radius (negative = repulsion)
    f2: number; // Force at outer radius
}

export class ForceField {
    // 5x5 matrix of force field parameters for each species pair
    private forceFields: ForceFieldParams[][] = [];
    
    constructor() {
        this.initializeDefault();
    }
    
    private initializeDefault(): void {
        // Initialize with default values
        for (let i = 0; i < 5; i++) {
            this.forceFields[i] = [];
            for (let j = 0; j < 5; j++) {
                this.forceFields[i][j] = {
                    r1: 20,
                    r2: 100,
                    f1: i === j ? -1.0 : -0.5, // Same species repel at close range
                    f2: i === j ? 0.3 : 0.1    // Slight attraction at medium range
                };
            }
        }
    }
    
    public calculateForce(distance: number, species1: number, species2: number, isRunner: boolean = false): number {
        const params = this.forceFields[species1][species2];
        
        // Runners have modified behavior
        if (isRunner) {
            // Runners are less affected by forces and more exploratory
            const runnerScale = 0.3;
            return this.interpolateForce(distance, params) * runnerScale;
        }
        
        return this.interpolateForce(distance, params);
    }
    
    private interpolateForce(distance: number, params: ForceFieldParams): number {
        if (distance < params.r1) {
            // Strong repulsion at very close range
            return -2.0 / (distance * distance);
        } else if (distance < params.r2) {
            // Interpolate between f1 and f2
            const t = (distance - params.r1) / (params.r2 - params.r1);
            return params.f1 * (1 - t) + params.f2 * t;
        } else {
            // Exponential decay beyond r2
            const decay = Math.exp(-(distance - params.r2) / 50);
            return params.f2 * decay;
        }
    }
    
    public setForceField(species1: number, species2: number, params: ForceFieldParams): void {
        this.forceFields[species1][species2] = { ...params };
    }
    
    public getForceField(species1: number, species2: number): ForceFieldParams {
        return { ...this.forceFields[species1][species2] };
    }
    
    // Preset configurations matching Ventrella's ecosystems
    public loadPreset(name: string): void {
        switch (name) {
            case 'pollack':
                this.loadPollackPreset();
                break;
            case 'gems':
                this.loadGemsPreset();
                break;
            case 'alliances':
                this.loadAlliancesPreset();
                break;
            case 'red_menace':
                this.loadRedMenacePreset();
                break;
            case 'acrobats':
                this.loadAcrobatsPreset();
                break;
            case 'mitosis':
                this.loadMitosisPreset();
                break;
            case 'planets':
                this.loadPlanetsPreset();
                break;
            case 'stigmergy':
                this.loadStigmergyPreset();
                break;
            case 'field':
                this.loadFieldPreset();
                break;
            case 'simplify':
                this.loadSimplifyPreset();
                break;
            case 'dreamtime':
                this.loadDreamtimePreset();
                break;
            default:
                this.initializeDefault();
        }
    }
    
    private loadPollackPreset(): void {
        // Chaotic, paint-splatter like patterns - increased forces
        const presets = [
            { r1: 10, r2: 150, f1: -3.0, f2: 2.0 },
            { r1: 15, r2: 180, f1: -2.0, f2: -1.5 },
            { r1: 20, r2: 200, f1: -1.0, f2: 1.8 },
            { r1: 12, r2: 160, f1: -2.5, f2: 1.2 },
            { r1: 18, r2: 190, f1: -1.5, f2: -1.0 }
        ];
        
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const idx = (i + j) % presets.length;
                this.forceFields[i][j] = { ...presets[idx] };
            }
        }
    }
    
    private loadGemsPreset(): void {
        // Crystalline structures - tight lattices
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.forceFields[i][j] = {
                    r1: 25,
                    r2: 80,
                    f1: -4.0,
                    f2: i === j ? 3.0 : -1.5
                };
            }
        }
    }
    
    private loadAlliancesPreset(): void {
        // Groups form alliances
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const allied = (i + j) % 2 === 0;
                this.forceFields[i][j] = {
                    r1: 20,
                    r2: 100,
                    f1: -1.0,
                    f2: allied ? 0.8 : -0.5
                };
            }
        }
    }
    
    private loadRedMenacePreset(): void {
        // Red particles hunt others aggressively
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (i === 0) { // Red species (predator)
                    this.forceFields[i][j] = {
                        r1: 10,
                        r2: 200,
                        f1: -1.0,
                        f2: j === 0 ? 0.5 : 3.5  // Strong attraction to prey
                    };
                } else {
                    this.forceFields[i][j] = {
                        r1: 15,
                        r2: 100,
                        f1: -2.5,
                        f2: j === 0 ? -3.0 : 0.8  // Strong repulsion from red
                    };
                }
            }
        }
    }
    
    private loadAcrobatsPreset(): void {
        // Dynamic, acrobatic movements
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const phase = (i * 5 + j) * 0.2;
                this.forceFields[i][j] = {
                    r1: 15 + Math.sin(phase) * 5,
                    r2: 100 + Math.cos(phase) * 30,
                    f1: -1.0 + Math.sin(phase + 1) * 0.5,
                    f2: 0.5 + Math.cos(phase + 2) * 0.5
                };
            }
        }
    }
    
    private loadMitosisPreset(): void {
        // Cell-like division behavior
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.forceFields[i][j] = {
                    r1: 25,
                    r2: 50,
                    f1: -1.5,
                    f2: i === j ? 0.8 : -0.2
                };
            }
        }
    }
    
    private loadPlanetsPreset(): void {
        // Orbital mechanics
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const mass = 1 + i * 0.5;
                this.forceFields[i][j] = {
                    r1: 20 * mass,
                    r2: 200,
                    f1: -2.0,
                    f2: 0.3 * mass
                };
            }
        }
    }
    
    private loadStigmergyPreset(): void {
        // Ant-like trail following
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.forceFields[i][j] = {
                    r1: 15,
                    r2: 80,
                    f1: -0.8,
                    f2: (i + j) % 3 === 0 ? 1.0 : 0.2
                };
            }
        }
    }
    
    private loadFieldPreset(): void {
        // Uniform field effects
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.forceFields[i][j] = {
                    r1: 20,
                    r2: 120,
                    f1: -1.0,
                    f2: 0.4
                };
            }
        }
    }
    
    private loadSimplifyPreset(): void {
        // Minimalist interactions
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                this.forceFields[i][j] = {
                    r1: 30,
                    r2: 100,
                    f1: -1.0,
                    f2: i === j ? 0.5 : 0.0
                };
            }
        }
    }
    
    private loadDreamtimePreset(): void {
        // Surreal, dreamlike behavior
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const dream = Math.sin(i * 1.5 + j * 0.7);
                this.forceFields[i][j] = {
                    r1: 20 + dream * 10,
                    r2: 100 + dream * 50,
                    f1: -1.0 + dream * 0.5,
                    f2: dream
                };
            }
        }
    }
}