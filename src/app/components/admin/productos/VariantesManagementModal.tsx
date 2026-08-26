'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BaseModal from '@/app/components/modal/BaseModal';
import type { ProductoPadreConVariantes } from '@/app/types/producto.types';
import { formatNombreConGenero } from './columns';
import { VariantesStockTable } from './VariantesStockTable';
import { ColoresPendientesPanel } from './ColoresPendientesPanel';
import { VariantesImagesManager } from './VariantesImagesManager';
import { DocumentosManager } from './DocumentosManager';

export default VariantesManagementModal;

interface VariantesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoPadreConVariantes | null;
  onSuccess?: () => void;
  loadingVariantes?: boolean;
}

type TabType = 'stock' | 'images' | 'documentos';

function VariantesManagementModal({
  isOpen,
  onClose,
  producto,
  onSuccess,
  loadingVariantes = false,
}: VariantesManagementModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const variantes = useMemo(() => {
    return producto?.productosWeb || [];
  }, [producto]);

  if (!producto) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'stock', label: 'Stock y Precios' },
    { id: 'images', label: 'Imágenes' },
    { id: 'documentos', label: 'Documentos' },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full pr-10">
          <span>Gestionar Variantes: {formatNombreConGenero(producto.nombre, producto.genero)}</span>
          {hasUnsavedChanges && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
            >
              <span className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
              Cambios sin guardar
            </motion.span>
          )}
        </div>
      }
      size="xl"
      className="max-w-6xl h-[80vh] min-h-0 flex flex-col"
      contentClassName="flex flex-1 min-h-0 flex-col overflow-hidden overscroll-contain p-6"
    >
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - altura fija, tabla scrollea internamente */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'stock' && (
              <motion.div
                key="stock"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex h-full min-h-0 flex-col"
              >
                {loadingVariantes ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                    Cargando variantes (incluye bloqueadas)…
                  </div>
                ) : (
                  <>
                    <ColoresPendientesPanel
                      productoPadreId={producto.id}
                      onAprobado={onSuccess}
                    />
                    <VariantesStockTable
                      producto={producto}
                      variantes={variantes}
                      onSuccess={onSuccess}
                      onHasChangesChange={setHasUnsavedChanges}
                    />
                  </>
                )}
              </motion.div>
            )}
            {activeTab === 'images' && (
              <motion.div
                key="images"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex h-full min-h-0 flex-col overflow-hidden"
              >
                <VariantesImagesManager
                  productoPadreId={producto.id}
                  productoNombre={formatNombreConGenero(producto.nombre, producto.genero)}
                  coloresDisponibles={Array.from(
                    new Set(variantes.map((v) => v.color).filter(Boolean))
                  ) as string[]}
                />
              </motion.div>
            )}
            {activeTab === 'documentos' && (
              <motion.div
                key="documentos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex h-full min-h-0 flex-col overflow-auto p-2"
              >
                <DocumentosManager
                  productoPadreId={producto.id}
                  tablaTallesUrl={producto.tablaTallesUrl ?? null}
                  fichaTecnicaUrl={producto.fichaTecnicaUrl ?? null}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BaseModal>
  );
}

