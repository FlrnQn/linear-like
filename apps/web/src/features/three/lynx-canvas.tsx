import { Float, MeshDistortMaterial } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

import type { Scene3DVariant } from './types'

// oklch(0.72 0.19 280), the app's accent token — converted to sRGB hex because
// three.js's Color doesn't parse oklch() strings.
const ACCENT_HEX = '#9092ff'

const VARIANT_CONFIG: Record<
  Scene3DVariant,
  { scale: number; rotationSpeed: number; floatSpeed: number; distort: number }
> = {
  login: { scale: 1.1, rotationSpeed: 0.25, floatSpeed: 1.6, distort: 0.35 },
  boot: { scale: 0.9, rotationSpeed: 0.6, floatSpeed: 2.4, distort: 0.25 },
  empty: { scale: 1, rotationSpeed: 0.2, floatSpeed: 1.4, distort: 0.4 },
}

function LynxObject({ variant }: { variant: Scene3DVariant }) {
  const meshRef = useRef<Mesh>(null)
  const config = VARIANT_CONFIG[variant]

  useFrame((_state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.x += delta * config.rotationSpeed
    mesh.rotation.y += delta * config.rotationSpeed * 1.4
  })

  return (
    <Float speed={config.floatSpeed} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={config.scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={ACCENT_HEX}
          distort={config.distort}
          speed={2}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>
    </Float>
  )
}

// Default export so this chunk can be React.lazy()-loaded — this file (plus
// three/fiber/drei) only downloads for someone who actually reaches a page
// with a 3D accent, never as part of the eager main bundle. Measured: dropping
// drei's Float/MeshDistortMaterial in favor of raw three.js saves ~1.5kB gzip
// out of ~242kB total — the weight here is three.js/fiber core itself, not drei.
export default function LynxCanvas({ variant }: { variant: Scene3DVariant }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} />
      <LynxObject variant={variant} />
    </Canvas>
  )
}
