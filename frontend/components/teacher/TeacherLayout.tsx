import { motion } from 'framer-motion';
import React from 'react';
import { GradientBackground } from '../ui/GradientBackground';

interface TeacherLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export function TeacherLayout({ children, sidebar }: TeacherLayoutProps) {
  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50/30 relative">
      <GradientBackground />

      {sidebar}

      <main className="pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">
          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.4,
              ease: 'easeOut',
            }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
