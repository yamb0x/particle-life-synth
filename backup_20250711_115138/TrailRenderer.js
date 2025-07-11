export class TrailRenderer {
    constructor(gl) {
        this.gl = gl;
        this.initShaders();
        this.initBuffers();
    }
    initShaders() {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, `
            attribute vec2 a_position;
            attribute vec4 a_color;
            
            uniform mat3 u_transform;
            
            varying vec4 v_color;
            
            void main() {
                vec3 position = u_transform * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                v_color = a_color;
            }
        `);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `
            precision mediump float;
            
            varying vec4 v_color;
            
            void main() {
                gl_FragColor = v_color;
            }
        `);
        this.program = this.createProgram(vertexShader, fragmentShader);
        this.transformUniform = this.gl.getUniformLocation(this.program, 'u_transform');
    }
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        if (!shader)
            throw new Error('Failed to create shader');
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${info}`);
        }
        return shader;
    }
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        if (!program)
            throw new Error('Failed to create program');
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Program link error: ${info}`);
        }
        return program;
    }
    initBuffers() {
        this.vertexBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
    }
    render(particles, transform, glowIntensity) {
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix3fv(this.transformUniform, false, transform);
        const vertices = [];
        const colors = [];
        // Create triangle strips for each trail
        for (const particle of particles) {
            if (particle.trailX.length < 2)
                continue;
            // Calculate trail width based on particle properties
            const baseWidth = particle.isRunner ? 3 : 2;
            for (let i = 0; i < particle.trailX.length - 1; i++) {
                const t1 = i / (particle.trailX.length - 1);
                const t2 = (i + 1) / (particle.trailX.length - 1);
                // Calculate perpendicular direction
                const dx = particle.trailX[i + 1] - particle.trailX[i];
                const dy = particle.trailY[i + 1] - particle.trailY[i];
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                // Width tapers along the trail
                const width1 = baseWidth * (1 - t1 * 0.5);
                const width2 = baseWidth * (1 - t2 * 0.5);
                // Create quad vertices (as two triangles)
                // First triangle
                vertices.push(particle.trailX[i] + nx * width1, particle.trailY[i] + ny * width1, particle.trailX[i] - nx * width1, particle.trailY[i] - ny * width1, particle.trailX[i + 1] + nx * width2, particle.trailY[i + 1] + ny * width2);
                // Second triangle
                vertices.push(particle.trailX[i] - nx * width1, particle.trailY[i] - ny * width1, particle.trailX[i + 1] - nx * width2, particle.trailY[i + 1] - ny * width2, particle.trailX[i + 1] + nx * width2, particle.trailY[i + 1] + ny * width2);
                // Colors with alpha gradient
                const alpha1 = t1 * 0.4 * glowIntensity;
                const alpha2 = t2 * 0.4 * glowIntensity;
                // 6 vertices (2 triangles)
                for (let j = 0; j < 3; j++) {
                    colors.push(...particle.color, alpha1);
                }
                for (let j = 0; j < 3; j++) {
                    colors.push(...particle.color, alpha2);
                }
            }
        }
        if (vertices.length === 0)
            return;
        // Update buffers
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        const colorLocation = this.gl.getAttribLocation(this.program, 'a_color');
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 0, 0);
        // Draw all triangles
        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
    }
}
