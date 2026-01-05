import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { slideDown, spring } from '../../config/animations';

interface TourProgressProps {
  current: number;
  total: number;
}

export function TourProgress({ current, total }: TourProgressProps) {
  return (
    <motion.div
      variants={slideDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
    >
      <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-full px-6 py-3 shadow-xl shadow-violet-500/10">
        <div className="flex items-center gap-4">
          {/* 文字進度 */}
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
            步驟
            <AnimatePresence mode="wait">
              <motion.span
                key={current}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="text-violet-600 font-bold text-lg inline-block min-w-[1.5rem] text-center"
              >
                {current}
              </motion.span>
            </AnimatePresence>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{total}</span>
          </span>

          {/* 圓點指示器 */}
          <div className="flex gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const stepNum = i + 1;
              const isCompleted = stepNum < current;
              const isCurrent = stepNum === current;

              return (
                <motion.div
                  key={i}
                  className="rounded-full"
                  layout
                  animate={{
                    width: isCurrent ? 24 : 8,
                    height: 8,
                    backgroundColor: isCompleted
                      ? '#7c3aed' // violet-600
                      : isCurrent
                        ? '#a78bfa' // violet-400
                        : '#d1d5db', // gray-300
                  }}
                  transition={spring}
                />
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
