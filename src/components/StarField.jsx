import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import { createGlowTexture } from '../utils/planetTextures.js'
import { STAR_BUCKETS, buildBandStars, buildStars } from '../utils/starField.js'

export default function StarField({
  count = 4200,
  bandCount = 5000,
  innerRadius = 60,
  outerRadius = 110,
  animated = true,
}) {
  const groupRef = useRef()
  const sprite = useMemo(() => createGlowTexture({ size: 64, peakAlpha: 1, spread: 0.3 }), [])
  const geometries = useMemo(
    () => buildStars(count, innerRadius, outerRadius, 1337),
    [count, innerRadius, outerRadius],
  )
  const bandGeometry = useMemo(
    () => buildBandStars(bandCount, innerRadius, outerRadius, 90210),
    [bandCount, innerRadius, outerRadius],
  )

  useFrame((_, delta) => {
    if (animated && groupRef.current) groupRef.current.rotation.y += delta * 0.004
  })

  return (
    <group ref={groupRef}>
      {/* Dense, small and dim: the band should read as unresolved haze, not as
          a second layer of individually countable stars. */}
      <points geometry={bandGeometry} raycast={() => null}>
        <pointsMaterial
          map={sprite}
          size={0.28}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
        />
      </points>

      {geometries.map((geometry, i) => (
        <points key={i} geometry={geometry} raycast={() => null}>
          <pointsMaterial
            map={sprite}
            size={STAR_BUCKETS[i].size}
            sizeAttenuation
            vertexColors
            transparent
            opacity={STAR_BUCKETS[i].opacity}
            depthWrite={false}
            blending={AdditiveBlending}
            // The field sits far beyond the fog's far plane, which would
            // otherwise erase it entirely.
            fog={false}
          />
        </points>
      ))}
    </group>
  )
}
