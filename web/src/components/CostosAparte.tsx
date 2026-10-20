import { rango } from '../lib/formato';
import type { Rango } from '../lib/types';

interface Props {
  costos: Rango[];
}

/**
 * Lo que cuesta la operación y no entra al total.
 *
 * Los honorarios del agente aduanal y la prevalidación se negocian y cambian
 * por aduana. Meterlos al total obligaría a elegir un punto del rango, y eso
 * sería inventar una precisión que no existe: el total dejaría de poder
 * comprobarse.
 */
export function CostosAparte({ costos }: Props) {
  return (
    <section className="pliego">
      <h2 className="pliego__titulo">Costos que van aparte</h2>
      <p className="pliego__ayuda">
        No entran al total porque se negocian. Súmalos cuando tengas la
        cotización de tu agente aduanal.
      </p>

      <ul className="aparte">
        {costos.map((costo) => (
          <li key={costo.concepto}>
            <span>{costo.concepto}</span>
            <span className="aparte__monto">
              {rango(costo.monto_min_mxn, costo.monto_max_mxn)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
