// Value noise that tiles exactly over `period` units on the x axis. Sampling a
// sphere's wrapping equirectangular UVs with ordinary noise leaves a visible
// seam at u = 0; wrapping the lattice cell removes it.

float pnHash(vec2 cell, float period) {
  cell.x = mod(cell.x, period);
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453123);
}

float pnNoise(vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = pnHash(i, period);
  float b = pnHash(i + vec2(1.0, 0.0), period);
  float c = pnHash(i + vec2(0.0, 1.0), period);
  float d = pnHash(i + vec2(1.0, 1.0), period);

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float pnFbm(vec2 p, float period) {
  float value = 0.0;
  float amplitude = 0.5;
  float octavePeriod = period;

  for (int i = 0; i < 4; i++) {
    value += amplitude * pnNoise(p, octavePeriod);
    p *= 2.0;
    octavePeriod *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}
