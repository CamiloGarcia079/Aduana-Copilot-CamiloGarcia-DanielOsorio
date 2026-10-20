"""
Pruebas de Integración de los Endpoints de la API (FastAPI TestClient)
"""

import unittest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from api.main import app


class TestAduanaApi(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        """Verifica que el servicio esté operativo."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["estado"], "operativo")

    def test_buscar_fracciones_insulina(self):
        """GET /api/v1/fracciones/buscar?q=insulina"""
        response = self.client.get("/api/v1/fracciones/buscar?q=insulina")
        self.assertEqual(response.status_code, 200)
        candidatas = response.json()
        self.assertIsInstance(candidatas, list)
        self.assertGreaterEqual(len(candidatas), 1)

        # Debe incluir la fracción de insulina inyectable
        fracciones = [item["fraccion"] for item in candidatas]
        self.assertTrue(any("3004.31.02.01" in f for f in fracciones))

        # Verificar estructura de cada candidato
        primer = candidatas[0]
        self.assertIn("fraccion", primer)
        self.assertIn("descripcion", primer)
        self.assertIn("categoria", primer)

    def test_cotizacion_insulina_patente_exito(self):
        """POST /api/v1/cotizacion con medicina de patente (IVA 0%)"""
        payload = {
            "fraccion": "3004.31.02.01",
            "valor_mercancia_usd": 25000.0,
            "flete_usd": 700.0,
            "seguro_usd": 120.0,
            "origen": "Alemania",
            "destino": "Guadalajara",
            "es_medicina_de_patente": True,
            "tipo_de_cambio": 20.0
        }
        response = self.client.post("/api/v1/cotizacion", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 1. Valor en aduana: (25000 + 700 + 120) * 20 = 25820 * 20 = 516,400.00 MXN
        self.assertEqual(data["valor_en_aduana_mxn"], 516400.00)

        # 2. IGI: Exento (0.00 MXN)
        self.assertEqual(data["igi"]["tasa"], 0.0)
        self.assertEqual(data["igi"]["monto_mxn"], 0.00)
        self.assertIn("fuente", data["igi"])
        self.assertIn("vigencia", data["igi"])

        # 3. DTA: 0.8% de 516,400 = 4,131.20 MXN
        self.assertEqual(data["dta"]["tasa"], 0.008)
        self.assertEqual(data["dta"]["monto_mxn"], 4131.20)
        self.assertIn("fuente", data["dta"])
        self.assertIn("vigencia", data["dta"])

        # 4. IVA: 0% por medicina de patente
        self.assertEqual(data["iva"]["tasa"], 0.0)
        self.assertEqual(data["iva"]["monto_mxn"], 0.00)
        self.assertIn("fuente", data["iva"])
        self.assertIn("vigencia", data["iva"])

        # 5. Prevalidación: Rango
        self.assertEqual(data["prevalidacion"]["min_mxn"], 310.00)
        self.assertEqual(data["prevalidacion"]["max_mxn"], 350.00)

        # 6. Honorarios: Rango (Piso mínimo aplica en este rango)
        self.assertEqual(data["honorarios"]["min_mxn"], 3500.00)
        self.assertEqual(data["honorarios"]["max_mxn"], 6500.00)

        # 7. Supuestos: Contiene justificación de medicina de patente
        supuestos = data["supuestos"]
        self.assertTrue(any("medicina de patente" in s.lower() for s in supuestos))

        # 8. Documentos: Contiene lista oficial
        self.assertIsInstance(data["documentos"], list)
        self.assertGreaterEqual(len(data["documentos"]), 5)

        # 9. Total MXN: Rango objeto {"min": ..., "max": ...}
        # min = 516400 + 0 + 4131.20 + 0 + 310 + 3500 = 524,341.20
        # max = 516400 + 0 + 4131.20 + 0 + 350 + 6500 = 527,381.20
        self.assertEqual(data["total_mxn"]["min"], 524341.20)
        self.assertEqual(data["total_mxn"]["max"], 527381.20)

    def test_cotizacion_no_patente_aplica_iva_16(self):
        """POST /api/v1/cotizacion con es_medicina_de_patente=False"""
        payload = {
            "fraccion": "3004.31.02.01",
            "valor_mercancia_usd": 10000.0,
            "flete_usd": 0.0,
            "seguro_usd": 0.0,
            "origen": "Alemania",
            "destino": "Guadalajara",
            "es_medicina_de_patente": False,
            "tipo_de_cambio": 20.0
        }
        response = self.client.post("/api/v1/cotizacion", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Valor en aduana: 10000 * 20 = 200,000.00 MXN
        # DTA: 200,000 * 0.008 = 1,600.00 MXN
        # IGI: 0.00 MXN
        # Base gravable IVA: 200,000 + 1,600 = 201,600.00 MXN
        # IVA 16%: 201,600 * 0.16 = 32,256.00 MXN
        self.assertEqual(data["iva"]["tasa"], 0.16)
        self.assertEqual(data["iva"]["monto_mxn"], 32256.00)

    def test_cotizacion_fraccion_inexistente_retorna_404(self):
        """Verifica que fracción no catalogada devuelva 404."""
        payload = {
            "fraccion": "0000.00.00.00",
            "valor_mercancia_usd": 1000.0,
            "tipo_de_cambio": 20.0
        }
        response = self.client.post("/api/v1/cotizacion", json=payload)
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
