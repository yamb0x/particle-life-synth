export class Particle {
    public x: number;
    public y: number;
    public vx: number;
    public vy: number;
    public species: number;
    public age: number;
    public size: number;
    public color: [number, number, number];
    public energy: number;
    public phase: number; // For oscillating behaviors
    public metabolism: number; // Energy consumption rate
    public isRunner: boolean; // Special particle with different rules
    public responseDelay: number; // Delay in force response (0-5 timesteps)
    public delayedForces: {fx: number, fy: number}[]; // Queue of delayed forces
    private trailUpdateCounter: number = 0;
    
    // Additional properties for comprehensive system
    public mass: number = 1.0;
    public charge: number = 0.0;
    public temperature: number = 1.0;
    
    // Trail history for rendering
    public trailX: number[] = [];
    public trailY: number[] = [];
    public maxTrailLength: number = 25;
    
    constructor(x: number, y: number, species: number, size: number = 6) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.species = species;
        this.age = 0;
        this.size = size;
        this.color = this.getSpeciesColor(species);
        this.energy = 1.0 + Math.random() * 0.5;
        this.phase = Math.random() * Math.PI * 2;
        this.metabolism = 0.3 + species * 0.1; // Different species have different metabolisms
        
        // 5% chance to be a runner particle
        this.isRunner = Math.random() < 0.05;
        
        // Random response delay (0-5 timesteps)
        this.responseDelay = Math.floor(Math.random() * 6);
        this.delayedForces = [];
        
        // Initialize trail
        this.trailX.push(x);
        this.trailY.push(y);
    }
    
    private getSpeciesColor(species: number): [number, number, number] {
        const colors: [number, number, number][] = [
            [1.0, 0.0, 0.0], // Red
            [0.0, 0.5, 1.0], // Blue
            [0.0, 1.0, 0.0], // Green
            [1.0, 1.0, 0.0], // Yellow
            [1.0, 0.0, 1.0], // Purple/Magenta
        ];
        return colors[species % colors.length];
    }
    
    public update(dt: number, friction: number = 0.2): void {
        // Update energy
        this.energy = Math.max(0.1, this.energy - this.metabolism * 0.0005 * dt);
        this.phase += 0.05 * dt;
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Apply friction
        this.vx *= (1 - friction);
        this.vy *= (1 - friction);
        
        // Update age
        this.age += dt;
        
        // Update trail
        this.updateTrail();
        
        // Size will be set dynamically based on visual parameters
    }
    
    private updateTrail(): void {
        // Always add current position to trail for smooth rendering
        this.trailX.push(this.x);
        this.trailY.push(this.y);
        
        // Keep trail length under control
        while (this.trailX.length > this.maxTrailLength) {
            this.trailX.shift();
            this.trailY.shift();
        }
    }
    
    public applyForce(fx: number, fy: number, maxForce: number = 0.5): void {
        // Add force to delay queue
        this.delayedForces.push({fx, fy});
        
        // If we have enough delayed forces, apply the oldest one
        if (this.delayedForces.length > this.responseDelay) {
            const delayed = this.delayedForces.shift()!;
            
            // Limit force magnitude
            const forceMag = Math.sqrt(delayed.fx * delayed.fx + delayed.fy * delayed.fy);
            if (forceMag > maxForce) {
                delayed.fx = (delayed.fx / forceMag) * maxForce;
                delayed.fy = (delayed.fy / forceMag) * maxForce;
            }
            
            // Apply spring-like damping to delayed force
            const damping = 0.8;
            this.vx += delayed.fx * damping;
            this.vy += delayed.fy * damping;
        }
    }
    
    public limitVelocity(maxSpeed: number = 2.0): void {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
    }
    
    public distanceTo(other: Particle): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    public setTrailLength(length: number): void {
        this.maxTrailLength = length;
        // Trim existing trail if needed
        while (this.trailX.length > this.maxTrailLength) {
            this.trailX.shift();
            this.trailY.shift();
        }
    }
}