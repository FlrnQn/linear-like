import { animate, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { formatCount } from './format-count'

export function StatTile({ label, value }: { label: string; value: number }) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const controls = animate(fromRef.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (latest) => {
        fromRef.current = latest
        setDisplay(Math.round(latest))
      },
    })
    return controls.stop
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border-border bg-surface rounded-xl border p-4"
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{formatCount(display)}</p>
    </motion.div>
  )
}
