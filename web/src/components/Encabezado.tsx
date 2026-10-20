import { Sello } from './Sello';
import type { Confianza } from '../lib/types';

/**
 * Lo que dice la insignia de vigencia según qué tan firmes son los datos.
 *
 * Los tres textos son deliberadamente distintos. Decir "verificado" cuando
 * nadie abrió la ley sería la mentira más fácil y más cara de esta pantalla:
 * es la frase que un jurado o un cliente va a citar.
 */
const VIGENCIA: Record<Confianza, string> = {
  alta: 'Aranceles verificados en fuente oficial',
  media: 'Aranceles con fuente citada, sin comprobar',
  baja: 'Aranceles pendientes de cargar',
};

interface Props {
  /** Null mientras no hay cotización: entonces no se afirma nada. */
  confianza: Confianza | null;
}

/**
 * El encabezado de la aplicación.
 *
 * Centrado y corto. Esta es una herramienta de trabajo, y cada píxel que gasta
 * el encabezado es un píxel que empuja hacia abajo el formulario, que es donde
 * la persona tiene que empezar.
 *
 * La insignia de vigencia va aquí, bajo el nombre, porque es lo que decide si
 * la cotización sirve. Una cotización bien calculada con tasas que nadie
 * comprobó no es una cotización, y eso tiene que leerse antes que nada.
 */
export function Encabezado({ confianza }: Props) {
  return (
    <header className="cinta">
      <div className="marca">
        <span className="marca__sello">
          <Sello />
        </span>
        <h1 className="marca__nombre">Aduana-Copilot</h1>
      </div>

      <p className="marca__que-es">
        Cuánto cuesta importar un medicamento a Jalisco y qué permisos pide
      </p>

      {confianza && (
        <p className={`vigencia vigencia--${confianza}`}>
          <span className="vigencia__punto" aria-hidden="true" />
          {VIGENCIA[confianza]}
        </p>
      )}
    </header>
  );
}
