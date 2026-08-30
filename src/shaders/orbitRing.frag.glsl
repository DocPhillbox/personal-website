uniform vec3 uColor;
uniform vec3 uTrailColor;
uniform float uRadius;
uniform float uHalfWidth;
uniform float uDashCount;
uniform float uPlanetAngle;
uniform float uOpacity;

varying vec2 vLocal;

const float TAU = 6.28318530718;

void main() {
  float r = length(vLocal);

  // Soft-edged band: a solid core that fades out toward the geometry edge.
  // Drawing the orbit as a shaded strip rather than a 1px line is what lets it
  // antialias instead of crawling as the camera moves.
  float across = abs(r - uRadius) / uHalfWidth;
  float band = 1.0 - smoothstep(0.22, 1.0, across);
  if (band <= 0.002) discard;

  // Negating y undoes the mesh's flat-lay rotation, so this angle matches the
  // planet's own orbital angle directly.
  float angle = atan(-vLocal.y, vLocal.x);

  // Feathered dashes. Hard on/off edges shimmer badly on a ring this thin.
  float phase = fract(angle / TAU * uDashCount);
  float dash = smoothstep(0.0, 0.14, phase) * (1.0 - smoothstep(0.52, 0.70, phase));

  // The arc the planet has just swept stays lit, so each ring reads as a path
  // being travelled rather than as static decoration.
  float behind = mod(uPlanetAngle - angle, TAU);
  float trail = exp(-behind * 2.6);

  float alpha = band * (dash * 0.42 + 0.07) * uOpacity;
  alpha += band * trail * 0.55;

  vec3 colour = mix(uColor, uTrailColor, trail);

  gl_FragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
}
