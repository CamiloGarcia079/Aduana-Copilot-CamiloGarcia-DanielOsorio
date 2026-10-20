import type { Supuesto } from '../lib/types';

interface Props {
  supuestos: Supuesto[];
}

/**
 * Lo que el sistema tuvo que dar por cierto.
 *
 * Es el bloque que distingue esta cotización de una hoja de Excel: en lugar de
 * entregar un total limpio y callarse lo que no sabe, dice qué asumió, por qué
 * y cómo comprobarlo. Si la lista está vacía, lo dice también, porque el hecho
 * de que no haya supuestos es en sí mismo el mejor resultado posible.
 */
export function Supuestos({ supuestos }: Props) {
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
        <p className="pliego__ayuda">
          No hubo que asumir nada: todas las cifras salieron de una fuente
          verificada.
        </p>
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
