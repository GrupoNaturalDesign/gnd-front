'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { productoService } from '@/app/services/producto.service';
import type { SFactoryItemCreateData, SFactoryItemEditData } from '@/app/services/producto.service';
import type { ProductoPadreConVariantes } from '@/app/types/producto.types';
import type { ModoWizard } from '@/app/hooks/useProductoWizard';
import type { WizardState } from '@/app/hooks/useProductoWizard';
import { parsearErrorBackend } from '@/app/utils/productoFormModal.utils';

export interface ProductoFormModalMutations {
  validarCodigo: (codigo: string) => Promise<{ existe: boolean; mensaje?: string }>;
  crearProducto: (data: SFactoryItemCreateData) => Promise<ProductoPadreConVariantes>;
  actualizarProductoEnSFactory: (params: {
    itemId: number;
    data: SFactoryItemEditData;
  }) => Promise<ProductoPadreConVariantes>;
  actualizarDatosLocales: (params: {
    id: number;
    data: {
      descripcionMarketing?: string;
      descripcionCorta?: string;
      destacado?: boolean;
      nombre?: string;
      descripcion?: string;
    };
  }) => Promise<unknown>;
  actualizarDatosVariante: (params: {
    productoWebId: number;
    data: { talle?: string | null; color?: string | null };
  }) => Promise<unknown>;
}

export interface UseProductoFormModalSubmitParams {
  wizardState: WizardState;
  modo: ModoWizard;
  isEditMode: boolean;
  datosSFactoryParaEdicion: (WizardState['datosSFactory'] & {
    rubro_id: number | null;
    subrubro_id: number | null;
  }) | null;
  validarPaso1: () => boolean;
  validarPaso2: () => boolean;
  validarPaso3: () => boolean;
  validarCodigo: (codigo: string) => Promise<boolean>;
  mutations: ProductoFormModalMutations;
  wizardActions: {
    setPaso: (paso: 1 | 2 | 3) => void;
    siguientePaso: () => void;
    setProductoPadreId: (id: number) => void;
    setProductoWebId: (id: number) => void;
    setItemId: (id: number) => void;
    setCreadoEnSFactory: (creado: boolean) => void;
  };
  setErrorsFromBackend: (errors: Record<string, string>) => void;
  onClose: () => void;
  onSubmit?: (data: ProductoPadreConVariantes) => Promise<void>;
}

