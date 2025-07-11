import { Particle } from '../core/Particle.js';
export declare class TrailRenderer {
    private gl;
    private program;
    private vertexBuffer;
    private colorBuffer;
    private transformUniform;
    constructor(gl: WebGLRenderingContext);
    private initShaders;
    private createShader;
    private createProgram;
    private initBuffers;
    render(particles: Particle[], transform: Float32Array, glowIntensity: number): void;
}
