import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { orbitPositionAt } from '../utils/orbit.js'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const OVERVIEW_RADIUS = 11.05
const CLOSEUP_RADIUS = 2.4

export default function CameraRig({ selectedSection, reducedMotion, controlsRef }) {
  const desired = useRef(new THREE.Vector3())
  const prevDesired = useRef(new THREE.Vector3())
  const targetBefore = useRef(new THREE.Vector3())
  const scratch = useRef(new THREE.Vector3())
  const prevId = useRef(null)

  useFrame(({ clock }, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    const camera = controls.object

    const id = selectedSection ? selectedSection.id : null
    if (selectedSection) {
      orbitPositionAt(selectedSection, clock.elapsedTime, desired.current)
    } else {
      desired.current.copy(ORIGIN)
    }

    const speed = reducedMotion ? 1 : Math.min(delta * 2.2, 1)
    targetBefore.current.copy(controls.target)

    // Feed the planet's own per-frame motion straight through, then smooth only
    // the residual gap. Lerping alone would trail a moving planet forever.
    if (id === prevId.current) {
      controls.target.add(scratch.current.subVectors(desired.current, prevDesired.current))
    }
    controls.target.lerp(desired.current, speed)

    prevDesired.current.copy(desired.current)
    prevId.current = id

    // Shift the camera by however far the target moved so following an orbiting
    // planet never drags the viewing angle the user picked around with it.
    camera.position.add(scratch.current.subVectors(controls.target, targetBefore.current))

    scratch.current.copy(camera.position).sub(controls.target)
    const currentRadius = scratch.current.length() || OVERVIEW_RADIUS
    scratch.current.normalize()

    const desiredRadius = selectedSection ? CLOSEUP_RADIUS : OVERVIEW_RADIUS
    const nextRadius = currentRadius + (desiredRadius - currentRadius) * speed
    camera.position.copy(controls.target).addScaledVector(scratch.current, nextRadius)
  })

  return null
}