export function useProductoFormModalSubmit({
  wizardState,
  modo,
  isEditMode,
  datosSFactoryParaEdicion,
  validarPaso1,
  validarPaso2,
  validarPaso3,
  validarCodigo,
  mutations,
  wizardActions,
  setErrorsFromBackend,
  onClose,
  onSubmit,
}: UseProductoFormModalSubmitParams) {
  const {
    setPaso,
    siguientePaso,
    setProductoPadreId,
    setProductoWebId,
    setItemId,
    setCreadoEnSFactory,
  } = wizardActions;

  const handleSiguiente = useCallback(async () => {
    if (wizardState.pasoActual === 1) {
      if (!validarPaso1()) return;

      if (modo === 'crear-variante' && wizardState.datosComunes.codigoCompleto) {
        const ok = await validarCodigo(wizardState.datosComunes.codigoCompleto);
        if (!ok) return;
      }

      if (modo === 'crear-variante') {
        setPaso(3);
      } else {
        siguientePaso();
      }
    } else if (wizardState.pasoActual === 2) {
      if (!validarPaso2()) return;

      if (isEditMode && wizardState.itemId && datosSFactoryParaEdicion) {
        const orig = datosSFactoryParaEdicion;
        const actual = wizardState.datosSFactory;
        const mismosDatos =
          (orig.rubro_id === actual.rubro_id ||
            (orig.rubro_id == null && actual.rubro_id == null)) &&
          (orig.subrubro_id === actual.subrubro_id ||
            (orig.subrubro_id == null && actual.subrubro_id == null)) &&
          (orig.descrip_corta ?? '') === (actual.descrip_corta ?? '') &&
          (orig.detalle ?? '') === (actual.detalle ?? '') &&
          (orig.um_id ?? 1) === (actual.um_id ?? 1);
        if (mismosDatos) {
          siguientePaso();
          return;
        }
      }

      try {
        const codigo =
          modo === 'crear-variante'
            ? wizardState.datosComunes.codigoCompleto!
            : wizardState.datosComunes.codigoBase;
        const descripcionParaSFactory =
          isEditMode && wizardState.itemId && datosSFactoryParaEdicion
            ? datosSFactoryParaEdicion.descripcion ?? ''
            : (wizardState.datosSFactory.descripcion?.trim() ||
                wizardState.datosComunes.nombre) as string;

        const datosSFactoryCompletos: SFactoryItemCreateData = {
          ...wizardState.datosSFactory,
          codigo: codigo || undefined,
          tipo: 'P',
          descripcion: descripcionParaSFactory,
          item_venta: 1,
          um_id: wizardState.datosSFactory.um_id || 1,
        };

        let productoCreado: ProductoPadreConVariantes;
        if (isEditMode && wizardState.itemId) {
          // En edición no mandar descripcion a SFactory: solo lecturas (el sync usa esa descripción para el padre).
          const { descripcion: _desc, ...dataSinDescripcion } = datosSFactoryCompletos;
          productoCreado = await mutations.actualizarProductoEnSFactory({
            itemId: wizardState.itemId,
            data: {
              ...dataSinDescripcion,
              item_id: wizardState.itemId,
            } as SFactoryItemEditData,
          });
        } else {
          productoCreado = await mutations.crearProducto(datosSFactoryCompletos);
        }

        setProductoPadreId(productoCreado.id);
        if (productoCreado.productosWeb && productoCreado.productosWeb.length > 0) {
          setProductoWebId(productoCreado.productosWeb[0].id);
          setItemId(productoCreado.productosWeb[0].sfactoryId);
        }
        setCreadoEnSFactory(true);
        toast.success('Producto creado/actualizado en SFactory correctamente');
        siguientePaso();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al crear/actualizar producto en SFactory';
        const erroresBackend = parsearErrorBackend(errorMessage);
        if (Object.keys(erroresBackend).length > 0) {
          setErrorsFromBackend(erroresBackend);
        }
        toast.error(errorMessage);
      }
    }
  }, [
    wizardState.pasoActual,
    wizardState.datosComunes,
    wizardState.datosSFactory,
    wizardState.itemId,
    modo,
    isEditMode,
    datosSFactoryParaEdicion,
    validarPaso1,
    validarPaso2,
    validarCodigo,
    mutations,
    setPaso,
    siguientePaso,
    setProductoPadreId,
    setProductoWebId,
    setItemId,
    setCreadoEnSFactory,
    setErrorsFromBackend,
  ]);

  const handleFinalizar = useCallback(async () => {
    if (!validarPaso3()) return;

    try {
      let productoWebIdFinal = wizardState.productoWebId;

      if (
        modo === 'crear-producto' &&
        wizardState.variante.talle &&
        wizardState.variante.color &&
        !wizardState.productoWebId
      ) {
        const codigoVariante = `${wizardState.datosComunes.codigoBase}1`;
        const datosVarianteSFactory: SFactoryItemCreateData = {
          ...wizardState.datosSFactory,
          codigo: codigoVariante,
          tipo: 'P',
          descripcion: (wizardState.datosSFactory.descripcion?.trim() ||
            wizardState.datosComunes.nombre) as string,
          item_venta: 1,
          um_id: wizardState.datosSFactory.um_id || 1,
        };

        const varianteCreada = await mutations.crearProducto(datosVarianteSFactory);
        if (varianteCreada.productosWeb && varianteCreada.productosWeb.length > 0) {
          productoWebIdFinal = varianteCreada.productosWeb[0].id;
          const itemId = varianteCreada.productosWeb[0].sfactoryId;
          await mutations.actualizarDatosVariante({
            productoWebId: productoWebIdFinal,
            data: {
              talle: wizardState.variante.talle,
              color: wizardState.variante.color,
            },
          });
          setProductoWebId(productoWebIdFinal);
          setItemId(itemId);
          toast.success('Variante creada correctamente');
        }
      }

      if (wizardState.productoPadreId) {
        await mutations.actualizarDatosLocales({
          id: wizardState.productoPadreId,
          data: {
            descripcionMarketing: wizardState.datosLocales.descripcionMarketing,
            descripcionCorta: wizardState.datosLocales.descripcionCorta,
            destacado: wizardState.datosLocales.destacado,
            nombre: wizardState.datosComunes.nombre,
            descripcion: wizardState.datosLocales.descripcion,
          },
        });
      }

      if (
        modo === 'crear-variante' &&
        wizardState.productoPadreId &&
        !wizardState.productoWebId
      ) {
        const productoPadre = await productoService.obtenerDatosPlantilla(
          wizardState.productoPadreId
        );
        if (
          !productoPadre.datosSFactory.rubro_id ||
          !productoPadre.datosSFactory.subrubro_id
        ) {
          throw new Error(
            'El producto padre no tiene rubro_id o subrubro_id. No se puede crear la variante sin estos datos.'
          );
        }

        const datosVarianteSFactory: SFactoryItemCreateData = {
          rubro_id: productoPadre.datosSFactory.rubro_id,
          subrubro_id: productoPadre.datosSFactory.subrubro_id,
          um_id: productoPadre.datosSFactory.um_id || 1,
          moneda_id: productoPadre.datosSFactory.moneda_id || 1,
          ...productoPadre.datosSFactory,
          codigo: wizardState.datosComunes.codigoCompleto!,
          tipo: 'P',
          descripcion: (productoPadre.datosSFactory.descripcion?.trim() ||
            productoPadre.datosLocales.nombre) as string,
          item_venta: 1,
        };

        const varianteCreada = await mutations.crearProducto(datosVarianteSFactory);
        if (varianteCreada.productosWeb && varianteCreada.productosWeb.length > 0) {
          productoWebIdFinal = varianteCreada.productosWeb[0].id;
          const itemId = varianteCreada.productosWeb[0].sfactoryId;
          await mutations.actualizarDatosVariante({
            productoWebId: productoWebIdFinal,
            data: {
              talle: wizardState.variante.talle,
              color: wizardState.variante.color,
            },
          });
          setProductoWebId(productoWebIdFinal);
          setItemId(itemId);
          toast.success('Variante creada correctamente');
        }
      } else if (modo === 'crear-variante' && wizardState.productoWebId) {
        await mutations.actualizarDatosVariante({
          productoWebId: wizardState.productoWebId,
          data: {
            talle: wizardState.variante.talle,
            color: wizardState.variante.color,
          },
        });
      }

      toast.success('Producto guardado correctamente');
      if (onSubmit && wizardState.productoPadreId) {
        const productoFinal = await productoService.getById(
          wizardState.productoPadreId,
          { includeVariantes: true }
        );
        await onSubmit(productoFinal);
      }
      onClose();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar datos locales'
      );
    }
  }, [
    wizardState,
    modo,
    validarPaso3,
    mutations,
    setProductoWebId,
    setItemId,
    onSubmit,
    onClose,
  ]);

  return { handleSiguiente, handleFinalizar };
}
