uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;

// vUv.x: 0 at the tail, 1 at the head. vUv.y: across the streak.
void main() {
  float along = clamp(vUv.x, 0.0, 1.0);
  float across = abs(vUv.y - 0.5) * 2.0;

  // The streak narrows toward the tail, so it tapers instead of ending square.
  float halfWidth = mix(0.18, 1.0, pow(along, 1.6));
  float radial = across / halfWidth;
  if (radial > 1.0) discard;

  float core = pow(1.0 - radial, 2.6);
  float lengthFall = pow(along, 3.2);
  float head = smoothstep(0.86, 1.0, along) * 0.7;

  gl_FragColor = vec4(uColor, (core * lengthFall + head * core) * uOpacity);
}
