<a name="readme-top"></a>

<div align="center">
  <h1>📋 Aduana-Copilot</h1>
  <p><strong>Copiloto aduanal para importar medicamentos a Jalisco</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js" alt="Node" />
    <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript" alt="TS" />
    <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react" alt="React" />
  </p>
</div>

<br />

<details>
  <summary>📋 Tabla de contenidos</summary>
  <ol>
    <li><a href="#el-problema">El problema</a></li>
    <li><a href="#qué-hace">Qué hace</a></li>
    <li><a href="#la-regla-que-sostiene-el-proyecto">La regla que sostiene el proyecto</a></li>
    <li><a href="#de-una-pregunta-a-una-cotización">De una pregunta a una cotización</a></li>
    <li><a href="#cómo-correrlo">Cómo correrlo</a></li>
    <li><a href="#cómo-está-armado">Cómo está armado</a></li>
    <li><a href="#los-datos">Los datos</a></li>
    <li><a href="#pruebas">Pruebas</a></li>
    <li><a href="#límites-conocidos">Límites conocidos</a></li>
    <li><a href="#hoja-de-ruta">Hoja de ruta</a></li>
    <li><a href="#el-equipo">El equipo</a></li>
  </ol>
</details>

<br />

## 🏥 El problema

Jalisco ha tenido que comprar medicamentos por su cuenta cuando la entrega
federal no llegó, sobre todo oncológicos. Cuando eso pasa, alguien en una
dirección de compras, en un hospital o en una distribuidora tiene que resolver
una pregunta sencilla de enunciar y difícil de contestar: **cuánto cuesta de
verdad traer este medicamento, y qué papeles me van a pedir.**

Contestarla hoy toma días. El costo no es solo el precio del proveedor: hay que
clasificar la mercancía en una fracción arancelaria, averiguar su arancel,
calcular el DTA, decidir qué tasa de IVA aplica, y sumar honorarios y
prevalidación. Cada una de esas cifras vive en una ley o en un sistema
distinto, y casi siempre hay que esperar a que un agente aduanal tenga tiempo.

Mientras tanto, equivocarse sale caro. Una fracción mal clasificada o un
permiso que falta deja la carga retenida en la aduana. Si es un medicamento que
necesita frío, el retraso puede acabar con el embarque completo.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 🎯 Qué hace

Aduana-Copilot recibe la petición en lenguaje normal y devuelve una cotización
de importación desglosada, con los permisos que hacen falta y con **la fuente y
la fecha de cada cifra**.

Lo que lo distingue de una hoja de Excel no es el total: es que dice de dónde
salió cada número, qué tuvo que asumir para llegar a él y cuándo se leyó la ley
que lo respalda. Esa es la parte auditable, y es la que permite que alguien
tome una decisión de compra con el documento en la mano.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 🔒 La regla que sostiene el proyecto

**El modelo de lenguaje nunca hace cuentas.**

Un modelo predice texto. Un número que predice se parece mucho a un número
correcto sin serlo, y en una cotización con la que alguien va a comprar
medicamentos eso no es aceptable. Así que toda la aritmética vive en
`core/app/services/cotizacion.py`, en funciones puras probadas contra casos
calculados a mano. El agente solo entiende la petición, llama a la herramienta
y explica el resultado.

De ahí salen otras tres reglas:

- **Sin fuente y sin fecha, el dato no entra.** Si una tasa no se verificó en
  un documento oficial, el sistema lo dice en rojo y baja la confianza de la
  cotización en lugar de rellenar el hueco.
- **Los supuestos se muestran, no se esconden.** Si hubo que asumir algo, la
  cotización lo enumera junto con cómo comprobarlo.
- **Si la confianza no es alta, el sistema manda a validar con un agente
  aduanal.** No sustituye a uno: le ahorra los primeros días de trabajo.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 📄 De una pregunta a una cotización

Lo que escribe el usuario:

> Necesito cotizar 500 cajas de insulina glargina desde Alemania para
> Guadalajara. La mercancía son 50 mil dólares, el flete me lo cotizaron en
> 3 mil y el seguro en 400. El tipo de cambio está en 17.50 y es medicina de
> patente.

Lo que hace el agente:

1. Llama a `buscar_fraccion` con "insulina" y recibe las fracciones candidatas.
   No elige por su cuenta sin decirlo: informa cuál tomó y por qué.
2. Llama a `calcular_cotizacion` con los datos. El motor hace las cuentas.
3. Redacta el resultado y enumera los supuestos.

Lo que devuelve el motor:

| Concepto | Base | Tasa | Importe |
|---|---:|---:|---:|
| Valor en aduana | | | 934,500.00 |
| IGI | 934,500.00 | 0 % | 0.00 |
| DTA | 934,500.00 | 0.8 % | 7,476.00 |
| IVA | 941,976.00 | 0 % | 0.00 |
| **Total estimado** | | | **941,976.00** |

Las tasas del ejemplo son de muestra. El orden sí es el real y es lo que más
se equivoca a mano: **el IVA se calcula sobre el valor en aduana ya con el IGI
y el DTA encima**, no sobre el valor en aduana solo. Calcularlo mal deja el
total por debajo de lo que de verdad se paga.

Honorarios del agente aduanal y prevalidación no entran al total. Se reportan
como rango, porque se negocian y meterlos obligaría a inventar una precisión
que no existe.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## ▶️ Cómo correrlo

Hacen falta Python 3.11 o más, y Node 20 o más. Son cuatro terminales.

