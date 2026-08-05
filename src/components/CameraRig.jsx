import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const OVERVIEW_POS = new THREE.Vector3(0, 3.4, 10.5)
const OVERVIEW_LOOK = new THREE.Vector3(0, 0, 0)

export default function CameraRig({ selectedPos, reducedMotion }) {
  const { camera } = useThree()
  const lookAtRef = useRef(OVERVIEW_LOOK.clone())
  const desiredPos = useRef(new THREE.Vector3())
  const desiredLook = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (selectedPos) {
      const dir = selectedPos.clone().normalize()
      desiredPos.current
        .copy(selectedPos)
        .add(dir.multiplyScalar(2.1))
        .add(new THREE.Vector3(0, 0.5, 0))
      desiredLook.current.copy(selectedPos)
    } else {
      desiredPos.current.copy(OVERVIEW_POS)
      desiredLook.current.copy(OVERVIEW_LOOK)
    }

    const speed = reducedMotion ? 1 : Math.min(delta * 2.2, 1)
    camera.position.lerp(desiredPos.current, speed)
    lookAtRef.current.lerp(desiredLook.current, speed)
    camera.lookAt(lookAtRef.current)
  })

  return null
}
