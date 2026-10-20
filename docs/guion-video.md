# Guion del video — Sprint 1

Duración: entre 1 minuto y 1 minuto 30. Lo que se ve en pantalla manda; la voz
acompaña.

**Antes de grabar.** Los tres servicios levantados, la página en
`localhost:5173` recargada y en blanco, y el navegador sin pestañas de más.
Ensáyalo una vez completo: la demo son tres clics y conviene que salgan
seguidos.

---

## 0:00 – 0:18 · El problema

**En pantalla:** la página recién abierta, sin cotización.

> Cuando Jalisco tuvo que comprar medicamentos oncológicos por su cuenta,
> porque la entrega federal no llegó, alguien tuvo que averiguar cuánto costaba
> de verdad traerlos y qué permisos pedían. Eso hoy toma días y depende de que
> un agente aduanal tenga tiempo.

---

## 0:18 – 0:40 · La cotización

**En pantalla:** clic en el ejemplo **"Con arancel e IVA"**, después en
**"Calcular cotización"**. Deja que la hoja aparezca sin hablar encima.

> Esto es un medicamento genérico desde India. El agente clasifica la
> mercancía, el motor calcula, y en segundos sale la liquidación completa.

**En pantalla:** baja despacio por el desglose, deteniéndote en el renglón del
IVA.

> El IVA no se calcula sobre el valor de la mercancía: se monta sobre el
> arancel y el derecho de trámite. Es el error más común al hacerlo a mano, y
> es dinero real.

---

## 0:40 – 1:05 · Lo que lo hace distinto

**En pantalla:** señala la línea de fuente bajo una cifra, con su etiqueta
ámbar de "sin comprobar".

> Cada cifra trae la ley de la que sale y la fecha en que se consultó. Y aquí
> está lo importante: el sistema distingue entre una cifra que cita su fuente y
> una que alguien de verdad fue a comprobar. Estas todavía no están comprobadas,
> y el sistema lo dice en lugar de disimularlo.

**En pantalla:** la insignia de arriba y la advertencia roja.

> Por eso no presume confianza alta y manda a validar con un agente aduanal.

---

## 1:05 – 1:25 · El cierre

**En pantalla:** baja hasta los documentos y los costos aparte.

> También dice qué permisos hacen falta, y deja fuera del total los honorarios
> y la prevalidación, porque se negocian y dar una cifra exacta sería inventar
> precisión.

**En pantalla:** vuelve arriba, a la hoja completa.

> El modelo de lenguaje entiende la petición y explica el resultado, pero no
> hace ni una cuenta: toda la aritmética vive en código probado contra casos
> calculados a mano. Un modelo que inventa un número se parece demasiado a uno
> correcto.

---

## Qué NO decir

- **No digas "verificado" ni "oficial"** mientras las cifras estén en ámbar.
  Es la frase que el jurado va a repetir, y hoy no la podemos sostener.
- **No prometas que abarata los medicamentos.** Da claridad de costo y de
  trámites. El precio lo ponen el fabricante, el flete y los impuestos.
- **No des cifras de ahorro ni de tiempo** que no hayas medido.

## Si preguntan

**¿Y si el modelo se equivoca en una cifra?**
No puede: no calcula. Las herramientas devuelven los números y el modelo solo
los redacta. Si inventara uno, no cuadraría con la hoja, que viene del motor.

**¿Por qué están en ámbar las cifras?**
Porque tienen su fuente citada pero nadie ha abierto todavía el texto oficial
para confirmarlo. Preferimos decirlo a aparentar que está cerrado.

**¿Qué falta para cerrarlo?**
Cotejar cada tasa contra el Diario Oficial y declararla verificada. Son unas
horas de trabajo humano, y el sistema ya está listo para recibirlo: en cuanto
el dato se declara, la pantalla cambia sola a verde.
