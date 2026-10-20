import { Router, type Request, type Response } from 'express';
import axios from 'axios';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/v1/fracciones/buscar?q=insulina
 *
 * Acerca fracciones arancelarias candidatas para un texto libre. Devuelve
 * varias a proposito: clasificar mercancia es trabajo de un agente aduanal, y
 * el sistema acerca opciones en lugar de aparentar una certeza que no tiene.
 */
router.get('/buscar', async (req: Request, res: Response) => {
  const consulta = String(req.query.q ?? '').trim();

  if (consulta.length < 3) {
    return res.status(400).json({
      error: 'Escribe al menos tres letras para buscar una fraccion.',
    });
  }

  try {
    const { data } = await axios.get(`${env.coreUrl}/api/v1/fracciones/buscar`, {
      params: { q: consulta },
      timeout: env.coreTimeoutMs,
    });
    return res.json(data);
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      return res.status(503).json({
        error: 'El motor de calculo no responde',
        detalle: `No se pudo contactar ${env.coreUrl}. Revisa que este levantado.`,
      });
    }
    console.error('[fracciones] Error no controlado:', error);
    return res.status(500).json({ error: 'Falla interna del gateway' });
  }
});

export default router;
