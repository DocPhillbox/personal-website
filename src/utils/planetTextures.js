import * as THREE from 'three'
import { RING_INNER_RATIO, RING_OUTER_RATIO } from './planetSurface.js'

function hashLattice(ix, iy, iz, seed) {
  let h = ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1013904223
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return ((h >>> 0) % 100000) / 100000
}

function smoothstep(t) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return c * c * (3 - 2 * c)
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

function fbm3D(x, y, z, seed, octaves = 4) {
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

// Direction vector matching three.js's SphereGeometry equirectangular UV layout.
function directionFromUV(u, v, out) {
  const phi = u * Math.PI * 2
  const theta = v * Math.PI
  const sinTheta = Math.sin(theta)
  out.x = -Math.cos(phi) * sinTheta
  out.y = Math.cos(theta)
  out.z = Math.sin(phi) * sinTheta
  return out
}

function makeCanvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(width, height)
  paint(image.data, width, height)
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

const _dir = new THREE.Vector3()
const _base = new THREE.Color()
const _pixel = new THREE.Color()
const _band = new THREE.Color()
const _tmp = new THREE.Color()
const _spot = new THREE.Vector3()

const OCEAN_PALETTE = {
  deepOcean: '#0f4c81',
  shallowOcean: '#2f9fd0',
  lowland: '#3fa14a',
  dryland: '#d9b35f',
  highland: '#8a6239',
  pole: '#f4f9ff',
}

const DESERT_PALETTE = {
  plains: '#c14e1d',
  dune: '#e2812f',
  highland: '#8a3418',
  peak: '#4a1c0e',
  pole: '#f0e6da',
}

export function createTelluricMaps(data, width = 512, height = 256) {
  const seed = seedFromId(data.id)
  const isDesert = data.biome === 'desert'
  const p = isDesert ? DESERT_PALETTE : OCEAN_PALETTE

  const roughData = new Float32Array(width * height)

  const map = makeCanvasTexture(width, height, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = y / h
      for (let x = 0; x < w; x++) {
        const u = x / w
        directionFromUV(u, v, _dir)
        const elevation = fbm3D(_dir.x * 2.2, _dir.y * 2.2, _dir.z * 2.2, seed, 4)
        const detail = fbm3D(_dir.x * 3.3, _dir.y * 3.3, _dir.z * 3.3, seed + 31, 3)

        let rough
        if (isDesert) {
          if (elevation < 0.5) {
            _pixel.set(p.plains).lerp(_tmp.set(p.dune), smoothstep(detail))
            rough = 0.75
          } else if (elevation < 0.78) {
            _pixel.set(p.dune).lerp(_tmp.set(p.highland), smoothstep((elevation - 0.5) / 0.28))
            rough = 0.85
          } else {
            _pixel.set(p.highland).lerp(_tmp.set(p.peak), smoothstep((elevation - 0.78) / 0.22))
            rough = 0.95
          }
        } else if (elevation < 0.42) {
          _pixel.set(p.deepOcean).lerp(_tmp.set(p.shallowOcean), smoothstep(elevation / 0.42))
          rough = 0.12
        } else if (elevation < 0.48) {
          _pixel.set(p.shallowOcean)
          rough = 0.2
        } else if (elevation < 0.74) {
          _pixel.set(p.lowland).lerp(_tmp.set(p.dryland), 1 - smoothstep(detail))
          rough = 0.8
        } else if (elevation < 0.87) {
          _pixel.set(p.highland).offsetHSL(0, 0, (elevation - 0.74) * 0.4)
          rough = 0.92
        } else {
          _pixel.set(p.pole)
          rough = 0.7
        }

        const lat = Math.abs(v - 0.5) * 2
        const capThreshold = isDesert ? 0.92 : 0.82
        if (lat > capThreshold) {
          const capT = smoothstep((lat - capThreshold) / (1 - capThreshold))
          _pixel.lerp(_tmp.set(p.pole), capT * (isDesert ? 0.65 : 0.9))
          rough = lerp(rough, 0.75, capT)
        }

        const i = (y * w + x) * 4
        out[i] = _pixel.r * 255
        out[i + 1] = _pixel.g * 255
        out[i + 2] = _pixel.b * 255
        out[i + 3] = 255
        roughData[y * w + x] = rough
      }
    }
  })
  map.colorSpace = THREE.SRGBColorSpace

  const roughnessMap = makeCanvasTexture(width, height, (out) => {
    for (let i = 0; i < roughData.length; i++) {
      const g = roughData[i] * 255
      out[i * 4] = g
      out[i * 4 + 1] = g
      out[i * 4 + 2] = g
      out[i * 4 + 3] = 255
    }
  })

  return { map, roughnessMap }
}

