import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalOverlay = ({ isOpen, onClose, children }: ModalOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[999999]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white w-[90%] max-w-[400px] p-8 rounded-[20px] shadow-2xl relative"
            style={{
              position: 'fixed !important',
              top: '50% !important',
              left: '50% !important',
              transform: 'translate(-50%, -50%) !important',
              zIndex: '999999 !important'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
