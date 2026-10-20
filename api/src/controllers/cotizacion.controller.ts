import { Router, type Request, type Response } from 'express';
import axios from 'axios';
import { env } from '../config/env';

const router = Router();

/**
 * Revisa el cuerpo antes de molestar al motor de calculo.
 *
 * Validar aqui ahorra un viaje de red y, mas importante, deja los mensajes de
 * error en espanol y en terminos que el operador entiende, en lugar del
 * formato tecnico que devolveria Pydantic.
 */
function revisar(cuerpo: any): string[] {
  const errores: string[] = [];

  if (!cuerpo?.fraccion?.trim()) {
    errores.push('Falta la fraccion arancelaria.');
  }

  const positivos: Array<[string, string]> = [
    ['valor_mercancia_usd', 'El valor de la mercancia'],
    ['tipo_de_cambio', 'El tipo de cambio'],
  ];
  for (const [campo, nombre] of positivos) {
    const valor = Number(cuerpo?.[campo]);
    if (!Number.isFinite(valor) || valor <= 0) {
      errores.push(`${nombre} tiene que ser un numero mayor que cero.`);
    }
  }

  const noNegativos: Array<[string, string]> = [
    ['flete_usd', 'El flete'],
    ['seguro_usd', 'El seguro'],
  ];
  for (const [campo, nombre] of noNegativos) {
    const valor = Number(cuerpo?.[campo] ?? 0);
    if (!Number.isFinite(valor) || valor < 0) {
      errores.push(`${nombre} no puede ser negativo.`);
    }
  }

  if (!cuerpo?.origen?.trim()) {
    errores.push('Falta el pais o la ciudad de origen.');
  }

  return errores;
}

/** Traduce una falla del motor en una respuesta que la pantalla pueda mostrar. */
function responderError(error: unknown, res: Response) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'El motor de calculo rechazo la cotizacion',
        detalle: error.response.data,
      });
    }
    return res.status(503).json({
      error: 'El motor de calculo no responde',
      detalle: `No se pudo contactar ${env.coreUrl}. Revisa que este levantado.`,
    });
  }

  console.error('[cotizacion] Error no controlado:', error);
  return res.status(500).json({ error: 'Falla interna del gateway' });
}

/**
 * POST /api/v1/cotizacion
 *
 * Cotiza una importacion. El gateway no calcula nada: valida, reenvia al motor
 * de Python y devuelve su respuesta tal cual. Tenerlo en un solo lugar
 * significa que la interfaz y el agente consumen exactamente la misma
 * cotizacion, sin que ninguno de los dos pueda alterar una cifra.
 */
router.post('/', async (req: Request, res: Response) => {
  const errores = revisar(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ error: 'Datos de la cotizacion invalidos', errores });
  }

  try {
    const { data } = await axios.post(`${env.coreUrl}/api/v1/cotizacion`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: env.coreTimeoutMs,
    });
    return res.status(201).json(data);
  } catch (error) {
    return responderError(error, res);
  }
});

export default router;
