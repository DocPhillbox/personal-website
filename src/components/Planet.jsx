import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { AdditiveBlending, DoubleSide } from 'three'
import { buildRingGeometry } from '../utils/planetSurface.js'
import {
  createCloudTexture,
  createGasGiantTexture,
  createGlowTexture,
  createRingTexture,
  createTelluricMaps,
} from '../utils/planetTextures.js'
import { orbitPositionAt } from '../utils/orbit.js'
import { animateMapFragment } from '../utils/shaderInjection.js'
import { GAS_SURFACE_FRAGMENT, GAS_SURFACE_PARS } from '../shaders/index.js'
import Atmosphere from './Atmosphere.jsx'
import Moon from './Moon.jsx'

const SPHERE_SEGMENTS = 64

export default function Planet({ data, onSelect, isSelected, isAnySelected, spinEnabled }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const ringRef = useRef()
  const glowRef = useRef()
  const cloudRef = useRef()
  const atmosphereRef = useRef()
  const gasTime = useRef({ value: 0 })
  const [hovered, setHovered] = useState(false)
  const isGas = data.type === 'gas'

  const telluricMaps = useMemo(() => (isGas ? null : createTelluricMaps(data)), [isGas, data.id, data.biome])
  const cloudTexture = useMemo(() => (data.clouds ? createCloudTexture(data) : null), [data.clouds, data.id])
  const gasTexture = useMemo(
    () => (isGas ? createGasGiantTexture(data) : null),
    [isGas, data.id, data.color, data.bandColor],
  )
  const ringGeometry = useMemo(() => (isGas ? buildRingGeometry(data) : null), [isGas, data.id, data.size])
  const ringTexture = useMemo(
    () => (isGas ? createRingTexture(data) : null),
    [isGas, data.id, data.color, data.bandColor],
  )
  const glowTexture = useMemo(() => (isGas ? createGlowTexture({ peakAlpha: 0.4, spread: 0.45 }) : null), [isGas])

  const gasShader = useMemo(
    () =>
      animateMapFragment({
        key: 'gas-surface',
        pars: GAS_SURFACE_PARS,
        fragment: GAS_SURFACE_FRAGMENT,
        uniforms: { uTime: gasTime.current },
      }),
    [],
  )

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      orbitPositionAt(data, clock.elapsedTime, groupRef.current.position)
    }
    if (spinEnabled) gasTime.current.value += delta
    if (meshRef.current) {
      if (spinEnabled) meshRef.current.rotation.y += delta * 0.3
      const targetScale = isSelected ? 1.35 : hovered ? 1.15 : 1
      const s = meshRef.current.scale
      s.x += (targetScale - s.x) * Math.min(delta * 6, 1)
      s.y += (targetScale - s.y) * Math.min(delta * 6, 1)
      s.z += (targetScale - s.z) * Math.min(delta * 6, 1)

      if (ringRef.current) ringRef.current.scale.setScalar(s.x)
      if (glowRef.current) glowRef.current.scale.setScalar(data.size * 4.2 * s.x)
      if (atmosphereRef.current) atmosphereRef.current.scale.setScalar(s.x)
      if (cloudRef.current) {
        cloudRef.current.scale.setScalar(s.x)
        // Slightly faster than the surface, so the deck visibly drifts over it.
        if (spinEnabled) cloudRef.current.rotation.y += delta * 0.42
      }
    }
  })

  const dimmed = isAnySelected && !isSelected

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(data.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[data.size, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        {isGas ? (
          <meshStandardMaterial
            map={gasTexture}
            onBeforeCompile={gasShader.onBeforeCompile}
            customProgramCacheKey={gasShader.customProgramCacheKey}
            roughness={0.55}
            metalness={0}
            transparent
            opacity={dimmed ? 0.25 : 1}
          />
        ) : (
          <meshStandardMaterial
            map={telluricMaps.map}
            roughnessMap={telluricMaps.roughnessMap}
            normalMap={telluricMaps.normalMap}
            roughness={1}
            metalness={0}
            transparent
            opacity={dimmed ? 0.25 : 1}
          />
        )}
      </mesh>

      {cloudTexture && (
        <mesh ref={cloudRef} raycast={() => null}>
          <sphereGeometry args={[data.size * 1.018, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <meshStandardMaterial
            map={cloudTexture}
            transparent
            depthWrite={false}
            roughness={1}
            metalness={0}
            opacity={dimmed ? 0.2 : 0.9}
          />
        </mesh>
      )}

      {data.atmosphere && (
        <Atmosphere
          ref={atmosphereRef}
          radius={data.size * 1.14}
          color={data.atmosphere.color}
          intensity={data.atmosphere.intensity ?? 0.9}
          power={data.atmosphere.power ?? 3}
          opacity={dimmed ? 0.25 : 1}
        />
      )}

      {isGas && (
        <mesh ref={ringRef} geometry={ringGeometry} rotation={[Math.PI / 2 - 0.2, 0, 0]} raycast={() => null}>
          <meshBasicMaterial map={ringTexture} side={DoubleSide} transparent opacity={dimmed ? 0.15 : 0.7} />
        </mesh>
      )}

      {isGas && (
        <sprite ref={glowRef} scale={[data.size * 4.2, data.size * 4.2, 1]} raycast={() => null}>
          <spriteMaterial
            map={glowTexture}
            color={data.color}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            opacity={dimmed ? 0.15 : 0.6}
          />
        </sprite>
      )}

      {data.moon && <Moon data={data.moon} spinEnabled={spinEnabled} />}

      {/* No distanceFactor on the label below: that prop is what scales it with
          camera distance. Without it the tag keeps a constant on-screen size. */}
      {(hovered || isSelected) && !isAnySelected && (
        <Html center position={[0, data.size + 0.42, 0]} occlude={false}>
          <div className="planet-tag" style={{ '--tag-accent': data.color }}>
            <span className="planet-tag__index">{data.index}</span>
            {data.label.toUpperCase()}
          </div>
        </Html>
      )}
    </group>
  )
}
