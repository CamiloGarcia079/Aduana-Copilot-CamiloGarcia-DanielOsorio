import type { BusquedaFraccion, Cotizacion, PeticionCotizacion } from './types';

const GATEWAY = import.meta.env.VITE_GATEWAY_URL ?? 'http://127.0.0.1:3000';

export class ErrorDeCotizacion extends Error {
  /** Los errores de campo que devolvio el gateway, si los hubo. */
  readonly detalles: string[];

  constructor(message: string, detalles: string[] = []) {
    super(message);
    this.detalles = detalles;
  }
}

/**
 * Lee el error que devolvio el gateway y lo convierte en algo mostrable.
 *
 * El gateway responde con `error` y a veces con una lista `errores`. Se
 * respetan sus mensajes en lugar de inventar uno generico, porque ya vienen
 * escritos en espanol y dicen que campo esta mal.
 */
async function leerError(respuesta: Response): Promise<never> {
  let cuerpo: any = {};
  try {
    cuerpo = await respuesta.json();
  } catch {
    // Una respuesta sin JSON, por ejemplo un 502 de un proxy.
  }

  throw new ErrorDeCotizacion(
    cuerpo.error ?? `El gateway respondio ${respuesta.status}.`,
    cuerpo.errores ?? []
  );
}

/** Pide la cotizacion al gateway. */
export async function cotizar(peticion: PeticionCotizacion): Promise<Cotizacion> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${GATEWAY}/api/v1/cotizacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peticion),
    });
  } catch {
    throw new ErrorDeCotizacion(
      'No se pudo contactar al gateway. Revisa que este levantado en el puerto 3000.'
    );
  }

  if (!respuesta.ok) await leerError(respuesta);

  return respuesta.json();
}

/** Busca fracciones candidatas para un texto libre. */
export async function buscarFracciones(consulta: string): Promise<BusquedaFraccion> {
  let respuesta: Response;

  try {
    respuesta = await fetch(
      `${GATEWAY}/api/v1/fracciones/buscar?q=${encodeURIComponent(consulta)}`
    );
  } catch {
    throw new ErrorDeCotizacion('No se pudo contactar al gateway para buscar la fraccion.');
  }

  if (!respuesta.ok) await leerError(respuesta);

  return respuesta.json();
}
