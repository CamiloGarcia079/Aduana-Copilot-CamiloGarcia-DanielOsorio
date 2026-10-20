import { fecha, fechaHora, pesos, pesosConSigno, tasa } from '../lib/formato';
import type { Concepto, Confianza, Cotizacion } from '../lib/types';

/** Como se lee cada nivel de confianza en la pantalla. */
const SELLO: Record<Confianza, string> = {
  alta: 'Cifras verificadas',
  media: 'Falta verificar una cifra',
  baja: 'Varias cifras sin verificar',
};

interface Props {
  cotizacion: Cotizacion;
}

/**
 * La cotizacion, presentada como una hoja de liquidacion.
 *
 * Cada impuesto ocupa dos renglones de la tabla: arriba la cifra, abajo la
 * fuente que la respalda. Separarlos asi tiene dos ventajas: la columna de
 * numeros queda limpia para leerla de corrido, y la fuente no desaparece al
 * imprimir, que es cuando mas falta hace.
 *
 * Los conceptos sin verificar no se esconden ni se omiten: se muestran con la
 * cifra en cero y la linea de respaldo en rojo. Un hueco visible es informacion
 * util; un hueco escondido es una trampa.
 */
export function HojaDeLiquidacion({ cotizacion: c }: Props) {
  return (
    <article className="hoja">
      <header className="hoja__encabezado">
        <div>
          <h2 className="hoja__titulo">Cotización de importación</h2>
          <p className="hoja__emitida">Emitida el {fechaHora(c.emitida_en)}</p>
        </div>

        <dl className="hoja__folio">
          <dt>Folio</dt>
          <dd>{c.folio}</dd>
        </dl>
      </header>

      <dl className="casillas">
        <div className="casilla casilla--ancha">
          <dt>Mercancía</dt>
          <dd>{c.descripcion_fraccion}</dd>
        </div>
        <div className="casilla">
          <dt>Fracción arancelaria</dt>
          <dd className="cifra">{c.fraccion}</dd>
        </div>
        <div className="casilla">
          <dt>Origen</dt>
          <dd>{c.origen}</dd>
        </div>
        <div className="casilla">
          <dt>Destino</dt>
          <dd>{c.destino}</dd>
        </div>
      </dl>

      <table className="liquidacion">
        <caption>Desglose</caption>

        <thead>
          <tr>
            <th scope="col">Concepto</th>
            <th scope="col">Base</th>
            <th scope="col">Tasa</th>
            <th scope="col">Importe en pesos</th>
          </tr>
        </thead>

        <tbody>
          {/* El valor en aduana es la base de todo lo demas, no un impuesto. */}
          <tr className="base">
            <td className="renglon__nombre">Valor en aduana</td>
            <td />
            <td />
            <td className="renglon__monto">{pesos(c.valor_en_aduana_mxn)}</td>
          </tr>
          <tr>
            <td className="renglon__fuente" colSpan={4}>
              Mercancía más flete más seguro, convertido a pesos
            </td>
          </tr>

          <Renglon concepto={c.igi} />
          <Renglon concepto={c.dta} />
          <Renglon concepto={c.iva} />
        </tbody>
      </table>

      <div className="total">
        <p className="total__linea">
          <span className="total__rotulo">Total estimado</span>
          <span className="total__monto">{pesosConSigno(c.total_mxn)}</span>
        </p>

        <div className="total__pie">
          <span className="total__nota">
            No incluye honorarios del agente aduanal ni prevalidación, porque se
            negocian y se reportan como rango.
          </span>
          <span className={`sello sello--${c.confianza}`}>
            <span className="sello__punto" aria-hidden="true" />
            {SELLO[c.confianza]}
          </span>
        </div>
      </div>

      {c.advertencia && (
        <p className="advertencia">
          <span className="advertencia__marca" aria-hidden="true">
            !
          </span>
          {c.advertencia}
        </p>
      )}

      <div className="acciones">
        <button type="button" className="boton boton--discreto" onClick={() => window.print()}>
          Descargar cotización
        </button>
      </div>
    </article>
  );
}

/**
 * Un impuesto y su respaldo, en dos renglones.
 *
 * Cuando la tasa no esta verificada se dice con todas sus letras y en rojo. La
 * alternativa habria sido ocultar el renglon, pero entonces el total parecería
 * completo cuando no lo esta.
 */
function Renglon({ concepto }: { concepto: Concepto }) {
  const sinVerificar = concepto.estado === 'ejemplo_sin_verificar';

  return (
    <>
      <tr>
        <td className="renglon__nombre">{concepto.concepto}</td>
        <td className="cifra">{pesos(concepto.base_mxn)}</td>
        <td className="cifra">{tasa(concepto.tasa_pct)}</td>
        <td className="renglon__monto">{pesos(concepto.monto_mxn)}</td>
      </tr>

      <tr>
        <td
          className={`renglon__fuente${sinVerificar ? ' renglon__fuente--hueco' : ''}`}
          colSpan={4}
        >
          {sinVerificar ? (
            <>Tasa sin verificar en fuente oficial. Se calculó con cero.</>
          ) : (
            <span className="respaldo">
              <span>{concepto.fuente},</span>
              <span className="respaldo__marca">
                consultado el {fecha(concepto.fecha_consulta)}
              </span>
            </span>
          )}
        </td>
      </tr>
    </>
  );
}
