import * as THREE from 'three'
import { RING_INNER_RATIO, RING_OUTER_RATIO } from './planetSurface.js'
import { fbm3D, lerp, noise3D, ridged3D, seedFromId, smoothstep, warpedFbm3D } from './noise.js'

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

function makeCanvasTexture(width, height, paint, { srgb = false } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(width, height)
  paint(image.data, width, height)
  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 8
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function grayscaleTexture(width, height, data) {
  return makeCanvasTexture(width, height, (out) => {
    for (let i = 0; i < data.length; i++) {
      const g = Math.max(0, Math.min(1, data[i])) * 255
      out[i * 4] = g
      out[i * 4 + 1] = g
      out[i * 4 + 2] = g
      out[i * 4 + 3] = 255
    }
  })
}

/**
 * Tangent-space normal map from a height field.
 *
 * three's bumpMap path reconstructs slopes from screen-space derivatives, which
 * washes out almost entirely on a smooth height field; encoding the gradient
 * directly is what makes relief survive to the lit pixel. Strength is calibrated
 * so the 95th-percentile slope lands near 35 degrees — pronounced but never
 * clipping, which would read as harsh noise.
 */
function normalMapFromHeights(width, height, heights, strength) {
  return makeCanvasTexture(width, height, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const xl = (x - 1 + w) % w
        const xr = (x + 1) % w
        const yu = Math.max(0, y - 1)
        const yd = Math.min(h - 1, y + 1)

        // Equirectangular texels crowd together near the poles; damping the
        // horizontal gradient there stops the relief from turning to noise.
        const lat = Math.abs(y / h - 0.5) * 2
        const conv = Math.max(0.25, Math.sqrt(1 - lat * lat * 0.96))

        const dx = ((heights[y * w + xr] - heights[y * w + xl]) * strength) / conv
        const dy = (heights[yd * w + x] - heights[yu * w + x]) * strength

        let nx = -dx
        let ny = -dy
        let nz = 1
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
        nx /= len
        ny /= len
        nz /= len

        const i = (y * w + x) * 4
        out[i] = (nx * 0.5 + 0.5) * 255
        out[i + 1] = (ny * 0.5 + 0.5) * 255
        out[i + 2] = (nz * 0.5 + 0.5) * 255
        out[i + 3] = 255
      }
    }
  })
}

// --- Alien palettes -------------------------------------------------------
// Deliberately not Sol: turquoise seas with violet flora, and a sulphur-amber
// desert with lilac frost, so the system reads as somewhere unvisited.

const OCEAN_WORLD = {
  abyss: '#0a2743',
  ocean: '#0f4f77',
  shelf: '#17789a',
  shore: '#3ac2bd',
  wetland: '#5b3d88',
  drySoil: '#a9709f',
  highland: '#4a3a60',
  peak: '#cdd7ea',
  ice: '#e9f6ff',
}

const DESERT_WORLD = {
  basin: '#a85626',
  dune: '#e2ab52',
  midland: '#8e4046',
  highland: '#582a49',
  peak: '#2a1528',
  ice: '#e7dbe9',
}

const SEA_LEVEL = 0.5

const _dir = new THREE.Vector3()
const _pixel = new THREE.Color()
const _tmp = new THREE.Color()

function paletteToColors(palette) {
  const out = {}
  for (const key of Object.keys(palette)) out[key] = new THREE.Color(palette[key])
  return out
}

const OCEAN_COLORS = paletteToColors(OCEAN_WORLD)
const DESERT_COLORS = paletteToColors(DESERT_WORLD)

