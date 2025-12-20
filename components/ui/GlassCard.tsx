import React from 'react'
import { motion } from 'framer-motion'
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
}
export function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={
        hoverEffect
          ? {
              y: -4,
              boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.15)',
            }
          : {}
      }
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-white/60 backdrop-blur-xl 
        border border-white/60 
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
        rounded-3xl
        ${hoverEffect || onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

