"""
Punto de Entrada del Servidor Aduana-Copilot API
===============================================
Para ejecutar el servidor:
    py main.py
o bien:
    uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
"""

import uvicorn
from api.main import app

if __name__ == "__main__":
    print("Iniciando Aduana-Copilot API Server en http://localhost:8000 ...")
    print("Documentación Swagger disponible en: http://localhost:8000/docs")
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
