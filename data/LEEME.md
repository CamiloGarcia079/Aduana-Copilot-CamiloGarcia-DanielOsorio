# Datos arancelarios y regulatorios

Aquí viven los datos con los que el motor hace sus cuentas. Son la parte más
delicada del proyecto: si un número está mal, la cotización está mal y el
cliente toma una decisión equivocada con dinero real.

## La regla

**Sin fuente y sin fecha de consulta, el dato no entra.** No importa si suena
razonable o si lo dijo un blog. Cada cifra tiene que apuntar a un documento
oficial que alguien pueda abrir y verificar.

## Estados de un dato

Cada registro lleva un campo `estado` que dice qué tanto se puede confiar en él:

| estado | Qué significa | Se muestra al usuario como |
|---|---|---|
| `verificado` | Se leyó en la fuente oficial, en la fecha indicada. | Cifra firme, con su fuente. |
| `estimado` | Es un rango real de mercado, no un dato oficial. Honorarios y prevalidación caen aquí. | Rango, nunca cifra única. |
| `ejemplo_sin_verificar` | Dato de relleno para poder programar. **No sirve para cotizar.** | La interfaz lo marca en rojo. |

Los archivos `*.ejemplo.json` de esta carpeta están todos en
`ejemplo_sin_verificar`. Existen para que la interfaz y el agente se puedan
construir sin esperar a que terminen los datos reales. Cuando lleguen los
reales, se reemplazan por `fracciones.json`, `parametros.json` y
`documentos.json`.

## Archivos

- `fracciones.json` — fracciones del capítulo 30 (partidas 3003 y 3004) con su
  tasa de IGI.
- `parametros.json` — DTA, IVA y los rangos de prevalidación y honorarios.
- `documentos.json` — permisos y documentos que exige una importación de
  medicamentos.

## De dónde salen

- **Fracciones y descripciones:** catálogo de comercio exterior del SAT
  (catálogos del CFDI 4.0, `c_FraccionArancelaria`).
- **Tasas de IGI:** SIAVI, de la Secretaría de Economía. Si no se puede
  descargar en bloque, se consulta fracción por fracción y se anota la fecha.
- **DTA:** Ley Federal de Derechos, artículo 179.
- **IVA:** Ley del Impuesto al Valor Agregado, artículo 2-A, y su reglamento.
- **Permisos sanitarios:** COFEPRIS.

El resultado de buscar cada una de estas fuentes se anota en
`docs/verificacion-datos.md`.
