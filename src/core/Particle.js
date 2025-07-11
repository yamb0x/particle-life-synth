export class Particle {
    constructor(x, y, species, size = 6) {
        this.trailUpdateCounter = 0;
        // Additional properties for comprehensive system
        this.mass = 1.0;
        this.charge = 0.0;
        this.temperature = 1.0;
        // Trail history for rendering
        this.trailX = [];
        this.trailY = [];
        this.maxTrailLength = 25;
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
    getSpeciesColor(species) {
        const colors = [
            [1.0, 0.0, 0.0], // Red
            [0.0, 0.5, 1.0], // Blue
            [0.0, 1.0, 0.0], // Green
            [1.0, 1.0, 0.0], // Yellow
            [1.0, 0.0, 1.0], // Purple/Magenta
        ];
        return colors[species % colors.length];
    }
    update(dt, friction = 0.2) {
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
    updateTrail() {
        // Always add current position to trail for smooth rendering
        this.trailX.push(this.x);
        this.trailY.push(this.y);
        // Keep trail length under control
        while (this.trailX.length > this.maxTrailLength) {
            this.trailX.shift();
            this.trailY.shift();
        }
    }
    applyForce(fx, fy, maxForce = 0.5) {
        // Add force to delay queue
        this.delayedForces.push({ fx, fy });
        // If we have enough delayed forces, apply the oldest one
        if (this.delayedForces.length > this.responseDelay) {
            const delayed = this.delayedForces.shift();
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
    limitVelocity(maxSpeed = 2.0) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
    }
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    setTrailLength(length) {
        this.maxTrailLength = length;
        // Trim existing trail if needed
        while (this.trailX.length > this.maxTrailLength) {
            this.trailX.shift();
            this.trailY.shift();
        }
    }
}
