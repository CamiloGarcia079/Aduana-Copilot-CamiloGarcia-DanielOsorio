import { rango } from '../lib/formato';
import type { Documento, Rango } from '../lib/types';

interface Props {
  documentos: Documento[];
  costosAparte: Rango[];
}

/**
 * Los papeles que hay que tener y los costos que van por fuera del total.
 *
 * Van juntos porque responden a la misma pregunta del cliente: además del
 * impuesto, qué más necesito. Los obligatorios se listan primero: si falta uno,
 * la carga se queda en la aduana y el resto de la cotización da igual.
 */
export function Documentos({ documentos, costosAparte }: Props) {
  const ordenados = [...documentos].sort(
    (a, b) => Number(b.obligatorio) - Number(a.obligatorio)
  );
  const obligatorios = documentos.filter((d) => d.obligatorio).length;

  return (
    <>
      <section className="pliego">
        <h2 className="pliego__titulo">
          Documentos <span className="pliego__cuenta">{obligatorios} obligatorios</span>
        </h2>
        <p className="pliego__ayuda">
          Si falta uno de los obligatorios, la carga se queda en la aduana.
        </p>

        <ul className="papeles">
          {ordenados.map((documento) => (
            <li className="papel" key={documento.clave}>
              <span className="papel__casilla" aria-hidden="true" />
              <div>
                <p className="papel__nombre">
                  {documento.nombre}
                  {!documento.obligatorio && (
                    <span className="papel__opcional"> (opcional)</span>
                  )}
                </p>
                <p className="papel__quien">
                  Lo emite {documento.quien_lo_emite}
                  {documento.notas ? `. ${documento.notas}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="pliego">
        <h2 className="pliego__titulo">Costos que van aparte</h2>
        <p className="pliego__ayuda">
          No entran al total porque se negocian. Súmalos cuando tengas la
          cotización de tu agente aduanal.
        </p>

        <ul className="aparte">
          {costosAparte.map((costo) => (
            <li key={costo.concepto}>
              <span>{costo.concepto}</span>
              <span className="aparte__monto">
                {rango(costo.monto_min_mxn, costo.monto_max_mxn)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
