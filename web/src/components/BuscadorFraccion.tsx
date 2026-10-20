import { useEffect, useRef, useState } from 'react';
import { buscarFracciones } from '../lib/api';
import type { FraccionCandidata } from '../lib/types';

/** Lo que se espera a que el usuario deje de teclear antes de buscar. */
const PAUSA = 400;

/**
 * En qué se diferencian dos fracciones con la misma descripción.
 *
 * Buscar "vincristina" devuelve dos resultados que se leen igual y solo
 * cambian en el código. Sin esta línea, elegir entre ellos es adivinar.
 *
 * Lo que los separa es la partida, y se lee en los primeros cuatro dígitos:
 * la 3004 es el medicamento ya dosificado y listo para venderse, la 3003 es
 * la misma sustancia a granel. Es una distinción de la propia tarifa, no una
 * interpretación nuestra.
 */
function enQueSeDiferencia(fraccion: string): string {
  if (fraccion.startsWith('3004')) return 'dosificado, listo para venta';
  if (fraccion.startsWith('3003')) return 'a granel, sin dosificar';
  return '';
}

interface Props {
  /** La fracción elegida. Vacío mientras no se elige ninguna. */
  fraccion: string;
  descripcion: string;
  onElegir: (fraccion: string, descripcion: string) => void;
  onLimpiar: () => void;
}

/**
 * Encuentra la fracción arancelaria por el nombre del medicamento.
 *
 * Nadie se sabe de memoria que la insulina inyectable es la 3004.31.02.01.
 * Pedirle ese código a quien compra medicamentos era pedirle que ya supiera la
 * respuesta que viene a buscar.
 *
 * Devuelve varias candidatas y obliga a elegir una, en lugar de quedarse con
 * la primera. Clasificar mercancía es una decisión con consecuencias legales,
 * así que el sistema acerca opciones y la persona decide, igual que hace el
 * agente cuando trabaja solo.
 */
export function BuscadorFraccion({ fraccion, descripcion, onElegir, onLimpiar }: Props) {
  const [consulta, setConsulta] = useState('');
  const [candidatas, setCandidatas] = useState<FraccionCandidata[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const temporizador = useRef<number | null>(null);

  useEffect(() => {
    if (temporizador.current) window.clearTimeout(temporizador.current);

    const texto = consulta.trim();
    if (texto.length < 3) {
      setCandidatas([]);
      setSinResultados(false);
      return;
    }

    temporizador.current = window.setTimeout(async () => {
      setBuscando(true);
      try {
        const resultado = await buscarFracciones(texto);
        setCandidatas(resultado.candidatas);
        setSinResultados(resultado.candidatas.length === 0);
      } catch {
        setCandidatas([]);
        setSinResultados(true);
      } finally {
        setBuscando(false);
      }
    }, PAUSA);

    return () => {
      if (temporizador.current) window.clearTimeout(temporizador.current);
    };
  }, [consulta]);

  function elegir(candidata: FraccionCandidata) {
    onElegir(candidata.fraccion, candidata.descripcion);
    setConsulta('');
    setCandidatas([]);
    setSinResultados(false);
  }

  // Ya hay una fracción elegida: se muestra como ficha y no como buscador.
  if (fraccion) {
    return (
      <div className="campo">
        <span className="campo__rotulo">Medicamento</span>
        <div className="elegida">
          <div className="elegida__texto">
            <p className="elegida__nombre">{descripcion || 'Fracción escrita a mano'}</p>
            <p className="elegida__codigo cifra">{fraccion}</p>
          </div>
          <button
            type="button"
            className="elegida__cambiar"
            onClick={onLimpiar}
            title="Buscar otro medicamento"
          >
            cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor="buscar-medicamento">
        ¿Qué medicamento vas a importar?
      </label>

      <input
        id="buscar-medicamento"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        placeholder="insulina, vincristina, antibiótico..."
        autoComplete="off"
      />

      {buscando && <p className="pista">Buscando en el catálogo...</p>}

      {candidatas.length > 0 && (
        <>
          <ul className="candidatas">
            {candidatas.map((c) => (
              <li key={c.fraccion}>
                <button type="button" onClick={() => elegir(c)}>
                  <span className="candidata__nombre">{c.descripcion}</span>
                  {enQueSeDiferencia(c.fraccion) && (
                    <span className="candidata__forma">
                      {enQueSeDiferencia(c.fraccion)}
                    </span>
                  )}
                  <span className="candidata__pie">
                    <span className="cifra">{c.fraccion}</span>
                    <span>
                      {c.igi_pct === null
                        ? 'sin arancel en el catálogo'
                        : `arancel ${Number(c.igi_pct)} %`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="pista">
            Elige la que mejor describa tu producto. La clasificación definitiva
            la confirma tu agente aduanal.
          </p>
        </>
      )}

      {sinResultados && (
        <p className="pista pista--hueco">
          No encontramos ese medicamento en el catálogo. Prueba con el principio
          activo, o escribe la fracción arancelaria si ya la conoces.
        </p>
      )}
    </div>
  );
}