export function createTelluricMaps(data, width = 512, height = 256) {
  const seed = seedFromId(data.id)
  const isDesert = data.biome === 'desert'
  const c = isDesert ? DESERT_COLORS : OCEAN_COLORS

  const count = width * height
  const heights = new Float32Array(count)
  const roughData = new Float32Array(count)

  const map = makeCanvasTexture(
    width,
    height,
    (out, w, h) => {
      for (let y = 0; y < h; y++) {
        const v = y / h
        const lat = Math.abs(v - 0.5) * 2

        for (let x = 0; x < w; x++) {
          const u = x / w
          directionFromUV(u, v, _dir)

          // Domain-warped base field: this is what gives landmasses inlets and
          // peninsulas instead of circular blobs.
          const continent = warpedFbm3D(_dir.x * 1.7, _dir.y * 1.7, _dir.z * 1.7, seed, 1.5, 5)
          const ridges = ridged3D(_dir.x * 3.2, _dir.y * 3.2, _dir.z * 3.2, seed + 53, 4)
          const moisture = fbm3D(_dir.x * 2.6, _dir.y * 2.6, _dir.z * 2.6, seed + 31, 3)
          const grain = fbm3D(_dir.x * 17, _dir.y * 17, _dir.z * 17, seed + 61, 2)

          let elevation = continent
          let rough
          let bump

          if (isDesert) {
            // No sea: ridges everywhere, strongest in the uplands.
            elevation = continent * 0.72 + ridges * 0.28

            if (elevation < 0.44) {
              _pixel.copy(c.basin).lerp(_tmp.copy(c.dune), smoothstep(0.2, 0.44, elevation + (moisture - 0.5) * 0.2))
              rough = 0.9
            } else if (elevation < 0.62) {
              _pixel.copy(c.dune).lerp(_tmp.copy(c.midland), smoothstep(0.44, 0.62, elevation))
              rough = 0.92
            } else if (elevation < 0.78) {
              _pixel.copy(c.midland).lerp(_tmp.copy(c.highland), smoothstep(0.62, 0.78, elevation))
              rough = 0.95
            } else {
              _pixel.copy(c.highland).lerp(_tmp.copy(c.peak), smoothstep(0.78, 0.95, elevation))
              rough = 0.97
            }
            bump = elevation * 0.8 + grain * 0.2
          } else {
            // Mountains only rise on land, and only well inland, so coastlines
            // stay low and readable.
            if (elevation > SEA_LEVEL) {
              const landT = (elevation - SEA_LEVEL) / (1 - SEA_LEVEL)
              elevation += ridges * 0.34 * smoothstep(0, 0.45, landT)
            }

            if (elevation < SEA_LEVEL - 0.13) {
              _pixel.copy(c.abyss).lerp(_tmp.copy(c.ocean), smoothstep(0.16, SEA_LEVEL - 0.13, elevation))
              rough = 0.38
            } else if (elevation < SEA_LEVEL - 0.02) {
              _pixel.copy(c.ocean).lerp(_tmp.copy(c.shelf), smoothstep(SEA_LEVEL - 0.13, SEA_LEVEL - 0.02, elevation))
              rough = 0.42
            } else if (elevation < SEA_LEVEL) {
              _pixel.copy(c.shelf).lerp(_tmp.copy(c.shore), smoothstep(SEA_LEVEL - 0.02, SEA_LEVEL, elevation))
              rough = 0.46
            } else if (elevation < 0.72) {
              _pixel.copy(c.wetland).lerp(_tmp.copy(c.drySoil), 1 - smoothstep(0.3, 0.7, moisture))
              _pixel.offsetHSL(0, 0, (grain - 0.5) * 0.06)
              rough = 0.9
            } else if (elevation < 0.86) {
              _pixel.copy(c.drySoil).lerp(_tmp.copy(c.highland), smoothstep(0.72, 0.86, elevation))
              rough = 0.94
            } else {
              _pixel.copy(c.highland).lerp(_tmp.copy(c.peak), smoothstep(0.86, 0.98, elevation))
              rough = 0.9
            }

            // Flat water: keep the height field level below the shoreline so the
            // normal map doesn't emboss ripples onto the sea.
            bump = elevation < SEA_LEVEL ? SEA_LEVEL : elevation * 0.82 + grain * 0.18
          }

          // Ice caps, with a wobbling edge rather than a latitude line.
          const capNoise = noise3D(_dir.x * 4, _dir.y * 4, _dir.z * 4, seed + 87) * 0.09
          const capStart = isDesert ? 0.93 : 0.84
          if (lat + capNoise > capStart) {
            const capT = smoothstep(capStart, capStart + 0.13, lat + capNoise)
            _pixel.lerp(_tmp.copy(c.ice), capT * (isDesert ? 0.7 : 0.95))
            rough = lerp(rough, 0.82, capT)
            bump = lerp(bump, bump + 0.04, capT)
          }

          const i = (y * w + x) * 4
          out[i] = _pixel.r * 255
          out[i + 1] = _pixel.g * 255
          out[i + 2] = _pixel.b * 255
          out[i + 3] = 255
          roughData[y * w + x] = rough
          heights[y * w + x] = bump
        }
      }
    },
    { srgb: true },
  )

  return {
    map,
    roughnessMap: grayscaleTexture(width, height, roughData),
    // Recalibrated for gradient noise, whose height field is far sharper than
    // the value noise this replaced; the old strengths pushed slopes past 70deg.
    normalMap: normalMapFromHeights(width, height, heights, isDesert ? 9 : 7.5),
  }
}

