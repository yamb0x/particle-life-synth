export declare class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    species: number;
    age: number;
    size: number;
    color: [number, number, number];
    energy: number;
    phase: number;
    metabolism: number;
    isRunner: boolean;
    responseDelay: number;
    delayedForces: {
        fx: number;
        fy: number;
    }[];
    private trailUpdateCounter;
    mass: number;
    charge: number;
    temperature: number;
    trailX: number[];
    trailY: number[];
    maxTrailLength: number;
    constructor(x: number, y: number, species: number, size?: number);
    private getSpeciesColor;
    update(dt: number, friction?: number): void;
    private updateTrail;
    applyForce(fx: number, fy: number, maxForce?: number): void;
    limitVelocity(maxSpeed?: number): void;
    distanceTo(other: Particle): number;
    setTrailLength(length: number): void;
}
