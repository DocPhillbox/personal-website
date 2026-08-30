import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Sun from './Sun.jsx'
import Planet from './Planet.jsx'
import OrbitRing from './OrbitRing.jsx'
import CameraRig from './CameraRig.jsx'
import Comet from './Comet.jsx'
import StarField from './StarField.jsx'
import Nebulae from './Nebulae.jsx'
import ShootingStars from './ShootingStars.jsx'
import { COMET } from '../data/content.js'

function SceneInner({ sections, selectedId, onSelect, reducedMotion }) {
  const controlsRef = useRef(null)
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedId) || null,
    [sections, selectedId],
  )

  return (
    <>
      <ambientLight intensity={0.5} />
      {/* Faint fill so the night side reads as shadowed rather than as a void. */}
      <hemisphereLight args={['#8fb4ff', '#241a2e', 0.32]} />
      <Sun animated={!reducedMotion} />
      <Comet data={COMET} animated={!reducedMotion} />

      {sections.map((s) => (
        <group key={s.id}>
          <OrbitRing section={s} />
          <Planet
            data={s}
            onSelect={onSelect}
            isSelected={selectedId === s.id}
            isAnySelected={Boolean(selectedId)}
            spinEnabled={!reducedMotion}
          />
        </group>
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.8}
        maxDistance={34}
        mouseButtons={{ LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
      />
      <CameraRig selectedSection={selectedSection} reducedMotion={reducedMotion} controlsRef={controlsRef} />
    </>
  )
}

export default function Scene({ sections, selectedId, onSelect, onClose, reducedMotion }) {
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 2]}
      camera={{ position: [0, 5.8, 16.6], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
      onPointerMissed={onClose}
    >
      <color attach="background" args={['#05070f']} />
      {/* Only bites well beyond the outermost orbit, so it adds depth to the
          star field without draining colour from the planets. */}
      <fog attach="fog" args={['#05070f', 26, 78]} />
      <Nebulae />
      <StarField animated={!reducedMotion} />
      <ShootingStars animated={!reducedMotion} />
      <SceneInner sections={sections} selectedId={selectedId} onSelect={onSelect} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
