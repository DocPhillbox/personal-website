// Gradient (Perlin-style) noise.
//
// The previous implementation used value noise with a smoothstep fade, whose
// derivative is exactly zero on every lattice line. That produces a visible grid
// of flat plateaus — the "edges" artifact. Gradient noise interpolates dot
// products with per-cell gradient vectors instead, so the field stays organic,
// and the quintic fade below is C2-continuous.

const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
]

function hash3(ix, iy, iz, seed) {
  let h = ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1013904223
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

function gradDot(ix, iy, iz, seed, dx, dy, dz) {
  const g = GRAD3[hash3(ix, iy, iz, seed) % 12]
  return g[0] * dx + g[1] * dy + g[2] * dz
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

/** Signed gradient noise, roughly in [-1, 1]. */
export function noise3D(x, y, z, seed) {
  const X = Math.floor(x)
  const Y = Math.floor(y)
  const Z = Math.floor(z)
  const fx = x - X
  const fy = y - Y
  const fz = z - Z
  const u = fade(fx)
  const v = fade(fy)
  const w = fade(fz)

  const n000 = gradDot(X, Y, Z, seed, fx, fy, fz)
  const n100 = gradDot(X + 1, Y, Z, seed, fx - 1, fy, fz)
  const n010 = gradDot(X, Y + 1, Z, seed, fx, fy - 1, fz)
  const n110 = gradDot(X + 1, Y + 1, Z, seed, fx - 1, fy - 1, fz)
  const n001 = gradDot(X, Y, Z + 1, seed, fx, fy, fz - 1)
  const n101 = gradDot(X + 1, Y, Z + 1, seed, fx - 1, fy, fz - 1)
  const n011 = gradDot(X, Y + 1, Z + 1, seed, fx, fy - 1, fz - 1)
  const n111 = gradDot(X + 1, Y + 1, Z + 1, seed, fx - 1, fy - 1, fz - 1)

  const x00 = lerp(n000, n100, u)
  const x10 = lerp(n010, n110, u)
  const x01 = lerp(n001, n101, u)
  const x11 = lerp(n011, n111, u)

  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w)
}

/** Fractal brownian motion, normalised to [0, 1]. */
export function fbm3D(x, y, z, seed, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3D(x * freq, y * freq, z * freq, seed + i * 97)
    norm += amp
    amp *= gain
    freq *= lacunarity
  }
  return sum / norm / 2 + 0.5
}

/**
 * Ridged multifractal — sharp crests instead of rolling hills. This is what
 * makes mountain ranges read as ranges rather than as lumps.
 */
export function ridged3D(x, y, z, seed, octaves = 5) {
  let sum = 0
  let amp = 0.5
  let freq = 1
  let weight = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    let n = 1 - Math.abs(noise3D(x * freq, y * freq, z * freq, seed + i * 131))
    n *= n
    n *= weight
    weight = Math.max(0, Math.min(1, n * 2))
    sum += n * amp
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

/**
 * Domain-warped fbm. Distorting the sample point by another noise field is what
 * turns circular blobs into landmasses with inlets, peninsulas and fjords.
 */
export function warpedFbm3D(x, y, z, seed, strength = 1.6, octaves = 4) {
  // Two warp octaves is enough to break up the blobbiness; a third roughly
  // doubles generation cost for detail the eye doesn't separate.
  const wx = fbm3D(x + 5.2, y + 1.3, z + 9.1, seed + 11, 2) - 0.5
  const wy = fbm3D(x + 3.7, y + 8.4, z + 2.6, seed + 23, 2) - 0.5
  const wz = fbm3D(x + 7.9, y + 4.5, z + 6.2, seed + 37, 2) - 0.5
  return fbm3D(
    x + wx * strength * 2,
    y + wy * strength * 2,
    z + wz * strength * 2,
    seed,
    octaves,
  )
}

export function seedFromId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 9973
}

export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export { lerp }
