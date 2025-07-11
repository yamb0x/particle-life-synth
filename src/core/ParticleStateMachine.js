export var ParticleState;
(function (ParticleState) {
    ParticleState["EXPLORING"] = "exploring";
    ParticleState["HUNTING"] = "hunting";
    ParticleState["FLEEING"] = "fleeing";
    ParticleState["CLUSTERING"] = "clustering";
    ParticleState["MATING"] = "mating";
    ParticleState["FORAGING"] = "foraging";
    ParticleState["DORMANT"] = "dormant";
    ParticleState["DYING"] = "dying";
})(ParticleState || (ParticleState = {}));
export class ParticleStateMachine {
    constructor(initialState = ParticleState.EXPLORING) {
        this.state = ParticleState.EXPLORING;
        this.stateTimer = 0;
        this.previousState = ParticleState.EXPLORING;
        this.behaviorMemory = [];
        this.maxMemoryLength = 30;
        this.behaviorParams = {
            exploreSpeed: 1.0,
            huntSpeed: 2.0,
            fleeSpeed: 2.5,
            clusterDistance: 50,
            matingEnergyThreshold: 1.5,
            dormantEnergyThreshold: 0.3,
            perceptionRadius: 150
        };
        this.stateTransitions = [
            // From EXPLORING
            {
                fromState: ParticleState.EXPLORING,
                toState: ParticleState.HUNTING,
                condition: (p, ctx) => ctx.nearestPrey !== undefined && p.energy > 0.7,
                priority: 2
            },
            {
                fromState: ParticleState.EXPLORING,
                toState: ParticleState.FLEEING,
                condition: (p, ctx) => ctx.nearestPredator !== undefined &&
                    ctx.nearestPredator.distanceTo(p) < 100,
                priority: 3
            },
            {
                fromState: ParticleState.EXPLORING,
                toState: ParticleState.CLUSTERING,
                condition: (p, ctx) => {
                    const sameSpecies = ctx.nearbyParticles.get(p.species) || [];
                    return sameSpecies.length > 3 && p.energy > 0.5;
                },
                priority: 1
            },
            {
                fromState: ParticleState.EXPLORING,
                toState: ParticleState.DORMANT,
                condition: (p, ctx) => p.energy < this.behaviorParams.dormantEnergyThreshold,
                priority: 4
            },
            // From HUNTING
            {
                fromState: ParticleState.HUNTING,
                toState: ParticleState.FLEEING,
                condition: (p, ctx) => ctx.nearestPredator !== undefined &&
                    ctx.nearestPredator.distanceTo(p) < 50,
                priority: 3
            },
            {
                fromState: ParticleState.HUNTING,
                toState: ParticleState.EXPLORING,
                condition: (p, ctx) => ctx.nearestPrey === undefined || p.energy < 0.4,
                priority: 2
            },
            // From FLEEING
            {
                fromState: ParticleState.FLEEING,
                toState: ParticleState.EXPLORING,
                condition: (p, ctx) => ctx.nearestPredator === undefined ||
                    ctx.nearestPredator.distanceTo(p) > 150,
                priority: 2
            },
            // From CLUSTERING
            {
                fromState: ParticleState.CLUSTERING,
                toState: ParticleState.MATING,
                condition: (p, ctx) => p.energy > this.behaviorParams.matingEnergyThreshold &&
                    ctx.nearestMate !== undefined,
                priority: 2
            },
            {
                fromState: ParticleState.CLUSTERING,
                toState: ParticleState.FLEEING,
                condition: (p, ctx) => ctx.nearestPredator !== undefined &&
                    ctx.nearestPredator.distanceTo(p) < 80,
                priority: 3
            },
            {
                fromState: ParticleState.CLUSTERING,
                toState: ParticleState.EXPLORING,
                condition: (p, ctx) => {
                    const sameSpecies = ctx.nearbyParticles.get(p.species) || [];
                    return sameSpecies.length < 2;
                },
                priority: 1
            },
            // From MATING
            {
                fromState: ParticleState.MATING,
                toState: ParticleState.EXPLORING,
                condition: (p, ctx) => p.energy < 1.0 || this.stateTimer > 100,
                priority: 1
            },
            // From DORMANT
            {
                fromState: ParticleState.DORMANT,
                toState: ParticleState.EXPLORING,
                condition: (p, ctx) => p.energy > 0.5,
                priority: 1
            },
            {
                fromState: ParticleState.DORMANT,
                toState: ParticleState.DYING,
                condition: (p, ctx) => p.energy < 0.1,
                priority: 2
            },
            // From FORAGING
            {
                fromState: ParticleState.FORAGING,
                toState: ParticleState.FLEEING,
                condition: (p, ctx) => ctx.nearestPredator !== undefined &&
                    ctx.nearestPredator.distanceTo(p) < 60,
                priority: 3
            },
            {
                fromState: ParticleState.FORAGING,
                toState: ParticleState.EXPLORING,
                condition: (p, ctx) => Math.abs(ctx.energyGradient.x) < 0.1 &&
                    Math.abs(ctx.energyGradient.y) < 0.1,
                priority: 1
            }
        ];
        this.state = initialState;
    }
    update(particle, context, dt) {
        this.stateTimer += dt;
        // Update behavior memory
        this.updateMemory(particle);
        // Check for state transitions
        const possibleTransitions = this.stateTransitions
            .filter(rule => rule.fromState === this.state && rule.condition(particle, context))
            .sort((a, b) => b.priority - a.priority);
        if (possibleTransitions.length > 0) {
            this.transitionTo(possibleTransitions[0].toState);
        }
        // Execute current state behavior
        this.executeBehavior(particle, context, dt);
    }
    transitionTo(newState) {
        this.previousState = this.state;
        this.state = newState;
        this.stateTimer = 0;
        this.target = undefined;
    }
    executeBehavior(particle, context, dt) {
        switch (this.state) {
            case ParticleState.EXPLORING:
                this.exploreMovement(particle, dt);
                break;
            case ParticleState.HUNTING:
                this.huntMovement(particle, context, dt);
                break;
            case ParticleState.FLEEING:
                this.fleeMovement(particle, context, dt);
                break;
            case ParticleState.CLUSTERING:
                this.clusterMovement(particle, context, dt);
                break;
            case ParticleState.MATING:
                this.matingMovement(particle, context, dt);
                break;
            case ParticleState.FORAGING:
                this.foragingMovement(particle, context, dt);
                break;
            case ParticleState.DORMANT:
                this.dormantBehavior(particle, dt);
                break;
            case ParticleState.DYING:
                this.dyingBehavior(particle, dt);
                break;
        }
    }
    exploreMovement(particle, dt) {
        // Levy flight pattern for exploration
        if (Math.random() < 0.05) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.levyFlightStep();
            particle.vx += Math.cos(angle) * distance * this.behaviorParams.exploreSpeed;
            particle.vy += Math.sin(angle) * distance * this.behaviorParams.exploreSpeed;
        }
        // Add slight noise for wandering
        particle.vx += (Math.random() - 0.5) * 0.2;
        particle.vy += (Math.random() - 0.5) * 0.2;
    }
    huntMovement(particle, context, dt) {
        if (!context.nearestPrey)
            return;
        const dx = context.nearestPrey.x - particle.x;
        const dy = context.nearestPrey.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            // Predictive pursuit - aim where prey will be
            const predictX = context.nearestPrey.x + context.nearestPrey.vx * 10;
            const predictY = context.nearestPrey.y + context.nearestPrey.vy * 10;
            const pdx = predictX - particle.x;
            const pdy = predictY - particle.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
            particle.vx += (pdx / pdist) * this.behaviorParams.huntSpeed * dt;
            particle.vy += (pdy / pdist) * this.behaviorParams.huntSpeed * dt;
        }
    }
    fleeMovement(particle, context, dt) {
        if (!context.nearestPredator)
            return;
        const dx = particle.x - context.nearestPredator.x;
        const dy = particle.y - context.nearestPredator.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            // Evasive maneuvers with zigzag pattern
            const baseAngle = Math.atan2(dy, dx);
            const zigzag = Math.sin(this.stateTimer * 0.1) * 0.5;
            particle.vx += Math.cos(baseAngle + zigzag) * this.behaviorParams.fleeSpeed * dt;
            particle.vy += Math.sin(baseAngle + zigzag) * this.behaviorParams.fleeSpeed * dt;
        }
    }
    clusterMovement(particle, context, dt) {
        const sameSpecies = context.nearbyParticles.get(particle.species) || [];
        if (sameSpecies.length === 0)
            return;
        // Calculate center of mass of nearby same species
        let centerX = 0, centerY = 0;
        let cohesionX = 0, cohesionY = 0;
        let separationX = 0, separationY = 0;
        let alignmentX = 0, alignmentY = 0;
        for (const other of sameSpecies) {
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Cohesion
            centerX += other.x;
            centerY += other.y;
            // Separation (avoid crowding)
            if (distance < this.behaviorParams.clusterDistance * 0.5 && distance > 0) {
                separationX -= dx / distance;
                separationY -= dy / distance;
            }
            // Alignment
            alignmentX += other.vx;
            alignmentY += other.vy;
        }
        // Apply flocking rules
        centerX /= sameSpecies.length;
        centerY /= sameSpecies.length;
        cohesionX = (centerX - particle.x) * 0.01;
        cohesionY = (centerY - particle.y) * 0.01;
        alignmentX /= sameSpecies.length;
        alignmentY /= sameSpecies.length;
        particle.vx += (cohesionX + separationX * 0.5 + alignmentX * 0.1) * dt;
        particle.vy += (cohesionY + separationY * 0.5 + alignmentY * 0.1) * dt;
    }
    matingMovement(particle, context, dt) {
        if (!context.nearestMate)
            return;
        // Courtship dance - circular motion around potential mate
        const dx = context.nearestMate.x - particle.x;
        const dy = context.nearestMate.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 20 && distance < 80) {
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            const danceRadius = 40;
            const danceSpeed = 0.1;
            particle.vx += Math.cos(angle + this.stateTimer * danceSpeed) * dt;
            particle.vy += Math.sin(angle + this.stateTimer * danceSpeed) * dt;
        }
    }
    foragingMovement(particle, context, dt) {
        // Follow energy gradient
        const gradientStrength = Math.sqrt(context.energyGradient.x * context.energyGradient.x +
            context.energyGradient.y * context.energyGradient.y);
        if (gradientStrength > 0.01) {
            particle.vx += context.energyGradient.x * dt;
            particle.vy += context.energyGradient.y * dt;
        }
        else {
            // Random walk when no gradient
            this.exploreMovement(particle, dt);
        }
    }
    dormantBehavior(particle, dt) {
        // Reduce movement to conserve energy
        particle.vx *= 0.9;
        particle.vy *= 0.9;
        // Slow metabolism
        particle.metabolism *= 0.5;
    }
    dyingBehavior(particle, dt) {
        // Erratic final movements
        particle.vx += (Math.random() - 0.5) * 0.5;
        particle.vy += (Math.random() - 0.5) * 0.5;
        particle.vx *= 0.8;
        particle.vy *= 0.8;
    }
    updateMemory(particle) {
        this.behaviorMemory.push({ x: particle.x, y: particle.y });
        while (this.behaviorMemory.length > this.maxMemoryLength) {
            this.behaviorMemory.shift();
        }
    }
    levyFlightStep() {
        // Levy flight distribution for exploration
        const u = Math.random();
        const beta = 1.5;
        return Math.pow(u, -1 / beta);
    }
    getState() {
        return this.state;
    }
    getStateTimer() {
        return this.stateTimer;
    }
    getTarget() {
        return this.target;
    }
    getBehaviorParams() {
        return this.behaviorParams;
    }
    getMemoryTrail() {
        return [...this.behaviorMemory];
    }
}
