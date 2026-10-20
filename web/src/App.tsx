import { useState } from 'react';
import { cotizar, ErrorDeCotizacion } from './lib/api';
import { FormularioCotizacion } from './components/FormularioCotizacion';
import { HojaDeLiquidacion } from './components/HojaDeLiquidacion';
import { Supuestos } from './components/Supuestos';
import { Documentos } from './components/Documentos';
import { TramoDeEnvio } from './components/TramoDeEnvio';
import type { Cotizacion, PeticionCotizacion } from './lib/types';

interface Falla {
  mensaje: string;
  detalles: string[];
}

export default function App() {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [cotizando, setCotizando] = useState(false);
  const [falla, setFalla] = useState<Falla | null>(null);

  async function pedirCotizacion(peticion: PeticionCotizacion) {
    setCotizando(true);
    setFalla(null);

    try {
      setCotizacion(await cotizar(peticion));
    } catch (error) {
      if (error instanceof ErrorDeCotizacion) {
        setFalla({ mensaje: error.message, detalles: error.detalles });
      } else {
        setFalla({ mensaje: 'Algo falló al cotizar.', detalles: [] });
      }
    } finally {
      setCotizando(false);
    }
  }

  /**
   * La insignia de vigencia resume si se puede confiar en la cotización.
   *
   * Está arriba y siempre visible porque es lo primero que alguien debería ver:
   * de nada sirve un total bien calculado con tasas que nadie verificó.
   */
  const datosFirmes = cotizacion?.confianza === 'alta';

  return (
    <div className="marco">
      <header className="cinta">
        <div>
          <h1 className="cinta__nombre">Aduana-Copilot</h1>
          <p className="cinta__que-es">
            Cuánto cuesta importar un medicamento a Jalisco y qué permisos pide
          </p>
        </div>

        {cotizacion && (
          <p className={`vigencia${datosFirmes ? '' : ' vigencia--hueco'}`}>
            <span className="vigencia__punto" aria-hidden="true" />
            {datosFirmes
              ? 'Aranceles verificados en fuente oficial'
              : 'Aranceles pendientes de verificar'}
          </p>
        )}
      </header>

      <main className="taller">
        <FormularioCotizacion
          cotizando={cotizando}
          error={falla}
          onCotizar={pedirCotizacion}
        />

        <div>
          {cotizacion ? (
            <>
              <HojaDeLiquidacion cotizacion={cotizacion} />

              <div className="pliegos">
                <Supuestos supuestos={cotizacion.supuestos} />
                <Documentos
                  documentos={cotizacion.documentos}
                  costosAparte={cotizacion.costos_no_incluidos}
                />
                <section className="pliego">
                  <h2 className="pliego__titulo">Tramo del envío</h2>
                  <TramoDeEnvio origen={cotizacion.origen} />
                </section>
              </div>
            </>
          ) : (
            <section className="en-blanco">
              <h2 className="en-blanco__titulo">Aquí aparece la cotización</h2>
              <p>
                Llena la fracción, el origen y los montos, o carga uno de los
                casos de ejemplo. El desglose llega con la fuente y la fecha de
                cada cifra, y con los supuestos que hubo que asumir.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
