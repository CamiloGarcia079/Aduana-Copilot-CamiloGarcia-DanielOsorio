"""
El contrato de la cotizacion.

Este archivo es la frontera entre el motor de calculo y todo lo demas: el
gateway, el agente y la interfaz esperan exactamente estas formas. Si una de
estas clases cambia, se rompe la pantalla y se rompe el agente, asi que
cualquier cambio se avisa antes al equipo.

Dos decisiones que vale la pena explicar:

1. Las cifras son `Decimal`, no `float`. Un `float` no puede representar 0.1 de
   forma exacta, y en una cotizacion que suma impuestos sobre impuestos ese
   error se acumula y termina en un total que no cuadra con el de un contador.

2. Cada concepto de la cotizacion (`Concepto`) carga su propia fuente y su
   fecha. No hay un solo campo de "fuentes" al final del documento: la fuente
   viaja pegada al numero que respalda. Es lo que permite auditar la
   cotizacion renglon por renglon.
"""

from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EstadoDato(str, Enum):
    """
    Que tanto se puede confiar en una cifra.

    La diferencia entre `CON_FUENTE` y `VERIFICADO` es la razon de ser de este
    proyecto. Que un dato traiga una cita no quiere decir que alguien la haya
    abierto: una herramienta puede escribir "Ley Federal de Derechos, articulo
    49" sin haber leido nunca esa ley. Por eso `VERIFICADO` no se deduce, se
    declara: solo lo pone una persona que fue a la fuente, y hasta entonces la
    cifra se presenta como lo que es, una cita sin comprobar.
    """

    VERIFICADO = "verificado"
    """Una persona lo leyo en la fuente oficial, en la fecha indicada."""

    CON_FUENTE = "con_fuente"
    """Trae cita y fecha, pero nadie ha confirmado que la cita diga eso."""

    ESTIMADO = "estimado"
    """Es un rango real de mercado, no un dato oficial."""

    EJEMPLO_SIN_VERIFICAR = "ejemplo_sin_verificar"
    """Sin valor utilizable. No sirve para cotizar."""


class Concepto(BaseModel):
    """
    Un renglon de la cotizacion: un impuesto o un derecho, con su respaldo.

    `monto_mxn` es lo que se suma al total. `tasa_pct` y `base_mxn` estan para
    que quien lea la cotizacion pueda repetir la cuenta a mano y llegar al
    mismo numero.
    """

    concepto: str = Field(description='Nombre legible, por ejemplo "IGI" o "DTA".')
    base_mxn: Decimal = Field(description="Monto sobre el que se aplico la tasa.")
    tasa_pct: Decimal = Field(description="Tasa aplicada, en porcentaje.")
    monto_mxn: Decimal = Field(description="Resultado de base por tasa.")

    estado: EstadoDato
    fuente: str = Field(description="Documento oficial que respalda la tasa.")
    fecha_consulta: str = Field(description="Cuando se leyo la fuente. ISO 8601.")
    vigencia: Optional[str] = Field(
        default=None,
        description="Desde cuando rige la tasa, si la fuente lo dice.",
    )


class Rango(BaseModel):
    """
    Un costo que no tiene cifra unica.

    Los honorarios del agente aduanal y la prevalidacion se negocian y cambian
    por aduana. Reportarlos como un numero exacto seria inventar precision que
    no existe, asi que van como rango y no entran al total: se muestran aparte
    para que el cliente los sume cuando ya tenga la cotizacion de su agente.
    """

    concepto: str
    monto_min_mxn: Optional[Decimal] = None
    monto_max_mxn: Optional[Decimal] = None

    estado: EstadoDato
    fuente: str
    fecha_consulta: str


