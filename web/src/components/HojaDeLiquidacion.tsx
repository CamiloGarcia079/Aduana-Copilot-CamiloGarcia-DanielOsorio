import { ComoSeCalculo } from './ComoSeCalculo';
import { Sello } from './Sello';
import { fecha, fechaHora, pesos, pesosConSigno, tasa } from '../lib/formato';
import { QUE_ES } from '../lib/glosario';
import type { Concepto, Confianza, Cotizacion, PeticionCotizacion } from '../lib/types';

/**
 * Cómo se lee cada nivel de confianza en la pantalla.
 *
 * "Con fuente, sin comprobar" es el estado normal mientras nadie abra las
 * leyes y lo declare. Decir "verificadas" antes de eso sería prestarle al
 * documento una autoridad que no tiene.
 */
const SELLO: Record<Confianza, string> = {
  alta: 'Cifras verificadas',
  media: 'Con fuente, sin comprobar',
  baja: 'Faltan cifras en el catálogo',
};

interface Props {
  cotizacion: Cotizacion;
  peticion: PeticionCotizacion | null;
}

/**
 * La cotización, presentada como una hoja de liquidación.
 *
 * Cada impuesto ocupa dos renglones de la tabla: arriba la cifra con lo que
 * es en palabras llanas, abajo la fuente que la respalda. Separarlos así tiene
 * dos ventajas: la columna de números queda limpia para leerla de corrido, y
 * la fuente no desaparece al imprimir, que es cuando más falta hace.
 *
 * Los conceptos sin dato no se esconden ni se omiten: se muestran con la cifra
 * en cero y la línea de respaldo en rojo. Un hueco visible es información
 * útil; un hueco escondido es una trampa.
 */
export function HojaDeLiquidacion({ cotizacion: c, peticion }: Props) {
  return (
    <article className="hoja">
      {/*
        El membrete.
        Una cotización circula: se imprime, se reenvía, se discute en una
        reunión donde no estamos. El sello y el nombre viajan con ella para
        que en esa reunión se sepa de dónde salió.
      */}
      <div className="membrete">
        <span className="membrete__sello">
          <Sello tamano={26} />
        </span>
        <span className="membrete__nombre">Aduana-Copilot</span>
        <span className="membrete__folio cifra">{c.folio}</span>
      </div>

      <header className="hoja__encabezado">
        <div>
          <h2 className="hoja__titulo">Cotización de importación</h2>
          <p className="hoja__emitida">Emitida el {fechaHora(c.emitida_en)}</p>
        </div>

        <p className={`sello sello--${c.confianza}`}>
          <span className="sello__punto" aria-hidden="true" />
          {SELLO[c.confianza]}
        </p>
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
            <th scope="col">Se calcula sobre</th>
            <th scope="col">Tasa</th>
            <th scope="col">Importe en pesos</th>
          </tr>
        </thead>

        <tbody>
          {/* El valor en aduana es la base de todo lo demas, no un impuesto. */}
          <tr className="base">
            <td>
              <span className="renglon__nombre">Valor en aduana</span>
              <span className="renglon__que-es">
                Lo que vale la mercancía al llegar a México
              </span>
            </td>
            <td />
            <td />
            <td className="renglon__monto">{pesos(c.valor_en_aduana_mxn)}</td>
          </tr>
          <tr>
            <td className="renglon__fuente" colSpan={4}>
              Precio del medicamento, más flete, más seguro, convertido a pesos
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

        <p className="total__nota">
          No incluye honorarios del agente aduanal ni prevalidación, porque se
          negocian y se reportan como rango.
        </p>

        <ComoSeCalculo cotizacion={c} peticion={peticion} />
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
 * Bajo la sigla va lo que esa sigla significa. Sin esa línea el documento solo
 * lo entiende un agente aduanal, y quien lo necesita es justamente quien no
 * lo es.
 */
function Renglon({ concepto }: { concepto: Concepto }) {
  const sinDato = concepto.estado === 'ejemplo_sin_verificar';
  const comprobado = concepto.estado === 'verificado';

  return (
    <>
      <tr>
        <td>
          <span className="renglon__nombre">{concepto.concepto}</span>
          <span className="renglon__que-es">{QUE_ES[concepto.concepto] ?? ''}</span>
        </td>
        <td className="cifra">{pesos(concepto.base_mxn)}</td>
        <td className="cifra">{tasa(concepto.tasa_pct)}</td>
        <td className="renglon__monto">{pesos(concepto.monto_mxn)}</td>
      </tr>

      <tr>
        <td
          className={`renglon__fuente${sinDato ? ' renglon__fuente--hueco' : ''}`}
          colSpan={4}
        >
          {sinDato ? (
            <>Esta tasa no está en el catálogo. Se calculó con cero.</>
          ) : (
            <span className="respaldo">
              <span>{concepto.fuente},</span>
              <span className="respaldo__marca">
                consultado el {fecha(concepto.fecha_consulta)}
              </span>
              {/*
                La marca distingue una cita que alguien abrio de una que solo
                esta escrita. Es la diferencia que el cliente necesita ver
                renglon por renglon, no solo en el total.
              */}
              {!comprobado && (
                <span className="respaldo__pendiente">sin comprobar</span>
              )}
            </span>
          )}
        </td>
      </tr>
    </>
  );
}
