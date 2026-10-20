"""
Motor de calculo de Aduana-Copilot.

Expone el calculo de la cotizacion por HTTP para que lo consuman el gateway de
Node y, a traves de el, el agente y la interfaz. Aqui no hay modelo de
lenguaje: solo aritmetica sobre los datos de data/.

Se levanta desde la carpeta core/:

    uvicorn app.main:app --reload --port 5000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .schemas import BusquedaFraccionResponse, CotizacionRequest, CotizacionResponse
from .services import catalogo, cotizacion

app = FastAPI(
    title="Aduana-Copilot · motor de calculo",
    description=(
        "Calcula el costo de importar medicamentos a Jalisco. Cada cifra viaja con "
        "la fuente y la fecha en que se consulto."
    ),
    version="0.1.0",
)

# El gateway de Node y la interfaz de Vite corren en otros puertos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """
    Estado del motor y de sus datos.

    Reporta cuantas fracciones tiene cargadas y si son reales o de ejemplo, que
    es lo primero que uno quiere saber cuando una cotizacion sale en ceros.
    """
    fracciones = catalogo.fracciones()
    verificadas = sum(1 for f in fracciones if f.get("igi_pct") is not None)

    return {
        "status": "ok",
        "servicio": "motor de calculo",
        "fracciones_cargadas": len(fracciones),
        "fracciones_con_tasa_verificada": verificadas,
        "datos_listos_para_cotizar": verificadas > 0,
    }


@app.post("/api/v1/cotizacion", response_model=CotizacionResponse)
def crear_cotizacion(peticion: CotizacionRequest) -> CotizacionResponse:
    """Calcula el costo de importar una mercancia a Jalisco."""
    return cotizacion.cotizar(peticion)


@app.get("/api/v1/fracciones/buscar", response_model=BusquedaFraccionResponse)
def buscar_fracciones(
    q: str = Query(min_length=3, description="Texto a buscar, por ejemplo insulina."),
) -> BusquedaFraccionResponse:
    """Acerca fracciones arancelarias candidatas para un texto libre."""
    return cotizacion.buscar_fracciones(q)


@app.post("/api/v1/datos/recargar")
def recargar_datos() -> dict:
    """
    Vuelve a leer data/ sin reiniciar el servidor.

    Sirve mientras se curan los datos: se edita el JSON, se llama a esto y la
    siguiente cotizacion ya usa la tasa nueva.
    """
    catalogo.recargar()
    fracciones = catalogo.fracciones()

    if not fracciones:
        raise HTTPException(
            status_code=500,
            detail="No se encontro ningun catalogo de fracciones en la carpeta data/.",
        )

    return {"status": "ok", "fracciones_cargadas": len(fracciones)}