**1. Configuración, una sola vez**

```bash
cp .env.example .env
```

La llave del reto va en `AGENT_API_KEY`. El `.env` no se sube al repositorio.

**2. Motor de cálculo**

```bash
cd core
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

En Windows, el activador es `.venv\Scripts\activate`.

**3. Gateway**

```bash
cd api
npm install
npm run dev
```

**4. Interfaz**

```bash
cd web
npm install
npm run dev
```

Queda en http://localhost:5173

**5. Agente, cuando quieras probarlo desde la terminal**

```bash
cd agent
npm install
npm run dev
```

Para ensayar el ciclo completo sin gastar crédito del reto:

```bash
AGENT_FAKE_LLM=true npm run dev
```

**Comprobar que todo se está hablando**

```bash
curl http://127.0.0.1:3000/health
```

El gateway responde por sí mismo y por el motor, así que si algo está caído se
ve en una sola llamada.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 🧩 Cómo está armado

```
agent/   Agente en TypeScript. Framework propio, sin librerías de agentes.
api/     Gateway en Node. Valida y reenvía; no calcula nada.
core/    Motor de cálculo en Python. Aquí vive toda la aritmética.
data/    Fracciones, tasas y documentos, cada uno con su fuente y su fecha.
web/     Interfaz en React. La cotización presentada como documento.
docs/    Verificación de fuentes y notas del equipo.
```

El agente y la interfaz hablan los dos con el gateway, y el gateway con el
motor. Nadie salta un escalón. Eso significa que la cifra que ve el usuario en
pantalla y la que dice el agente salieron del mismo cálculo, y ninguno de los
dos puede alterarla por su cuenta.

El contrato entre las partes está en `core/app/schemas.py` y en
`web/src/lib/types.ts`, que son espejo uno del otro. Si uno cambia, el otro
cambia igual.

Las cantidades viajan como texto, no como número. El motor las calcula con
`Decimal` para no perder centavos, y convertirlas a `float` en el camino
reintroduciría justo el error que se evitó.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 📚 Los datos

La parte más delicada del proyecto, y la que más trabajo humano necesita. Está
documentada en [`data/LEEME.md`](data/LEEME.md).

Cada dato lleva un estado:

| Estado | Qué significa |
|---|---|
| `verificado` | Se leyó en la fuente oficial, en la fecha indicada. |
| `estimado` | Rango real de mercado, no un dato oficial. |
| `ejemplo_sin_verificar` | Relleno para poder programar. **No sirve para cotizar.** |

Los archivos `*.ejemplo.json` que vienen en el repositorio están todos en
`ejemplo_sin_verificar`. Existen para que la interfaz y el agente se pudieran
construir sin esperar a los datos reales. Con ellos el sistema corre completo,
pero devuelve ceros y marca la cotización en rojo, que es exactamente lo que
debe hacer.

Las fuentes que hay que consultar están en
[`docs/verificacion-datos.md`](docs/verificacion-datos.md).

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 🧪 Pruebas

```bash
cd core
pytest
```

Son dos grupos con propósito distinto.

Las **pruebas de la formula** usan tasas inventadas y redondas para verificar
la aritmética: que el IVA se monte sobre el IGI y el DTA, que el redondeo suba
el medio centavo, que una fracción desconocida devuelva una cotización con
aviso en lugar de reventar.

Los **casos dorados** son cinco cotizaciones calculadas a mano en Excel por una
persona, guardadas en `core/tests/casos_dorados.json`. Son la prueba que de
verdad importa: si el motor coincide con las cuentas de un humano en cinco
escenarios distintos, se le puede creer. Mientras ese archivo no exista, esas
pruebas se saltan solas.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## ⚠️ Límites conocidos

Vale más decirlos que descubrirlos en una demostración.

- **Los datos arancelarios todavía no están verificados.** Mientras no lo
  estén, el sistema cotiza en ceros y lo advierte. Es su comportamiento
  correcto, no una falla.
- **No sustituye a un agente aduanal.** La clasificación arancelaria
  definitiva y el despacho los hace una persona con patente. Esto le ahorra
  los primeros días.
- **No estima fletes ni seguros.** Dependen de la naviera, del volumen y de la
  temporada. Los pone el cliente.
- **No baja el precio de los medicamentos.** Da claridad sobre el costo y los
  trámites. El precio lo definen el fabricante, el flete y los impuestos.
- **La tasa de IVA a medicinas de patente la declara el cliente.** El sistema
  no tiene forma de saberlo desde la fracción, así que siempre queda anotada
  como supuesto.
- **El mapa es contexto, no una ruta.** La línea es recta y no calcula escalas
  ni puertos.
- **El catálogo de fracciones está incompleto.** Son unas 195 en el capítulo
  30 y se van curando por partes.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 🗺️ Hoja de ruta

- [ ] Verificar las fuentes oficiales y llenar `data/` con tasas reales
- [ ] Los cinco casos calculados a mano
- [ ] Catálogo completo del capítulo 30
- [ ] Medir el costo por tarea del agente con el modelo real
- [ ] Consultar si un medicamento ya tiene registro sanitario en México
- [ ] Tasas preferenciales por tratado comercial
- [ ] Guardar cotizaciones para comparar entre proveedores

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## 👥 El equipo

Proyecto del Reto Agente 2026, de Platica.mx con Campuslands.

- **Camilo García** — agente, gateway e interfaz
- **Daniel Osorio** — datos arancelarios y motor de cálculo

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>
