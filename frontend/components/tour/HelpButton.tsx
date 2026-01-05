import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { HelpCenter } from '../modals/HelpCenter';

export function HelpButton() {
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelpCenter(true)}
        className="w-9 h-9 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 flex items-center justify-center transition-colors shadow-sm"
        aria-label="開啟幫助中心"
        title="幫助與導覽"
      >
        <HelpCircle size={18} />
      </motion.button>

      <AnimatePresence>
        {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
      </AnimatePresence>
    </>
  );
}
