"""
Pruebas Unitarias de las Funciones Puras del Motor de Cálculo (Uso de Decimal)
"""

import unittest
from decimal import Decimal
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from core.pure_calculator import (
    calcular_valor_en_aduana,
    calcular_igi,
    calcular_dta,
    calcular_iva,
    calcular_prevalidacion_rango,
    calcular_honorarios_rango,
    calcular_cotizacion_completa
)


class TestPureCalculator(unittest.TestCase):

    def test_valor_en_aduana_formula_y_precision(self):
        """Fórmula: Valor en aduana = (mercancía + flete + seguro) × tipo de cambio"""
        mercancia = Decimal("20000.50")
        flete = Decimal("1500.25")
        seguro = Decimal("250.10")
        tc = Decimal("19.8525")

        # Suma base en USD: 20000.50 + 1500.25 + 250.10 = 21750.85 USD
        # Valor aduana MXN: 21750.85 * 19.8525 = 431808.749625 -> redondeado: 431808.75
        resultado = calcular_valor_en_aduana(mercancia, flete, seguro, tc)
        self.assertIsInstance(resultado, Decimal)
        self.assertEqual(resultado, Decimal("431808.75"))

    def test_igi_con_tasa_exenta_y_con_arancel(self):
        """Fórmula: IGI = valor en aduana × tasa de la fracción"""
        valor_aduana = Decimal("500000.00")

        # Caso medicamentos exentos (0.0)
        igi_cero = calcular_igi(valor_aduana, Decimal("0.0"))
        self.assertEqual(igi_cero, Decimal("0.00"))

        # Caso con arancel del 5%
        igi_cinco = calcular_igi(valor_aduana, Decimal("0.05"))
        self.assertEqual(igi_cinco, Decimal("25000.00"))

    def test_dta_ocho_al_millar(self):
        """Fórmula: DTA = valor en aduana × 0.8% (0.008)"""
        valor_aduana = Decimal("555000.00")
        dta = calcular_dta(valor_aduana)
        # 555,000 * 0.008 = 4,440.00
        self.assertEqual(dta, Decimal("4440.00"))

    def test_iva_medicina_de_patente_es_cero_y_agrega_supuesto(self):
        """Si es medicina de patente: IVA 0% y se genera el supuesto"""
        valor_aduana = Decimal("555000.00")
        igi = Decimal("0.00")
        dta = Decimal("4440.00")

        tasa, monto, supuesto = calcular_iva(valor_aduana, igi, dta, es_medicina_de_patente=True)
        self.assertEqual(tasa, Decimal("0.0"))
        self.assertEqual(monto, Decimal("0.00"))
        self.assertIsNotNone(supuesto)
        self.assertIn("Art. 25 Fracc. III", supuesto)
        self.assertIn("COFEPRIS", supuesto)

    def test_iva_no_patente_aplica_dieciseis_porciento(self):
        """Si NO es medicina de patente: aplica tasa general del 16%"""
        valor_aduana = Decimal("100000.00")
        igi = Decimal("0.00")
        dta = Decimal("800.00")
        # Base gravable: 100,000 + 0 + 800 = 100,800.00
        # IVA 16%: 100,800 * 0.16 = 16,128.00
        tasa, monto, supuesto = calcular_iva(valor_aduana, igi, dta, es_medicina_de_patente=False)
        self.assertEqual(tasa, Decimal("0.16"))
        self.assertEqual(monto, Decimal("16128.00"))
        self.assertIsNone(supuesto)

    def test_prevalidacion_y_honorarios_como_rangos(self):
        """Prevalidación y honorarios siempre retornan rangos (min y max)"""
        p_min, p_max = calcular_prevalidacion_rango()
        self.assertLess(p_min, p_max)
        self.assertEqual(p_min, Decimal("310.00"))
        self.assertEqual(p_max, Decimal("350.00"))

        valor_aduana = Decimal("555000.00")
        h_min, h_max = calcular_honorarios_rango(valor_aduana)
        # 555,000 * 0.0045 = 2,497.50 -> Aplica piso mínimo de 3,500.00
        self.assertEqual(h_min, Decimal("3500.00"))
        # 555,000 * 0.0080 = 4,440.00 -> Aplica piso mínimo de 6,500.00
        self.assertEqual(h_max, Decimal("6500.00"))

    def test_calcular_cotizacion_completa_estructura_contrato(self):
        """Verifica que la función orquestadora cumpla con las claves del contrato"""
        fraccion_mock = {
            "fraccion": "3004.31.02.01",
            "descripcion": "Soluciones inyectables que contengan insulina",
            "igi_pct": 0.0,
            "fuente": "LIGIE (DOF 07/06/2022) / SAT"
        }
        docs_mock = [{"id": "registro_sanitario", "nombre": "Registro Sanitario"}]

        resp = calcular_cotizacion_completa(
            fraccion_info=fraccion_mock,
            valor_mercancia_usd=Decimal("25000.00"),
            flete_usd=Decimal("700.00"),
            seguro_usd=Decimal("120.00"),
            tipo_de_cambio=Decimal("20.00"),
            origen="Alemania",
            destino="Guadalajara",
            es_medicina_de_patente=True,
            documentos_catalogo=docs_mock
        )

        # Claves requeridas en el contrato
        self.assertIn("valor_en_aduana_mxn", resp)
        self.assertIn("igi", resp)
        self.assertIn("dta", resp)
        self.assertIn("iva", resp)
        self.assertIn("supuestos", resp)
        self.assertIn("documentos", resp)
        self.assertIn("total_mxn", resp)

        # Cada contribución contiene tasa, monto_mxn, fuente y vigencia
        for key in ["igi", "dta", "iva"]:
            self.assertIn("tasa", resp[key], f"Falta 'tasa' en {key}")
            self.assertIn("monto_mxn", resp[key], f"Falta 'monto_mxn' en {key}")
            self.assertIn("fuente", resp[key], f"Falta 'fuente' en {key}")
            self.assertIn("vigencia", resp[key], f"Falta 'vigencia' en {key}")


if __name__ == "__main__":
    unittest.main()
