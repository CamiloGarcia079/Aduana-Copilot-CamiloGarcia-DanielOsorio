import type { Confianza, Supuesto } from '../lib/types';

/**
 * Qué decir cuando el motor no tuvo que asumir nada.
 *
 * No basta con "no hubo supuestos": que el cálculo saliera limpio no quiere
 * decir que las tasas estén comprobadas. Decir "todas las cifras salieron de
 * una fuente verificada" mientras el sello de arriba avisa lo contrario es la
 * clase de contradicción que destruye la confianza en el documento entero.
 */
const SIN_SUPUESTOS: Record<Confianza, string> = {
  alta: 'No hubo que asumir nada: todas las cifras salieron de una fuente verificada.',
  media:
    'El motor no tuvo que asumir nada para calcular, pero las tasas que usó citan su fuente sin que nadie las haya comprobado contra el texto oficial.',
  baja: 'El motor no tuvo que asumir nada, pero faltan cifras en el catálogo.',
};

interface Props {
  supuestos: Supuesto[];
  confianza: Confianza;
}

/**
 * Lo que el sistema tuvo que dar por cierto.
 *
 * Es el bloque que distingue esta cotización de una hoja de Excel: en lugar de
 * entregar un total limpio y callarse lo que no sabe, dice qué asumió, por qué
 * y cómo comprobarlo. Si la lista está vacía, lo dice también, porque el hecho
 * de que no haya supuestos es en sí mismo el mejor resultado posible.
 */
export function Supuestos({ supuestos, confianza }: Props) {
  return (
    <section className="pliego">
      <h2 className="pliego__titulo">
        Supuestos{' '}
        <span className="pliego__cuenta">
          {supuestos.length === 0 ? 'ninguno' : `${supuestos.length}`}
        </span>
      </h2>
      <p className="pliego__ayuda">
        Cosas que el sistema asumió para poder calcular. Revísalas antes de
        tomar una decisión de compra.
      </p>

      {supuestos.length === 0 ? (
        <p className="pliego__ayuda">{SIN_SUPUESTOS[confianza]}</p>
      ) : (
        <ul className="supuestos">
          {supuestos.map((supuesto) => (
            <li className="supuesto" key={supuesto.clave}>
              <p className="supuesto__que">
                {supuesto.descripcion}
                {supuesto.afecta_al_total && (
                  <span className="supuesto__afecta">mueve el total</span>
                )}
              </p>
              <p className="supuesto__detalle">{supuesto.por_que}</p>
              <p className="supuesto__detalle">Cómo comprobarlo: {supuesto.como_verificar}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
