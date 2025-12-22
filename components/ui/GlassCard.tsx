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
        bg-white/70 backdrop-blur-2xl 
        border border-white/80 
        shadow-[0_8px_30px_rgb(0,0,0,0.06)]
        shadow-violet-500/5
        rounded-3xl
        ${hoverEffect || onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Subtle shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-violet-50/20 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

