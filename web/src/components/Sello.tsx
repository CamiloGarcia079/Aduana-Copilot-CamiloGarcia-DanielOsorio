/**
 * El sello de Aduana-Copilot.
 *
 * Un sello es lo que convierte un papel en un documento: dice que algo pasó
 * por una revisión. Es la idea entera del producto, así que sirve de logo.
 *
 * Está dibujado como lo que sería un sello de goma gastado: el anillo abierto
 * por arriba, donde en un sello real iría el texto curvo, y dentro tres
 * renglones que se acortan, como una cotización desglosada. El anillo abierto
 * también dice algo cierto del proyecto: la revisión no está cerrada hasta que
 * una persona la cierra.
 *
 * Es un dibujo propio, no la marca de ninguna autoridad. Importa: un sello que
 * se pareciera al de una dependencia haría creer que esto es un documento
 * oficial, y no lo es.
 */
export function Sello({ tamano = 34 }: { tamano?: number }) {
  return (
    <svg
      className="sello-marca"
      width={tamano}
      height={tamano}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Anillo exterior, abierto arriba */}
      <path
        d="M20 3.5a16.5 16.5 0 1 1-8.6 2.42"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Anillo interior, más fino, abierto del lado opuesto */}
      <path
        d="M20 9.5a10.5 10.5 0 1 1-6.8 2.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Los renglones de una liquidación, de mayor a menor */}
      <path
        d="M14.5 17h11M14.5 20.5h11M14.5 24h6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