/**
 * Cloud deck for the ocean world, rendered on its own slightly larger shell.
 * A real weather layer casting its own silhouette is the single biggest step
 * from "textured ball" to "planet".
 */
export function createCloudTexture(data, width = 384, height = 192) {
  const seed = seedFromId(data.id) + 404

  return makeCanvasTexture(
    width,
    height,
    (out, w, h) => {
      for (let y = 0; y < h; y++) {
        const v = y / h
        const lat = Math.abs(v - 0.5) * 2
        for (let x = 0; x < w; x++) {
          const u = x / w
          directionFromUV(u, v, _dir)

          // Stretched horizontally so banding reads as circulation, not blobs.
          const base = warpedFbm3D(_dir.x * 2.4, _dir.y * 4.2, _dir.z * 2.4, seed, 1.8, 5)
          const wisps = fbm3D(_dir.x * 7, _dir.y * 11, _dir.z * 7, seed + 19, 3)

          let density = smoothstep(0.48, 0.74, base * 0.75 + wisps * 0.25)
          // Thin the deck at the equator and poles, as circulation cells do.
          density *= 0.55 + 0.45 * Math.sin(lat * Math.PI * 1.6 + 0.6) ** 2

          const i = (y * w + x) * 4
          out[i] = 255
          out[i + 1] = 255
          out[i + 2] = 255
          out[i + 3] = Math.max(0, Math.min(1, density)) * 235
        }
      }
    },
    { srgb: true },
  )
}

export function createGasGiantTexture(data, width = 768, height = 384) {
  const seed = seedFromId(data.id)
  const base = new THREE.Color(data.color)
  const band = new THREE.Color(data.bandColor || data.color)
  const deep = base.clone().offsetHSL(0.02, 0.08, -0.2)
  const pale = band.clone().offsetHSL(-0.01, -0.05, 0.1)

  const spot = new THREE.Vector3(
    Math.cos(seed * 0.7) * 0.55,
    Math.sin(seed * 1.3) * 0.3,
    Math.sin(seed * 0.7) * 0.55,
  ).normalize()

  return makeCanvasTexture(
    width,
    height,
    (out, w, h) => {
      for (let y = 0; y < h; y++) {
        const v = y / h
        for (let x = 0; x < w; x++) {
          const u = x / w
          directionFromUV(u, v, _dir)

          // Turbulence displaces the band boundaries so they meander and curl
          // instead of running as clean latitude lines.
          const turb = fbm3D(_dir.x * 2.2, _dir.y * 1.4, _dir.z * 2.2, seed + 7, 4) - 0.5
          const fine = fbm3D(_dir.x * 6, _dir.y * 9, _dir.z * 6, seed + 23, 3) - 0.5

          const latitude = v * 2 - 1 + turb * 0.42 + fine * 0.08
          let t = Math.sin(latitude * Math.PI * 3.1) * 0.5 + 0.5
          t = smoothstep(0.12, 0.88, t)

          _pixel.copy(deep).lerp(_tmp.copy(base), smoothstep(0, 0.55, t))
          if (t > 0.5) _pixel.lerp(_tmp.copy(band), smoothstep(0.5, 1, t))
          if (t > 0.82) _pixel.lerp(_tmp.copy(pale), smoothstep(0.82, 1, t) * 0.7)

          // Filament detail along the shear lines.
          const filament = ridged3D(_dir.x * 5, _dir.y * 14, _dir.z * 5, seed + 41, 3)
          _pixel.offsetHSL(0, 0, (filament - 0.5) * 0.1)

          // The great storm.
          const d = _dir.distanceTo(spot)
          if (d < 0.36) {
            const s = smoothstep(0.36, 0.05, d)
            _pixel.lerp(_tmp.copy(base).offsetHSL(0.04, 0.22, -0.12), s * 0.85)
            const swirl = ridged3D(_dir.x * 9, _dir.y * 9, _dir.z * 9, seed + 71, 3)
            _pixel.offsetHSL(0, 0, (swirl - 0.5) * 0.16 * s)
          }

          const i = (y * w + x) * 4
          out[i] = _pixel.r * 255
          out[i + 1] = _pixel.g * 255
          out[i + 2] = _pixel.b * 255
          out[i + 3] = 255
        }
      }
    },
    { srgb: true },
  )
}

