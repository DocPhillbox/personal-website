import * as THREE from 'three'

// Also used by planetTextures.js (createRingTexture) to align its radial bands.
export const RING_INNER_RATIO = 1.5
export const RING_OUTER_RATIO = 2.1

export function buildRingGeometry(data) {
  const inner = data.size * RING_INNER_RATIO
  const outer = data.size * RING_OUTER_RATIO
  return new THREE.RingGeometry(inner, outer, 64, 1)
}
