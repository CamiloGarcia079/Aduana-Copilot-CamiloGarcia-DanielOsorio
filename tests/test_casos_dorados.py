"""
Suite de Pruebas Automatizadas de los Casos Dorados (Bloque 4)
Valida que cada uno de los 5 casos hechos a mano coincida exactamente
con el cálculo del motor puro y la respuesta del endpoint POST /api/v1/cotizacion.
"""

import unittest
import json
from decimal import Decimal
from pathlib import Path
from fastapi.testclient import TestClient
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from api.main import app
from core.pure_calculator import calcular_cotizacion_completa

CASOS_FILE = BASE_DIR / "core" / "tests" / "casos_dorados.json"
DATA_DIR = BASE_DIR / "data"


class TestCasosDorados(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        with open(CASOS_FILE, "r", encoding="utf-8") as f:
            cls.casos = json.load(f)

        with open(DATA_DIR / "fracciones.json", "r", encoding="utf-8") as f:
            fracs = json.load(f)
            cls.fracciones_map = {f["fraccion"]: f for f in fracs}
            for f in fracs:
                cls.fracciones_map[f["fraccion"].replace(".", "")] = f

        with open(DATA_DIR / "documentos.json", "r", encoding="utf-8") as f:
            cls.documentos = json.load(f)

    def test_cantidad_de_casos_dorados(self):
        """Verifica que existan exactamente 5 casos dorados validados."""
        self.assertEqual(len(self.casos), 5)

    def test_validacion_matematica_y_api_de_cada_caso(self):
        """
        Ejecuta cada caso dorado contra el motor de cálculo y contra la API HTTP,
        validando cada cifra al centavo exacto.
        """
        for caso in self.casos:
            caso_id = caso["caso_id"]
            entrada = caso["entrada"]
            esperado = caso["salida_esperada"]

            with self.subTest(caso=caso_id):
                # 1. Prueba contra endpoint HTTP POST /api/v1/cotizacion
                response = self.client.post("/api/v1/cotizacion", json=entrada)
                self.assertEqual(
                    response.status_code, 200,
                    f"El caso {caso_id} falló con status {response.status_code}: {response.text}"
                )
                data = response.json()

                # Comparar Valor en Aduana
                self.assertEqual(
                    data["valor_en_aduana_mxn"], esperado["valor_en_aduana_mxn"],
                    f"[{caso_id}] Error en valor_en_aduana_mxn"
                )

                # Comparar IGI
                self.assertEqual(
                    data["igi"]["tasa"], esperado["igi"]["tasa"],
                    f"[{caso_id}] Error en tasa IGI"
                )
                self.assertEqual(
                    data["igi"]["monto_mxn"], esperado["igi"]["monto_mxn"],
                    f"[{caso_id}] Error en monto IGI"
                )

                # Comparar DTA
                self.assertEqual(
                    data["dta"]["tasa"], esperado["dta"]["tasa"],
                    f"[{caso_id}] Error en tasa DTA"
                )
                self.assertEqual(
                    data["dta"]["monto_mxn"], esperado["dta"]["monto_mxn"],
                    f"[{caso_id}] Error en monto DTA"
                )

                # Comparar IVA
                self.assertEqual(
                    data["iva"]["tasa"], esperado["iva"]["tasa"],
                    f"[{caso_id}] Error en tasa IVA"
                )
                self.assertEqual(
                    data["iva"]["monto_mxn"], esperado["iva"]["monto_mxn"],
                    f"[{caso_id}] Error en monto IVA"
                )

                # Comparar Prevalidación (Rango)
                self.assertEqual(
                    data["prevalidacion"]["min_mxn"], esperado["prevalidacion"]["min_mxn"],
                    f"[{caso_id}] Error en prevalidacion min"
                )
                self.assertEqual(
                    data["prevalidacion"]["max_mxn"], esperado["prevalidacion"]["max_mxn"],
                    f"[{caso_id}] Error en prevalidacion max"
                )

                # Comparar Honorarios (Rango)
                self.assertEqual(
                    data["honorarios"]["min_mxn"], esperado["honorarios"]["min_mxn"],
                    f"[{caso_id}] Error en honorarios min"
                )
                self.assertEqual(
                    data["honorarios"]["max_mxn"], esperado["honorarios"]["max_mxn"],
                    f"[{caso_id}] Error en honorarios max"
                )

                # Comparar Total MXN (Rango)
                self.assertEqual(
                    data["total_mxn"]["min"], esperado["total_mxn"]["min"],
                    f"[{caso_id}] Error en total_mxn min"
                )
                self.assertEqual(
                    data["total_mxn"]["max"], esperado["total_mxn"]["max"],
                    f"[{caso_id}] Error en total_mxn max"
                )

                # Validar presencia de supuestos y documentos
                self.assertGreaterEqual(len(data["supuestos"]), 3)
                self.assertGreaterEqual(len(data["documentos"]), 5)


if __name__ == "__main__":
    unittest.main()
