'use client';
import React, { useEffect, useId, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MODAL_BASE_Z_INDEX, useModalStack } from './ModalStackContext';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string | React.ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  className?: string;
  /** Clases del área bajo el header (por defecto incluye scroll vertical). */
  contentClassName?: string;
  zIndex?: number;
  /** Si false, nunca muestra overlay oscuro. Si undefined, solo el modal superior del stack lo muestra. */
  showOverlay?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  size = 'md',
  closeOnOverlayClick = true,
  className = '',
  contentClassName = 'p-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 overscroll-contain',
  zIndex = 999999,
  showOverlay,
}) => {
  const [mounted, setMounted] = useState(false);
  const modalId = useId();
  const modalStack = useModalStack();

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !modalStack) return;
    return modalStack.register(modalId);
  }, [isOpen, modalStack, modalId]);

  useEffect(() => {
    if (modalStack) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, modalStack]);

  const stackIndex = modalStack?.getStackIndex(modalId) ?? -1;
  const isTopModal =
    !modalStack ||
    modalStack.isTop(modalId) ||
    (isOpen && stackIndex < 0 && modalStack.count === 0);
  const usesStackZIndex = modalStack != null && isOpen && stackIndex >= 0;
  const effectiveZIndex = usesStackZIndex
    ? MODAL_BASE_Z_INDEX + (stackIndex + 1) * 10
    : zIndex;

  const shouldShowDarkOverlay =
    showOverlay === false ? false : showOverlay === true ? true : isTopModal;

  const shouldShowClickCatcher =
    isOpen && isTopModal && !shouldShowDarkOverlay && closeOnOverlayClick;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {shouldShowDarkOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm w-screen h-screen"
              style={{ zIndex: effectiveZIndex - 1 }}
              onClick={handleOverlayClick}
            />
          )}

          {shouldShowClickCatcher && (
            <div
              className="fixed inset-0 w-screen h-screen"
              style={{ zIndex: effectiveZIndex - 1 }}
              onClick={handleOverlayClick}
              aria-hidden
            />
          )}

          {/* Modal Container - Full screen container */}
          <div
            className="fixed inset-0 p-4 pointer-events-none flex items-center justify-center overflow-x-hidden overflow-y-auto"
            style={{ zIndex: effectiveZIndex }}
          >
            <div
              className={`pointer-events-auto my-auto w-full shrink-0 ${sizeClasses[size]} ${className}`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 300,
                }}
                className="relative bg-white rounded-lg shadow-2xl w-full h-full min-h-0 flex flex-col max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header con título: cruz alineada en la misma fila */}
                {title && (
                  <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-200 shrink-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="min-w-0 flex-1 text-2xl font-bold text-black leading-tight"
                    >
                      {typeof title === 'string' ? <h3>{title}</h3> : title}
                    </motion.div>
                    {showCloseButton && (
                      <motion.button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Cerrar modal"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Sin título: cruz alineada al padding del contenido */}
                {showCloseButton && !title && (
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </motion.button>
                )}

                {/* Content - por defecto scroll aquí; override con contentClassName si el hijo maneja scroll */}
                <div className={contentClassName}>{children}</div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};

export default BaseModal;
