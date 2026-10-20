/**
 * Como se escriben las cifras en la pantalla.
 *
 * Todas las cantidades llegan del motor como texto para no perder centavos.
 * Aqui solo se les da forma para leerlas; nunca se usan para volver a
 * calcular.
 */

const PESOS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Una cantidad en pesos, lista para una columna de cifras.
 *
 * Se quita el simbolo de moneda a proposito: en la hoja de liquidacion la
 * columna ya esta rotulada en pesos, y repetir el signo en cada renglon
 * estorba al comparar numeros de distinta longitud.
 */
export function pesos(monto: string): string {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return '—';

  return PESOS.format(numero).replace(/^\s*\$\s*/, '');
}

/** Una cantidad en pesos con su simbolo, para el total y los rangos. */
export function pesosConSigno(monto: string): string {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return '—';

  return PESOS.format(numero);
}

/**
 * Una tasa, escrita corta.
 *
 * Se recortan los ceros que no aportan: 0.8 en lugar de 0.80, y 16 en lugar de
 * 16.00. Una tasa con decimales de relleno se lee como si fuera mas precisa de
 * lo que es.
 */
export function tasa(valor: string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';

  return `${numero.toLocaleString('es-MX', { maximumFractionDigits: 2 })} %`;
}

/** Un rango de costos, o un aviso de que todavia no se conoce. */
export function rango(min: string | null, max: string | null): string {
  if (min === null && max === null) return 'por cotizar';
  if (min !== null && max !== null) return `${pesosConSigno(min)} a ${pesosConSigno(max)}`;

  return pesosConSigno((min ?? max) as string);
}

/**
 * La fecha de una consulta, escrita como la leeria una persona.
 *
 * Una fecha sola ("2026-10-20") se arma a mano en lugar de pasarla por
 * `new Date(texto)`. El constructor la interpreta como medianoche en UTC, y al
 * mostrarla en un huso al oeste de Greenwich sale el dia anterior. Aqui eso
 * importa: la fecha dice cuando se leyo la ley, y equivocarla por un dia deja
 * el documento en falso.
 */
export function fecha(iso: string): string {
  if (!iso) return 'sin fecha';

  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  const d = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(iso);

  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Fecha y hora de emision de la cotizacion. */
export function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
