import axios from 'axios';
import { env } from '../config/env';
import type { Tool } from './registry';

/**
 * Calcula la cotizacion de importacion.
 *
 * Esta es la herramienta que sostiene la regla central del proyecto: el modelo
 * no hace cuentas. Todo lo que el agente dice sobre dinero tiene que haber
 * pasado por aqui, y de aqui salio del motor de Python, que a su vez solo usa
 * tasas con fuente y fecha.
 *
 * Se le devuelve al modelo la cotizacion completa, incluidos los supuestos y
 * la confianza. Darle solo el total seria mas corto, pero entonces no podria
 * advertir al usuario de lo que no esta verificado.
 */
export const calcularCotizacionTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'calcular_cotizacion',
      description:
        'Calcula el costo de importar un medicamento a Jalisco: valor en aduana, IGI, DTA, ' +
        'IVA y total, mas los permisos necesarios. Devuelve cada cifra con su fuente y los ' +
        'supuestos que se tuvieron que asumir. Usa esta herramienta para CUALQUIER cifra que ' +
        'vayas a decir: nunca calcules tu.',
      parameters: {
        type: 'object',
        properties: {
          fraccion: {
            type: 'string',
            description: 'Fraccion arancelaria, por ejemplo "3004.31.01".',
          },
          valor_mercancia_usd: {
            type: 'number',
            description: 'Valor de la mercancia en dolares, sin flete ni seguro.',
          },
          flete_usd: {
            type: 'number',
            description:
              'Costo del flete en dolares. Lo da el cliente. Si no lo tienes, pidelo: no lo estimes.',
          },
          seguro_usd: {
            type: 'number',
            description: 'Costo del seguro en dolares. Lo da el cliente.',
          },
          tipo_de_cambio: {
            type: 'number',
            description: 'Pesos mexicanos por dolar.',
          },
          origen: {
            type: 'string',
            description: 'Pais o ciudad de donde sale la mercancia.',
          },
          destino: {
            type: 'string',
            description: 'Destino en Mexico. Por omision, Guadalajara, Jalisco.',
          },
          es_medicina_de_patente: {
            type: 'boolean',
            description:
              'Solo en true si el usuario lo declaro. Cambia la tasa de IVA, asi que no lo ' +
              'asumas tu: si no lo dijeron, va en false.',
          },
        },
        required: [
          'fraccion',
          'valor_mercancia_usd',
          'flete_usd',
          'seguro_usd',
          'tipo_de_cambio',
          'origen',
        ],
      },
    },
  },

  async run(args) {
    const { data } = await axios.post(
      `${env.gatewayUrl}/api/v1/cotizacion`,
      {
        fraccion: args.fraccion,
        valor_mercancia_usd: args.valor_mercancia_usd,
        flete_usd: args.flete_usd,
        seguro_usd: args.seguro_usd,
        tipo_de_cambio: args.tipo_de_cambio,
        origen: args.origen,
        destino: args.destino ?? 'Guadalajara, Jalisco',
        es_medicina_de_patente: args.es_medicina_de_patente ?? false,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20_000 }
    );

    // Se le entrega al modelo lo que necesita para redactar y para advertir.
    return {
      folio: data.folio,
      fraccion: data.fraccion,
      descripcion: data.descripcion_fraccion,
      valor_en_aduana_mxn: data.valor_en_aduana_mxn,
      igi: { tasa_pct: data.igi.tasa_pct, monto_mxn: data.igi.monto_mxn, fuente: data.igi.fuente },
      dta: { tasa_pct: data.dta.tasa_pct, monto_mxn: data.dta.monto_mxn, fuente: data.dta.fuente },
      iva: { tasa_pct: data.iva.tasa_pct, monto_mxn: data.iva.monto_mxn, fuente: data.iva.fuente },
      total_mxn: data.total_mxn,
      costos_no_incluidos: data.costos_no_incluidos.map((c: any) => c.concepto),
      supuestos: data.supuestos.map((s: any) => s.descripcion),
      documentos_obligatorios: data.documentos
        .filter((d: any) => d.obligatorio)
        .map((d: any) => d.nombre),
      confianza: data.confianza,
      advertencia: data.advertencia,
    };
  },
};
