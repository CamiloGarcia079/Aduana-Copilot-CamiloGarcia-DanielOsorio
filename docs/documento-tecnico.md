# Documento técnico — Aduana-Copilot

**Reto Agente 2026 · Platica.mx con Campuslands · Sprint 1**
Camilo García y Daniel Osorio
20 de octubre de 2026

---

## 1. Qué resuelve

Cuando un hospital, una clínica o una distribuidora de Jalisco necesita
importar un medicamento, tiene que responder una pregunta sencilla de enunciar
y cara de contestar: **cuánto cuesta realmente traerlo y qué permisos le van a
pedir**.

El precio del proveedor es solo una parte. Hay que clasificar la mercancía en
una fracción arancelaria, averiguar su arancel, calcular el derecho de trámite,
decidir qué tasa de IVA aplica y sumar honorarios y prevalidación. Cada cifra
vive en una ley o en un sistema distinto, y normalmente hay que esperar a que
un agente aduanal tenga tiempo.

Equivocarse cuesta: una fracción mal clasificada o un permiso faltante deja la
carga retenida en la aduana. Si el medicamento necesita frío, el retraso puede
acabar con el embarque.

Aduana-Copilot recibe la petición en lenguaje natural y devuelve una
cotización desglosada, con los permisos necesarios y **la fuente y la fecha de
cada cifra**.

## 2. La decisión de diseño que ordena todo lo demás

**El modelo de lenguaje no hace ninguna cuenta.**

Un modelo predice texto. Un número predicho se parece mucho a un número
correcto sin serlo, y en una cotización con la que alguien compra medicamentos
eso no es aceptable.

Toda la aritmética vive en `core/app/services/cotizacion.py`, en funciones
puras sin acceso a red ni a base de datos, probadas contra casos calculados
fuera del motor. El agente entiende la petición, llama a la herramienta y
redacta el resultado.

De ahí se derivan tres reglas más:

| Regla | Cómo se implementa |
|---|---|
| Sin fuente y sin fecha, el dato no entra | Cada registro de `data/` lleva `fuente` y `fecha_consulta`; sin valor, el motor reporta el hueco en lugar de rellenarlo |
| Los supuestos se muestran, no se esconden | `CotizacionResponse.supuestos[]`, con qué se asumió, por qué y cómo comprobarlo |
| Si la confianza no es alta, se manda a validar | `Confianza` + `advertencia`, que el agente está obligado a repetir por prompt |

## 3. Verificado no se deduce, se declara

Es la decisión más importante del sprint y vale la pena explicarla.

La primera versión del motor marcaba una cifra como `verificado` en cuanto
traía un texto de fuente. Parecía razonable, y era falso: escribir *"Ley
Federal de Derechos, artículo 49"* es gratis. Una herramienta puede generar esa
cadena sin haber abierto nunca esa ley, y la pantalla mostraba el sello verde
igual.

Ahora hay cuatro estados y el salto entre los dos primeros exige un acto
humano:

| Estado | Significa | Quién lo pone |
|---|---|---|
| `verificado` | Alguien abrió la fuente y lo confirmó | Una persona, escribiéndolo en el dato |
| `con_fuente` | Trae cita y fecha, sin comprobar | El motor, por omisión |
| `estimado` | Rango real de mercado | El motor, cuando hay rango |
| `ejemplo_sin_verificar` | Sin valor utilizable | El motor, cuando falta |

El motor nunca escribe `verificado` por su cuenta. Mientras falte esa
declaración, la interfaz marca cada renglón en ámbar con la etiqueta "sin
comprobar" y la cotización no pasa de confianza media.

La prueba
`test_una_tasa_con_fuente_pero_sin_declarar_no_da_confianza_alta` existe para
que nadie revierta esto sin darse cuenta.

## 4. Arquitectura

```
Usuario ─┐
         ├─→ Gateway (Node) ─→ Motor de cálculo (Python) ─→ data/
Agente ──┘
```

| Módulo | Tecnología | Responsabilidad |
|---|---|---|
| `agent/` | TypeScript | Ciclo del agente y herramientas. Framework propio, sin librerías de agentes |
| `api/` | Node + Express | Valida y reenvía. No calcula nada |
| `core/` | Python + FastAPI | Toda la aritmética. Funciones puras |
| `data/` | JSON | Fracciones, parámetros legales y documentos, con su fuente |
| `web/` | React + Vite | La cotización presentada como documento |

El agente y la interfaz hablan los dos con el gateway, y el gateway con el
motor. Nadie salta un escalón: la cifra que ve el usuario en pantalla y la que
dice el agente salen del mismo cálculo, y ninguno puede alterarla.

El contrato está duplicado a propósito en `core/app/schemas.py` y
`web/src/lib/types.ts`, con los mismos nombres de campo, para que una
divergencia se note al compilar.

