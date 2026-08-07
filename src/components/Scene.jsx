import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import Sun from './Sun.jsx'
import Planet from './Planet.jsx'
import OrbitRing from './OrbitRing.jsx'
import CameraRig from './CameraRig.jsx'

function SceneInner({ sections, selectedId, onSelect, reducedMotion }) {
  const elapsedRef = useRef(0)
  const frozenTimeRef = useRef(null)
  const [selectedPos, setSelectedPos] = useState(null)

  useFrame(({ clock }) => {
    elapsedRef.current = clock.elapsedTime
  })

  useEffect(() => {
    if (!selectedId) {
      frozenTimeRef.current = null
      setSelectedPos(null)
      return
    }
    frozenTimeRef.current = elapsedRef.current
    const sec = sections.find((s) => s.id === selectedId)
    if (sec) {
      const angle = sec.phase + frozenTimeRef.current * sec.speed
      setSelectedPos(new THREE.Vector3(Math.cos(angle) * sec.orbitRadius, 0, Math.sin(angle) * sec.orbitRadius))
    }
  }, [selectedId, sections])

  return (
    <>
      <ambientLight intensity={0.4} />
      <Sun />

      {sections.map((s) => (
        <group key={s.id}>
          <OrbitRing radius={s.orbitRadius} />
          <Planet
            data={s}
            frozenTimeRef={frozenTimeRef}
            onSelect={onSelect}
            isSelected={selectedId === s.id}
            isAnySelected={Boolean(selectedId)}
            spinEnabled={!reducedMotion}
          />
        </group>
      ))}

      <CameraRig selectedPos={selectedPos} reducedMotion={reducedMotion} />
    </>
  )
}

export default function Scene({ sections, selectedId, onSelect, onClose, reducedMotion }) {
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 2]}
      camera={{ position: [0, 3.4, 10.5], fov: 45 }}
      gl={{ antialias: true }}
      onPointerMissed={onClose}
    >
      <color attach="background" args={['#0b1220']} />
      <fog attach="fog" args={['#0b1220', 9, 23]} />
      <Stars radius={60} depth={30} count={1600} factor={2} saturation={0} fade speed={reducedMotion ? 0 : 0.25} />
      <SceneInner sections={sections} selectedId={selectedId} onSelect={onSelect} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
