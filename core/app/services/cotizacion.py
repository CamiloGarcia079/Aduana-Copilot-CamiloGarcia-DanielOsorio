"""
El motor de calculo.

Aqui se arma la cotizacion. Son funciones puras: entran numeros, salen
numeros, no se toca la red ni la base de datos ni el modelo de lenguaje. Eso
hace que se puedan probar con los casos validados a mano y que el resultado
sea siempre el mismo para la misma entrada.

El orden de los impuestos importa y no es arbitrario, porque cada uno se monta
sobre el anterior:

    valor en aduana = (mercancia + flete + seguro) x tipo de cambio
    IGI             = valor en aduana x tasa de la fraccion
    DTA             = valor en aduana x tasa del DTA
    IVA             = (valor en aduana + IGI + DTA) x tasa del IVA

El IVA se calcula sobre el valor en aduana ya con IGI y DTA encima. Calcularlo
solo sobre el valor en aduana daria un total mas bajo que el real.
"""

from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Optional

from ..schemas import (
    BusquedaFraccionResponse,
    Concepto,
    Confianza,
    CotizacionRequest,
    CotizacionResponse,
    Documento,
    EstadoDato,
    FraccionCandidata,
    Rango,
    Supuesto,
)
from . import catalogo

CENTAVOS = Decimal("0.01")

SIN_DATO = "dato no verificado todavía"

ADVERTENCIA_NO_FIRME = (
    "Esta cotización tiene cifras sin verificar en fuente oficial. "
    "Valídala con tu agente aduanal antes de tomar una decisión de compra."
)


def _redondear(monto: Decimal) -> Decimal:
    """
    Redondea a centavos como lo haria un contador.

    Python redondea 2.5 a 2 por defecto (redondeo al par), que no es lo que
    espera nadie que revise una cotizacion. ROUND_HALF_UP sube el medio
    centavo, que es la regla comun en facturacion.
    """
    return monto.quantize(CENTAVOS, rounding=ROUND_HALF_UP)


def _estado(valor: Any) -> EstadoDato:
    """Un dato sin valor no esta verificado, por mas que lo diga su campo."""
    return EstadoDato.EJEMPLO_SIN_VERIFICAR if valor is None else EstadoDato.VERIFICADO


def _a_decimal(valor: Any) -> Optional[Decimal]:
    return None if valor is None else Decimal(str(valor))


def _concepto(
    nombre: str,
    base: Decimal,
    tasa_pct: Optional[Decimal],
    origen: dict[str, Any],
) -> Concepto:
    """
    Arma un renglon de la cotizacion.

    Si la tasa no esta, el renglon igual se emite: con tasa y monto en cero,
    estado sin verificar y la fuente vacia. Asi la cotizacion siempre tiene la
    misma forma y la pantalla puede marcar el hueco en lugar de no mostrar nada.
    """
    tasa = tasa_pct if tasa_pct is not None else Decimal("0")
    monto = _redondear(base * tasa / Decimal("100"))

    return Concepto(
        concepto=nombre,
        base_mxn=_redondear(base),
        tasa_pct=tasa,
        monto_mxn=monto,
        estado=_estado(tasa_pct),
        fuente=origen.get("fuente") or SIN_DATO,
        fecha_consulta=origen.get("fecha_consulta") or "",
        vigencia=origen.get("vigencia"),
    )


def _folio(momento: datetime) -> str:
    """Folio legible y ordenable, del estilo AC-20261020-1443."""
    return f"AC-{momento.strftime('%Y%m%d-%H%M')}"


