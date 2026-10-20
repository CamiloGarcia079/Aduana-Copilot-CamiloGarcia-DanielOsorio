# Verificación de datos

Este archivo es la bitácora de dónde salió cada cifra del proyecto. Se llena
**antes** de programar el motor con datos reales, porque si una fuente no
existe o no se puede consultar, eso cambia lo que se puede construir.

La regla: se anota lo que se encontró **y también lo que no**. Un "no se pudo
abrir la página" escrito aquí vale más que un dato inventado en `data/`.

Responsable: Daniel Osorio.

---

## 1. Catálogo de fracciones del capítulo 30

**Qué se busca:** la lista de fracciones arancelarias de medicamentos, con su
descripción oficial. Deberían ser unas 195 en el capítulo 30.

**Dónde:** catálogos de comercio exterior del SAT para CFDI 4.0, campo
`c_FraccionArancelaria`.

- [ ] ¿Se encontró el archivo?
- [ ] ¿En qué formato está? (xls, xml, csv)
- [ ] ¿Cuántas fracciones del capítulo 30 trae?

**Enlace usado:**

**Fecha de descarga:**

**Notas:**

---

## 2. Tasas de IGI por fracción

**Qué se busca:** el arancel de importación de cada fracción.

**Dónde:** SIAVI, de la Secretaría de Economía.

- [ ] ¿Se puede descargar en bloque, o solo consultar fracción por fracción?
- [ ] Si es solo consulta, ¿cuánto tarda hacerlo para 40 o 60 fracciones?
- [ ] ¿La página muestra la vigencia de la tasa?

**Enlace usado:**

**Fecha de consulta:**

**Notas:**

> Si no hay descarga en bloque, se curan a mano entre 40 y 60 fracciones de las
> partidas 3003 y 3004, y cada una se anota con su fecha. No hace falta el
> catálogo completo para el primer sprint.

---

## 3. Visor de Registros Sanitarios de COFEPRIS

**Qué se busca:** saber si se puede consultar qué medicamentos ya tienen
registro sanitario en México.

**Dónde:** Visor de Registros Sanitarios de COFEPRIS.

- [ ] ¿Abre la página?
- [ ] ¿Permite exportar los resultados? ¿En qué formato?
- [ ] ¿Hay API documentada?

**Enlace usado:**

**Fecha de consulta:**

**Notas:**

> De esto depende si la herramienta "¿ya existe aquí?" entra al sprint 1 o se
> queda para después. Si no exporta, se queda fuera y no pasa nada.

---

## 4. DTA, el Derecho de Trámite Aduanero

**Qué se busca:** la tasa vigente y sobre qué base se aplica.

**Dónde:** Ley Federal de Derechos, artículo 179.

- [ ] ¿Qué dice el texto vigente?
- [ ] ¿La tasa es 0.8 % del valor en aduana?
- [ ] ¿Hay casos con cuota fija en lugar de porcentaje?

**Enlace usado:**

**Fecha de consulta:**

**Notas:**

> Lo que tenemos viene de un blog de un proveedor, no de la ley. Hasta que se
> lea el artículo, el motor lo reporta como supuesto.

---

## 5. IVA aplicable a medicamentos

**El dato más delicado del proyecto.**

**Qué se busca:** qué tasa de IVA aplica a la importación de medicinas de
patente y a las que no lo son.

**Dónde:** Ley del IVA, artículo 2-A, y su reglamento.

- [ ] ¿Qué dice el artículo 2-A en su texto vigente?
- [ ] ¿Qué cuenta como "medicina de patente" según el reglamento?
- [ ] ¿La tasa de la importación es la misma que la de la venta en el país?

**Enlace usado:**

**Fecha de consulta:**

**Notas:**

> Lo que tenemos se apoya en una opinión de 2019 de un organismo del sector,
> no en el texto de la ley. Es el dato que más puede mover el total: si una
> importación de un millón de pesos lleva 16 % en lugar de 0 %, la diferencia
> son 160 mil pesos. Mientras no se verifique, el motor lo marca como supuesto.

---

## 6. Prevalidación y honorarios del agente aduanal

**Qué se busca:** rangos reales de mercado, no una cifra única.

- [ ] ¿Cuánto cobra la prevalidación? ¿Cambia por aduana?
- [ ] ¿En qué rango están los honorarios de un agente aduanal?
- [ ] ¿Se cobran como porcentaje del valor en aduana o como cuota fija?

**Fuentes consultadas:**

**Fecha:**

**Notas:**

> Estos van siempre como rango y nunca entran al total. Si alguien pregunta por
> qué, la respuesta es que se negocian: dar una cifra única sería inventar una
> precisión que no existe.

---

## Qué hacer cuando una fuente no se deja consultar

No es un fracaso, es información. Se anota aquí:

- Qué se intentó abrir
- Qué pasó (no carga, pide registro, está caída, pide pago)
- Qué alternativa se buscó

Y el dato se queda en `ejemplo_sin_verificar`. El sistema ya sabe qué hacer con
eso: lo marca en rojo, baja la confianza y le dice al usuario que valide con su
agente aduanal. Eso es correcto y es mejor que un número inventado.
