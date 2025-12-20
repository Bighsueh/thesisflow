import React from 'react'
import { Navigation } from './Navigation'
import { GradientBackground } from '../ui/GradientBackground'
import { motion } from 'framer-motion'
interface LayoutProps {
  children: React.ReactNode
}
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen font-sans text-gray-900 relative">
      <GradientBackground />
      <Navigation />

      <main className="relative z-10 pt-28 pb-16 px-4 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
            }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

