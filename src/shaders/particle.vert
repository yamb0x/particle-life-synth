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