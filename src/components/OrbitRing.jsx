import { useMemo } from 'react'
import { Line } from '@react-three/drei'

// Anneau pointillé + petits repères façon instrument de mesure / schéma technique.
export default function OrbitRing({ radius, color = '#26314a' }) {
  const points = useMemo(() => {
    const segments = 128
    const pts = []
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius])
    }
    return pts
  }, [radius])

  const ticks = useMemo(() => {
    const t = []
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      const x = Math.cos(a) * radius
      const z = Math.sin(a) * radius
      const dx = Math.cos(a) * 0.12
      const dz = Math.sin(a) * 0.12
      t.push([
        [x - dx, 0, z - dz],
        [x + dx, 0, z + dz],
      ])
    }
    return t
  }, [radius])

  return (
    <group>
      <Line points={points} color={color} dashed dashSize={0.08} gapSize={0.1} transparent opacity={0.5} />
      {ticks.map((seg, i) => (
        <Line key={i} points={seg} color={color} transparent opacity={0.8} lineWidth={1} />
      ))}
    </group>
  )
}
