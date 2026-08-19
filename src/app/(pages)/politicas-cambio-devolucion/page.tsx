import { BRAND_NAME, WHATSAPP_PHONE_NUMBER, getWhatsAppNumberForUrl } from '@/app/utils/constants';
import { generatePageMetadata } from '@/app/utils/seo';

export const metadata = generatePageMetadata(
    `Políticas de Cambio y Devolución | ${BRAND_NAME}`,
    `Políticas de cambio y devolución de ${BRAND_NAME}. Conocé nuestros términos y condiciones para cambios y devoluciones.`,
    '/politicas-cambio-devolucion'
);

export default function PoliticasCambioDevolucion() {
    return (
        <div className="min-h-screen bg-gray-100/50 py-8 md:py-12">
            <div className="mx-auto max-w-[42rem] px-4">
                <article className="bg-white shadow-sm border border-gray-200/80 rounded-sm px-6 md:px-10 py-8 md:py-10">
                    <h1 className="text-lg font-semibold text-black tracking-tight mb-6 uppercase">
                        Políticas de cambio y devolución
                    </h1>

                    <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
                        <p>
                            Los cambios se aceptan dentro de los 10 días hábiles posteriores a la entrega, siempre que las prendas no hayan sido usadas, lavadas ni personalizadas.
                        </p>

                        <p>
                            En caso de bordado o estampa institucional, no se aceptan devoluciones una vez aprobado el diseño.
                        </p>

                        <p>
                            Si el producto presenta defectos de fabricación, deberá informarse dentro de las 48 hs. de recibido para coordinar el reemplazo sin costo.
                        </p>

                        <p>
                            Los cambios se gestionan con el vendedor asignado, quien coordinará el retiro o reposición según la ubicación del cliente.
                        </p>

                        <p>
                            Para prendas con talles especiales, se fabrican bajo pedido y no poseen cambio.
                        </p>

                        <p>
                            Ante cualquier consulta, podés comunicarte con nuestro equipo comercial a través del formulario o por WhatsApp, de lunes a viernes de 8 a 17 hs.
                        </p>

                        <h2 className="text-base font-semibold text-black mt-8 mb-3 uppercase pt-2 border-t border-gray-200">
                            Cambios
                        </h2>

                        <p>
                            Comunícate con nuestro Centro de Atención al Cliente a través de WhatsApp al número <a href={`https://wa.me/${getWhatsAppNumberForUrl()}`} className="text-[#Ed3237] hover:underline">{WHATSAPP_PHONE_NUMBER}</a> indicando: número de pedido, producto que deseás cambiar y el motivo. Para facilitar el trabajo de nuestros asesores podés adjuntarnos una foto.
                        </p>

                        <p>
                            Los cambios se encuentran sujetos a disponibilidad de stock. En caso de no contar con la misma prenda, se puede elegir otra de igual o mayor valor abonando diferencia, respecto al precio de la compra inicial.
                        </p>

                        <p>
                            Los productos deben estar en su packaging original y con la etiqueta puesta en la prenda, (en caso que la prenda contenga) en perfecto estado, deberán estar acompañados por la factura de compra.
                        </p>

                        <p>
                            Los costos del mismo, correrán por cuenta del cliente. Nosotros hacemos todas las gestiones.
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
}

