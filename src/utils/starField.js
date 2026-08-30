import * as THREE from 'three'

function mulberry32(seed) {
  return function random() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Real star colours cluster around white with blue and amber outliers.
const TINTS = ['#ffffff', '#ffffff', '#ffffff', '#d8e6ff', '#c2d8ff', '#fff1da', '#ffd9b4', '#e8d8ff']

// Three size buckets rather than one uniform size: PointsMaterial cannot vary
// size per point, and the mix of faint and bright stars is what gives depth.
export const STAR_BUCKETS = [
  { share: 0.72, size: 0.36, opacity: 0.75 },
  { share: 0.22, size: 0.62, opacity: 0.9 },
  { share: 0.06, size: 1.05, opacity: 1 },
]

function toGeometry(positions, colors) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return geometry
}

/**
 * Purely random placement on a sphere clumps, leaving bare patches. A Fibonacci
 * lattice covers evenly but reads as an artificial grid, so each point is
 * jittered by roughly its own spacing: even coverage, organic scatter.
 */
export function buildStars(count, innerRadius, outerRadius, seed) {
  const random = mulberry32(seed)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const jitter = 1.9 / Math.sqrt(count)

  const buckets = STAR_BUCKETS.map(() => ({ positions: [], colors: [] }))
  const colour = new THREE.Color()
  const dir = new THREE.Vector3()

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const y = 1 - 2 * t
    const rxy = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i

    dir.set(Math.cos(theta) * rxy, y, Math.sin(theta) * rxy)
    dir.x += (random() * 2 - 1) * jitter
    dir.y += (random() * 2 - 1) * jitter
    dir.z += (random() * 2 - 1) * jitter
    dir.normalize()

    const radius = innerRadius + random() * (outerRadius - innerRadius)

    let roll = random()
    let bucket = 0
    for (let b = 0; b < STAR_BUCKETS.length; b++) {
      bucket = b
      if (roll < STAR_BUCKETS[b].share) break
      roll -= STAR_BUCKETS[b].share
    }

    colour.set(TINTS[Math.floor(random() * TINTS.length)])
    // Vary brightness so the field has faint depth rather than uniform dots.
    colour.multiplyScalar(0.45 + random() * 0.55)

    buckets[bucket].positions.push(dir.x * radius, dir.y * radius, dir.z * radius)
    buckets[bucket].colors.push(colour.r, colour.g, colour.b)
  }

  return buckets.map((b) => toGeometry(b.positions, b.colors))
}

/**
 * A galactic plane: stars crowded toward one great circle instead of spread
 * evenly. Sampling a gaussian offset from the band plane, rather than a hard
 * cutoff, is what makes the edges dissolve into the surrounding field.
 */
export function buildBandStars(count, innerRadius, outerRadius, seed) {
  const random = mulberry32(seed)
  const positions = []
  const colors = []
  const colour = new THREE.Color()

  // Tilt so the band cuts the view diagonally rather than sitting on the
  // ecliptic, where it would line up with the orbits.
  const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.62, 0.9, 0.24))
  const dir = new THREE.Vector3()

  for (let i = 0; i < count; i++) {
    const azimuth = random() * Math.PI * 2
    // Box–Muller, so density falls off smoothly away from the plane.
    const g = Math.sqrt(-2 * Math.log(Math.max(1e-6, random()))) * Math.cos(2 * Math.PI * random())
    const latitude = g * 0.17

    const cosLat = Math.cos(latitude)
    dir.set(Math.cos(azimuth) * cosLat, Math.sin(latitude), Math.sin(azimuth) * cosLat)
    dir.applyMatrix4(rotation)

    const radius = innerRadius + random() * (outerRadius - innerRadius)

    colour.set(TINTS[Math.floor(random() * TINTS.length)])
    colour.multiplyScalar(0.3 + random() * 0.4)

    positions.push(dir.x * radius, dir.y * radius, dir.z * radius)
    colors.push(colour.r, colour.g, colour.b)
  }

  return toGeometry(positions, colors)
}
