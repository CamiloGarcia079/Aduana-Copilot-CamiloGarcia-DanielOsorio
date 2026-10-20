import { useState } from 'react';
import { PAISES_CONOCIDOS } from '../lib/rutas';
import type { PeticionCotizacion } from '../lib/types';

/**
 * Tres peticiones de ejemplo, listas para cargar con un clic.
 *
 * Sirven para ensayar y para mostrar el sistema sin teclear: quien lo ve puede
 * comparar una compra de patente contra una de genérico y ver cómo cambia el
 * IVA. Son escenarios verosímiles de Jalisco, no cifras reales de una compra.
 */
const EJEMPLOS: Array<{ etiqueta: string; valores: PeticionCotizacion }> = [
  {
    etiqueta: 'Insulina de patente',
    valores: {
      fraccion: '3004.31.01',
      valor_mercancia_usd: '50000',
      flete_usd: '3000',
      seguro_usd: '400',
      tipo_de_cambio: '17.50',
      origen: 'Alemania',
      destino: 'Guadalajara, Jalisco',
      es_medicina_de_patente: true,
    },
  },
  {
    etiqueta: 'Antibiótico genérico',
    valores: {
      fraccion: '3004.20.01',
      valor_mercancia_usd: '18000',
      flete_usd: '1200',
      seguro_usd: '150',
      tipo_de_cambio: '17.50',
      origen: 'India',
      destino: 'Guadalajara, Jalisco',
      es_medicina_de_patente: false,
    },
  },
  {
    etiqueta: 'Insumo a granel',
    valores: {
      fraccion: '3003.90.99',
      valor_mercancia_usd: '7500',
      flete_usd: '900',
      seguro_usd: '80',
      tipo_de_cambio: '17.50',
      origen: 'China',
      destino: 'Guadalajara, Jalisco',
      es_medicina_de_patente: false,
    },
  },
];

const INICIAL: PeticionCotizacion = {
  fraccion: '',
  valor_mercancia_usd: '',
  flete_usd: '',
  seguro_usd: '',
  tipo_de_cambio: '17.50',
  origen: '',
  destino: 'Guadalajara, Jalisco',
  es_medicina_de_patente: false,
};

interface Props {
  cotizando: boolean;
  error: { mensaje: string; detalles: string[] } | null;
  onCotizar: (peticion: PeticionCotizacion) => void;
}

/**
 * Lo que hay que saber para cotizar.
 *
 * El flete y el seguro los escribe el cliente a propósito: el sistema no los
 * estima, porque dependen de la naviera, del volumen y de la temporada, y una
 * cifra inventada ahí arruinaría el total completo.
 */
export function FormularioCotizacion({ cotizando, error, onCotizar }: Props) {
  const [forma, setForma] = useState<PeticionCotizacion>(INICIAL);

  const cambiar = (campo: keyof PeticionCotizacion, valor: string | boolean) =>
    setForma((previo) => ({ ...previo, [campo]: valor }));

  return (
    <form
      className="peticion"
      onSubmit={(evento) => {
        evento.preventDefault();
        onCotizar(forma);
      }}
    >
      <h2 className="peticion__titulo">Qué quieres importar</h2>
      <p className="peticion__ayuda">
        El flete y el seguro los pones tú. El sistema no los estima: dependen de
        tu transportista.
      </p>

      <div className="ejemplos">
        <span className="ejemplos__rotulo">Carga un caso de ejemplo</span>
        <div className="ejemplos__lista">
          {EJEMPLOS.map((ejemplo) => (
            <button
              key={ejemplo.etiqueta}
              type="button"
              className="ejemplo"
              onClick={() => setForma(ejemplo.valores)}
            >
              {ejemplo.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <label className="campo">
        <span className="campo__rotulo">Fracción arancelaria</span>
        <input
          className="cifra"
          value={forma.fraccion}
          onChange={(e) => cambiar('fraccion', e.target.value)}
          placeholder="3004.31.01"
          required
        />
      </label>

      <label className="campo">
        <span className="campo__rotulo">Origen</span>
        <input
          list="paises"
          value={forma.origen}
          onChange={(e) => cambiar('origen', e.target.value)}
          placeholder="Alemania"
          required
        />
        <datalist id="paises">
          {PAISES_CONOCIDOS.map((pais) => (
            <option key={pais} value={pais} />
          ))}
        </datalist>
      </label>

      <label className="campo">
        <span className="campo__rotulo">Valor de la mercancía, en dólares</span>
        <input
          className="cifra"
          type="number"
          min="0"
          step="0.01"
          value={forma.valor_mercancia_usd}
          onChange={(e) => cambiar('valor_mercancia_usd', e.target.value)}
          placeholder="50000"
          required
        />
      </label>

      <div className="terna">
        <label className="campo campo--numero">
          <span className="campo__rotulo">Flete USD</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={forma.flete_usd}
            onChange={(e) => cambiar('flete_usd', e.target.value)}
            placeholder="3000"
          />
        </label>

        <label className="campo campo--numero">
          <span className="campo__rotulo">Seguro USD</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={forma.seguro_usd}
            onChange={(e) => cambiar('seguro_usd', e.target.value)}
            placeholder="400"
          />
        </label>

        <label className="campo campo--numero">
          <span className="campo__rotulo">Tipo de cambio</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={forma.tipo_de_cambio}
            onChange={(e) => cambiar('tipo_de_cambio', e.target.value)}
            required
          />
        </label>
      </div>

      <label className="declara">
        <input
          type="checkbox"
          checked={forma.es_medicina_de_patente}
          onChange={(e) => cambiar('es_medicina_de_patente', e.target.checked)}
        />
        <span className="declara__texto">
          <strong>Es medicina de patente</strong>
          <span>
            Cambia la tasa de IVA. Lo declaras tú y queda anotado como supuesto
            en la cotización.
          </span>
        </span>
      </label>

      <button className="boton" type="submit" disabled={cotizando}>
        {cotizando ? 'Calculando...' : 'Calcular cotización'}
      </button>

      {error && (
        <div className="aviso-error" role="alert">
          {error.mensaje}
          {error.detalles.length > 0 && (
            <ul>
              {error.detalles.map((detalle) => (
                <li key={detalle}>{detalle}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
