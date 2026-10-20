import axios from 'axios';
import { env } from '../config/env';
import type { Tool } from './registry';

/**
 * Busca la fraccion arancelaria de un medicamento.
 *
 * Devuelve varias candidatas a proposito. Clasificar mercancia en la TIGIE es
 * una decision tecnica con consecuencias legales: si el agente se quedara con
 * una sola fraccion, estaria tomando esa decision en lugar del agente aduanal.
 * Entregar candidatas y dejar que la persona elija es mas lento y mas honesto.
 */
export const buscarFraccionTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'buscar_fraccion',
      description:
        'Busca fracciones arancelarias del capitulo 30 (medicamentos) que coincidan con ' +
        'el nombre o la descripcion de un producto. Usala cuando no te den la fraccion. ' +
        'Devuelve varias candidatas con su tasa de IGI; tu eliges la que mejor coincida ' +
        'y le dices al usuario cual elegiste.',
      parameters: {
        type: 'object',
        properties: {
          consulta: {
            type: 'string',
            description:
              'Nombre del medicamento o principio activo, por ejemplo "insulina" o ' +
              '"antibiotico inyectable".',
          },
        },
        required: ['consulta'],
      },
    },
  },

  async run(args) {
    const { data } = await axios.get(`${env.gatewayUrl}/api/v1/fracciones/buscar`, {
      params: { q: args.consulta },
      timeout: 15_000,
    });

    return {
      consulta: data.consulta,
      candidatas: data.candidatas,
      advertencia: data.advertencia,
    };
  },
};
