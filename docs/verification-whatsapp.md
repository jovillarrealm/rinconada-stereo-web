# Verificación de los logos de WhatsApp

Fecha: 2 de octubre de 2026, America/Bogota. Mediciones iniciadas el 3 de octubre a las 03:45 UTC.

## Cambio y corrección detectada

Se sustituyeron los emojis de «Dedicar en cabina» y «Pedir tema» por SVG de WhatsApp, blancos en el estado normal y negros al pasar el cursor sobre el fondo verde. Los botones conservan fondos oscuros en ambos temas. El emoji de «Abrir Chat en vivo» se mantiene.

La primera validación comunicada solo incluyó `npm test` y `git diff --check`. No incluyó Chrome, inspección visual ni mediciones de rendimiento. Esa validación no bastaba para afirmar que se conservaba el layout.

El primer ensayo con Chrome DevTools MCP detectó que los SVG de 18 × 18 px aumentaban 1 px la altura del botón principal y 3 px la del flotante. Se ajustaron los tamaños CSS al espacio que ocupaban los emojis: 18 × 17 px para el principal y aproximadamente 19,36 × 14,08 px para el flotante. Las mediciones finales se ejecutaron después de esta corrección, sin modificar los estilos durante la serie.

## Método

Chrome DevTools MCP oficial 1.10.1, negociado por stdio y comprobado con herramientas reales. Chrome headless 154.0.0.0 en Windows, Node 26.7.0. Estado anterior: commit `86b91a9d6fec696bde39262c9f87536d96a54767`; estado posterior: archivos del árbol de trabajo.

Se realizaron 24 cargas: tres pares antes/después para escritorio 1440 × 900 y móvil emulado 390 × 844, en temas claro y oscuro. CPU 4×, Fast 4G, contextos aislados, archivos locales sin caché y service worker excluido. Cbox y los metadatos siguieron utilizando la red real. Observación de carga de al menos cinco segundos, antes de hover o scroll. El procedimiento completo está en [verification.md](verification.md).

## UI y geometría

- Se revisaron capturas antes/después, estados hover y reproductor flotante, además de las cajas medidas de componentes y botones.
- Las alturas de los botones, del bloque de canción y del reproductor coinciden con el estado anterior. La mayor diferencia de geometría medida en cualquiera de los cuatro perfiles fue **0,015625 px**, por ancho del icono y alineación contigua; ninguna diferencia superó 0,1 px.
- No se detectó desbordamiento horizontal en los perfiles probados.
- Los colores calculados son blanco en reposo y negro en hover para ambos logos y ambos temas.
- El reproductor flotante aparece al desplazar la página; su icono cabe también en el botón compacto móvil.
- El emoji del chat se conserva en las cuatro combinaciones.
- Los SVG son inline: no agregan archivos de imagen ni solicitudes de red para los logos. No se probó enviar mensajes, abrir WhatsApp ni reproducir audio real.

Las capturas tienen contenido dinámico de canciones y de Cbox; no se exige igualdad píxel a píxel de ese contenido. La conclusión de geometría se limita a las cajas y perfiles medidos, no a todos los dispositivos posibles.

## LCP

Medianas de tres cargas por variante. Valores de `PerformanceObserver`, contrastados con las trazas de DevTools; las trazas y el observer pueden diferir algunos milisegundos por redondeo.

| Perfil | Antes, ms | Después, ms | Diferencia | Rango antes, ms | Rango después, ms |
| --- | ---: | ---: | ---: | --- | --- |
| Escritorio claro | 1328 | 1372 | +44 ms (+3,3 %) | 1132–1576 | 1076–1424 |
| Escritorio oscuro | 1448 | 1160 | −288 ms (−19,9 %) | 1224–1456 | 1152–1432 |
| Móvil claro | 1252 | 1264 | +12 ms (+1,0 %) | 1160–1272 | 1144–1280 |
| Móvil oscuro | 1260 | 1148 | −112 ms (−8,9 %) | 1208–1444 | 1116–1432 |

El elemento LCP fue `assets/locupez.avif` en escritorio y `assets/logo-rinconada.avif` en móvil, en ambas variantes. No pasó a ser un logo de WhatsApp.

No se detectó una regresión consistente de LCP: dos medianas aumentaron ligeramente y dos bajaron, con rangos solapados y variación entre ejecuciones mayor que los aumentos. Tres muestras por variante no prueban equivalencia estadística ni una mejora real; las disminuciones tampoco se atribuyen al cambio de iconos.

## CLS y fuentes de desplazamiento

| Perfil | CLS de página principal antes/después | CLS de traza con frames antes/después |
| --- | --- | --- |
| Escritorio claro | 0 / 0 | ≈0,03524 / ≈0,03524 |
| Escritorio oscuro | 0 / 0 | ≈0,03524 / ≈0,03523 |
| Móvil claro | 0 / 0 | 0 / 0 |
| Móvil oscuro | 0 / 0 | 0 / 0 |

DevTools redondea el CLS de escritorio a 0,04. Los eventos `LayoutShift` de esas trazas tienen `is_main_frame: false`; afectan al `BODY` y a `DIV#messages` del iframe de Cbox. El análisis `CLSCulprits` confirma esos elementos. No se encontraron eventos de desplazamiento en el frame principal durante las 24 cargas.

El CLS de Cbox ya existía antes del cambio y permaneció prácticamente igual después. No se afirma que la página completa tenga CLS cero. En móvil, el iframe se carga al abrir el chat; la serie de carga inicial no incluye ese estado.

## Consola y comprobaciones complementarias

La consola registró el 404 del script del service worker, deliberadamente excluido por el servidor de prueba, en ambas variantes. No se detectaron nuevos errores de consola asociados a los SVG en las primeras muestras de cada perfil. `npm test`, `git diff --check` y la comprobación sintáctica de los scripts también pasaron.

## Evidencia

El resumen con las 24 muestras, rangos, entorno y huellas de los archivos posteriores se conserva en [verification-whatsapp-metrics.json](verification-whatsapp-metrics.json).

Las evidencias extensas se guardaron en la carpeta local ignorada `screenshots/whatsapp-ui/`:

- `results.json`, `environment.json`, `summary.json` y `mcp-calls.jsonl`.
- Trazas comprimidas `*-before-*.json.gz` y `*-after-*.json.gz`, importables en Chrome DevTools.
- Resultados `*-trace.txt`, `*-CLSCulprits.txt` y `*-LCPBreakdown.txt`.
- Capturas `*-top.png`, `*-hover.png`, `*-sticky.png` y `*-sticky-hover.png` y snapshots de accesibilidad.

Estas evidencias se pueden regenerar con los scripts documentados; las capturas y trazas no se agregaron al repositorio.

## Límite de la conclusión

La distribución se conserva en los componentes y perfiles probados, sin nuevos desplazamientos observados en el frame principal y sin regresión consistente de LCP en este laboratorio. No se midió la página publicada, el percentil 75 de usuarios reales, la latencia de Cloudflare ni el funcionamiento real de caché/offline. Una garantía sobre Core Web Vitals en producción necesita mediciones de campo adicionales.
