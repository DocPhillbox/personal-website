import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Sun() {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05
      meshRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <group>
      <pointLight color="#ffcf5c" intensity={9} distance={20} decay={2} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial
          color="#ffcf5c"
          emissive="#ffcf5c"
          emissiveIntensity={0.55}
          flatShading
          roughness={0.5}
        />
      </mesh>
    </group>
  )
}
