import { useState } from 'react';
import { BuscadorFraccion } from './BuscadorFraccion';
import { PAISES_CONOCIDOS } from '../lib/rutas';
import type { PeticionCotizacion } from '../lib/types';

/**
 * Tres peticiones de ejemplo, listas para cargar con un clic.
 *
 * Sirven para dos cosas: ensayar sin teclear, y enseñar de un vistazo qué
 * cambia el resultado. Puestas una al lado de la otra se ve que una medicina
 * de patente paga distinto que un genérico con arancel.
 */
const EJEMPLOS: Array<{
  etiqueta: string;
  pista: string;
  descripcion: string;
  valores: PeticionCotizacion;
}> = [
  {
    etiqueta: 'Insulina',
    pista: 'patente, sin arancel',
    descripcion: 'Soluciones inyectables que contengan insulina',
    valores: {
      fraccion: '3004.31.02.01',
      valor_mercancia_usd: '25000',
      flete_usd: '1200',
      seguro_usd: '300',
      tipo_de_cambio: '20',
      origen: 'Alemania',
      destino: 'Guadalajara, Jalisco',
      es_medicina_de_patente: true,
    },
  },
  {
    etiqueta: 'Oncológico',
    pista: 'vincristina desde Suiza',
    descripcion: 'Preparaciones a base de sulfato de vincristina',
    valores: {
      fraccion: '3004.49.03.00',
      valor_mercancia_usd: '85000',
      flete_usd: '4200',
      seguro_usd: '900',
      tipo_de_cambio: '19.80',
      origen: 'Suiza',
      destino: 'Guadalajara, Jalisco',
      es_medicina_de_patente: true,
    },
  },
  {
    // El único del catálogo con arancel distinto de cero, y al no ser de
    // patente también paga IVA. Es el que deja ver la liquidación completa.
    etiqueta: 'Genérico',
    pista: 'con arancel y con IVA',
    descripcion:
      'Los demás medicamentos preparados para usos terapéuticos o profilácticos',
    valores: {
      fraccion: '3004.90.99.99',
      valor_mercancia_usd: '15000',
      flete_usd: '1500',
      seguro_usd: '250',
      tipo_de_cambio: '19.50',
      origen: 'India',
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
  tipo_de_cambio: '',
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
 * Lo que hay que saber para cotizar, pedido en el orden en que se piensa.
 *
 * Primero qué traes, después de dónde, después cuánto cuesta. El flete y el
 * seguro los escribe el cliente a propósito: el sistema no los estima porque
 * dependen de la naviera, del volumen y de la temporada, y una cifra inventada
 * ahí arruinaría el total entero.
 */
export function FormularioCotizacion({ cotizando, error, onCotizar }: Props) {
  const [forma, setForma] = useState<PeticionCotizacion>(INICIAL);
  const [descripcion, setDescripcion] = useState('');

  const cambiar = (campo: keyof PeticionCotizacion, valor: string | boolean) =>
    setForma((previo) => ({ ...previo, [campo]: valor }));

  function cargarEjemplo(ejemplo: (typeof EJEMPLOS)[number]) {
    setForma(ejemplo.valores);
    setDescripcion(ejemplo.descripcion);
  }

  return (
    <form
      className="peticion"
      onSubmit={(evento) => {
        evento.preventDefault();
        onCotizar(forma);
      }}
    >
      <h2 className="peticion__titulo">Arma tu cotización</h2>

      <div className="ejemplos">
        <span className="ejemplos__rotulo">O prueba con un caso real</span>
        <div className="ejemplos__lista">
          {EJEMPLOS.map((ejemplo) => (
            <button
              key={ejemplo.etiqueta}
              type="button"
              className="ejemplo"
              onClick={() => cargarEjemplo(ejemplo)}
            >
              <span className="ejemplo__nombre">{ejemplo.etiqueta}</span>
              <span className="ejemplo__pista">{ejemplo.pista}</span>
            </button>
          ))}
        </div>
      </div>

      <BuscadorFraccion
        fraccion={forma.fraccion}
        descripcion={descripcion}
        onElegir={(fraccion, desc) => {
          cambiar('fraccion', fraccion);
          setDescripcion(desc);
        }}
        onLimpiar={() => {
          cambiar('fraccion', '');
          setDescripcion('');
        }}
      />

      <label className="campo">
        <span className="campo__rotulo">¿De qué país sale?</span>
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

      <fieldset className="grupo">
        <legend className="grupo__titulo">Los montos de la operación</legend>

        <label className="campo">
          <span className="campo__rotulo">Precio del medicamento, en dólares</span>
          <input
            className="cifra"
            type="number"
            min="0"
            step="0.01"
            value={forma.valor_mercancia_usd}
            onChange={(e) => cambiar('valor_mercancia_usd', e.target.value)}
            placeholder="25000"
            required
          />
          <span className="campo__pista">Lo que te cobra el proveedor, sin envío</span>
        </label>

        <div className="terna">
          <label className="campo campo--numero">
            <span className="campo__rotulo">Flete</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={forma.flete_usd}
              onChange={(e) => cambiar('flete_usd', e.target.value)}
              placeholder="1200"
            />
          </label>

          <label className="campo campo--numero">
            <span className="campo__rotulo">Seguro</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={forma.seguro_usd}
              onChange={(e) => cambiar('seguro_usd', e.target.value)}
              placeholder="300"
            />
          </label>

          <label className="campo campo--numero">
            <span className="campo__rotulo">Dólar hoy</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={forma.tipo_de_cambio}
              onChange={(e) => cambiar('tipo_de_cambio', e.target.value)}
              placeholder="20.00"
              required
            />
          </label>
        </div>

        <p className="campo__pista">
          El flete y el seguro los cotiza tu transportista. El sistema no los
          inventa.
        </p>
      </fieldset>

      <label className="declara">
        <input
          type="checkbox"
          checked={forma.es_medicina_de_patente}
          onChange={(e) => cambiar('es_medicina_de_patente', e.target.checked)}
        />
        <span className="declara__texto">
          <strong>Es medicina de patente</strong>
          <span>
            Un medicamento terminado y dosificado, con registro sanitario
            vigente. Paga menos IVA, así que lo declaras tú y queda anotado como
            supuesto en la cotización.
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
