# Scripts

Herramientas de un solo uso. No forman parte del sistema que corre: están aquí
para dejar por escrito **cómo se construyeron los datos**, que es lo que
permite rehacerlos o auditarlos después.

## curate_fracciones.py

Extrae las fracciones de medicamentos (partidas 3003 y 3004) del catálogo
oficial del SAT y las convierte al formato de `data/fracciones.json`,
clasificándolas por categoría clínica.

**No corre tal cual.** La ruta del archivo de Excel está escrita a mano y
apunta a la máquina donde se ejecutó. Para volver a usarlo:

1. Descarga el catálogo del SAT: `c_FraccionArancelaria_20240513.xls`, de los
   catálogos de Comercio Exterior para CFDI 4.0.
2. Cambia `EXCEL_PATH` por la ruta donde lo guardaste.
3. Instala la librería que lee el archivo: `pip install xlrd`.
4. Córrelo: `python scripts/curate_fracciones.py`

El resultado hay que revisarlo a mano antes de meterlo en `data/`. El script
saca el código y la descripción del catálogo del SAT, pero **la tasa de IGI no
viene en ese archivo**: esa se consulta aparte y se anota con su fuente y su
fecha, como explica `data/LEEME.md`.
