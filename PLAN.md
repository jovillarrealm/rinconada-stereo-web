# Plan de ejecución — Rinconada Stereo

Estado: plan propuesto, 23 de septiembre de 2026. Referencia de aceptación: `SPEC.md`. Se avanza por hitos; cada hito tiene una prueba de salida. **El primer lanzamiento es `github.io`, sin tocar DNS.** El cambio de dominio es una decisión posterior y separada.

## Hito 0 — inventario y preservación

**Objetivo:** saber qué se está reemplazando y cómo revertir un futuro corte.

1. Registrar el propietario y acceso de GitHub, registrador del dominio, DNS, hosting WordPress y proveedor de streaming. Registrar qué correo y cuenta administran el Cbox nuevo `3560755`; el correo desconocido del Cbox antiguo no bloquea el proyecto.
2. En WordPress, anotar `Ajustes → Generales` (URL y zona horaria), páginas publicadas, menús, widgets y plugins que sirven audio, chat, clima, programación y contacto. Enumerar las URL públicas que sí deben sobrevivir, especialmente `/escuchanos-en-vivo/`.
3. En el código público y, si hay acceso, en el panel del proveedor de streaming, confirmar URL de inserción, URL HTTPS de señal, formato, estado del servicio, vencimiento/pago y contacto de soporte. Registrar qué ruta funciona en teléfono y escritorio. No cambiar credenciales del streaming para construir la web.
4. Exportar WordPress y tomar una copia de archivos/medios y base de datos desde el hosting, con ubicación privada y prueba de lectura. Guardar capturas o exportación de páginas que se retiran. Una exportación XML sola puede no contener todos los medios ni configuración.
5. Consultar y guardar los registros DNS actuales (apex, `www`, MX, TXT y nombres de servidor), TTL y acceso al proveedor DNS. Registrar el estado sin editarlo. Los registros de correo no se deben tocar en el corte web.
6. Confirmar programación, correo, WhatsApp y redes que aparecerán públicamente; pedir archivo maestro del logo si existe.

**Salida:** inventario de accesos, URLs y DNS, copia recuperable y contenidos aprobados. Lo que no tenga acceso se registra como dependencia concreta, sin inventar valores.

## Hito 1 — terminar la V1 local

1. **Unificar Hero y Reproductor («01 / LA SEÑAL»):** rediseñar el primer pantallazo para escuchar sin hacer scroll. En escritorio: dos columnas integradas (izquierda: titular, mensaje identitario y tarjeta del reproductor `<audio controls>` directo con respaldo en `<details>`; derecha: iframe de la sala Cbox). En móvil: disposición de una columna centrada donde el reproductor se ubica en la parte superior inmediatamente accesible sobre el chat.
2. **Depuración de botones y enlaces redundantes:** eliminar «Conversar» en el header, «Entrar al chat» en el hero y «Entra al chat en vivo» en contacto; retirar también los enlaces externos «Abrir el reproductor en otra pestaña» y «Abrir el chat en otra pestaña». La interacción queda limpia y concentrada en la página.
3. **Pecesitos interactivos («La ciénaga»):** implementar la franja visual en Canvas 2D inmediatamente antes de la sección «02 / EN LA EMISORA». Cardumen orgánico de 5 a 12 siluetas de peces con nado suave, interacción sutil al pasar el cursor o tocar la pantalla, pausa automática del ciclo de animación con `IntersectionObserver` cuando esté fuera de pantalla y composición estática con `prefers-reduced-motion`.
4. **Componente de clima nativo (reemplazo de Forecast7):** sustituir el script y widget externo de Forecast7 por una tarjeta nativa integrada que consulta la API pública de Open-Meteo para las coordenadas de La Pacha / San Sebastián de Buenavista (`9.2579, -74.2599`). Conservar exactamente la misma columna del layout en Programación (`minmax(280px, 380px)`), con iconos SVG nativos, datos en tiempo real (temperatura, sensación/humedad, viento) y atribución CC BY 4.0.
5. **Sala Cbox y programación:** mantener sala Cbox nueva 3560755, comprobar estilos base en Cbox según STYLE_GUIDE.md, sustituir programación provisional por horarios revisados o confirmar estado «En actualización».
6. **Rutas heredadas:** añadir página estática de enlace/traslado para `/escuchanos-en-vivo/` y las otras rutas esenciales detectadas. Como Pages no ofrece redirecciones HTTP configurables desde archivos HTML, definir una salida estática que lleve a la escucha y probarla.

**Salida:** criterios A1–A9 del spec comprobados localmente con Hero sin scroll, botones simplificados, pecesitos en canvas 2D y clima nativo Open-Meteo.

## Hito 2 — publicar prueba en GitHub Pages (Completado y desplegado)