class Supuesto(BaseModel):
    """
    Algo que el motor tuvo que dar por cierto para poder calcular.

    Existe porque la alternativa es peor: si el motor se callara los supuestos,
    el cliente leeria el total como un hecho. Cada supuesto dice que se asumio
    y como comprobarlo.
    """

    clave: str
    descripcion: str
    por_que: str = Field(description="Por que hubo que asumirlo.")
    como_verificar: str = Field(description="Que tendria que revisar una persona.")
    afecta_al_total: bool


class Documento(BaseModel):
    """Un permiso o papel que exige la importacion."""

    clave: str
    nombre: str
    quien_lo_emite: str
    obligatorio: bool
    notas: Optional[str] = None
    estado: EstadoDato
    fuente: str


class Confianza(str, Enum):
    """
    Que tan firme es la cotizacion completa.

    La regla de seguridad del proyecto: si no es `alta`, la interfaz y el
    agente tienen que decirle al usuario que valide con su agente aduanal
    antes de tomar una decision de compra.
    """

    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"


class CotizacionRequest(BaseModel):
    """Lo que se necesita para cotizar. Nada de esto lo adivina el motor."""

    fraccion: str = Field(description='Fraccion arancelaria, por ejemplo "3004.31.01".')
    valor_mercancia_usd: Decimal = Field(gt=0, description="Valor FOB de la mercancia.")
    flete_usd: Decimal = Field(ge=0, description="Lo cotiza el cliente, no el motor.")
    seguro_usd: Decimal = Field(ge=0, description="Lo cotiza el cliente, no el motor.")
    tipo_de_cambio: Decimal = Field(gt=0, description="Pesos por dolar.")

    origen: str = Field(description="Pais o ciudad de donde sale la mercancia.")
    destino: str = Field(default="Guadalajara, Jalisco")

    es_medicina_de_patente: bool = Field(
        default=False,
        description=(
            "Lo declara el cliente, no lo decide el motor. Cambia la tasa de IVA "
            "y por eso siempre genera un supuesto."
        ),
    )


class CotizacionResponse(BaseModel):
    """
    La cotizacion terminada.

    Se devuelve completa aunque algun dato falte: en ese caso el concepto llega
    con estado `ejemplo_sin_verificar` y la confianza baja. Es mejor una
    cotizacion que avisa de sus huecos que un error que no dice nada.
    """

    folio: str = Field(description="Identificador de la cotizacion.")
    emitida_en: str = Field(description="Fecha y hora de emision. ISO 8601.")

    fraccion: str
    descripcion_fraccion: str
    origen: str
    destino: str

    valor_en_aduana_mxn: Decimal = Field(
        description="CIF en pesos: mercancia mas flete mas seguro, por el tipo de cambio."
    )

    igi: Concepto
    dta: Concepto
    iva: Concepto

    total_mxn: Decimal = Field(description="Valor en aduana mas los tres conceptos.")

    costos_no_incluidos: list[Rango] = Field(
        default_factory=list,
        description="Honorarios y prevalidacion. Van aparte porque son rangos.",
    )

    supuestos: list[Supuesto] = Field(default_factory=list)
    documentos: list[Documento] = Field(default_factory=list)

    confianza: Confianza
    advertencia: Optional[str] = Field(
        default=None,
        description="Que tiene que hacer el usuario antes de confiar en el total.",
    )


class FraccionCandidata(BaseModel):
    """Una fraccion que podria corresponder a lo que busca el usuario."""

    fraccion: str
    descripcion: str
    igi_pct: Optional[Decimal]
    estado: EstadoDato


class BusquedaFraccionResponse(BaseModel):
    """
    Resultado de buscar una fraccion.

    Devuelve varias a proposito. Clasificar mercancia es trabajo de un agente
    aduanal: el motor acerca candidatas y la persona elige, en lugar de
    aparentar una certeza que no tiene.
    """

    consulta: str
    candidatas: list[FraccionCandidata]
    advertencia: str = Field(
        default=(
            "La clasificación arancelaria definitiva la determina un agente aduanal. "
            "Estas son candidatas, no una clasificación oficial."
        )
    )
