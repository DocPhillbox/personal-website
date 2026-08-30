import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createMoonTexture } from '../utils/planetTextures.js'
import { orbitPositionAt } from '../utils/orbit.js'

const SPHERE_SEGMENTS = 32

export default function Moon({ data, spinEnabled }) {
  const orbitRef = useRef()
  const meshRef = useRef()
  const maps = useMemo(() => createMoonTexture(data), [data.id, data.color])

  useFrame(({ clock }, delta) => {
    if (orbitRef.current) {
      orbitPositionAt(data, clock.elapsedTime, orbitRef.current.position)
    }
    if (spinEnabled && meshRef.current) meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <group ref={orbitRef}>
      <mesh ref={meshRef} raycast={() => null}>
        <sphereGeometry args={[data.size, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <meshStandardMaterial map={maps.map} normalMap={maps.normalMap} roughness={0.96} metalness={0} />
      </mesh>
    </group>
  )
}
