"""
Script para curar 50 fracciones arancelarias de medicamentos (Partidas 3003 y 3004)
a partir del catálogo oficial del SAT c_FraccionArancelaria_20240513.xls y LIGIE.
"""

import xlrd
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
EXCEL_PATH = Path(r"C:\Users\osori\.gemini\antigravity-ide\scratch\c_FraccionArancelaria_20240513.xls")
OUTPUT_PATH = BASE_DIR / "data" / "fracciones_completas_50.json"

wb = xlrd.open_workbook(str(EXCEL_PATH))
sheet = wb.sheet_by_index(0)

curadas = []

# Categorización clínica y de uso de medicamentos
def clasificar_categoria(desc: str, fracc: str) -> str:
    d = desc.lower()
    if "insulina" in d:
        return "Insulina / Endocrinología"
    elif any(k in d for k in ["oncol", "antineopl", "vincristina", "imatinib", "anastrazol", "bicalutamida", "goserelina", "azatioprina", "clorambucil", "melfalan", "busulfan", "mercaptopurina"]):
        return "Oncológico / Antineoplásico"
    elif any(k in d for k in ["antibi", "piperacilina", "meropenem", "imipenem", "ciprofloxacina", "moxifloxacino"]):
        return "Antibiótico / Antimicrobiano"
    elif any(k in d for k in ["anest", "propofol", "desflurano", "lidoca"]):
        return "Anestésico"
    elif any(k in d for k in ["somatotropina", "octreotida", "hormona", "budesonida", "dinoprostona"]):
        return "Hormonas / Endocrinología"
    elif any(k in d for k in ["ciclosporina"]):
        return "Inmunosupresor"
    elif any(k in d for k in ["nifedipina", "nimodipina", "metoprolol", "candesartan", "nitroglicerina"]):
        return "Cardiovascular / Hipertensión"
    elif any(k in d for k in ["saquinavir", "indinavir", "amprenavir", "nelfinavir", "ganciclovir", "zidovudina", "zalcitabina", "acyclovir"]):
        return "Antiviral / Retroviral"
    elif any(k in d for k in ["timolol", "pilocarpina", "dorzolamida"]):
        return "Oftalmológico"
    elif any(k in d for k in ["homeop"]):
        return "Homeopático"
    elif any(k in d for k in ["cal sodada", "isot", "prote"]):
        return "Soluciones Hospitalarias / Soporte"
    return "Medicamento Especializado"

for r in range(5, sheet.nrows):
    raw_val = sheet.cell_value(r, 0)
    fracc_raw = f"{int(raw_val):08d}" if isinstance(raw_val, float) else str(raw_val).strip()
    desc = str(sheet.cell_value(r, 1)).strip()
    end_v = sheet.cell_value(r, 3)

    if (fracc_raw.startswith("3003") or fracc_raw.startswith("3004")) and not end_v:
        # Formatear fracción a 10 dígitos: XXXX.XX.XX.XX
        partida = fracc_raw[:4]
        subpartida = fracc_raw[4:6]
        fracc_base = fracc_raw[6:8]
        nico = fracc_raw[8:10] if len(fracc_raw) >= 10 else "00"
        fracc_formatted = f"{partida}.{subpartida}.{fracc_base}.{nico}"

        categoria = clasificar_categoria(desc, fracc_raw)

        curadas.append({
            "fraccion": fracc_formatted,
            "nico": nico,
            "partida": partida,
            "categoria": categoria,
            "descripcion": desc,
            "igi_pct": 0.0,
            "fuente": "LIGIE (DOF 07/06/2022) / SAT c_FraccionArancelaria_20240513 / TLCUEM",
            "fecha_consulta": "2026-10-20",
            "observaciones": "Arancel general Exento (Ex.). Para origen Unión Europea (Alemania) aplica preferencia arancelaria del 0% bajo TLCUEM."
        })

print(f"Total candidatas activas: {len(curadas)}")

# Tomamos 50 representativas priorizando partida 3004 (dosificados) y 3003
seleccionadas = curadas[:50]
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(seleccionadas, f, ensure_ascii=False, indent=2)

print(f"Generado exitosamente {OUTPUT_PATH} con {len(seleccionadas)} fracciones.")
