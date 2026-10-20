import { Sello } from './Sello';

/**
 * Lo que se ve antes de la primera cotización.
 *
 * Una pantalla en blanco que solo dice "aquí aparecerá el resultado"
 * desaprovecha el único momento en que tenemos la atención entera de alguien
 * que todavía no sabe qué hace esto. Así que aquí se explica el producto: qué
 * va a recibir y, sobre todo, qué NO vamos a hacer por él.
 *
 * Decir los límites antes de que los descubra es lo que hace que confíe en el
 * número cuando llegue.
 */
export function Bienvenida() {
  return (
    <section className="bienvenida">
      <span className="bienvenida__sello" aria-hidden="true">
        <Sello tamano={48} />
      </span>

      <h2 className="bienvenida__titulo">
        Cuánto cuesta de verdad traer un medicamento
      </h2>

      <p className="bienvenida__entrada">
        Dinos qué vas a importar y de dónde. En segundos tendrás la cuenta
        completa, con los permisos que te van a pedir y la ley detrás de cada
        cifra.
      </p>

      <ul className="promesas">
        <li>
          <h3>El costo desglosado</h3>
          <p>
            Arancel, derecho de trámite e IVA, cada uno con la ley de la que
            sale y la fecha en que se consultó.
          </p>
        </li>
        <li>
          <h3>Los papeles que hacen falta</h3>
          <p>
            Qué permisos exige COFEPRIS y qué documentos pide la aduana. Si
            falta uno, la carga se queda parada.
          </p>
        </li>
        <li>
          <h3>Lo que el sistema no sabe</h3>
          <p>
            Cada supuesto queda anotado, y si una cifra no está comprobada te
            lo decimos en lugar de disimularlo.
          </p>
        </li>
      </ul>

      <p className="bienvenida__limite">
        Esto no sustituye a tu agente aduanal: le ahorra los primeros días de
        trabajo y te deja llegar a la reunión con las cuentas hechas.
      </p>
    </section>
  );
}
