import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { AdditiveBlending, DoubleSide } from 'three'
import { buildRingGeometry } from '../utils/planetSurface.js'
import { createGasGiantTexture, createGlowTexture, createRingTexture, createTelluricMaps } from '../utils/planetTextures.js'
import Moon from './Moon.jsx'

const SPHERE_SEGMENTS = 48

export default function Planet({ data, frozenTimeRef, onSelect, isSelected, isAnySelected, spinEnabled }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const ringRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  const isGas = data.type === 'gas'

  const telluricMaps = useMemo(
    () => (isGas ? null : createTelluricMaps(data)),
    [isGas, data.id, data.color],
  )
  const gasTexture = useMemo(
    () => (isGas ? createGasGiantTexture(data) : null),
    [isGas, data.id, data.color, data.bandColor],
  )
  const ringGeometry = useMemo(() => (isGas ? buildRingGeometry(data) : null), [isGas, data.id, data.size])
  const ringTexture = useMemo(
    () => (isGas ? createRingTexture(data) : null),
    [isGas, data.id, data.color, data.bandColor],
  )
  const glowTexture = useMemo(
    () => (isGas ? createGlowTexture({ peakAlpha: 0.4, spread: 0.45 }) : null),
    [isGas],
  )

  useFrame(({ clock }, delta) => {
    const t = frozenTimeRef.current ?? clock.elapsedTime
    const angle = data.phase + t * data.speed
    if (groupRef.current) {
      groupRef.current.position.set(Math.cos(angle) * data.orbitRadius, 0, Math.sin(angle) * data.orbitRadius)
    }
    if (meshRef.current) {
      if (spinEnabled) meshRef.current.rotation.y += delta * 0.3
      const targetScale = isSelected ? 1.35 : hovered ? 1.15 : 1
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * Math.min(delta * 6, 1)
      meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * Math.min(delta * 6, 1)
      meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * Math.min(delta * 6, 1)
      if (ringRef.current) ringRef.current.scale.setScalar(meshRef.current.scale.x)
      if (glowRef.current) glowRef.current.scale.setScalar(data.size * 4.2 * meshRef.current.scale.x)
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
            roughness={0.4}
            metalness={0.05}
            transparent
            opacity={dimmed ? 0.25 : 1}
          />
        ) : (
          <meshStandardMaterial
            map={telluricMaps.map}
            roughnessMap={telluricMaps.roughnessMap}
            roughness={1}
            metalness={0.1}
            transparent
            opacity={dimmed ? 0.25 : 1}
          />
        )}
      </mesh>

      {isGas && (
        <mesh ref={ringRef} geometry={ringGeometry} rotation={[Math.PI / 2 - 0.2, 0, 0]} raycast={() => null}>
          <meshBasicMaterial
            map={ringTexture}
            side={DoubleSide}
            transparent
            opacity={dimmed ? 0.15 : 0.7}
          />
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

      {data.moon && (
        <Moon data={data.moon} frozenTimeRef={frozenTimeRef} spinEnabled={spinEnabled} />
      )}

      {(hovered || isSelected) && !isAnySelected && (
        <Html center distanceFactor={8} position={[0, data.size + 0.35, 0]} occlude={false}>
          <div
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '11px',
              letterSpacing: '0.05em',
              color: data.color,
              whiteSpace: 'nowrap',
              background: '#0b1220cc',
              border: '1px solid #26314a',
              borderRadius: '4px',
              padding: '4px 8px',
              pointerEvents: 'none',
            }}
          >
            {data.index} — {data.label.toUpperCase()}
          </div>
        </Html>
      )}
    </group>
  )
}
