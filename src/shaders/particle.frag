precision mediump float;

varying vec3 v_color;
varying float v_alpha;
varying float v_glow;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float distance = length(center);
    
    // Create soft circular particle with glow
    float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
    
    // Add glow effect
    float glow = exp(-distance * 8.0) * v_glow;
    alpha = max(alpha, glow * 0.3);
    
    gl_FragColor = vec4(v_color, alpha * v_alpha);
}