def cotizar(peticion: CotizacionRequest) -> CotizacionResponse:
    """
    Calcula la cotizacion completa de una importacion.

    Devuelve siempre una cotizacion, incluso cuando faltan tasas. En ese caso
    baja la confianza y agrega el supuesto correspondiente, porque un cliente
    que ve "confianza baja" y una advertencia esta mejor informado que uno que
    recibe un error sin explicacion.
    """
    ahora = datetime.now(timezone.utc)
    params = catalogo.parametros()
    supuestos: list[Supuesto] = []

    # ---- Valor en aduana (CIF en pesos) ----
    cif_usd = peticion.valor_mercancia_usd + peticion.flete_usd + peticion.seguro_usd
    valor_en_aduana = _redondear(cif_usd * peticion.tipo_de_cambio)

    if peticion.flete_usd == 0:
        supuestos.append(
            Supuesto(
                clave="flete_en_cero",
                descripcion="La cotización se calculó con flete en cero.",
                por_que=(
                    "El motor no estima fletes: el precio depende de la naviera o "
                    "aerolínea, del volumen y de la temporada."
                ),
                como_verificar="Pide la cotización de flete a tu transportista y vuelve a calcular.",
                afecta_al_total=True,
            )
        )

    # ---- IGI, segun la fraccion ----
    fraccion = catalogo.buscar_fraccion(peticion.fraccion) or {}
    igi = _concepto(
        "IGI",
        valor_en_aduana,
        _a_decimal(fraccion.get("igi_pct")),
        fraccion,
    )

    if not fraccion:
        supuestos.append(
            Supuesto(
                clave="fraccion_desconocida",
                descripcion=f"La fracción {peticion.fraccion} no está en el catálogo.",
                por_que="El catálogo del capítulo 30 todavía no está completo.",
                como_verificar="Consulta la tasa en SIAVI y agrégala a data/fracciones.json.",
                afecta_al_total=True,
            )
        )
    elif fraccion.get("igi_pct") is None:
        supuestos.append(
            Supuesto(
                clave="igi_sin_verificar",
                descripcion="La tasa de IGI de esta fracción no está verificada.",
                por_que="Se tomó cero para poder calcular, pero no es un dato oficial.",
                como_verificar="Consulta la fracción en SIAVI y anota la tasa con su fecha.",
                afecta_al_total=True,
            )
        )

    # ---- DTA ----
    dta_param = params.get("dta", {})
    dta = _concepto("DTA", valor_en_aduana, _a_decimal(dta_param.get("tasa_pct")), dta_param)

    if dta_param.get("tasa_pct") is None:
        supuestos.append(
            Supuesto(
                clave="dta_sin_verificar",
                descripcion="La tasa del Derecho de Trámite Aduanero no está verificada.",
                por_que="Se tomó cero para poder calcular.",
                como_verificar="Lee el artículo 179 de la Ley Federal de Derechos vigente.",
                afecta_al_total=True,
            )
        )

    # ---- IVA, sobre el valor en aduana ya con IGI y DTA ----
    iva_param = params.get("iva", {})
    base_iva = valor_en_aduana + igi.monto_mxn + dta.monto_mxn

    clave_tasa = (
        "tasa_medicina_de_patente_pct"
        if peticion.es_medicina_de_patente
        else "tasa_general_pct"
    )
    iva = _concepto("IVA", base_iva, _a_decimal(iva_param.get(clave_tasa)), iva_param)

    if peticion.es_medicina_de_patente:
        supuestos.append(
            Supuesto(
                clave="medicina_de_patente",
                descripcion="Se aplicó la tasa de IVA de medicinas de patente.",
                por_que=(
                    "El cliente declaró que la mercancía es medicina de patente. El motor "
                    "no lo verifica: no tiene forma de saberlo desde la fracción."
                ),
                como_verificar=(
                    "Confirma con tu agente aduanal que el producto califica, según el "
                    "artículo 2-A de la Ley del IVA."
                ),
                afecta_al_total=True,
            )
        )

    if iva_param.get(clave_tasa) is None:
        supuestos.append(
            Supuesto(
                clave="iva_sin_verificar",
                descripcion="La tasa de IVA aplicable no está verificada.",
                por_que="Se tomó cero para poder calcular.",
                como_verificar=(
                    "Lee el artículo 2-A de la Ley del IVA y su reglamento, en su texto vigente."
                ),
                afecta_al_total=True,
            )
        )

    total = _redondear(valor_en_aduana + igi.monto_mxn + dta.monto_mxn + iva.monto_mxn)

    # ---- Costos que van aparte porque son rangos ----
    no_incluidos = [
        _rango(params.get("prevalidacion", {}), "Prevalidación del pedimento"),
        _rango(params.get("honorarios_agente_aduanal", {}), "Honorarios del agente aduanal"),
    ]

    # ---- Documentos ----
    docs = [
        Documento(
            clave=d.get("clave", ""),
            nombre=d.get("nombre", ""),
            quien_lo_emite=d.get("quien_lo_emite", ""),
            obligatorio=bool(d.get("obligatorio")),
            notas=d.get("notas"),
            estado=EstadoDato(d.get("estado", EstadoDato.EJEMPLO_SIN_VERIFICAR.value)),
            fuente=d.get("fuente") or SIN_DATO,
        )
        for d in catalogo.documentos()
    ]

    confianza = _calcular_confianza(igi, dta, iva)

    return CotizacionResponse(
        folio=_folio(ahora),
        emitida_en=ahora.isoformat(timespec="seconds"),
        fraccion=peticion.fraccion,
        descripcion_fraccion=fraccion.get("descripcion", "Fracción no encontrada en el catálogo"),
        origen=peticion.origen,
        destino=peticion.destino,
        valor_en_aduana_mxn=valor_en_aduana,
        igi=igi,
        dta=dta,
        iva=iva,
        total_mxn=total,
        costos_no_incluidos=no_incluidos,
        supuestos=supuestos,
        documentos=docs,
        confianza=confianza,
        advertencia=None if confianza is Confianza.ALTA else ADVERTENCIA_NO_FIRME,
    )


def _rango(origen: dict[str, Any], nombre: str) -> Rango:
    """Arma un costo que se reporta como rango y no entra al total."""
    return Rango(
        concepto=origen.get("concepto") or nombre,
        monto_min_mxn=_a_decimal(origen.get("monto_min_mxn")),
        monto_max_mxn=_a_decimal(origen.get("monto_max_mxn")),
        estado=EstadoDato(origen.get("estado", EstadoDato.EJEMPLO_SIN_VERIFICAR.value)),
        fuente=origen.get("fuente") or SIN_DATO,
        fecha_consulta=origen.get("fecha_consulta") or "",
    )


def _calcular_confianza(*conceptos: Concepto) -> Confianza:
    """
    Resume que tan firme es la cotizacion en una sola palabra.

    Se mira cuantos conceptos quedaron sin verificar. Basta uno para que la
    cotizacion deje de ser firme, porque ese hueco ya mueve el total.
    """
    sin_verificar = sum(
        1 for c in conceptos if c.estado is EstadoDato.EJEMPLO_SIN_VERIFICAR
    )

    if sin_verificar == 0:
        return Confianza.ALTA
    if sin_verificar == 1:
        return Confianza.MEDIA
    return Confianza.BAJA


def buscar_fracciones(consulta: str) -> BusquedaFraccionResponse:
    """Acerca fracciones candidatas para un texto libre."""
    return BusquedaFraccionResponse(
        consulta=consulta,
        candidatas=[
            FraccionCandidata(
                fraccion=f.get("fraccion", ""),
                descripcion=f.get("descripcion", ""),
                igi_pct=_a_decimal(f.get("igi_pct")),
                estado=EstadoDato(f.get("estado", EstadoDato.EJEMPLO_SIN_VERIFICAR.value)),
            )
            for f in catalogo.buscar_por_texto(consulta)
        ],
    )
