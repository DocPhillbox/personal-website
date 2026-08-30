import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import { createGlowTexture, createSunTexture } from '../utils/planetTextures.js'
import { animateMapFragment } from '../utils/shaderInjection.js'
import { SUN_SURFACE_FRAGMENT, SUN_SURFACE_PARS } from '../shaders/index.js'

// Two stacked sprites: a tight inner corona over a very wide, very faint outer
// one. A single gradient stretched this far just looks like a flat disc — the
// pair is what reads as light actually falling off into space.
const GLOW_SCALE = 11
const HALO_SCALE = 26

export default function Sun({ animated = true }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const sunTime = useRef({ value: 0 })

  const sunTexture = useMemo(() => createSunTexture(), [])
  const glowTexture = useMemo(() => createGlowTexture({ peakAlpha: 0.26, spread: 0.5 }), [])
  const haloTexture = useMemo(() => createGlowTexture({ size: 512, peakAlpha: 0.15, spread: 0.86 }), [])

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
      {/* Softened decay (1.6 rather than physical 2) so the outermost world is
          still legible without blowing out the innermost one. */}
      <pointLight color="#ffe3bd" intensity={5} distance={48} decay={1.6} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.25, 64, 64]} />
        {/* meshBasicMaterial multiplies its map by `color`, so a neutral grey
            dims the disc without shifting its hue. */}
        <meshBasicMaterial
          map={sunTexture}
          color="#bdbdbd"
          onBeforeCompile={sunShader.onBeforeCompile}
          customProgramCacheKey={sunShader.customProgramCacheKey}
          toneMapped={false}
        />
      </mesh>
      <sprite scale={[HALO_SCALE, HALO_SCALE, 1]} raycast={() => null}>
        <spriteMaterial
          map={haloTexture}
          color="#ffcf9a"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>
      <sprite ref={glowRef} scale={[GLOW_SCALE, GLOW_SCALE, 1]} raycast={() => null}>
        <spriteMaterial
          map={glowTexture}
          color="#ffd9a8"
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </sprite>
    </group>
  )
}
