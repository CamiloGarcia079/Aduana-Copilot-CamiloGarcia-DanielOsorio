import { useState } from 'react';
import type { Documento } from '../lib/types';

interface Props {
  documentos: Documento[];
}

/**
 * Los papeles que exige la importación.
 *
 * Los obligatorios se listan primero: si falta uno, la carga se queda en la
 * aduana y el resto de la cotización da igual.
 *
 * Esto se usa como lista de verificación, así que por omisión se lee el
 * nombre y quién lo emite, y la explicación larga queda recortada a dos
 * renglones. Un solo botón la despliega entera para todas a la vez: once
 * controles de "ver más" serían más ruido que la propia descripción.
 */
export function Documentos({ documentos }: Props) {
  const [verCompleto, setVerCompleto] = useState(false);

  const ordenados = [...documentos].sort(
    (a, b) => Number(b.obligatorio) - Number(a.obligatorio)
  );
  const obligatorios = documentos.filter((d) => d.obligatorio).length;
  const hayDescripciones = documentos.some((d) => d.notas);

  return (
    <section className="pliego">
        <h2 className="pliego__titulo">
          Documentos <span className="pliego__cuenta">{obligatorios} obligatorios</span>
        </h2>
        <p className="pliego__ayuda">
          Si falta uno de los obligatorios, la carga se queda en la aduana.
        </p>

        {hayDescripciones && (
          <button
            type="button"
            className="pliego__alterna"
            onClick={() => setVerCompleto((previo) => !previo)}
          >
            {verCompleto ? 'Ver solo los nombres' : 'Ver qué es cada documento'}
          </button>
        )}

        <ul className="papeles">
          {ordenados.map((documento) => (
            <li className="papel" key={documento.clave}>
              <span className="papel__casilla" aria-hidden="true" />
              <div className="papel__texto">
                <p className="papel__nombre">
                  {documento.nombre}
                  {!documento.obligatorio && (
                    <span className="papel__opcional"> (opcional)</span>
                  )}
                </p>
                <p className="papel__quien">Lo emite {documento.quien_lo_emite}</p>
                {documento.notas && (
                  <p className={`papel__nota${verCompleto ? '' : ' papel__nota--corta'}`}>
                    {documento.notas}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
    </section>
  );
}
