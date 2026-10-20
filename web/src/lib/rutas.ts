/**
 * Coordenadas para dibujar el tramo de origen a destino.
 *
 * Es contexto visual, no una ruta real: no calcula escalas, ni puertos, ni
 * distancias de navegacion. Sirve para que quien vea la cotizacion ubique de
 * donde sale la mercancia.
 *
 * Son pocos origenes a proposito: los paises de los que mas se importa
 * medicamento. Si llega uno que no esta en la lista, el mapa simplemente
 * muestra el destino y no dibuja la linea, en lugar de inventar un punto.
 */

export interface Punto {
  lat: number;
  lon: number;
  nombre: string;
}

/** Guadalajara, Jalisco: el destino de todas las cotizaciones del proyecto. */
export const GUADALAJARA: Punto = {
  lat: 20.6597,
  lon: -103.3496,
  nombre: 'Guadalajara, Jalisco',
};

const ORIGENES: Record<string, Punto> = {
  alemania: { lat: 50.1109, lon: 8.6821, nombre: 'Frankfurt, Alemania' },
  suiza: { lat: 47.5596, lon: 7.5886, nombre: 'Basilea, Suiza' },
  india: { lat: 19.076, lon: 72.8777, nombre: 'Mumbai, India' },
  china: { lat: 31.2304, lon: 121.4737, nombre: 'Shanghai, China' },
  'estados unidos': { lat: 32.7157, lon: -117.1611, nombre: 'San Diego, Estados Unidos' },
  eua: { lat: 32.7157, lon: -117.1611, nombre: 'San Diego, Estados Unidos' },
  espana: { lat: 41.3851, lon: 2.1734, nombre: 'Barcelona, Espana' },
  'españa': { lat: 41.3851, lon: 2.1734, nombre: 'Barcelona, Espana' },
  francia: { lat: 48.8566, lon: 2.3522, nombre: 'Paris, Francia' },
  italia: { lat: 45.4642, lon: 9.19, nombre: 'Milan, Italia' },
  brasil: { lat: -23.5505, lon: -46.6333, nombre: 'Sao Paulo, Brasil' },
  argentina: { lat: -34.6037, lon: -58.3816, nombre: 'Buenos Aires, Argentina' },
  'corea del sur': { lat: 37.5665, lon: 126.978, nombre: 'Seul, Corea del Sur' },
  japon: { lat: 35.6762, lon: 139.6503, nombre: 'Tokio, Japon' },
  canada: { lat: 43.6532, lon: -79.3832, nombre: 'Toronto, Canada' },
};

/**
 * Busca el punto de un origen escrito a mano.
 *
 * Compara sin acentos ni mayusculas, y acepta que el texto traiga mas cosas
 * ("desde Alemania, puerto de Hamburgo"), porque lo escribe una persona y no
 * un formulario cerrado.
 */
export function ubicarOrigen(texto: string): Punto | null {
  const limpio = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

  if (!limpio) return null;

  const clave = Object.keys(ORIGENES).find((pais) => {
    const paisLimpio = pais.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return limpio.includes(paisLimpio);
  });

  return clave ? ORIGENES[clave] : null;
}

/** Los paises que el mapa sabe ubicar, para sugerirlos en el formulario. */
export const PAISES_CONOCIDOS = [
  'Alemania',
  'Suiza',
  'India',
  'China',
  'Estados Unidos',
  'Espana',
  'Francia',
  'Italia',
  'Brasil',
  'Corea del Sur',
];
