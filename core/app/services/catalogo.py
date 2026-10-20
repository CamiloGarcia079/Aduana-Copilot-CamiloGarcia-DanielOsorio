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


def _primero(origen: dict[str, Any], *nombres: str) -> Any:
    """
    Devuelve el primer campo que exista y traiga algo.

    Los archivos de datos se han escrito en dos momentos y con dos
    vocabularios: unos usan `clave` y `quien_lo_emite`, otros `id` y `emisor`.
    En lugar de obligar a reescribir los datos, que es donde esta el trabajo
    de verificacion mas caro, el motor acepta los dos y los traduce aqui.
    """
    for nombre in nombres:
        valor = origen.get(nombre)
        if valor not in (None, ""):
            return valor
    return None


def _normalizar_documento(d: dict[str, Any]) -> dict[str, Any]:
    """Lleva un documento a los nombres de campo que espera el contrato."""
    return {
        "clave": _primero(d, "clave", "id") or "",
        "nombre": _primero(d, "nombre") or "",
        "quien_lo_emite": _primero(d, "quien_lo_emite", "emisor") or "",
        "obligatorio": bool(d.get("obligatorio")),
        "notas": _primero(d, "notas", "descripcion"),
        "estado": d.get("estado"),
        "fuente": _primero(d, "fuente", "fundamento_legal") or "",
    }


@lru_cache(maxsize=1)
def documentos() -> list[dict[str, Any]]:
    """Permisos y documentos de una importacion de medicamentos."""
    datos = _cargar("documentos")
    crudos = datos if isinstance(datos, list) else datos.get("documentos", [])
    return [_normalizar_documento(d) for d in crudos]


def rango_de(clave: str) -> dict[str, Any]:
    """
    Lee un costo que se reporta como rango y no entra al total.

    Hay tres formas de escribirlo en los datos, y las tres significan lo
    mismo: `monto_min_mxn` y `monto_max_mxn` sueltos, un objeto `rango` con
    `min` y `max`, o una `cuota_minima_piso_mxn` igual con `min` y `max`.
    Se leen las tres para que un costo escrito de cualquiera de esas maneras
    aparezca en la cotizacion en lugar de salir como "por cotizar".
    """
    origen = parametros().get(clave, {})

    minimo = _primero(origen, "monto_min_mxn")
    maximo = _primero(origen, "monto_max_mxn")

    if minimo is None and maximo is None:
        anidado = origen.get("rango") or origen.get("cuota_minima_piso_mxn") or {}
        minimo = _primero(anidado, "min", "monto_min_mxn")
        maximo = _primero(anidado, "max", "monto_max_mxn")

    return {
        "concepto": origen.get("concepto"),
        "monto_min_mxn": minimo,
        "monto_max_mxn": maximo,
        "estado": origen.get("estado"),
        "es_estimado": origen.get("es_estimado"),
        "fuente": _primero(origen, "fuente", "fundamento_legal") or "",
        "fecha_consulta": origen.get("fecha_consulta") or "",
    }


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
