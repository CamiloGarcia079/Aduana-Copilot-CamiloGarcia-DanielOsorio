"""
Pruebas del motor de calculo.

Se dividen en dos grupos con proposito distinto:

1. Pruebas de la formula. Usan datos inventados a proposito para comprobar que
   la aritmetica es correcta: que el IVA se monta sobre el IGI y el DTA, que el
   redondeo sube el medio centavo, que los Decimal no arrastran error.

2. Casos dorados. Son cotizaciones reales calculadas a mano en Excel por una
   persona, guardadas en `casos_dorados.json`. Son la prueba que de verdad
   importa: si el motor coincide con las cuentas de un humano en cinco casos
   distintos, se le puede creer. Mientras el archivo no exista, estas pruebas
   se saltan solas.
"""

import json
from decimal import Decimal
from pathlib import Path

import pytest

from app.schemas import Confianza, CotizacionRequest, EstadoDato
from app.services import catalogo, cotizacion

CASOS_DORADOS = Path(__file__).parent / "casos_dorados.json"


# --------------------------------------------------------------------------
# Grupo 1: la formula
# --------------------------------------------------------------------------


@pytest.fixture
def datos_de_prueba(monkeypatch):
    """
    Sustituye el catalogo real por tasas inventadas y faciles de verificar.

    Se usan numeros redondos (10% de IGI, 1% de DTA, 16% de IVA) para que la
    cuenta se pueda seguir mentalmente al leer la prueba.
    """
    monkeypatch.setattr(
        catalogo,
        "buscar_fraccion",
        lambda codigo: {
            "fraccion": "9999.99.99",
            "descripcion": "Mercancia de prueba",
            "igi_pct": 10,
            "fuente": "prueba",
            "fecha_consulta": "2026-10-20",
        }
        if codigo == "9999.99.99"
        else None,
    )
    monkeypatch.setattr(
        catalogo,
        "parametros",
        lambda: {
            "dta": {"tasa_pct": 1, "fuente": "prueba", "fecha_consulta": "2026-10-20"},
            "iva": {
                "tasa_general_pct": 16,
                "tasa_medicina_de_patente_pct": 0,
                "fuente": "prueba",
                "fecha_consulta": "2026-10-20",
            },
            "prevalidacion": {"estado": "estimado", "monto_min_mxn": 300, "monto_max_mxn": 400},
            "honorarios_agente_aduanal": {"estado": "estimado", "pct_min": 0.3, "pct_max": 0.8},
        },
    )
    monkeypatch.setattr(catalogo, "documentos", lambda: [])


def _peticion(**cambios) -> CotizacionRequest:
    """Peticion base de las pruebas, con los campos que se quieran cambiar."""
    valores = {
        "fraccion": "9999.99.99",
        "valor_mercancia_usd": Decimal("1000"),
        "flete_usd": Decimal("100"),
        "seguro_usd": Decimal("50"),
        "tipo_de_cambio": Decimal("20"),
        "origen": "Alemania",
    }
    valores.update(cambios)
    return CotizacionRequest(**valores)


def test_valor_en_aduana_suma_mercancia_flete_y_seguro(datos_de_prueba):
    """El valor en aduana es el CIF convertido a pesos."""
    r = cotizacion.cotizar(_peticion())

    # (1000 + 100 + 50) x 20 = 23 000
    assert r.valor_en_aduana_mxn == Decimal("23000.00")


def test_igi_se_aplica_sobre_el_valor_en_aduana(datos_de_prueba):
    r = cotizacion.cotizar(_peticion())

    # 23 000 x 10% = 2 300
    assert r.igi.monto_mxn == Decimal("2300.00")
    assert r.igi.base_mxn == Decimal("23000.00")


def test_dta_se_aplica_sobre_el_valor_en_aduana(datos_de_prueba):
    r = cotizacion.cotizar(_peticion())

    # 23 000 x 1% = 230
    assert r.dta.monto_mxn == Decimal("230.00")


def test_iva_se_monta_sobre_el_igi_y_el_dta(datos_de_prueba):
    """
    Esta es la prueba que mas importa de la formula.

    Si el IVA se calculara solo sobre el valor en aduana daria 3 680. La base
    correcta incluye el IGI y el DTA, asi que son 4 084.80. La diferencia es
    plata real y es el error mas facil de cometer.
    """
    r = cotizacion.cotizar(_peticion())

    # base = 23 000 + 2 300 + 230 = 25 530
    assert r.iva.base_mxn == Decimal("25530.00")
    # 25 530 x 16% = 4 084.80
    assert r.iva.monto_mxn == Decimal("4084.80")


def test_el_total_es_la_suma_de_los_renglones(datos_de_prueba):
    r = cotizacion.cotizar(_peticion())

    esperado = r.valor_en_aduana_mxn + r.igi.monto_mxn + r.dta.monto_mxn + r.iva.monto_mxn
    assert r.total_mxn == esperado
    # 23 000 + 2 300 + 230 + 4 084.80
    assert r.total_mxn == Decimal("29614.80")


