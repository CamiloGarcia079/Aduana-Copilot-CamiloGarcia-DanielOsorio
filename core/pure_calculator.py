"""
Módulo de Funciones Puras de Cálculo Aduanero (Core Pure Calculator)
===================================================================
Reglas del Negocio:
• Cero LLM en cálculos matemáticos.
• Decimal estricto para evitar imprecisiones de coma flotante (IEEE 754).
• Fórmulas:
  1. Valor en aduana = (mercancía + flete + seguro) × tipo de cambio
  2. IGI = valor en aduana × tasa de la fracción
  3. DTA = valor en aduana × 0.8% (factor 0.008, Art. 49 Fracc. I LFD)
  4. IVA = (valor en aduana + IGI + DTA) × tasa
  5. Si es medicina de patente: tasa IVA = 0.0% y se registra en supuestos
  6. Prevalidación y honorarios: calculados como rangos (min y max)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Tuple, List, Optional


DOS_DECIMALES = Decimal("0.01")
TASA_DTA = Decimal("0.008")         # 0.8% (8 al millar)
TASA_IVA_GENERAL = Decimal("0.16")  # 16% tasa general
TASA_IVA_PATENTE = Decimal("0.0")   # 0% medicinas de patente

# Rangos normativos y de mercado
PREVAL_MIN = Decimal("310.00")
PREVAL_MAX = Decimal("350.00")

HON_PCT_MIN = Decimal("0.0045")     # 0.45%
HON_PCT_MAX = Decimal("0.0080")     # 0.80%
HON_PISO_MIN = Decimal("3500.00")
HON_PISO_MAX = Decimal("6500.00")


def redondear(valor: Decimal) -> Decimal:
    """Redondea un Decimal a 2 decimales usando ROUND_HALF_UP (estándar fiscal/aduanero)."""
    return valor.quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)


def calcular_valor_en_aduana(
    valor_mercancia_usd: Decimal,
    flete_usd: Decimal,
    seguro_usd: Decimal,
    tipo_de_cambio: Decimal
) -> Decimal:
    """
    Fórmula: Valor en aduana = (mercancía + flete + seguro) × tipo de cambio
    """
    base_usd = valor_mercancia_usd + flete_usd + seguro_usd
    return redondear(base_usd * tipo_de_cambio)


def calcular_igi(
    valor_en_aduana_mxn: Decimal,
    tasa_fraccion: Decimal
) -> Decimal:
    """
    Fórmula: IGI = valor en aduana × tasa de la fracción
    """
    return redondear(valor_en_aduana_mxn * tasa_fraccion)


def calcular_dta(
    valor_en_aduana_mxn: Decimal
) -> Decimal:
    """
    Fórmula: DTA = valor en aduana × 0.8% (Art. 49 Fracc. I Ley Federal de Derechos)
    """
    return redondear(valor_en_aduana_mxn * TASA_DTA)


def calcular_iva(
    valor_en_aduana_mxn: Decimal,
    igi_mxn: Decimal,
    dta_mxn: Decimal,
    es_medicina_de_patente: bool
) -> Tuple[Decimal, Decimal, Optional[str]]:
    """
    Fórmula: IVA = (valor en aduana + IGI + DTA) × tasa
    Si es medicina de patente: tasa = 0% y genera el texto de supuesto regulatorio.
    """
    base_gravable = valor_en_aduana_mxn + igi_mxn + dta_mxn
    if es_medicina_de_patente:
        tasa = TASA_IVA_PATENTE
        monto = Decimal("0.00")
        supuesto = (
            "Se aplicó tasa del 0% de IVA por declararse medicina de patente "
            "(Fundamento: Art. 25 Fracc. III y Art. 2-A Fracc. I inc. b de la Ley del IVA; "
            "Art. 7 del Reglamento de la LIVA). Requiere Registro Sanitario vigente de COFEPRIS."
        )
    else:
        tasa = TASA_IVA_GENERAL
        monto = redondear(base_gravable * tasa)
        supuesto = None

    return tasa, monto, supuesto


def calcular_prevalidacion_rango() -> Tuple[Decimal, Decimal]:
    """Retorna el rango estimado de prevalidación (min_mxn, max_mxn)."""
    return PREVAL_MIN, PREVAL_MAX


def calcular_honorarios_rango(valor_en_aduana_mxn: Decimal) -> Tuple[Decimal, Decimal]:
    """
    Retorna el rango estimado de honorarios de agente aduanal (min_mxn, max_mxn).
    Calculado como 0.45% a 0.80% con pisos mínimos de $3,500 y $6,500 MXN.
    """
    calculado_min = valor_en_aduana_mxn * HON_PCT_MIN
    calculado_max = valor_en_aduana_mxn * HON_PCT_MAX

    hon_min = redondear(max(HON_PISO_MIN, calculado_min))
    hon_max = redondear(max(HON_PISO_MAX, calculado_max))
    return hon_min, hon_max


def calcular_cotizacion_completa(
    fraccion_info: Dict[str, Any],
    valor_mercancia_usd: Decimal,
    flete_usd: Decimal,
    seguro_usd: Decimal,
    tipo_de_cambio: Decimal,
    origen: str,
    destino: str,
    es_medicina_de_patente: bool,
    documentos_catalogo: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Función pura orquestadora del cálculo.
    Toma tipos Decimal y catálogos validados, retornando el contrato de cotización.
    """
    # 1. Valor en aduana
    valor_en_aduana_mxn = calcular_valor_en_aduana(
        valor_mercancia_usd, flete_usd, seguro_usd, tipo_de_cambio
    )

    # 2. IGI
    tasa_igi_dec = Decimal(str(fraccion_info.get("igi_pct", 0.0))) / Decimal("100.0")
    monto_igi_mxn = calcular_igi(valor_en_aduana_mxn, tasa_igi_dec)

    # 3. DTA
    monto_dta_mxn = calcular_dta(valor_en_aduana_mxn)

    # 4. IVA
    tasa_iva_dec, monto_iva_mxn, supuesto_iva = calcular_iva(
        valor_en_aduana_mxn, monto_igi_mxn, monto_dta_mxn, es_medicina_de_patente
    )

    # 5. Rangos estimados
    preval_min, preval_max = calcular_prevalidacion_rango()
    hon_min, hon_max = calcular_honorarios_rango(valor_en_aduana_mxn)

    # 6. Lista de supuestos obligatorios con fuente y vigencia
    supuestos: List[str] = []
    if supuesto_iva:
        supuestos.append(supuesto_iva)
    else:
        supuestos.append("Se aplicó tasa general del 16% de IVA al no declararse medicina de patente (Art. 1 LIVA).")

    supuestos.append(
        f"Tipo de cambio comercial: ${tipo_de_cambio:,.4f} MXN/USD (Fuente: FIX Banco de México / DOF)."
    )
    supuestos.append(
        f"Prevalidación estimada en rango de ${preval_min} a ${preval_max} MXN "
        "(Art. 16-A Ley Aduanera y Regla 1.8.3 RGCE 2026)."
    )
    supuestos.append(
        f"Honorarios estimados en rango de ${hon_min:,.2f} a ${hon_max:,.2f} MXN "
        "(Tabuladores de referencia CAAAREM / mercado aduanal)."
    )

    # 7. Totales (tanto el rango total estimado de importación como subtotal fiscal fijo)
    total_min_mxn = redondear(valor_en_aduana_mxn + monto_igi_mxn + monto_dta_mxn + monto_iva_mxn + preval_min + hon_min)
    total_max_mxn = redondear(valor_en_aduana_mxn + monto_igi_mxn + monto_dta_mxn + monto_iva_mxn + preval_max + hon_max)

    return {
        "valor_en_aduana_mxn": float(valor_en_aduana_mxn),
        "igi": {
            "tasa": float(tasa_igi_dec),
            "monto_mxn": float(monto_igi_mxn),
            "fuente": fraccion_info.get("fuente", "LIGIE (DOF 07/06/2022) / SAT"),
            "vigencia": "2026"
        },
        "dta": {
            "tasa": float(TASA_DTA),
            "monto_mxn": float(monto_dta_mxn),
            "fuente": "Artículo 49, Fracción I de la Ley Federal de Derechos",
            "vigencia": "2026"
        },
        "iva": {
            "tasa": float(tasa_iva_dec),
            "monto_mxn": float(monto_iva_mxn),
            "fuente": "Art. 25 Fracc. III y Art. 2-A Fracc. I inc. b LIVA; Art. 7 RLIVA" if es_medicina_de_patente else "Art. 1 de la Ley del IVA (Tasa General 16%)",
            "vigencia": "2026"
        },
        "prevalidacion": {
            "min_mxn": float(preval_min),
            "max_mxn": float(preval_max),
            "fuente": "Artículo 16-A Ley Aduanera y Regla 1.8.3 RGCE",
            "vigencia": "2026"
        },
        "honorarios": {
            "min_mxn": float(hon_min),
            "max_mxn": float(hon_max),
            "fuente": "Tabulador de referencia CAAAREM y prácticas de mercado",
            "vigencia": "2026"
        },
        "supuestos": supuestos,
        "documentos": documentos_catalogo,
        "total_mxn": {
            "min": float(total_min_mxn),
            "max": float(total_max_mxn)
        }
    }
