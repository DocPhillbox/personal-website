import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import { createGlowTexture, createSunTexture } from '../utils/planetTextures.js'
import { animateMapFragment } from '../utils/shaderInjection.js'
import { SUN_SURFACE_FRAGMENT, SUN_SURFACE_PARS } from '../shaders/index.js'

const GLOW_SCALE = 10.5

export default function Sun({ animated = true }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const sunTime = useRef({ value: 0 })

  const sunTexture = useMemo(() => createSunTexture(), [])
  const glowTexture = useMemo(() => createGlowTexture({ peakAlpha: 0.5, spread: 0.6 }), [])

  const sunShader = useMemo(
    () =>
      animateMapFragment({
        key: 'sun-surface',
        pars: SUN_SURFACE_PARS,
        fragment: SUN_SURFACE_FRAGMENT,
        uniforms: { uTime: sunTime.current },
      }),
    [],
  )

  useFrame((_, delta) => {
    if (!animated) return
    sunTime.current.value += delta
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05
    if (glowRef.current) {
      // Two detuned sines so the corona pulses without an obvious beat.
      const t = sunTime.current.value
      const breath = 1 + Math.sin(t * 0.45) * 0.045 + Math.sin(t * 0.23 + 1.3) * 0.03
      glowRef.current.scale.set(GLOW_SCALE * breath, GLOW_SCALE * breath, 1)
      glowRef.current.material.opacity = 0.86 + Math.sin(t * 0.37 + 0.6) * 0.14
    }
  })

  return (
    <group>
      <pointLight color="#ffcf5c" intensity={6} distance={20} decay={2} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial
          map={sunTexture}
          onBeforeCompile={sunShader.onBeforeCompile}
          customProgramCacheKey={sunShader.customProgramCacheKey}
          toneMapped={false}
        />
      </mesh>
      <sprite ref={glowRef} scale={[GLOW_SCALE, GLOW_SCALE, 1]} raycast={() => null}>
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