**Las cantidades viajan como texto.** El motor las calcula con `Decimal` para
no perder centavos, y convertirlas a `float` en el camino reintroduciría el
error que se evitó del otro lado. La interfaz las formatea para mostrarlas y
nunca las usa para recalcular.

## 5. El agente

Ciclo propio, sin librerías de agentes: observa, pide herramientas, ejecuta,
repite hasta que responde con texto. Tope de cuatro vueltas para que una
herramienta que falle no lo deje girando y gastando crédito.

**Dos herramientas:**

- `buscar_fraccion` — acerca fracciones candidatas para un texto libre.
  Devuelve varias a propósito: clasificar mercancía es una decisión con
  consecuencias legales, así que el sistema acerca opciones y la persona
  decide.
- `calcular_cotizacion` — la única fuente de cifras. Devuelve la cotización
  completa con supuestos y confianza, no solo el total, para que el agente
  pueda advertir de lo que no está comprobado.

**Medición de costo.** `core/costo.ts` calcula el gasto por tarea. La salida se
obtiene restando (`total − prompt`) y no leyendo `completion_tokens`, porque el
modelo razona antes de responder y esos tokens se cobran sin aparecer en ese
campo. Leerlo directo daría un costo más barato que el real.

## 6. La fórmula

```
valor en aduana = (mercancía + flete + seguro) × tipo de cambio
IGI             = valor en aduana × tasa de la fracción
DTA             = valor en aduana × tasa del DTA
IVA             = (valor en aduana + IGI + DTA) × tasa del IVA
total           = valor en aduana + IGI + DTA + IVA
```

El orden no es arbitrario: **el IVA se monta sobre el valor en aduana ya con el
IGI y el DTA encima**. Calcularlo solo sobre el valor en aduana da un total más
bajo que el real, y es el error más común al hacerlo a mano.

Honorarios del agente aduanal y prevalidación **no entran al total**: se
negocian y cambian por aduana, así que se reportan como rango. Meterlos
obligaría a elegir un punto del rango, que sería inventar precisión.

## 7. Pruebas

```bash
cd core && pytest
```

**18 pruebas, dos grupos con propósito distinto.**

Las **pruebas de la fórmula** usan tasas inventadas y redondas para verificar
la aritmética: que el IVA se monte sobre el IGI y el DTA, que el redondeo suba
el medio centavo (`ROUND_HALF_UP`, no el redondeo al par de Python), que una
fracción desconocida devuelva una cotización con aviso en lugar de reventar, y
que una tasa citada pero no declarada no alcance confianza alta.

Los **casos dorados** (`core/tests/casos_dorados.json`) son cinco cotizaciones
con los totales calculados fuera del motor, cubriendo medicina de patente, IGI
en cero, IGI mayor que cero, IVA al 16 % y flete alto.

## 8. Estado al cierre del sprint

**Funciona de extremo a extremo.** Los cuatro módulos compilan, las 18 pruebas
pasan y el agente encadena sus dos herramientas contra el gateway real.

**Datos cargados:** 56 fracciones del capítulo 30 (de unas 195), los cuatro
parámetros legales y 11 documentos regulatorios. Todos en `con_fuente`.

**Lo que falta, y es trabajo humano:**

1. Cotejar cada tasa contra el Diario Oficial y declararla `verificado`.
2. Confirmar que las reformas arancelarias de 2026 a la LIGIE no tocan el
   capítulo 30. El catálogo actual se armó sobre la publicación de 2022.
3. Resolver si el DTA lleva cuota fija cuando el arancel es cero. El artículo
   49 de la Ley Federal de Derechos fija el 8 al millar en su fracción I, pero
   prevé cuotas fijas en otras fracciones y falta confirmar cuál aplica.
4. Medir el costo por tarea con el modelo real.

## 9. Límites conocidos

- **No sustituye a un agente aduanal.** La clasificación definitiva y el
  despacho los hace una persona con patente. Esto le ahorra los primeros días.
- **No estima fletes ni seguros.** Dependen de la naviera, del volumen y de la
  temporada. Los pone el cliente.
- **No baja el precio de los medicamentos.** Da claridad sobre el costo y los
  trámites. El precio lo definen el fabricante, el flete y los impuestos.
- **La condición de medicina de patente la declara el cliente.** El sistema no
  puede deducirla de la fracción, así que siempre queda anotada como supuesto.
- **El mapa es contexto, no una ruta.** La línea es recta y no calcula escalas
  ni puertos.

## 10. Hacia dónde sigue

- Consultar si un medicamento ya tiene registro sanitario en México. El Visor
  de COFEPRIS no expone API y rechaza peticiones automáticas, así que queda
  pendiente de otra vía.
- Tasas preferenciales por tratado comercial, que pueden bajar el arancel.
- Guardar cotizaciones para comparar entre proveedores.
- Completar el catálogo del capítulo 30.