export function createSunTexture(width = 640, height = 320) {
  const seed = 4242
  const core = new THREE.Color('#fff6e2')
  const mid = new THREE.Color('#ffc271')
  const hot = new THREE.Color('#ff8a4a')
  const spot = new THREE.Color('#c9541f')

  return makeCanvasTexture(
    width,
    height,
    (out, w, h) => {
      for (let y = 0; y < h; y++) {
        const v = y / h
        for (let x = 0; x < w; x++) {
          const u = x / w
          directionFromUV(u, v, _dir)

          // Supergranulation cells over fine granulation.
          const cells = ridged3D(_dir.x * 5, _dir.y * 5, _dir.z * 5, seed, 4)
          const fine = fbm3D(_dir.x * 16, _dir.y * 16, _dir.z * 16, seed + 11, 3)
          const n = cells * 0.62 + fine * 0.38

          _pixel.copy(core).lerp(_tmp.copy(mid), smoothstep(0.25, 0.72, n))
          if (n > 0.6) _pixel.lerp(_tmp.copy(hot), smoothstep(0.6, 0.95, n))

          // Occasional cooler patches so the disc isn't uniform.
          const patch = fbm3D(_dir.x * 2.1, _dir.y * 2.1, _dir.z * 2.1, seed + 57, 3)
          if (patch < 0.34) _pixel.lerp(_tmp.copy(spot), smoothstep(0.34, 0.16, patch) * 0.55)

          const i = (y * w + x) * 4
          out[i] = _pixel.r * 255
          out[i + 1] = _pixel.g * 255
          out[i + 2] = _pixel.b * 255
          out[i + 3] = 255
        }
      }
    },
    { srgb: true },
  )
}

const RING_INNER_NORM = RING_INNER_RATIO / RING_OUTER_RATIO

export function createRingTexture(data, size = 512) {
  const seed = seedFromId(data.id)
  const base = new THREE.Color(data.bandColor || data.color)
  const palette = [
    base.clone().offsetHSL(0, 0.05, -0.36),
    base.clone().offsetHSL(0, 0, -0.14),
    base.clone().offsetHSL(-0.02, -0.05, -0.02),
    base.clone().offsetHSL(0.03, -0.25, 0.04),
    base.clone().offsetHSL(0.05, 0.1, -0.24),
  ]

  const bandFreq = 15 + (seed % 5) * 3
  const bandPhase = ((seed % 100) / 100) * Math.PI * 2
  const gapFreq = 5 + (seed % 3)
  const gapPhase = (((seed >> 3) % 100) / 100) * Math.PI * 2

  return makeCanvasTexture(
    size,
    size,
    (out, w, h) => {
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
          _pixel.offsetHSL(0, 0, (grain - 0.5) * 0.15)

          const gapWave = smoothstep(0, 1, Math.sin(rn * gapFreq * Math.PI * 2 + gapPhase) * 0.5 + 0.5)
          let alpha = 0.22 + gapWave * 0.45

          const edgeFade = Math.min(
            smoothstep(0, 1, (r - RING_INNER_NORM) / 0.025),
            smoothstep(0, 1, (1 - r) / 0.035),
          )
          alpha *= edgeFade

          out[i] = _pixel.r * 255
          out[i + 1] = _pixel.g * 255
          out[i + 2] = _pixel.b * 255
          out[i + 3] = Math.max(0, Math.min(1, alpha)) * 255
        }
      }
    },
    { srgb: true },
  )
}

const MOON_CRATER_COUNT = 14

