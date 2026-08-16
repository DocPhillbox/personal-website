import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createMoonTexture } from '../utils/planetTextures.js'

const SPHERE_SEGMENTS = 24

export default function Moon({ data, frozenTimeRef, spinEnabled }) {
  const orbitRef = useRef()
  const meshRef = useRef()
  const texture = useMemo(() => createMoonTexture(data), [data.id, data.color])

  useFrame(({ clock }, delta) => {
    const t = frozenTimeRef.current ?? clock.elapsedTime
    const angle = (data.phase || 0) + t * data.speed
    if (orbitRef.current) {
      orbitRef.current.position.set(Math.cos(angle) * data.orbitRadius, 0, Math.sin(angle) * data.orbitRadius)
    }
    if (spinEnabled && meshRef.current) meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <group ref={orbitRef}>
      <mesh ref={meshRef} raycast={() => null}>
        <sphereGeometry args={[data.size, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
  )
}
