import express from 'express';
import cors from 'cors';
import axios from 'axios';

import { env } from './config/env';
import cotizacionRoutes from './controllers/cotizacion.controller';
import fraccionesRoutes from './controllers/fracciones.controller';

/**
 * API Gateway de Aduana-Copilot.
 *
 * Es la unica puerta de entrada: por aqui pasan la interfaz y el agente. No
 * calcula impuestos ni guarda datos, solo valida lo que llega y lo reenvia al
 * motor de Python.
 *
 * Tenerlo en medio sirve para tres cosas: la interfaz habla con un solo
 * puerto, los mensajes de error salen en espanol, y si manana el motor cambia
 * de lenguaje o de direccion, nadie mas se enlaza.
 */
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/cotizacion', cotizacionRoutes);
app.use('/api/v1/fracciones', fraccionesRoutes);

/**
 * GET /health
 *
 * Dice si el gateway esta vivo y, de paso, si el motor de calculo le responde.
 * Preguntar por los dos en una sola llamada ahorra adivinar cual de los dos se
 * cayo cuando la pantalla deja de cotizar.
 */
app.get('/health', async (_req, res) => {
  let motor: unknown = 'sin respuesta';

  try {
    const { data } = await axios.get(`${env.coreUrl}/health`, { timeout: 3_000 });
    motor = data;
  } catch {
    motor = { status: 'caido', url: env.coreUrl };
  }

  res.json({
    status: 'ok',
    servicio: 'API Gateway',
    motorDeCalculo: motor,
    segundosEnPie: Math.round(process.uptime()),
  });
});

const server = app.listen(env.port, () => {
  console.log(`API Gateway escuchando en el puerto ${env.port}`);
  console.log(`Motor de calculo: ${env.coreUrl}`);
});

/** Apagado ordenado, para que nodemon no deje el puerto ocupado. */
function apagar(senal: string): void {
  console.log(`\n${senal} recibido, cerrando el gateway...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
