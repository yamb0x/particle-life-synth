import { TrailRenderer } from './TrailRenderer.js';
export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this.initializeWebGL();
        this.initializeShaders();
        this.initializeBuffers();
        this.setupWebGLState();
        this.trailRenderer = new TrailRenderer(this.gl);
    }
    initializeWebGL() {
        const gl = this.canvas.getContext('webgl', {
            alpha: false,
            depth: false,
            stencil: false,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        return gl;
    }
    initializeShaders() {
        // Particle shader
        const particleVertexShader = this.createShader(this.gl.VERTEX_SHADER, `
            attribute vec2 a_position;
            attribute vec3 a_color;
            attribute float a_size;
            attribute float a_alpha;
            
            uniform mat3 u_transform;
            uniform float u_pointSize;
            uniform float u_glowIntensity;
            
            varying vec3 v_color;
            varying float v_alpha;
            varying float v_glow;
            
            void main() {
                vec3 position = u_transform * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                gl_PointSize = a_size * u_pointSize;
                
                v_color = a_color;
                v_alpha = a_alpha;
                v_glow = u_glowIntensity;
            }
        `);
        const particleFragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `
            precision mediump float;
            
            varying vec3 v_color;
            varying float v_alpha;
            varying float v_glow;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float distance = length(center);
                
                // Simple circular particle
                if (distance > 0.5) discard;
                
                // Smooth edge
                float alpha = 1.0 - smoothstep(0.3, 0.5, distance);
                
                // Optional subtle glow
                if (v_glow > 0.0) {
                    float glow = exp(-distance * 3.0) * v_glow * 0.3;
                    alpha = max(alpha, glow);
                }
                
                gl_FragColor = vec4(v_color, alpha * v_alpha);
            }
        `);
        this.particleProgram = this.createProgram(particleVertexShader, particleFragmentShader);
        // Trail shader
        const trailVertexShader = this.createShader(this.gl.VERTEX_SHADER, `
            attribute vec2 a_position;
            attribute vec3 a_color;
            attribute float a_alpha;
            
            uniform mat3 u_transform;
            
            varying vec3 v_color;
            varying float v_alpha;
            
            void main() {
                vec3 position = u_transform * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                
                v_color = a_color;
                v_alpha = a_alpha;
            }
        `);
        const trailFragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `
            precision mediump float;
            
            varying vec3 v_color;
            varying float v_alpha;
            
            void main() {
                // Simple trail rendering
                gl_FragColor = vec4(v_color, v_alpha * 0.5);
            }
        `);
        this.trailProgram = this.createProgram(trailVertexShader, trailFragmentShader);
        // Get uniform locations
        this.particleTransformUniform = this.gl.getUniformLocation(this.particleProgram, 'u_transform');
        this.particlePointSizeUniform = this.gl.getUniformLocation(this.particleProgram, 'u_pointSize');
        this.particleGlowIntensityUniform = this.gl.getUniformLocation(this.particleProgram, 'u_glowIntensity');
        this.trailTransformUniform = this.gl.getUniformLocation(this.trailProgram, 'u_transform');
    }
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error('Failed to create shader');
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${error}`);
        }
        return shader;
    }
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        if (!program) {
            throw new Error('Failed to create program');
        }
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program linking error: ${error}`);
        }
        return program;
    }
    initializeBuffers() {
        // Particle buffers
        this.particleVertexBuffer = this.gl.createBuffer();
        this.particleColorBuffer = this.gl.createBuffer();
        this.particleSizeBuffer = this.gl.createBuffer();
        this.particleAlphaBuffer = this.gl.createBuffer();
        // Trail buffers
        this.trailVertexBuffer = this.gl.createBuffer();
        this.trailColorBuffer = this.gl.createBuffer();
        this.trailAlphaBuffer = this.gl.createBuffer();
    }
    setupWebGLState() {
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE); // Additive blending
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.DEPTH_TEST); // Ensure depth testing is off
    }
    render(particleSystem) {
        const particles = particleSystem.getParticles();
        // Clear canvas completely
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        // Create transformation matrix (screen space)
        const transform = new Float32Array([
            2.0 / this.canvas.width, 0.0, 0.0,
            0.0, -2.0 / this.canvas.height, 0.0,
            -1.0, 1.0, 1.0
        ]);
        // Render trails using the new trail renderer
        this.trailRenderer.render(particles, transform, particleSystem.visual.glowIntensity);
        // Render particles
        this.renderParticles(particles, transform, particleSystem.visual.particleSize, particleSystem.visual.glowIntensity);
    }
    renderTrails(particles, transform, glowIntensity) {
        this.gl.useProgram(this.trailProgram);
        // Set uniforms
        this.gl.uniformMatrix3fv(this.trailTransformUniform, false, transform);
        // Prepare trail data
        const trailVertices = [];
        const trailColors = [];
        const trailAlphas = [];
        for (const particle of particles) {
            if (particle.trailX.length < 2)
                continue;
            // Create connected line segments for smooth trails
            for (let i = 0; i < particle.trailX.length - 1; i++) {
                // Calculate alpha for fading effect
                const alpha1 = (i / particle.trailX.length) * 0.6;
                const alpha2 = ((i + 1) / particle.trailX.length) * 0.6;
                // Add two vertices for each line segment
                trailVertices.push(particle.trailX[i], particle.trailY[i]);
                trailVertices.push(particle.trailX[i + 1], particle.trailY[i + 1]);
                // Colors for both vertices
                trailColors.push(...particle.color, ...particle.color);
                // Alpha for both vertices
                trailAlphas.push(alpha1 * glowIntensity, alpha2 * glowIntensity);
            }
        }
        if (trailVertices.length === 0)
            return;
        // Update buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.trailVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(trailVertices), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.trailColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(trailColors), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.trailAlphaBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(trailAlphas), this.gl.DYNAMIC_DRAW);
        // Set attributes
        const positionLocation = this.gl.getAttribLocation(this.trailProgram, 'a_position');
        const colorLocation = this.gl.getAttribLocation(this.trailProgram, 'a_color');
        const alphaLocation = this.gl.getAttribLocation(this.trailProgram, 'a_alpha');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.trailVertexBuffer);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.trailColorBuffer);
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.trailAlphaBuffer);
        this.gl.enableVertexAttribArray(alphaLocation);
        this.gl.vertexAttribPointer(alphaLocation, 1, this.gl.FLOAT, false, 0, 0);
        // Set line width for trails
        this.gl.lineWidth(2.0);
        // Draw trails
        this.gl.drawArrays(this.gl.LINES, 0, trailVertices.length / 2);
    }
    renderParticles(particles, transform, particleSize, glowIntensity) {
        this.gl.useProgram(this.particleProgram);
        // Set uniforms
        this.gl.uniformMatrix3fv(this.particleTransformUniform, false, transform);
        this.gl.uniform1f(this.particlePointSizeUniform, particleSize);
        this.gl.uniform1f(this.particleGlowIntensityUniform, glowIntensity);
        // Prepare particle data
        const vertices = [];
        const colors = [];
        const sizes = [];
        const alphas = [];
        for (const particle of particles) {
            vertices.push(particle.x, particle.y);
            colors.push(...particle.color);
            sizes.push(particle.size);
            alphas.push(1.0);
        }
        // Update buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleSizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleAlphaBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(alphas), this.gl.DYNAMIC_DRAW);
        // Set attributes
        const positionLocation = this.gl.getAttribLocation(this.particleProgram, 'a_position');
        const colorLocation = this.gl.getAttribLocation(this.particleProgram, 'a_color');
        const sizeLocation = this.gl.getAttribLocation(this.particleProgram, 'a_size');
        const alphaLocation = this.gl.getAttribLocation(this.particleProgram, 'a_alpha');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleVertexBuffer);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleColorBuffer);
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleSizeBuffer);
        this.gl.enableVertexAttribArray(sizeLocation);
        this.gl.vertexAttribPointer(sizeLocation, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleAlphaBuffer);
        this.gl.enableVertexAttribArray(alphaLocation);
        this.gl.vertexAttribPointer(alphaLocation, 1, this.gl.FLOAT, false, 0, 0);
        // Draw particles
        this.gl.drawArrays(this.gl.POINTS, 0, particles.length);
    }
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
}