export function createGasGiantTexture(data, width = 512, height = 256) {
  const seed = seedFromId(data.id)
  _base.set(data.color)
  _band.set(data.bandColor || data.color)
  _spot.set(Math.cos(seed * 0.7) * 0.55, Math.sin(seed * 1.3) * 0.3, Math.sin(seed * 0.7) * 0.55).normalize()

  const texture = makeCanvasTexture(width, height, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = y / h
      for (let x = 0; x < w; x++) {
        const u = x / w
        directionFromUV(u, v, _dir)

        const wobble = fbm3D(_dir.x * 1.8, _dir.z * 1.8, seed * 0.01 + _dir.y * 0.5, seed, 3) * 0.4
        let t = (Math.sin((v * 2 - 1 + wobble) * Math.PI * 3.2) + 1) / 2
        t = smoothstep(t)
        _pixel.copy(_base).lerp(_band, t)

        const turb = fbm3D(_dir.x * 5, _dir.y * 5, _dir.z * 5, seed + 50, 3)
        _pixel.offsetHSL(0, 0, (turb - 0.5) * 0.12)

        const d = _dir.distanceTo(_spot)
        if (d < 0.34) {
          const s = smoothstep(1 - d / 0.34)
          _pixel.offsetHSL(0.02, 0.15, -0.1 * s)
        }

        const i = (y * w + x) * 4
        out[i] = _pixel.r * 255
        out[i + 1] = _pixel.g * 255
        out[i + 2] = _pixel.b * 255
        out[i + 3] = 255
      }
    }
  })
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const RING_INNER_NORM = RING_INNER_RATIO / RING_OUTER_RATIO

export function createRingTexture(data, size = 1024) {
  const seed = seedFromId(data.id)
  const base = new THREE.Color(data.bandColor || data.color)
  const palette = [
    base.clone().offsetHSL(0, 0.05, -0.36),
    base.clone().offsetHSL(0, 0, -0.14),
    base.clone().offsetHSL(-0.02, -0.05, -0.02),
    base.clone().offsetHSL(0.03, -0.25, 0.04),
    base.clone().offsetHSL(0.05, 0.1, -0.24),
  ]

  // Continuous (sine-sum) radial banding instead of hard cutoffs, so the
  // circular bands stay smooth at any zoom level instead of rasterizing
  // into stair-stepped edges.
  const bandFreq = 15 + (seed % 5) * 3
  const bandPhase = ((seed % 100) / 100) * Math.PI * 2
  const gapFreq = 5 + (seed % 3)
  const gapPhase = (((seed >> 3) % 100) / 100) * Math.PI * 2

  const texture = makeCanvasTexture(size, size, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const ny = (y / h) * 2 - 1
      for (let x = 0; x < w; x++) {
        const nx = (x / w) * 2 - 1
        const i = (y * w + x) * 4
        const r = Math.sqrt(nx * nx + ny * ny)

        if (r < RING_INNER_NORM - 0.02 || r > 1.02) {
          out[i + 3] = 0
          continue
        }

        const rn = (r - RING_INNER_NORM) / (1 - RING_INNER_NORM)

        let bandT =
          Math.sin(rn * bandFreq + bandPhase) * 0.5 +
          Math.sin(rn * bandFreq * 1.7 + bandPhase * 1.3) * 0.3 +
          Math.sin(rn * bandFreq * 0.5 + bandPhase * 0.6) * 0.2
        bandT = (bandT + 1) / 2

        const paletteF = bandT * (palette.length - 1)
        const p0 = Math.floor(paletteF)
        const p1 = Math.min(palette.length - 1, p0 + 1)
        _pixel.copy(palette[p0]).lerp(palette[p1], paletteF - p0)

        const angle = Math.atan2(ny, nx)
        const grain = fbm3D(Math.cos(angle) * 3 + r * 6, Math.sin(angle) * 3 + r * 6, r * 10, seed, 2)
        _pixel.offsetHSL(0, 0, (grain - 0.5) * 0.08)

        const gapWave = smoothstep(Math.sin(rn * gapFreq * Math.PI * 2 + gapPhase) * 0.5 + 0.5)
        let alpha = 0.22 + gapWave * 0.45

        const edgeFade = Math.min(smoothstep((r - RING_INNER_NORM) / 0.025), smoothstep((1 - r) / 0.035))
        alpha *= edgeFade

        out[i] = _pixel.r * 255
        out[i + 1] = _pixel.g * 255
        out[i + 2] = _pixel.b * 255
        out[i + 3] = Math.max(0, Math.min(1, alpha)) * 255
      }
    }
  })
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createSunTexture(width = 640, height = 320) {
  const seed = 4242
  const core = new THREE.Color('#fff3c4')
  const mid = new THREE.Color('#ffb347')
  const hot = new THREE.Color('#ff7a3d')

  const texture = makeCanvasTexture(width, height, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = y / h
      for (let x = 0; x < w; x++) {
        const u = x / w
        directionFromUV(u, v, _dir)

        const n1 = fbm3D(_dir.x * 3, _dir.y * 3, _dir.z * 3, seed, 4)
        const n2 = fbm3D(_dir.x * 10, _dir.y * 10, _dir.z * 10, seed + 11, 3)
        const n = n1 * 0.7 + n2 * 0.3

        _pixel.copy(core).lerp(mid, smoothstep(n))
        if (n > 0.55) _pixel.lerp(hot, (n - 0.55) * 1.4)

        const i = (y * w + x) * 4
        out[i] = _pixel.r * 255
        out[i + 1] = _pixel.g * 255
        out[i + 2] = _pixel.b * 255
        out[i + 3] = 255
      }
    }
  })
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const MOON_CRATER_COUNT = 9

