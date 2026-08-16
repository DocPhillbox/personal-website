import { forwardRef, useMemo } from 'react'
import { AdditiveBlending, BackSide, Color } from 'three'
import { atmosphereFragmentShader, atmosphereVertexShader } from '../shaders/index.js'

// Rendered on the far side of a slightly oversized shell, so the fresnel term
// peaks exactly where the planet's silhouette meets space: a soft limb halo
// that also takes the hard edge off the day/night terminator.

const Atmosphere = forwardRef(function Atmosphere(
  { radius, color, intensity = 0.9, power = 3, opacity = 1 },
  ref,
) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [color, intensity, power],
  )

  // Dimming is a per-frame-ish prop, so drive it through the uniform rather
  // than rebuilding the uniforms object.
  uniforms.uIntensity.value = intensity * opacity

  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={BackSide}
      />
    </mesh>
  )
})

export default Atmosphere
