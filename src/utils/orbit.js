import * as THREE from 'three'

// Single source of truth for orbital placement. The planets and the camera rig
// both derive positions from this, so the camera can track a planet analytically
// without depending on which component's frame callback ran first.
export function orbitPositionAt(data, time, out = new THREE.Vector3()) {
  const angle = data.phase + time * data.speed
  return out.set(Math.cos(angle) * data.orbitRadius, 0, Math.sin(angle) * data.orbitRadius)
}
