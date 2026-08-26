// Tipos basados en el backend gnd-back/src/types/producto.types.ts

export interface ProductoPrecio {
  id: number;
  productoWebId: number;
  tipoCliente: 'minorista' | 'mayorista';
  precio: number; // Compatibilidad
  precioLista: number;
  precioTransfer: number | null;
  cuotasFinanciado: number | null;
  precioSinImp: number | null;
  minimoUnidades: number | null;
}

export type MotivoInactivoVariante =
  | 'activa'
  | 'sin_stock_deposito'
  | 'pendiente_aprobacion'
  | 'sin_color';

export interface ProductoWebResponse {
  id: number;
  empresaId: number;
  productoPadreId: number;
  sfactoryId: number;
  sfactoryCodigo: string;
  sfactoryBarcode: string | null;
  nombre: string;
  descripcionCompleta: string | null;
  sexo: string | null;
  talle: string | null;
  color: string | null;
  precioCache: number | null;
  stockCache: number | null;
  ultimaSyncSfactory: string | null; // ISO date string
  activoSfactory: boolean;
  /** Presente cuando el padre se pide con variantesScope=todas */
  motivoInactivo?: MotivoInactivoVariante;
  imagenVariante: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  precios?: ProductoPrecio[];
}

export interface ProductoPadreResponse {
  id: number;
  empresaId: number;
  codigoAgrupacion: string;
  nombre: string;
  descripcion: string | null;
  agrupacionTipo: 'automatico' | 'manual' | 'hibrido';
  agrupacionConfirmada: boolean;
  rubroId: number | null;
  subrubroId: number | null;
  linea: string | null;
  material: string | null;
  um: string | null;
  publicado: boolean;
  destacado: boolean;
  orden: number;
  descripcionMarketing: string | null;
  descripcionCorta: string | null;
  slug: string | null;
  genero: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  imagenes: any | null;
  videoUrl: string | null;
  fichaTecnicaUrl: string | null;
  tablaTallesUrl: string | null;
  camposPersonalizados: any | null;
  coloresDisponibles: any | null;
  tallesDisponibles: any | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ProductoPadreConVariantes extends ProductoPadreResponse {
  productosWeb?: ProductoWebResponse[];
  rubro?: {
    id: number;
    nombre: string;
    slug: string | null;
  } | null;
  subrubro?: {
    id: number;
    nombre: string;
    slug: string | null;
  } | null;
  _count?: {
    productosWeb: number;
  };
  coloresPendientesCount?: number;
}

export interface ProductoQueryParams {
  empresaId?: number;
  rubroId?: number;
  subrubroId?: number;
  publicado?: boolean;
  destacado?: boolean;
  includeVariantes?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