export function createMoonTexture(data, width = 256, height = 128) {
  const seed = seedFromId(data.id)
  const rock = new THREE.Color(data.color || '#9c958c')
  const rockLight = rock.clone().offsetHSL(0, 0, 0.14)
  const rockDark = rock.clone().offsetHSL(0, 0, -0.18)

  const craters = []
  for (let i = 0; i < MOON_CRATER_COUNT; i++) {
    const a = noise3D(i * 3.1, 0.5, 1.7, seed) * 0.5 + 0.5
    const b = noise3D(i * 1.9, 2.3, 0.4, seed + 5) * 0.5 + 0.5
    const theta = a * Math.PI
    const phi = b * Math.PI * 2
    const sinTheta = Math.sin(theta)
    craters.push({
      dir: new THREE.Vector3(Math.cos(phi) * sinTheta, Math.cos(theta), Math.sin(phi) * sinTheta),
      radius: 0.07 + (noise3D(i * 0.7, 4.1, 2.2, seed + 9) * 0.5 + 0.5) * 0.15,
    })
  }

  const heights = new Float32Array(width * height)

  const map = makeCanvasTexture(
    width,
    height,
    (out, w, h) => {
      for (let y = 0; y < h; y++) {
        const v = y / h
        for (let x = 0; x < w; x++) {
          const u = x / w
          directionFromUV(u, v, _dir)

          const regolith = fbm3D(_dir.x * 5, _dir.y * 5, _dir.z * 5, seed, 4)
          _pixel.copy(rockDark).lerp(_tmp.copy(rockLight), smoothstep(0.25, 0.78, regolith))
          let elev = regolith * 0.5 + 0.25

          for (let ci = 0; ci < craters.length; ci++) {
            const crater = craters[ci]
            const d = _dir.distanceTo(crater.dir)
            if (d < crater.radius) {
              const t = d / crater.radius
              const floor = smoothstep(0, 1, 1 - t / 0.72) * 0.24
              const rim = t > 0.74 ? smoothstep(0, 1, (t - 0.74) / 0.26) * 0.16 : 0
              _pixel.offsetHSL(0, 0, rim - floor)
              elev += rim - floor
            }
          }

          const i = (y * w + x) * 4
          out[i] = _pixel.r * 255
          out[i + 1] = _pixel.g * 255
          out[i + 2] = _pixel.b * 255
          out[i + 3] = 255
          heights[y * w + x] = elev
        }
      }
    },
    { srgb: true },
  )

  return { map, normalMap: normalMapFromHeights(width, height, heights, 11) }
}

/**
 * Cloudy nebula patch, white so it can be tinted per instance.
 *
 * A plain radial gradient betrays the sprite's square/circular boundary once
 * it is this large on screen; driving alpha with fbm and killing it well before
 * the edge is what keeps the patch shapeless.
 */
// 160px is ample: the content is entirely low-frequency and gets magnified to
// ~90 world units, so a larger map costs load time for detail nobody can see.
export function createNebulaTexture(seed, size = 160) {
  return makeCanvasTexture(size, size, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const ny = (y / h) * 2 - 1
      for (let x = 0; x < w; x++) {
        const nx = (x / w) * 2 - 1
        const i = (y * w + x) * 4
        const r = Math.hypot(nx, ny)

        if (r >= 1) {
          out[i + 3] = 0
          continue
        }

        const billow = fbm3D(nx * 2.1, ny * 2.1, seed * 0.13, seed, 4)
        const strands = ridged3D(nx * 3.6, ny * 3.6, seed * 0.27, seed + 17, 2)

        let alpha = smoothstep(0.4, 0.86, billow * 0.62 + strands * 0.38)
        alpha *= Math.pow(1 - r, 1.9)

        out[i] = 255
        out[i + 1] = 255
        out[i + 2] = 255
        out[i + 3] = Math.max(0, Math.min(1, alpha)) * 255
      }
    }
  })
}

/**
 * Radial glow.
 *
 * Built per pixel rather than with canvas gradient stops: every stop is a break
 * in the slope, and once the sprite is blown up to tens of world units those
 * breaks read as hard concentric rings. A single continuous falloff has no such
 * discontinuity. `spread` maps to the exponent — larger is more diffuse.
 *
 * The dither matters too. Across a large, very faint gradient, 8-bit alpha
 * quantisation lands as visible contour rings; a sub-step of noise scatters the
 * rounding so the steps dissolve.
 */
export function createGlowTexture({ size = 256, peakAlpha = 0.9, spread = 0.35 } = {}) {
  const falloff = Math.max(0.6, 1 / Math.max(0.05, spread))

  return makeCanvasTexture(size, size, (out, w, h) => {
    for (let y = 0; y < h; y++) {
      const ny = (y + 0.5) / h * 2 - 1
      for (let x = 0; x < w; x++) {
        const nx = (x + 0.5) / w * 2 - 1
        const i = (y * w + x) * 4
        const r = Math.hypot(nx, ny)

        out[i] = 255
        out[i + 1] = 255
        out[i + 2] = 255

        if (r >= 1) {
          out[i + 3] = 0
          continue
        }

        const alpha = peakAlpha * Math.pow(1 - r, falloff)
        out[i + 3] = Math.max(0, Math.min(255, alpha * 255 + (Math.random() - 0.5)))
      }
    }
  })
}
