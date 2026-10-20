import { pesos, tasa } from '../lib/formato';
import type { Cotizacion, PeticionCotizacion } from '../lib/types';

interface Props {
  cotizacion: Cotizacion;
  peticion: PeticionCotizacion | null;
}

/** Una cantidad en dólares, corta y sin ceros de relleno. */
function dolares(monto: string): string {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return '—';

  return numero.toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

/**
 * La cuenta completa, renglón por renglón, en palabras.
 *
 * Es la respuesta a la única pregunta que de verdad importa cuando alguien
 * recibe una cotización: de dónde salió este número. Un total que no se puede
 * reconstruir hay que creérselo, y aquí nadie tiene que creerse nada: con una
 * calculadora se repite la cuenta.
 *
 * Va cerrado por omisión. Quien confía sigue de largo; quien duda lo abre. Lo
 * importante es que la posibilidad de comprobar esté a un clic y no haya que
 * pedirla.
 */
export function ComoSeCalculo({ cotizacion: c, peticion }: Props) {
  return (
    <details className="cuenta">
      <summary className="cuenta__abrir">
        Ver cómo se llegó a este total
      </summary>

      <ol className="cuenta__pasos">
        <li>
          <p className="cuenta__que">Lo que vale la mercancía al llegar a México</p>
          <p className="cuenta__operacion">
            {peticion ? (
              <>
                {dolares(peticion.valor_mercancia_usd)} de medicamento, más{' '}
                {dolares(peticion.flete_usd || '0')} de flete, más{' '}
                {dolares(peticion.seguro_usd || '0')} de seguro, al cambio de{' '}
                {dolares(peticion.tipo_de_cambio)} pesos por dólar
              </>
            ) : (
              <>Precio del medicamento, más flete, más seguro, convertido a pesos</>
            )}
          </p>
          <p className="cuenta__resultado cifra">
            {pesos(c.valor_en_aduana_mxn)} de valor en aduana
          </p>
        </li>

        <li>
          <p className="cuenta__que">El arancel de importación</p>
          <p className="cuenta__operacion">
            {pesos(c.igi.base_mxn)} por {tasa(c.igi.tasa_pct)}
          </p>
          <p className="cuenta__resultado cifra">{pesos(c.igi.monto_mxn)} de IGI</p>
        </li>

        <li>
          <p className="cuenta__que">El derecho que cobra la aduana por el trámite</p>
          <p className="cuenta__operacion">
            {pesos(c.dta.base_mxn)} por {tasa(c.dta.tasa_pct)}
          </p>
          <p className="cuenta__resultado cifra">{pesos(c.dta.monto_mxn)} de DTA</p>
        </li>

        <li>
          <p className="cuenta__que">
            El IVA, que se monta sobre el valor en aduana ya con el arancel y el
            trámite encima
          </p>
          <p className="cuenta__operacion">
            {pesos(c.valor_en_aduana_mxn)} más {pesos(c.igi.monto_mxn)} más{' '}
            {pesos(c.dta.monto_mxn)} son {pesos(c.iva.base_mxn)}, por{' '}
            {tasa(c.iva.tasa_pct)}
          </p>
          <p className="cuenta__resultado cifra">{pesos(c.iva.monto_mxn)} de IVA</p>
        </li>

        <li className="cuenta__cierre">
          <p className="cuenta__que">Todo sumado</p>
          <p className="cuenta__operacion">
            {pesos(c.valor_en_aduana_mxn)} más {pesos(c.igi.monto_mxn)} más{' '}
            {pesos(c.dta.monto_mxn)} más {pesos(c.iva.monto_mxn)}
          </p>
          <p className="cuenta__resultado cifra">{pesos(c.total_mxn)} en total</p>
        </li>
      </ol>
    </details>
  );
}
