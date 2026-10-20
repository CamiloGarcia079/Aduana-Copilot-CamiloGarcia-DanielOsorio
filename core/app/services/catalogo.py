"""
Carga de los datos arancelarios desde la carpeta data/.

El motor no trae ningun numero escrito en el codigo. Todo sale de los archivos
JSON de data/, y por eso actualizar una tasa cuando cambia la ley no obliga a
tocar el programa ni a volver a desplegarlo.

Si existen los archivos reales (`fracciones.json`), se usan esos. Si no, se
cae a los de ejemplo (`fracciones.ejemplo.json`), que no tienen tasas y dejan
la cotizacion en confianza baja. Nunca se inventa una tasa que falte.
"""

import json
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

# data/ vive en la raiz del repo, tres carpetas arriba de este archivo.
CARPETA_DATOS = Path(__file__).resolve().parents[3] / "data"


def _cargar(nombre: str) -> dict[str, Any]:
    """
    Lee un archivo de datos, prefiriendo el real sobre el de ejemplo.

    Devuelve un diccionario vacio si no hay ninguno de los dos, en lugar de
    reventar: el motor tiene que poder arrancar y avisar que le faltan datos.
    """
    real = CARPETA_DATOS / f"{nombre}.json"
    ejemplo = CARPETA_DATOS / f"{nombre}.ejemplo.json"

    archivo = real if real.exists() else ejemplo
    if not archivo.exists():
        return {}

    return json.loads(archivo.read_text(encoding="utf-8"))


def _a_decimal(valor: Any) -> Optional[Decimal]:
    """
    Convierte a Decimal pasando por texto.

    El paso por `str` es a proposito: `Decimal(0.8)` guarda el error del float
    y arrastra basura en los decimales, mientras `Decimal("0.8")` guarda 0.8
    exacto. Como los JSON traen numeros, hay que convertirlos asi.
    """
    if valor is None:
        return None
    return Decimal(str(valor))


@lru_cache(maxsize=1)
def fracciones() -> list[dict[str, Any]]:
    """Catalogo de fracciones del capitulo 30."""
    datos = _cargar("fracciones")
    if isinstance(datos, list):
        return datos
    return datos.get("fracciones", [])


@lru_cache(maxsize=1)
def parametros() -> dict[str, Any]:
    """DTA, IVA, prevalidacion y honorarios."""
    return _cargar("parametros")


@lru_cache(maxsize=1)
def documentos() -> list[dict[str, Any]]:
    """Permisos y documentos de una importacion de medicamentos."""
    datos = _cargar("documentos")
    if isinstance(datos, list):
        return datos
    return datos.get("documentos", [])


def buscar_fraccion(codigo: str) -> Optional[dict[str, Any]]:
    """Busca una fraccion por su codigo exacto o limpio sin puntos."""
    cod_limpio = codigo.replace(".", "").strip()
    for f in fracciones():
        f_cod = f.get("fraccion", "").strip()
        if f_cod == codigo or f_cod.replace(".", "") == cod_limpio or f_cod.startswith(codigo):
            return f
    return None


def buscar_por_texto(consulta: str, tope: int = 8) -> list[dict[str, Any]]:
    """
    Busca fracciones cuya descripcion o codigo contenga el texto.

    Es una busqueda simple por subcadena, suficiente para el catalogo del
    capitulo 30, que son unas 195 fracciones. Si el catalogo creciera a toda
    la TIGIE habria que indexarlo.
    """
    agujas = [p for p in consulta.lower().split() if len(p) > 2]
    if not agujas:
        return []

    encontradas = [
        f
        for f in fracciones()
        if all(
            aguja in f"{f.get('fraccion', '')} {f.get('descripcion', '')}".lower()
            for aguja in agujas
        )
    ]

    # Si nada coincide con todas las palabras, se relaja a cualquiera de ellas.
    if not encontradas:
        encontradas = [
            f
            for f in fracciones()
            if any(
                aguja in f"{f.get('fraccion', '')} {f.get('descripcion', '')}".lower()
                for aguja in agujas
            )
        ]

    return encontradas[:tope]


def recargar() -> None:
    """
    Olvida los datos en memoria para que se vuelvan a leer del disco.

    Sirve en desarrollo: Daniel edita data/fracciones.json y llama a esto en
    lugar de reiniciar el servidor.
    """
    fracciones.cache_clear()
    parametros.cache_clear()
    documentos.cache_clear()
