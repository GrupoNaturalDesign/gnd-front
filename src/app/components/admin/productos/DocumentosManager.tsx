'use client';

import React, { useRef, useState } from 'react';
import { Upload, Trash2, FileText, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import {
  useUploadTablaTalles,
  useDeleteTablaTalles,
  useUploadFichaTecnica,
  useDeleteFichaTecnica,
} from '@/app/hooks/useProductoDocumentos';
import { normalizeImageUrl } from '@/app/utils/normalizeImageUrl';
import { compressImage } from '@/app/utils/compressImage';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface DocumentosManagerProps {
  productoPadreId: number;
  tablaTallesUrl: string | null;
  fichaTecnicaUrl: string | null;
}

type DocTipo = 'tabla-talles' | 'ficha-tecnica';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPdf(url: string | null): boolean {
  if (!url) return false;
  // Ignorar query (?v=…) al detectar extensión
  const pathOnly = url.split('?')[0]?.toLowerCase() ?? '';
  return pathOnly.endsWith('.pdf');
}

/** Usa la misma base que las imágenes de producto (NEXT_PUBLIC_IMAGES_BASE_URL) */
function getPublicUrl(url: string): string {
  const normalized = normalizeImageUrl(url);
  return normalized ?? url;
}

// ---------------------------------------------------------------------------
// DocumentoCard — tarjeta individual para un documento
// ---------------------------------------------------------------------------

interface DocumentoCardProps {
  label: string;
  url: string | null;
  isUploading: boolean;
  isDeleting: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

function DocumentoCard({
  label,
  url,
  isUploading,
  isDeleting,
  onUpload,
  onDelete,
}: DocumentoCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const publicUrl = url ? getPublicUrl(url) : null;
  const esPdf = isPdf(url);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isImage = file.type.startsWith('image/');
    if (isImage) {
      setCompressing(true);
      try {
        const compressed = await compressImage(file);
        onUpload(compressed);
      } catch {
        toast.error('Error al comprimir la imagen');
      } finally {
        setCompressing(false);
      }
    } else {
      onUpload(file);
    }
  };

  return (
    <div className="border rounded-lg p-5 space-y-4 bg-white">
      <h4 className="font-medium text-gray-800">{label}</h4>

      {/* Vista previa / estado actual */}
      {publicUrl ? (
        <div className="space-y-3">
          {esPdf ? (
            /* PDF — mostrar ícono + link */
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">Documento PDF cargado</p>
                <p className="text-xs text-gray-500 truncate">{url}</p>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver
              </a>
            </div>
          ) : (
            /* Imagen — preview */
            <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                key={publicUrl}
                src={publicUrl}
                alt={label}
                className="w-full max-h-48 object-contain"
              />
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Ver en tamaño completo"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Acciones cuando hay archivo */}
          <div className="flex gap-2">
            <Button
              variant="grayOutline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting || compressing}
              className="flex-1"
            >
              {compressing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Comprimiendo...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Reemplazar
                </>
              )}
            </Button>
            <Button
              variant="grayOutline"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting || isUploading}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Sin documento — área de upload */
        <div
          onClick={() => !compressing && !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        >
          {compressing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Comprimiendo imagen...</p>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Subiendo documento...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 mb-3">
                <ImageIcon className="h-8 w-8 text-gray-300" />
                <FileText className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-600 text-sm font-medium">
                Haz clic para subir
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WEBP o PDF (máx. 10MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function DocumentosManager({
  productoPadreId,
  tablaTallesUrl,
  fichaTecnicaUrl,
}: DocumentosManagerProps) {
  const [confirmDelete, setConfirmDelete] = useState<DocTipo | null>(null);

  const uploadTablaMutation = useUploadTablaTalles();
  const deleteTablaMutation = useDeleteTablaTalles();
  const uploadFichaMutation = useUploadFichaTecnica();
  const deleteFichaMutation = useDeleteFichaTecnica();

  const handleUpload = async (tipo: DocTipo, file: File) => {
    try {
      if (tipo === 'tabla-talles') {
        await uploadTablaMutation.mutateAsync({ productoPadreId, file });
        toast.success('Tabla de talles subida exitosamente');
      } else {
        await uploadFichaMutation.mutateAsync({ productoPadreId, file });
        toast.success('Ficha técnica subida exitosamente');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al subir el documento'
      );
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete === 'tabla-talles') {
        await deleteTablaMutation.mutateAsync(productoPadreId);
        toast.success('Tabla de talles eliminada');
      } else {
        await deleteFichaMutation.mutateAsync(productoPadreId);
        toast.success('Ficha técnica eliminada');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar el documento'
      );
    } finally {
      setConfirmDelete(null);
    }
  };

  const confirmLabel =
    confirmDelete === 'tabla-talles' ? 'la tabla de talles' : 'la ficha técnica';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Subí la tabla de talles y las indicaciones de bordado para este producto.
        Se aceptan imágenes (JPG, PNG, WEBP) o PDF.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocumentoCard
          label="Tabla de Talles"
          url={tablaTallesUrl}
          isUploading={uploadTablaMutation.isPending}
          isDeleting={deleteTablaMutation.isPending}
          onUpload={(file) => handleUpload('tabla-talles', file)}
          onDelete={() => setConfirmDelete('tabla-talles')}
        />

        <DocumentoCard
          label="Indicaciones de Bordado / Ficha Técnica"
          url={fichaTecnicaUrl}
          isUploading={uploadFichaMutation.isPending}
          isDeleting={deleteFichaMutation.isPending}
          onUpload={(file) => handleUpload('ficha-tecnica', file)}
          onDelete={() => setConfirmDelete('ficha-tecnica')}
        />
      </div>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar documento"
        message={`¿Está seguro de que desea eliminar ${confirmLabel}?`}
        type="confirm"
        confirmText="Eliminar"
        loading={deleteTablaMutation.isPending || deleteFichaMutation.isPending}
      />
    </div>
  );
}
