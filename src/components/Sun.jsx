import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import { createGlowTexture, createSunTexture } from '../utils/planetTextures.js'

export default function Sun() {
  const meshRef = useRef()
  const sunTexture = useMemo(() => createSunTexture(), [])
  const glowTexture = useMemo(() => createGlowTexture({ peakAlpha: 0.5, spread: 0.6 }), [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group>
      <pointLight color="#ffcf5c" intensity={9} distance={20} decay={2} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial map={sunTexture} toneMapped={false} />
      </mesh>
      <sprite scale={[10.5, 10.5, 1]} raycast={() => null}>
        <spriteMaterial
          map={glowTexture}
          color="#ffcf5c"
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>
    </group>
  )
}
