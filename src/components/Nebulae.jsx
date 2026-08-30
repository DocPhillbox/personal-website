import { useMemo } from 'react'
import { AdditiveBlending } from 'three'
import { createNebulaTexture } from '../utils/planetTextures.js'

// Deliberately few, large, and very faint. These exist to stop the background
// reading as flat black, not to be looked at — anything above ~0.16 opacity
// starts competing with the planets.
const PATCHES = [
  { seed: 3, position: [-52, 18, -62], scale: 92, color: '#6d4dd6', opacity: 0.15 },
  { seed: 11, position: [64, -14, -48], scale: 78, color: '#1f7d9c', opacity: 0.12 },
  { seed: 27, position: [10, 34, 70], scale: 86, color: '#b2478f', opacity: 0.09 },
  { seed: 41, position: [-38, -30, 58], scale: 70, color: '#2f6fd0', opacity: 0.1 },
]

export default function Nebulae() {
  const textures = useMemo(() => PATCHES.map((p) => createNebulaTexture(p.seed)), [])

  return (
    <group>
      {PATCHES.map((patch, i) => (
        <sprite key={patch.seed} position={patch.position} scale={[patch.scale, patch.scale, 1]} raycast={() => null}>
          <spriteMaterial
            map={textures[i]}
            color={patch.color}
            transparent
            opacity={patch.opacity}
            depthWrite={false}
            blending={AdditiveBlending}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  )
}
