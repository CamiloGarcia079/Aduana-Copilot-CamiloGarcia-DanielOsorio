import { useState } from 'react';
import { cotizar, ErrorDeCotizacion } from './lib/api';
import { Bienvenida } from './components/Bienvenida';
import { Encabezado } from './components/Encabezado';
import { FormularioCotizacion } from './components/FormularioCotizacion';
import { HojaDeLiquidacion } from './components/HojaDeLiquidacion';
import { Supuestos } from './components/Supuestos';
import { Documentos } from './components/Documentos';
import { CostosAparte } from './components/CostosAparte';
import { TramoDeEnvio } from './components/TramoDeEnvio';
import type { Cotizacion, PeticionCotizacion } from './lib/types';

interface Falla {
  mensaje: string;
  detalles: string[];
}

export default function App() {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);

  /**
   * Lo último que se pidió.
   *
   * Se guarda porque la cotización que vuelve del motor trae los pesos pero no
   * los dólares que se escribieron, y la explicación del cálculo necesita esos
   * dólares para poder empezar la cuenta por el principio.
   */
  const [peticion, setPeticion] = useState<PeticionCotizacion | null>(null);

  const [cotizando, setCotizando] = useState(false);
  const [falla, setFalla] = useState<Falla | null>(null);

  async function pedirCotizacion(nueva: PeticionCotizacion) {
    setCotizando(true);
    setFalla(null);

    try {
      const resultado = await cotizar(nueva);
      setPeticion(nueva);
      setCotizacion(resultado);
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

  return (
    <div className="marco">
      <Encabezado confianza={cotizacion?.confianza ?? null} />

      <main className="taller">
        <FormularioCotizacion
          cotizando={cotizando}
          error={falla}
          onCotizar={pedirCotizacion}
        />

        <div>
          {cotizacion ? (
            /*
             * La llave fuerza a React a rehacer el bloque en cada cotización
             * nueva, y con eso la animación de entrada vuelve a correr. Es la
             * única animación de la pantalla: marca el momento en que llega el
             * resultado, que es lo que la persona estaba esperando.
             */
            <div className="resultado" key={cotizacion.folio}>
              <HojaDeLiquidacion cotizacion={cotizacion} peticion={peticion} />

              {/*
                Dos columnas explícitas en lugar de dejar que la rejilla
                acomode sola. La lista de documentos es mucho más alta que los
                demás paneles, y repartiéndolos sin orden quedaban huecos
                grandes que se leen como si faltara contenido.
              */}
              <div className="pliegos">
                <div className="columna">
                  <Supuestos
                    supuestos={cotizacion.supuestos}
                    confianza={cotizacion.confianza}
                  />
                  <CostosAparte costos={cotizacion.costos_no_incluidos} />
                  <section className="pliego">
                    <h2 className="pliego__titulo">Tramo del envío</h2>
                    <TramoDeEnvio origen={cotizacion.origen} />
                  </section>
                </div>

                <div className="columna">
                  <Documentos documentos={cotizacion.documentos} />
                </div>
              </div>
            </div>
          ) : (
            <Bienvenida />
          )}
        </div>
      </main>
    </div>
  );
}
