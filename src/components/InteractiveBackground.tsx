'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export function InteractiveBackground() {
  const [isMounted, setIsMounted] = useState(false)
  
  // Use springs for smooth mouse follow
  const springConfig = { damping: 25, stiffness: 150 }
  const mouseX = useSpring(0, springConfig)
  const mouseY = useSpring(0, springConfig)

  useEffect(() => {
    setIsMounted(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      // Get mouse position relative to viewport
      mouseX.set(e.clientX - 250) // center the 500px orb
      mouseY.set(e.clientY - 250)
    }

    // Set initial position to center of screen
    mouseX.set(window.innerWidth / 2 - 250)
    mouseY.set(window.innerHeight / 2 - 250)

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      />
    </div>
  )
}