export function createMoonTexture(data, width = 256, height = 128) {
  const seed = seedFromId(data.id)
  const rock = new THREE.Color(data.color || '#9c958c')
  const rockLight = rock.clone().offsetHSL(0, 0, 0.12)
  const rockDark = rock.clone().offsetHSL(0, 0, -0.16)

  const craters = []
  for (let i = 0; i < MOON_CRATER_COUNT; i++) {
    const theta = hashLattice(i, 0, 0, seed) * Math.PI
    const phi = hashLattice(i, 1, 0, seed) * Math.PI * 2
    const sinTheta = Math.sin(theta)
    craters.push({
      dir: new THREE.Vector3(Math.cos(phi) * sinTheta, Math.cos(theta), Math.sin(phi) * sinTheta),
      radius: 0.09 + hashLattice(i, 2, 0, seed) * 0.16,
    })
  }

  const texture = makeCanvasTexture(width, height, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = y / h
      for (let x = 0; x < w; x++) {
        const u = x / w
        directionFromUV(u, v, _dir)
        const n = fbm3D(_dir.x * 4, _dir.y * 4, _dir.z * 4, seed, 3)

        _pixel.copy(rockDark).lerp(rockLight, smoothstep(n))

        for (let c = 0; c < craters.length; c++) {
          const crater = craters[c]
          const d = _dir.distanceTo(crater.dir)
          if (d < crater.radius) {
            const t = d / crater.radius
            const floor = smoothstep(1 - t / 0.7) * 0.22
            const rim = t > 0.78 ? smoothstep((t - 0.78) / 0.22) * 0.14 : 0
            _pixel.offsetHSL(0, 0, rim - floor)
          }
        }

        const i = (y * w + x) * 4
        out[i] = _pixel.r * 255
        out[i + 1] = _pixel.g * 255
        out[i + 2] = _pixel.b * 255
        out[i + 3] = 255
      }
    }
  })
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createGlowTexture({ size = 256, peakAlpha = 0.9, spread = 0.35 } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, `rgba(255, 255, 255, ${peakAlpha})`)
  gradient.addColorStop(spread * 0.4, `rgba(255, 255, 255, ${peakAlpha * 0.5})`)
  gradient.addColorStop(spread, `rgba(255, 255, 255, ${peakAlpha * 0.18})`)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}
