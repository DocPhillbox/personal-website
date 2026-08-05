import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

export default function Planet({ data, frozenTimeRef, onSelect, isSelected, isAnySelected, spinEnabled }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

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
        <icosahedronGeometry args={[data.size, 1]} />
        <meshStandardMaterial
          color={data.color}
          flatShading
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>

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
