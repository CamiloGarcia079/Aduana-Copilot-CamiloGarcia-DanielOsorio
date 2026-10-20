# Verificación y Validación de Fuentes de Datos - Aduana-Copilot

**Proyecto:** Aduana-Copilot  
**Responsable del módulo de datos y motor de cálculo:** Motor Core & Data Pipeline  
**Fecha de verificación:** 20 de octubre de 2026  
**Repositorio:** [Aduana-Copilot-CamiloGarcia-DanielOsorio](https://github.com/CamiloGarcia079/Aduana-Copilot-CamiloGarcia-DanielOsorio)

---

## 1. Catálogo de Fracciones Arancelarias del Capítulo 30 (SAT, CFDI 4.0 / Complemento Comercio Exterior)

### Hallazgo
* **Estado:** **Confirmado y verificado con exactitud.**
* **Total de fracciones en el Capítulo 30:** **195 fracciones vigentes** (exactamente la cifra proyectada).
* **Desglose de partidas de medicamentos:**
  * Partida **3003** (Medicamentos no dosificados / mezclas a granel): **34 fracciones activas** con NICO.
  * Partida **3004** (Medicamentos dosificados / acondicionados para venta al por menor, como insulina y oncológicos): **79 fracciones activas** con NICO.
  * Total partidas 3003 y 3004: **113 fracciones activas**.
* **Estructura técnica:** Código a 10 dígitos (8 dígitos de fracción arancelaria internacional/LIGIE + 2 dígitos del Número de Identificación Comercial - NICO).
* **Enlace oficial de descarga del SAT:**  
  [http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/c_FraccionArancelaria_20240513.xls](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/c_FraccionArancelaria_20240513.xls)  
  *(Enlace al repositorio de catálogos de Comercio Exterior del SAT: [Catálogos CFDI Comercio Exterior](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/catalogos_emision_cfdi_complemento_ce.htm))*
* **Fecha de corte de publicación SAT:** 13 de mayo de 2024 (versión vigente para CFDI 4.0 con complemento de Comercio Exterior).
* **Fecha de descarga e inspección local:** 20 de octubre de 2026.
* **Integridad del archivo:** 1,769,472 bytes, 11,524 registros totales en el catálogo global, de los cuales 195 corresponden al capítulo 30 en estatus vigente.

---

## 2. SIAVI (Secretaría de Economía): Capacidad de Descarga vs. Consulta Individual

### Hallazgo
* **¿Se puede descargar de forma estructurada?:** **NO de forma masiva/API automatizada para la tarifa vigente.**
* **Situación regulatoria y operativa:**
  1. **Aviso Oficial de Secretaría de Economía / SNICE:** El sistema SIAVI tradicional dejó de actualizarse de manera continua a partir de **febrero de 2022** (con estadísticas comerciales y aranceles congelados a noviembre de 2021) en cumplimiento con las disposiciones de la Ley del Sistema Nacional de Información Estadística y Geográfica (SNIEG) y la transición a la Séptima Enmienda de la LIGIE.
  2. **Modalidad de consulta:** La plataforma SIAVI operaba exclusivamente mediante formularios web de **consulta fracción por fracción** (one-by-one HTML query), sin endpoint de descarga masiva (bulk download) ni API pública estructurada.
* **Decisión técnica acordada:**
  * **Se cura a mano** el catálogo de fracciones de medicamentos (`data/fracciones.json`) tomando como base la **TIGIE vigente (Decreto DOF 07/06/2022)**, los decretos arancelarios en el Diario Oficial de la Federación, y el catálogo oficial de fracciones arancelarias del SAT (`c_FraccionArancelaria_20240513.xls`).
* **Enlace oficial de referencia:**  
  [https://www.snice.gob.mx](https://www.snice.gob.mx) y [https://www.economia.gob.mx](https://www.economia.gob.mx)
* **Fecha de consulta:** 20 de octubre de 2026.

---

## 3. Visor de Registros Sanitarios de COFEPRIS (Lanzamiento Abril 2026)

### Hallazgo
* **Fecha oficial de lanzamiento:** **22 de abril de 2026** por parte de la Comisión Federal para la Protección contra Riesgos Sanitarios (COFEPRIS).
* **Portal oficial:**  
  [https://tramiteselectronicos02.cofepris.gob.mx/BRSDM/default.aspx](https://tramiteselectronicos02.cofepris.gob.mx/BRSDM/default.aspx)  
  *(Módulo BRSDM: Búsqueda de Registros Sanitarios de Medicamentos)*.
* **Campos estructurados:** Integra 28 campos informativos por registro (titular, denominación distintiva, principio activo, número de registro sanitario, vigencia, forma farmacéutica, fabricante, distribuidores autorizados).
* **¿Permite exportar?:**
  * La interfaz web institucional cuenta con funcionalidades de consulta en pantalla y botón para exportación de registros filtrados.
  * **Sin embargo, NO dispone de una API REST pública ni acceso programático abierto:** Las peticiones automáticas por HTTP/cURL son interceptadas con código **403 Forbidden** debido a políticas de WAF/firewall institucional y sesiones ASP.NET WebForms.
* **Impacto en el Sprint 1:**
  * Conforme a la instrucción del proyecto: **La herramienta de scraping/consulta directa en tiempo real al Visor de COFEPRIS queda FUERA del Sprint 1**.
  * En su lugar, los requisitos sanitarios y el checklist regulatorio se gestionan de forma auditable en `data/documentos.json`, con validación de supuestos de Registro Sanitario en el motor de cálculo.
* **Fecha de consulta:** 20 de octubre de 2026.

---

## 4. Confirmación de Fuentes Oficiales (DTA e IVA)

### 4.1. Derecho de Trámite Aduanero (DTA) — 0.8% (8 al millar)
* **Punto verificado:** Base legal y tasa aplicable.
* **Resultado del análisis legal:**
  * **Corrección de artículo:** El planteamiento inicial citaba el *artículo 179 de la Ley Federal de Derechos*. Se verificó en el texto de la Ley Federal de Derechos que el **Artículo 179** se refiere a derechos por dictámenes y permisos de monumentos históricos del INAH e INBAL.
  * **Fundamento legal exacto y vigente:** **Artículo 49, Fracción I de la Ley Federal de Derechos (LFD)**.
  * **Texto oficial:**  
    > *"Artículo 49.- Se pagará el derecho de trámite aduanero, por las operaciones aduaneras que se efectúen utilizando un pedimento o el documento aduanero correspondiente en los términos de la Ley Aduanera, conforme a las siguientes tasas o cuotas:*  
    > *I. Del 8 al millar [0.8%], sobre el valor que tengan los bienes para los efectos del impuesto general de importación..."*
* **Tasa:** **0.8% (factor 0.008)** sobre el valor en aduana de las mercancías.
* **Estatus en el sistema:** **HECHO CONFIRMADO** con fundamento en el Art. 49 Fracc. I de la Ley Federal de Derechos.
* **Fecha de verificación:** 20 de octubre de 2026.

---

### 4.2. IVA 0% a Medicinas de Patente (Importación)
* **Punto verificado:** ¿La importación de medicinas de patente causa IVA al 0% o está exenta, y cuál es su solidez jurídica frente a opiniones administrativas de 2019?
* **Resultado del análisis legal:**
  1. **Fundamento en Ley:**
     * **Artículo 2-A, Fracción I, inciso b) de la Ley del IVA (LIVA):** Establece la **tasa del 0%** para la enajenación de *"Medicinas de patente y productos destinados a la alimentación..."*.
     * **Artículo 25, Fracción III de la Ley del IVA:** Dispone expresamente que **no se pagará el IVA en las importaciones**:
       > *"Artículo 25.- No se pagará el impuesto al valor agregado en las importaciones siguientes: [...] III. Las de bienes cuya enajenación en el país y las de servicios por cuya prestación en territorio nacional no den lugar al pago del impuesto al valor agregado o cuando sean de los señalados en el artículo 2o.-A de esta Ley."*
     * **Artículo 7 del Reglamento de la Ley del IVA (RLIVA):** Define legalmente *"medicina de patente"* como las especialidades farmacéuticas, estupefacientes, psicotrópicos, antígenos o vacunas que cuenten con autorización sanitaria conforme a la legislación de salud.
  2. **El antecedente de 2019 y criterios normativos:**
     * Históricamente existió controversia (especialmente en 2019 con criterios del SAT sobre el suministro hospitalario y la importación de principios activos / APIs a granel sin procesar). La autoridad fiscal ha argumentado que las sustancias químicas no dosificadas o que no cuenten con registro sanitario como especialidad farmacéutica terminada causan el 16% general.
     * En cambio, para medicamentos terminados de patente (partida 3004) con Registro Sanitario, la vinculación entre el **Art. 25 Fracc. III** y el **Art. 2-A Fracc. I inc. b)** es un precepto legal taxativo.
* **Estatus en el sistema y Regla de Oro:**
  * Para blindar la auditoría y cumplir estrictamente la regla del proyecto:  
    El motor de cálculo aplica **IVA = 0.0%**, pero **EL AGENTE DEBE MARCARLO OBLIGATORIAMENTE COMO UN SUPUESTO CONDICIONADO (NO COMO HECHO AUTOMÁTICO INCONDICIONAL)**.
  * **Condición del supuesto registrada en el motor:**
    > *"Se asume tasa 0% de IVA (no causación en importación según Art. 25 Fracc. III y Art. 2-A Fracc. I inc. b de la LIVA) bajo el supuesto verificable de que el producto sea una especialidad farmacéutica terminada con Registro Sanitario vigente de COFEPRIS (Art. 7 RLIVA). Si el producto importado fuese considerado materia prima activa a granel o no acreditara registro de medicina de patente, la autoridad aduanera podría determinar tasa general del 16%."*
* **Fecha de verificación:** 20 de octubre de 2026.

---

## 5. Resumen de Parámetros Operativos Verificados

| Concepto | Valor / Rango | Base Legal / Fuente Oficial | Fecha Consulta | Naturaleza en Aduana-Copilot |
| :--- | :--- | :--- | :--- | :--- |
| **IGI (Arancel)** | 0.0% (Exento) | LIGIE (DOF 07/06/2022) / TLCUEM para origen UE-Alemania | 2026-10-20 | Hecho normativo |
| **DTA** | 0.8% (8 al millar) | Art. 49, Fracción I de la Ley Federal de Derechos | 2026-10-20 | Hecho normativo |
| **IVA** | 0.0% | Art. 25 Fracc. III y Art. 2-A Fracc. I inc. b LIVA; Art. 7 RLIVA | 2026-10-20 | **Supuesto auditado** (requiere registro de medicina de patente) |
| **Prevalidación** | Rango: $310.00 – $350.00 MXN | Art. 16-A Ley Aduanera; RGCE 2026 Regla 1.8.3 | 2026-10-20 | **Estimado (Rango)** |
| **Honorarios Agente**| Rango: 0.45% – 0.80% (Piso $3,500 – $6,500 MXN) | Prácticas de mercado aduanal farmacéutico / CAAAREM | 2026-10-20 | **Estimado (Rango)** |
