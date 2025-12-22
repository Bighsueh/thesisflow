import React from 'react'
import { motion } from 'framer-motion'
export function GradientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-white">
      {/* Top Left - Purple/Blue */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-purple-300 via-violet-300 to-blue-300 blur-3xl opacity-60"
      />

      {/* Bottom Right - Lavender/Pink */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3],
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-fuchsia-300 via-purple-300 to-indigo-300 blur-3xl opacity-60"
      />

      {/* Center/Top - Light Blue */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-blue-200 via-cyan-200 to-indigo-200 blur-3xl opacity-50"
      />
    </div>
  )
}

