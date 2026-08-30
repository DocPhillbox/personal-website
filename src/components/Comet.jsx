import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cometTailFragmentShader, cometTailVertexShader } from '../shaders/index.js'
import { createGlowTexture } from '../utils/planetTextures.js'

const X_AXIS = new THREE.Vector3(1, 0, 0)
const _camLocal = new THREE.Vector3()

export default function Comet({ data, animated = true }) {
  const groupRef = useRef()
  const tailRef = useRef()
  const time = useRef({ value: 0 })
  const camera = useThree((state) => state.camera)

  const glowTexture = useMemo(() => createGlowTexture({ peakAlpha: 0.8, spread: 0.42 }), [])

  const uniforms = useMemo(
    () => ({
      uTime: time.current,
      uColorInner: { value: new THREE.Color(data.colorInner) },
      uColorOuter: { value: new THREE.Color(data.colorOuter) },
      uOpacity: { value: 0.9 },
    }),
    [data.colorInner, data.colorOuter],
  )

  // Local +X runs down the tail, so the shader's vUv.x maps to distance travelled.
  const orientation = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(X_AXIS, new THREE.Vector3(...data.tailDirection).normalize()),
    [data.tailDirection],
  )

  const tailGeometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(data.tailLength, data.tailWidth, 96, 2)
    g.translate(data.tailLength / 2, 0, 0)
    return g
  }, [data.tailLength, data.tailWidth])

  useFrame((_, delta) => {
    if (animated) time.current.value += delta

    // Cylindrical billboard: spin the tail about its own axis so its face stays
    // toward the camera. A full billboard would swing the tail direction around
    // too, and a fixed plane would vanish when viewed edge-on.
    if (tailRef.current && groupRef.current) {
      _camLocal.copy(camera.position)
      groupRef.current.worldToLocal(_camLocal)
      tailRef.current.rotation.x = Math.atan2(-_camLocal.y, _camLocal.z)
    }
  })

  return (
    <group ref={groupRef} position={data.position} quaternion={orientation}>
      <mesh ref={tailRef} geometry={tailGeometry} raycast={() => null}>
        <shaderMaterial
          vertexShader={cometTailVertexShader}
          fragmentShader={cometTailFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh raycast={() => null}>
        <sphereGeometry args={[data.nucleusSize, 24, 24]} />
        <meshBasicMaterial color={data.colorInner} toneMapped={false} fog={false} />
      </mesh>

      <sprite scale={[data.nucleusSize * 14, data.nucleusSize * 14, 1]} raycast={() => null}>
        <spriteMaterial
          map={glowTexture}
          color={data.colorOuter}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.75}
        />
      </sprite>
    </group>
  )
}
