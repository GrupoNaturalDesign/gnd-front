import React from 'react';
import { motion } from 'framer-motion';
import { TextField } from '../fields/TextField';
import { TextAreaField } from '../fields/TextAreaField';
import { SelectField } from '../fields/SelectField';
import { CheckboxField } from '../fields/CheckboxField';
import type { ProductoFormData } from '@/app/hooks/useProductoForm';
import type { RubroResponse } from '@/app/types/rubro.types';
import type { SubrubroResponse } from '@/app/types/rubro.types';

interface ProductoInfoStepProps {
  formData: ProductoFormData;
  errors: Record<string, string>;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onRubroChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  rubrosData?: RubroResponse[];
  subrubrosData?: SubrubroResponse[];
}

const SEXO_OPTIONS = [
  { value: 'Hombre', label: 'Hombre' },
  { value: 'Mujer', label: 'Mujer' },
  { value: 'Unisex', label: 'Unisex' },
  { value: 'Niño', label: 'Niño' },
  { value: 'Niña', label: 'Niña' },
];

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
];

export const ProductoInfoStep: React.FC<ProductoInfoStepProps> = ({
  formData,
  errors,
  onFieldChange,
  onRubroChange,
  rubrosData,
  subrubrosData,
}) => {
  const rubroOptions = rubrosData?.map((rubro) => ({
    value: rubro.id.toString(),
    label: rubro.nombre,
  })) || [];

  const subrubroOptions = subrubrosData?.map((subrubro) => ({
    value: subrubro.id.toString(),
    label: subrubro.nombre,
  })) || [];

  return (
    <motion.div
      key="info"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 px-2"
    >
      <TextField
        id="nombre"
        name="nombre"
        label="Nombre"
        value={formData.nombre}
        onChange={onFieldChange}
        placeholder="Nombre del producto"
        error={errors.nombre}
        required
      />

      <TextField
        id="codigoAgrupacion"
        name="codigoAgrupacion"
        label="Código de Agrupación"
        value={formData.codigoAgrupacion}
        onChange={onFieldChange}
        placeholder="Código único de agrupación"
        error={errors.codigoAgrupacion}
        required
      />

      <TextField
        id="descripcionCorta"
        name="descripcionCorta"
        label="Descripción Corta"
        value={formData.descripcionCorta}
        onChange={onFieldChange}
        placeholder="Descripción breve del producto"
      />

      <TextAreaField
        id="descripcion"
        name="descripcion"
        label="Descripción Completa"
        value={formData.descripcion}
        onChange={onFieldChange}
        placeholder="Descripción detallada del producto"
        rows={4}
      />

      <TextAreaField
        id="descripcionMarketing"
        name="descripcionMarketing"
        label="Descripción Marketing"
        value={formData.descripcionMarketing}
        onChange={onFieldChange}
        placeholder="Descripción para marketing y SEO"
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          id="rubroId"
          name="rubroId"
          label="Rubro"
          value={formData.rubroId}
          onChange={onRubroChange}
          options={rubroOptions}
          placeholder="Seleccionar rubro"
        />

        <SelectField
          id="subrubroId"
          name="subrubroId"
          label="Subrubro"
          value={formData.subrubroId}
          onChange={onFieldChange}
          options={subrubroOptions}
          placeholder={formData.rubroId ? 'Seleccionar subrubro' : 'Primero selecciona un rubro'}
          disabled={!formData.rubroId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          id="sexo"
          name="sexo"
          label="Sexo"
          value={formData.sexo}
          onChange={onFieldChange}
          options={SEXO_OPTIONS}
          placeholder="Seleccionar sexo"
        />

        <SelectField
          id="talle"
          name="talle"
          label="Talle"
          value={formData.talle}
          onChange={onFieldChange}
          options={TALLE_OPTIONS}
          placeholder="Seleccionar talle"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <CheckboxField
          name="destacado"
          label="Destacado"
          checked={formData.destacado}
          onChange={onFieldChange}
        />
      </div>
    </motion.div>
  );
};

