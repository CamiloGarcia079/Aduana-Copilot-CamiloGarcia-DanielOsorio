"""
Pruebas Unitarias del Motor de Cálculo (Core Engine) de Aduana-Copilot
"""

import unittest
import sys
from pathlib import Path

# Agregar raíz del proyecto al sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from core.calculator import AduanaCalculator, AduanaValidationError


class TestAduanaCalculator(unittest.TestCase):
    def setUp(self):
        self.calc = AduanaCalculator()

    def test_catalogo_cargado(self):
        """Verifica que se carguen al menos 10 fracciones iniciales de medicamentos."""
        # Debido a que se registran con puntos y sin puntos, la cantidad de claves es >= 10
        self.assertGreaterEqual(len(self.calc.fracciones), 10)
        self.assertIn("3004.31.02.01", self.calc.fracciones)
        self.assertIn("3004.49.03.00", self.calc.fracciones)

    def test_regla_de_oro_fuente_y_fecha(self):
        """Verifica que cada parámetro y fracción tenga explícitamente fuente y fecha_consulta."""
        for fracc, data in self.calc.fracciones.items():
            self.assertTrue(bool(data.get("fuente")), f"Fracción {fracc} sin fuente")
            self.assertTrue(bool(data.get("fecha_consulta")), f"Fracción {fracc} sin fecha_consulta")

        for param_name, param_data in self.calc.parametros.items():
            self.assertTrue(bool(param_data.get("fuente")), f"Parámetro {param_name} sin fuente")
            self.assertTrue(bool(param_data.get("fecha_consulta")), f"Parámetro {param_name} sin fecha_consulta")

    def test_cotizacion_insulina_alemania_guadalajara(self):
        """Prueba del caso de uso de referencia: 500 cajas de insulina desde Alemania a Guadalajara."""
        # 500 cajas a 50 EUR cada una = 25,000 EUR
        # Tipo de cambio = 21.50 MXN/EUR -> Valor comercial = 537,500.00 MXN
        # Flete aéreo internacional = 15,000.00 MXN
        # Seguro internacional = 2,500.00 MXN
        # Valor Aduana = 555,000.00 MXN
        resultado = self.calc.cotizar_importacion(
            fraccion="3004.31.02.01",
            valor_factura=25000.0,
            moneda="EUR",
            tipo_cambio=21.50,
            flete_internacional_mxn=15000.0,
            seguro_internacional_mxn=2500.0,
            origen="Alemania",
            destino="Guadalajara, Jalisco",
            cantidad=500,
            unidad_medida="cajas"
        )

        # 1. Validación de valor comercial y valor en aduana
        self.assertEqual(resultado["desglose_valores_mxn"]["valor_comercial"], 537500.00)
        self.assertEqual(resultado["desglose_valores_mxn"]["valor_aduana"], 555000.00)

        # 2. IGI: Exento (0.00 MXN)
        igi = resultado["contribuciones_aduanales_mxn"]["arancel_igi"]
        self.assertEqual(igi["tasa_pct"], 0.0)
        self.assertEqual(igi["monto"], 0.00)
        self.assertTrue(bool(igi["fuente"]))

        # 3. DTA: 0.8% del valor en aduana = 555,000 * 0.008 = 4,440.00 MXN
        dta = resultado["contribuciones_aduanales_mxn"]["dta"]
        self.assertEqual(dta["tasa_pct"], 0.8)
        self.assertEqual(dta["monto"], 4440.00)
        self.assertIn("Artículo 49", dta["fundamento_legal"])

        # 4. IVA: 0% marcado estrictamente como supuesto
        iva = resultado["contribuciones_aduanales_mxn"]["iva"]
        self.assertEqual(iva["tasa_pct"], 0.0)
        self.assertEqual(iva["monto"], 0.00)
        self.assertTrue(iva["es_supuesto"])
        self.assertIn("Artículo 25", iva["fundamento_legal"])

        # 5. Prevalidación: Siempre en rango (nunca cifra única)
        preval = resultado["servicios_y_gastos_estimados_mxn"]["prevalidacion"]
        self.assertIn("min_mxn", preval)
        self.assertIn("max_mxn", preval)
        self.assertEqual(preval["min_mxn"], 310.0)
        self.assertEqual(preval["max_mxn"], 350.0)

        # 6. Honorarios: Siempre en rango (mínimo y máximo)
        honorarios = resultado["servicios_y_gastos_estimados_mxn"]["honorarios_agente_aduanal"]
        self.assertIn("min_mxn", honorarios)
        self.assertIn("max_mxn", honorarios)
        self.assertGreater(honorarios["max_mxn"], honorarios["min_mxn"])

        # 7. Documentos regulatorios
        docs = resultado["documentos_y_permisos_requeridos"]
        ids = [d["id"] for d in docs]
        self.assertIn("registro_sanitario", ids)
        self.assertIn("permiso_previo_importacion", ids)
        self.assertIn("monitoreo_cadena_frio", ids)

        # 8. Supuestos usados: Todo supuesto trae fuente y fecha
        supuestos = resultado["supuestos_usados"]
        self.assertGreaterEqual(len(supuestos), 4)
        for s in supuestos:
            self.assertTrue(bool(s.get("fuente")), f"Supuesto {s['concepto']} sin fuente")
            self.assertTrue(bool(s.get("fecha")), f"Supuesto {s['concepto']} sin fecha")

    def test_fraccion_inexistente_lanza_error(self):
        """Verifica que fracciones no curadas lancen error controlado."""
        with self.assertRaises(AduanaValidationError):
            self.calc.cotizar_importacion(
                fraccion="9999.99.99.99",
                valor_factura=1000.0
            )


if __name__ == "__main__":
    unittest.main()
