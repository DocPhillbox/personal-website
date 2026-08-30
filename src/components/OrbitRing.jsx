import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { orbitRingFragmentShader, orbitRingVertexShader } from '../shaders/index.js'

const HALF_WIDTH = 0.05

export default function OrbitRing({ section, color = '#4a5878' }) {
  const materialRef = useRef()
  const radius = section.orbitRadius

  const geometry = useMemo(
    () => new THREE.RingGeometry(radius - HALF_WIDTH, radius + HALF_WIDTH, 256, 1),
    [radius],
  )

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uTrailColor: { value: new THREE.Color(section.color) },
      uRadius: { value: radius },
      uHalfWidth: { value: HALF_WIDTH },
      // Scaled with the radius so dash length stays consistent between orbits.
      uDashCount: { value: Math.round(radius * 8) },
      uPlanetAngle: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [radius, color, section.color],
  )

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uPlanetAngle.value = section.phase + clock.elapsedTime * section.speed
    }
  })

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={orbitRingVertexShader}
        fragmentShader={orbitRingFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
