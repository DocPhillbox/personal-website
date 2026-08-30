// Gradient (Perlin-style) noise that tiles exactly over `period` units on the x
// axis, so it can be sampled across a sphere's wrapping equirectangular UVs
// without a seam.
//
// Value noise was used here previously. Its derivative is exactly zero on every
// lattice line, which shows up as a grid of flat plateaus — visible "edges" in
// the render. Gradient noise has no such degeneracy, and the quintic fade below
// is C2-continuous.

vec2 pnGradient(vec2 cell, float period) {
  cell.x = mod(cell.x, period);
  float angle = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453123) * 6.28318530718;
  return vec2(cos(angle), sin(angle));
}

float pnNoise(vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  float a = dot(pnGradient(i, period), f);
  float b = dot(pnGradient(i + vec2(1.0, 0.0), period), f - vec2(1.0, 0.0));
  float c = dot(pnGradient(i + vec2(0.0, 1.0), period), f - vec2(0.0, 1.0));
  float d = dot(pnGradient(i + vec2(1.0, 1.0), period), f - vec2(1.0, 1.0));

  // 2D gradient noise spans roughly [-0.707, 0.707]; remap to [0, 1].
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.7071 + 0.5;
}

float pnFbm(vec2 p, float period) {
  float value = 0.0;
  float amplitude = 0.5;
  float total = 0.0;
  float octavePeriod = period;

  for (int i = 0; i < 4; i++) {
    value += amplitude * pnNoise(p, octavePeriod);
    total += amplitude;
    p *= 2.0;
    octavePeriod *= 2.0;
    amplitude *= 0.5;
  }

  return value / total;
}

// Ridged variant: sharp crests, used where filaments should read as structure
// rather than as soft cloud.
float pnRidged(vec2 p, float period) {
  float value = 0.0;
  float amplitude = 0.5;
  float total = 0.0;
  float octavePeriod = period;

  for (int i = 0; i < 3; i++) {
    float n = 1.0 - abs(pnNoise(p, octavePeriod) * 2.0 - 1.0);
    value += amplitude * n * n;
    total += amplitude;
    p *= 2.0;
    octavePeriod *= 2.0;
    amplitude *= 0.5;
  }

  return value / total;
}
