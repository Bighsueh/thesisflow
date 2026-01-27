import { motion } from 'framer-motion';
import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  // className 和 onClick 已從 HTMLAttributes 繼承，無需重複定義
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={
        hoverEffect
          ? {
              y: -2,
              scale: 1.01,
              boxShadow: '0 20px 40px -10px rgba(139, 92, 246, 0.18)',
            }
          : {}
      }
      whileTap={hoverEffect ? { scale: 0.99 } : {}}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      onClick={onClick}
      {...rest}
      className={`
        relative overflow-hidden
        bg-white/80 backdrop-blur-2xl 
        border border-white/80 
        shadow-[0_4px_20px_rgb(0,0,0,0.04)]
        shadow-violet-500/5
        rounded-2xl
        transition-colors duration-200
        ${hoverEffect || onClick ? 'cursor-pointer hover:border-violet-200/50' : ''}
        ${className}
      `}
    >
      {/* Subtle shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-violet-50/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
