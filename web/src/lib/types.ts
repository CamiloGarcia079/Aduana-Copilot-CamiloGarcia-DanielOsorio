/**
 * El contrato de la cotizacion, visto desde la interfaz.
 *
 * Es el espejo de `core/app/schemas.py`. Si una de las dos partes cambia, la
 * otra tiene que cambiar igual, y por eso los nombres de los campos son
 * identicos a los del JSON y no se traducen ni se acomodan.
 *
 * Las cifras llegan como texto, no como number. Es a proposito: el motor las
 * calcula con Decimal para no perder centavos, y convertirlas a number en
 * JavaScript reintroduciria el error que se evito del otro lado. Se formatean
 * para mostrarlas y nunca se usan para volver a calcular.
 */

export type EstadoDato = 'verificado' | 'estimado' | 'ejemplo_sin_verificar';

export type Confianza = 'alta' | 'media' | 'baja';

/** Un renglon de la cotizacion: un impuesto o derecho, con su respaldo. */
export interface Concepto {
  concepto: string;
  base_mxn: string;
  tasa_pct: string;
  monto_mxn: string;
  estado: EstadoDato;
  fuente: string;
  fecha_consulta: string;
  vigencia: string | null;
}

/** Un costo sin cifra unica, que se reporta aparte y no entra al total. */
export interface Rango {
  concepto: string;
  monto_min_mxn: string | null;
  monto_max_mxn: string | null;
  estado: EstadoDato;
  fuente: string;
  fecha_consulta: string;
}

/** Algo que el motor tuvo que dar por cierto para poder calcular. */
export interface Supuesto {
  clave: string;
  descripcion: string;
  por_que: string;
  como_verificar: string;
  afecta_al_total: boolean;
}

/** Un permiso o papel que exige la importacion. */
export interface Documento {
  clave: string;
  nombre: string;
  quien_lo_emite: string;
  obligatorio: boolean;
  notas: string | null;
  estado: EstadoDato;
  fuente: string;
}

export interface Cotizacion {
  folio: string;
  emitida_en: string;

  fraccion: string;
  descripcion_fraccion: string;
  origen: string;
  destino: string;

  valor_en_aduana_mxn: string;

  igi: Concepto;
  dta: Concepto;
  iva: Concepto;

  total_mxn: string;

  costos_no_incluidos: Rango[];
  supuestos: Supuesto[];
  documentos: Documento[];

  confianza: Confianza;
  advertencia: string | null;
}

/** Lo que la pantalla le manda al gateway para cotizar. */
export interface PeticionCotizacion {
  fraccion: string;
  valor_mercancia_usd: string;
  flete_usd: string;
  seguro_usd: string;
  tipo_de_cambio: string;
  origen: string;
  destino: string;
  es_medicina_de_patente: boolean;
}

export interface FraccionCandidata {
  fraccion: string;
  descripcion: string;
  igi_pct: string | null;
  estado: EstadoDato;
}

export interface BusquedaFraccion {
  consulta: string;
  candidatas: FraccionCandidata[];
  advertencia: string;
}
