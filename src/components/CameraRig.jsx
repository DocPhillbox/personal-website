import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const OVERVIEW_RADIUS = 11.05
const CLOSEUP_RADIUS = 2.4

export default function CameraRig({ selectedPos, reducedMotion, controlsRef }) {
  const offset = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    const camera = controls.object

    offset.current.copy(camera.position).sub(controls.target)
    const currentRadius = offset.current.length() || OVERVIEW_RADIUS
    offset.current.normalize()

    const desiredTarget = selectedPos || ORIGIN
    const desiredRadius = selectedPos ? CLOSEUP_RADIUS : OVERVIEW_RADIUS
    const speed = reducedMotion ? 1 : Math.min(delta * 2.2, 1)

    const nextRadius = currentRadius + (desiredRadius - currentRadius) * speed
    controls.target.lerp(desiredTarget, speed)
    camera.position.copy(controls.target).addScaledVector(offset.current, nextRadius)
  })

  return null
}