1. **Repositorio público creado:** `https://github.com/jovillarrealm/rinconada-stereo-web` con ramas `main` y `agy-cienaga`.
2. **GitHub Pages habilitado y publicado:** URL en vivo: [`https://jovillarrealm.github.io/rinconada-stereo-web/`](https://jovillarrealm.github.io/rinconada-stereo-web/) (HTTPS forzado, `.nojekyll` activo, despliegue directo desde raíz de `main`).
3. **Pruebas y verificación completadas:**
   - Recursos estáticos (`styles.css`, `app.js`, `assets/logo-rinconada.png`) retornan HTTP 200.
   - Sondeo en vivo de canción (`Shoutcast2` vía JSONP) operativo sin bloqueos CORS.
   - Clima regional Open-Meteo verificado con IntersectionObserver diferido (33°C, La Pacha prominente).
   - Acuario interactivo Canvas 2D (14 peces, 8 especies) verificado tanto en escritorio como en móvil (390px).
   - Chat Cbox cargado en su contenedor sin popups ni desbordamiento.

**Salida:** URL `github.io` pública y lista para depuración conjunta. WordPress y DNS del dominio original siguen intactos.

## Hito 3 — decisión sobre el dominio (posterior a la prueba)

**Puerta de decisión:** el propietario aprueba la versión pública, programación y contactos; audio, chat y pronóstico pasan las pruebas; existe inventario DNS y copia de WordPress. Este hito no se ejecuta como consecuencia automática de publicar en `github.io`.

1. Verificar la propiedad del dominio en GitHub antes de asociarlo, según la recomendación de GitHub. Elegir canónico entre dominio raíz y `www`. En Pages, configurar primero el dominio personalizado; después actualizar solo registros web en el proveedor DNS. [Guía oficial](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
2. Confirmar que `rinconadastereo.com` y `www` resuelven al destino previsto, HTTPS está disponible y la variante secundaria redirige a la canónica. Revisar rutas heredadas, audio, chat y enlaces desde el dominio real. GitHub advierte que la propagación DNS puede tardar hasta 24 horas.
3. Mantener WordPress y hosting disponibles durante la ventana de observación acordada. Puede haber visitantes con DNS anterior; ambos sitios deben poder reproducir la señal durante esa ventana. Vigilar errores y mensajes de oyentes.

**Reversión del corte:** si el nuevo dominio falla, restaurar los registros web desde la copia exacta del hito 0 y comprobar resolución/HTTPS del sitio anterior. Mantener Pages accesible en `github.io` para corregirlo. No cambiar MX/TXT de correo para resolver un fallo web. La propagación y caché DNS pueden hacer que la reversión no sea instantánea.

## Hito 4 — cierre controlado

Tras una ventana de observación satisfactoria, decidir si renovar o cancelar el hosting WordPress. Antes de cualquier cancelación, comprobar nuevamente backup, correo del dominio, archivos y servicios que el hosting pueda estar proporcionando. Retirar artículos de la navegación pública no autoriza borrar sus originales. La cancelación y la eliminación de datos se tratarán como acciones separadas.

## Seguimiento de brechas de la maqueta

| Brecha actual | Se resuelve en | Evidencia de cierre |
| --- | --- | --- |
| Hero separado de reproductor (requiere scroll) | Hito 1 | Primer pantallazo combinado: escucha sin scroll en desktop (2 columnas) y móvil (player superior) |
| Botones y enlaces redundantes («Conversar», «Abrir en pestaña») | Hito 1 | Enlaces retirados; navegación limpia y autónoma en una página |
| Franja de pecesitos no implementada | Hito 1 | Canvas 2D con peces nadando, interactivos y con pausa por IntersectionObserver |
| Widget Forecast7 externo con iframes y publicidad | Hito 1 | Componente nativo Open-Meteo integrado con datos y SVG propios en el mismo espacio |
| Cbox nuevo insertado, conversación y administración sin validar | Hito 1 | Dos invitados conversan, dueño entra al panel y configura filtros disponibles |
| Señal directa no validada | Hitos 0–2 | Reproducción en Android, iPhone y escritorio; respaldo comprobado |
| Programación y contactos sin validación final | Hitos 0–1 | Aprobación del dueño y enlaces abiertos en destino correcto |
| GitHub no autenticado; sin repositorio | Hito 2 | Repositorio y URL pública operativos |
| Dominio aún en WordPress | Hito 3 | Corte aprobado, DNS/HTTPS y reversión verificados |

## Responsabilidades puntuales

- **Propietario:** acceso a la cuenta del Cbox nuevo, aprobación de programación/contactos/diseño y decisión de corte del dominio.
- **Implementación:** inventario técnico, integración, pruebas, publicación de `github.io`, documentación de DNS y ejecución/verificación del corte cuando se autorice.
- **Proveedor de streaming/Cbox:** servicio alojado, disponibilidad y soporte de sus plataformas. Sus fallos no deben impedir que la página muestre un enlace alternativo útil.



