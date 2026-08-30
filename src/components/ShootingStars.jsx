import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { meteorFragmentShader, meteorVertexShader } from '../shaders/index.js'

const X_AXIS = new THREE.Vector3(1, 0, 0)
const _camLocal = new THREE.Vector3()
const _ndc = new THREE.Vector3()
const _rayDir = new THREE.Vector3()
const _camRight = new THREE.Vector3()
const _camUp = new THREE.Vector3()
const _travelDir = new THREE.Vector3()

const MIN_WAIT = 6
const MAX_WAIT = 14
const FLIGHT_TIME = 1.4
const MIN_DEPTH = 52
const MAX_DEPTH = 74

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

/**
 * One streak at a time, well out in the background shell so it never crosses
 * the planets. It is a single reused mesh that is simply hidden between runs —
 * spawning and disposing geometry every few seconds would be wasteful.
 */
export default function ShootingStars({ animated = true }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const camera = useThree((state) => state.camera)

  const state = useRef({ waiting: randomRange(2, 5), elapsed: 0, active: false })
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color('#dceaff') }, uOpacity: { value: 0 } }),
    [],
  )

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, 32, 1)
    g.translate(0.5, 0, 0)
    return g
  }, [])

  const start = () => {
    // Spawn inside the view frustum rather than anywhere on a shell around the
    // origin. Only about a ninth of such a shell is ever on screen, so uniform
    // placement meant almost every streak played out where nobody could see it.
    _ndc.set(randomRange(-0.72, 0.72), randomRange(-0.15, 0.85), 0.5).unproject(camera)
    _rayDir.copy(_ndc).sub(camera.position).normalize()

    const g = groupRef.current
    const origin = camera.position.clone().addScaledVector(_rayDir, randomRange(MIN_DEPTH, MAX_DEPTH))

    // Travel across the screen plane, so the streak reads as crossing the view
    // instead of receding from it.
    _camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
    _camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize()
    const side = Math.random() < 0.5 ? 1 : -1
    const angle = randomRange(Math.PI * 0.12, Math.PI * 0.42)
    _travelDir
      .copy(_camRight)
      .multiplyScalar(Math.cos(angle) * side)
      .addScaledVector(_camUp, -Math.sin(angle))
      .normalize()

    g.position.copy(origin)
    g.quaternion.setFromUnitVectors(X_AXIS, _travelDir)

    const length = randomRange(11, 18)
    g.scale.set(length, randomRange(0.6, 1.0), 1)

    state.current.travel = _travelDir.clone().multiplyScalar(randomRange(30, 48))
    state.current.origin = origin
  }

  useFrame((_, delta) => {
    const s = state.current
    const g = groupRef.current
    if (!g) return

    if (!animated) {
      g.visible = false
      return
    }

    if (!s.active) {
      s.waiting -= delta
      g.visible = false
      if (s.waiting <= 0) {
        s.active = true
        s.elapsed = 0
        start()
      }
      return
    }

    s.elapsed += delta
    const t = s.elapsed / FLIGHT_TIME
    if (t >= 1) {
      s.active = false
      s.waiting = randomRange(MIN_WAIT, MAX_WAIT)
      g.visible = false
      return
    }

    g.visible = true
    g.position.copy(s.origin).addScaledVector(s.travel, t)

    // Fade in fast, fade out slowly, so it never pops on or off.
    uniforms.uOpacity.value = Math.min(1, t * 6) * (1 - t * t)

    // Cylindrical billboard about the direction of travel, so the streak keeps
    // its face to the camera without twisting its heading.
    _camLocal.copy(camera.position)
    g.worldToLocal(_camLocal)
    if (meshRef.current) meshRef.current.rotation.x = Math.atan2(-_camLocal.y, _camLocal.z)
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={meshRef} geometry={geometry} raycast={() => null}>
        <shaderMaterial
          vertexShader={meteorVertexShader}
          fragmentShader={meteorFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