def test_medicina_de_patente_cambia_la_tasa_y_deja_supuesto(datos_de_prueba):
    """
    El motor nunca decide solo si algo es medicina de patente.

    Lo declara el cliente, y por eso queda anotado como supuesto: si despues
    resulta que no calificaba, la cotizacion dice de donde salio el cero.
    """
    r = cotizacion.cotizar(_peticion(es_medicina_de_patente=True))

    assert r.iva.tasa_pct == Decimal("0")
    assert r.iva.monto_mxn == Decimal("0.00")

    claves = [s.clave for s in r.supuestos]
    assert "medicina_de_patente" in claves


def test_flete_en_cero_genera_supuesto(datos_de_prueba):
    """El motor no estima fletes, y lo dice en lugar de callarlo."""
    r = cotizacion.cotizar(_peticion(flete_usd=Decimal("0")))

    assert "flete_en_cero" in [s.clave for s in r.supuestos]


def test_fraccion_desconocida_no_revienta_y_baja_la_confianza(datos_de_prueba):
    """
    Una fraccion que no esta en el catalogo devuelve cotizacion, no error.

    Es a proposito: el catalogo esta incompleto mientras se cura, y es mejor
    entregar una cotizacion que avisa de su hueco que un 500 sin explicacion.
    """
    r = cotizacion.cotizar(_peticion(fraccion="0000.00.00"))

    assert r.igi.estado is EstadoDato.EJEMPLO_SIN_VERIFICAR
    assert r.confianza is not Confianza.ALTA
    assert r.advertencia is not None
    assert "fraccion_desconocida" in [s.clave for s in r.supuestos]


def test_con_todos_los_datos_verificados_la_confianza_es_alta(datos_de_prueba):
    r = cotizacion.cotizar(_peticion())

    assert r.confianza is Confianza.ALTA
    assert r.advertencia is None


def test_los_rangos_no_entran_al_total(datos_de_prueba):
    """
    Honorarios y prevalidacion se reportan aparte.

    Meterlos al total obligaria a elegir un punto del rango, y eso seria
    inventar precision: el total dejaria de ser verificable.
    """
    r = cotizacion.cotizar(_peticion())

    assert len(r.costos_no_incluidos) == 2
    assert r.total_mxn == Decimal("29614.80")


def test_el_redondeo_sube_el_medio_centavo(datos_de_prueba):
    """
    Se usa ROUND_HALF_UP y no el redondeo al par de Python.

    Con 0.025 de base, el redondeo por defecto de Python daria 0.02 y un
    contador esperaria 0.03.
    """
    r = cotizacion.cotizar(
        _peticion(
            valor_mercancia_usd=Decimal("0.125"),
            flete_usd=Decimal("0"),
            seguro_usd=Decimal("0"),
            tipo_de_cambio=Decimal("1"),
        )
    )

    # 0.125 redondeado a centavos
    assert r.valor_en_aduana_mxn == Decimal("0.13")


# --------------------------------------------------------------------------
# Grupo 2: casos dorados
# --------------------------------------------------------------------------


def _cargar_casos_dorados() -> list[dict]:
    if not CASOS_DORADOS.exists():
        return []
    return json.loads(CASOS_DORADOS.read_text(encoding="utf-8")).get("casos", [])


@pytest.mark.skipif(
    not CASOS_DORADOS.exists(),
    reason="Todavia no existe core/tests/casos_dorados.json con las cuentas hechas a mano.",
)
@pytest.mark.parametrize("caso", _cargar_casos_dorados(), ids=lambda c: c.get("nombre", "caso"))
def test_caso_dorado(caso):
    """
    Compara el motor contra una cotizacion calculada a mano.

    Cada caso del archivo trae su `entrada` y los totales que una persona
    obtuvo en Excel. Si no coinciden, o el motor esta mal o la cuenta a mano
    estaba mal: en cualquiera de los dos casos hay que revisarlo antes de
    mostrarle una cifra a un cliente.
    """
    resultado = cotizacion.cotizar(CotizacionRequest(**caso["entrada"]))
    esperado = caso["esperado"]

    for campo, valor in esperado.items():
        obtenido = {
            "valor_en_aduana_mxn": resultado.valor_en_aduana_mxn,
            "igi_mxn": resultado.igi.monto_mxn,
            "dta_mxn": resultado.dta.monto_mxn,
            "iva_mxn": resultado.iva.monto_mxn,
            "total_mxn": resultado.total_mxn,
        }[campo]

        assert obtenido == Decimal(str(valor)), (
            f"{caso['nombre']}: {campo} dio {obtenido} y a mano salio {valor}"
        )
