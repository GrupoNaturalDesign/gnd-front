import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TextField } from '../fields/TextField';
import { SelectField } from '../fields/SelectField';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { ModoWizard } from '@/app/hooks/useProductoWizard';

const TALLE_OPTIONS = [
  { value: '2XS', label: '2XS' },
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: '2XL', label: '2XL' },
  { value: '3XL', label: '3XL' },
  { value: '4XL', label: '4XL' },
  { value: '30', label: '30' },
  { value: '32', label: '32' },
  { value: '34', label: '34' },
  { value: '36', label: '36' },
  { value: '38', label: '38' },
  { value: '40', label: '40' },
  { value: '42', label: '42' },
  { value: '44', label: '44' },
  { value: '46', label: '46' },
  { value: '48', label: '48' },
  { value: '50', label: '50' },
  { value: '52', label: '52' },
  { value: '54', label: '54' },
  { value: '56', label: '56' },
];

interface ProductoDatosComunesStepProps {
  modo: ModoWizard;
  nombre: string;
  codigoBase: string;
  codigoCompleto?: string;
  productoPadreNombre?: string;
  siguienteNumeroSugerido?: number;
  variante?: {
    talle: string | null;
    color: string | null;
  };
  onTalleChange?: (value: string | null) => void;
  onColorChange?: (value: string | null) => void;
  onNombreChange: (value: string) => void;
  onCodigoBaseChange: (value: string) => void;
  onCodigoCompletoChange?: (value: string) => void;
  errors: {
    nombre?: string;
    codigoBase?: string;
    codigoCompleto?: string;
    talle?: string;
    color?: string;
  };
  isValidatingCodigo?: boolean;
  codigoValido?: boolean;
  codigoMensaje?: string;
}

export const ProductoDatosComunesStep: React.FC<ProductoDatosComunesStepProps> = ({
  modo,
  nombre,
  codigoBase,
  codigoCompleto,
  productoPadreNombre,
  siguienteNumeroSugerido,
  variante,
  onTalleChange,
  onColorChange,
  onNombreChange,
  onCodigoBaseChange,
  onCodigoCompletoChange,
  errors,
  isValidatingCodigo = false,
  codigoValido,
  codigoMensaje,
}) => {
  const [sufijoCodigo, setSufijoCodigo] = useState(siguienteNumeroSugerido?.toString() || '');

  // Inicializar el sufijo cuando cambia el siguienteNumeroSugerido
  // NO llamar a onCodigoCompletoChange aquí para evitar loops infinitos
  // Se llamará cuando el usuario cambie el sufijo manualmente
  useEffect(() => {
    if (modo === 'crear-variante' && siguienteNumeroSugerido) {
      const sufijoInicial = siguienteNumeroSugerido.toString();
      setSufijoCodigo(sufijoInicial);
    }
  }, [modo, siguienteNumeroSugerido]);

  // Efecto separado para actualizar el código completo cuando cambia el sufijo o codigoBase
  // Solo se ejecuta cuando el usuario cambia el sufijo manualmente
  useEffect(() => {
    if (modo === 'crear-variante' && sufijoCodigo && codigoBase && onCodigoCompletoChange) {
      onCodigoCompletoChange(codigoBase + sufijoCodigo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sufijoCodigo, codigoBase, modo]);

  const handleSufijoChange = (value: string) => {
    // Solo permitir números en el sufijo
    const valorLimpio = value.replace(/[^0-9]/g, '');
    setSufijoCodigo(valorLimpio);
    
    // Reconstruir el código completo: prefijo + sufijo
    if (onCodigoCompletoChange && codigoBase) {
      onCodigoCompletoChange(codigoBase + valorLimpio);
    }
  };

  return (
    <motion.div
      key="datos-comunes"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 pb-2"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Datos comunes</h3>
        <p className="text-sm text-gray-600">
          {modo === 'crear-variante'
            ? 'Ingresa el nombre y código completo de la nueva variante'
            : modo === 'editar'
            ? 'Datos básicos del producto (el código no se puede modificar)'
            : 'Ingresa los datos básicos del producto'}
        </p>
      </div>

      <TextField
        id="nombre"
        name="nombre"
        label="Nombre del producto"
        value={nombre}
        onChange={(e) => onNombreChange(e.target.value)}
        placeholder="Ej: Bermuda Endure"
        error={errors.nombre}
        required={modo !== 'editar' && modo !== 'crear-variante'}
        disabled={modo === 'editar' || modo === 'crear-variante'}
        readOnly={modo === 'editar' || modo === 'crear-variante'}
      />

      {modo === 'crear-variante' && productoPadreNombre && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Producto Padre:</strong> {productoPadreNombre}
          </p>
          {siguienteNumeroSugerido && (
            <p className="text-xs text-blue-600 mt-1">
              Sugerencia: El siguiente número sería {siguienteNumeroSugerido}
            </p>
          )}
        </div>
      )}

      {modo === 'crear-variante' ? (
        <div>
          <label className="block text-sm font-medium mb-2">
            Código Completo de la Variante <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-0">
            {/* Prefijo NO EDITABLE */}
            <div className="px-4 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 text-gray-700 font-mono text-sm flex items-center">
              {codigoBase}
            </div>
            {/* Sufijo EDITABLE */}
            <div className="relative flex-1">
              <input
                type="text"
                value={sufijoCodigo}
                onChange={(e) => handleSufijoChange(e.target.value)}
                placeholder={siguienteNumeroSugerido?.toString() || "1"}
                className={`w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm ${
                  errors.codigoCompleto ? 'border-red-500' : 'border-gray-300'
                } ${isValidatingCodigo ? 'pr-10' : ''} ${
                  codigoValido === true ? 'border-green-500' : codigoValido === false ? 'border-red-500' : ''
                }`}
              />
              {isValidatingCodigo && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
              {!isValidatingCodigo && codigoValido === true && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
              {!isValidatingCodigo && codigoValido === false && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
          </div>
          {errors.codigoCompleto && (
            <p className="mt-1 text-sm text-red-500">{errors.codigoCompleto}</p>
          )}
          {codigoMensaje && (
            <p className={`mt-1 text-sm ${codigoValido ? 'text-green-600' : 'text-red-500'}`}>
              {codigoMensaje}
            </p>
          )}

          {/* Talle y color de la variante */}
          {onTalleChange && onColorChange && (
            <div className="border-t pt-6 mt-6 space-y-4">
              <h4 className="text-md font-semibold mb-2">Datos de la variante</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  id="talle"
                  name="talle"
                  label="Talle"
                  value={variante?.talle || ''}
                  onChange={(e) => onTalleChange(e.target.value || null)}
                  options={TALLE_OPTIONS}
                  placeholder="Seleccionar talle"
                  error={errors.talle}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variante?.color || ''}
                    onChange={(e) => onColorChange(e.target.value || null)}
                    placeholder="Ej: Celeste, Negro, Blanco"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                      errors.color ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.color && (
                    <p className="mt-1 text-sm text-red-500">{errors.color}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <TextField
          id="codigoBase"
          name="codigoBase"
          label="Código base"
          value={codigoBase}
          onChange={(e) => onCodigoBaseChange(e.target.value)}
          placeholder="Ej: L-WW-BER-END"
          error={errors.codigoBase}
          required
          disabled={false}
        />
      )}
    </motion.div>
  );
};

