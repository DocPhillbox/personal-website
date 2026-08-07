import * as THREE from 'three'

function hashLattice(ix, iy, iz, seed) {
  let h = ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1013904223
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return ((h >>> 0) % 100000) / 100000
}

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function valueNoise3D(x, y, z, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z)
  const x1 = x0 + 1, y1 = y0 + 1, z1 = z0 + 1
  const sx = smoothstep(x - x0), sy = smoothstep(y - y0), sz = smoothstep(z - z0)

  const c000 = hashLattice(x0, y0, z0, seed)
  const c100 = hashLattice(x1, y0, z0, seed)
  const c010 = hashLattice(x0, y1, z0, seed)
  const c110 = hashLattice(x1, y1, z0, seed)
  const c001 = hashLattice(x0, y0, z1, seed)
  const c101 = hashLattice(x1, y0, z1, seed)
  const c011 = hashLattice(x0, y1, z1, seed)
  const c111 = hashLattice(x1, y1, z1, seed)

  const x00 = lerp(c000, c100, sx)
  const x10 = lerp(c010, c110, sx)
  const x01 = lerp(c001, c101, sx)
  const x11 = lerp(c011, c111, sx)
  const y0i = lerp(x00, x10, sy)
  const y1i = lerp(x01, x11, sy)
  return lerp(y0i, y1i, sz)
}

function fbm3D(x, y, z, seed, octaves = 3) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3D(x * freq, y * freq, z * freq, seed + i * 97)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

function seedFromId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 9973
}

const _color = new THREE.Color()
const _land = new THREE.Color()
const _deep = new THREE.Color()
const _band = new THREE.Color()

function telluricFaceColor(dir, seed, baseHex) {
  _color.set(baseHex)
  const n = fbm3D(dir.x * 2.4, dir.y * 2.4, dir.z * 2.4, seed, 3)

  _land.copy(_color).offsetHSL(0, 0.05, 0.14)
  _deep.copy(_color).offsetHSL(0, 0.08, -0.18)

  let out
  if (n > 0.56) out = _land
  else if (n < 0.4) out = _deep
  else out = _color

  const crater = hashLattice(
    Math.round(dir.x * 60),
    Math.round(dir.y * 60),
    Math.round(dir.z * 60),
    seed + 7,
  )
  if (crater > 0.986) {
    return out.clone().offsetHSL(0, 0, -0.22)
  }
  return out
}

function gasFaceColor(dir, seed, baseHex, bandHex) {
  const wobble = fbm3D(dir.x * 1.6, dir.z * 1.6, seed * 0.01, seed, 2) * 0.35
  const bandFreq = 5.5
  let t = (Math.sin((dir.y + wobble) * bandFreq) + 1) / 2
  t = smoothstep(t)

  _color.set(baseHex)
  _band.set(bandHex || baseHex)
  const out = _color.clone().lerp(_band, t)

  const spot = new THREE.Vector3(
    Math.cos(seed * 0.7) * 0.6,
    Math.sin(seed * 1.3) * 0.35,
    Math.sin(seed * 0.7) * 0.6,
  ).normalize()
  const d = dir.distanceTo(spot)
  if (d < 0.32) {
    const s = smoothstep(1 - d / 0.32)
    out.offsetHSL(0.02, 0.1, -0.08 * s)
  }

  return out
}

export function buildPlanetGeometry(data) {
  const detail = data.type === 'gas' ? 3 : 2
  const geometry = new THREE.IcosahedronGeometry(data.size, detail).toNonIndexed()
  const pos = geometry.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const seed = seedFromId(data.id)

  const oblate = data.type === 'gas' ? 0.86 : 1
  if (oblate !== 1) {
    for (let i = 0; i < pos.count; i++) {
      geometry.attributes.position.setY(i, pos.getY(i) * oblate)
    }
    pos.needsUpdate = true
  }

  const dir = new THREE.Vector3()
  const centroid = new THREE.Vector3()

  for (let f = 0; f < pos.count; f += 3) {
    centroid.set(0, 0, 0)
    for (let v = 0; v < 3; v++) {
      dir.fromBufferAttribute(pos, f + v)
      centroid.add(dir)
    }
    centroid.divideScalar(3).normalize()

    const c =
      data.type === 'gas'
        ? gasFaceColor(centroid, seed, data.color, data.bandColor)
        : telluricFaceColor(centroid, seed, data.color)

    for (let v = 0; v < 3; v++) {
      colors[(f + v) * 3] = c.r
      colors[(f + v) * 3 + 1] = c.g
      colors[(f + v) * 3 + 2] = c.b
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

export function buildRingGeometry(data) {
  const inner = data.size * 1.5
  const outer = data.size * 2.1
  return new THREE.RingGeometry(inner, outer, 64, 1)
}
