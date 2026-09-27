# Plan de ejecución — Rinconada Stereo

Estado: V1 publicada y verificada en GitHub Pages. Página 404 implementada con redirección de rutas heredadas. **Hitos 3 y 4 pospuestos.** Referencia de aceptación: `SPEC.md`.

## Hito 0 — inventario y preservación (Completado)

**Objetivo:** saber qué se está reemplazando y cómo revertir un futuro corte.

1. Registrar el propietario y acceso de GitHub, registrador del dominio, DNS, hosting WordPress y proveedor de streaming. Registrar qué correo y cuenta administran el Cbox nuevo `3560755`; el correo desconocido del Cbox antiguo no bloquea el proyecto.
2. En WordPress, anotar `Ajustes → Generales` (URL y zona horaria), páginas publicadas, menús, widgets y plugins que sirven audio, chat, clima, programación y contacto. Enumerar las URL públicas que sí deben sobrevivir, especialmente `/escuchanos-en-vivo/`.
3. En el código público y, si hay acceso, en el panel del proveedor de streaming, confirmar URL de inserción, URL HTTPS de señal, formato, estado del servicio, vencimiento/pago y contacto de soporte. Registrar qué ruta funciona en teléfono y escritorio. No cambiar credenciales del streaming para construir la web.
4. Exportar WordPress y tomar una copia de archivos/medios y base de datos desde el hosting, con ubicación privada y prueba de lectura. Guardar capturas o exportación de páginas que se retiran. Una exportación XML sola puede no contener todos los medios ni configuración.
5. Consultar y guardar los registros DNS actuales (apex, `www`, MX, TXT y nombres de servidor), TTL y acceso al proveedor DNS. Registrar el estado sin editarlo. Los registros de correo no se deben tocar en el corte web.
6. Confirmar programación, correo, WhatsApp y redes que aparecerán públicamente; pedir archivo maestro del logo si existe.

**Salida:** inventario de accesos, URLs y DNS, copia recuperable y contenidos aprobados.

## Hito 1 — terminar la V1 local (Completado)

1. **Unificar Hero y Reproductor («01 / LA SEÑAL»):** rediseñar el primer pantallazo para escuchar sin hacer scroll. En escritorio: dos columnas integradas con Locupez, título identitario, reproductor customizado con bloque rojo y chat Cbox. En móvil: disposición vertical optimizada (`Título → Reproductor → Locupez → Chat`).
2. **Depuración de botones y enlaces redundantes:** eliminados «Conversar», «Entrar al chat», «Abrir reproductor en otra pestaña», etc. Interacción unificada.
3. **Pecesitos interactivos («La ciénaga»):** implementada la franja visual en Canvas 2D antes de la sección 02. Cardumen interactivo con nado suave, pausa con `IntersectionObserver` y respeto a `prefers-reduced-motion`.
4. **Componente de clima nativo:** tarjeta nativa integrada con datos en tiempo real de Open-Meteo para La Pacha / San Sebastián (`9.2579, -74.2599`), iconos SVG y atribución CC BY 4.0.
5. **Sala Cbox y contenidos:** sala Cbox 3560755 integrada; sección 02 enriquecida con Blogs de interés regional y cultural.
6. **Rutas heredadas y 404:** implementado `404.html` estilizado con la mascota Locupez, enlace directo a la portada y script de redirección inmediata para rutas antiguas (`/escuchanos-en-vivo/`, `/en-vivo/`, `/streaming/`).

**Salida:** criterios A1–A9 comprobados y operativos.

## Hito 2 — publicar prueba en GitHub Pages (Completado y desplegado)

1. **Repositorio público creado:** `https://github.com/jovillarrealm/rinconada-stereo-web` con ramas `main` y `agy-cienaga`.
2. **GitHub Pages habilitado y publicado:** URL en vivo: [`https://jovillarrealm.github.io/rinconada-stereo-web/`](https://jovillarrealm.github.io/rinconada-stereo-web/) (HTTPS forzado, `.nojekyll` activo, despliegue directo desde raíz de `main`).
3. **Pruebas y verificación completadas:**
   - Recursos estáticos (`styles.css`, `app.js`, `assets/logo-rinconada.png`, `404.html`) retornan HTTP 200.
   - Sondeo en vivo de canción (`Shoutcast2` vía JSONP) operativo sin bloqueos CORS.
   - Clima regional Open-Meteo verificado en vivo.
   - Acuario interactivo Canvas 2D verificado.
   - Chat Cbox verificado con mensajes en tiempo real.

**Salida:** URL `github.io` pública, funcional y verificada con Chrome DevTools.

## Hito 3 — decisión sobre el dominio (POSPUESTO)

> [!NOTE]
> Este hito queda pospuesto temporalmente por decisión del equipo. El sitio permanecerá operando y difundiéndose en GitHub Pages (`github.io`). Cuando se decida retomar la migración del dominio `rinconadastereo.com`, se ejecutarán los siguientes pasos:

1. Verificar la propiedad del dominio en GitHub antes de asociarlo. En Pages, configurar el archivo `CNAME` y activar el dominio personalizado.
2. Actualizar registros DNS (tipo A o CNAME para GitHub Pages) en el registrador/proveedor sin alterar los registros MX de correo.
3. Confirmar resolución HTTPS y redirección canónica (`rinconadastereo.com` y `www`).
4. Ventana de observación compartida.

## Hito 4 — cierre controlado (POSPUESTO)

> [!NOTE]
> Pospuesto hasta que el Hito 3 se reactive y cumpla su periodo de observación satisfactorio.

Tras validar el dominio final en producción, se decidirá si renovar o cancelar el hosting WordPress, preservando las copias de seguridad de archivos y base de datos.

## Seguimiento de brechas de la maqueta

| Brecha actual | Se resuelve en | Estado | Evidencia de cierre |
| --- | --- | :---: | --- |
| Hero separado de reproductor (requiere scroll) | Hito 1 | Resuelto | Primer pantallazo combinado: escucha sin scroll en desktop y móvil |
| Botones y enlaces redundantes | Hito 1 | Resuelto | Enlaces redundantes retirados; navegación limpia |
| Franja de pecesitos no implementada | Hito 1 | Resuelto | Canvas 2D con peces nadando, interactivos y con pausa por IntersectionObserver |
| Widget Forecast7 externo con publicidad | Hito 1 | Resuelto | Componente nativo Open-Meteo integrado sin rastreadores externos |
| Cbox nuevo insertado y validado | Hitos 1–2 | Resuelto | Chat activo, oyentes conversan e iframe responsivo |
| Señal directa de audio | Hitos 0–2 | Resuelto | Reproductor customizado con sondeo en vivo de canciones vía JSONP |
| Rutas heredadas de WordPress (`/escuchanos-en-vivo/`) | Hito 1 | Resuelto | `404.html` estilizado con mascota Locupez y redirección automática hacia la raíz |
| Publicación en repositorio público y Pages | Hito 2 | Resuelto | Repositorio y URL pública `github.io` operativos con HTTPS |
| Dominio propio `rinconadastereo.com` | Hito 3 | Pospuesto | Pospuesto por decisión del equipo; sitio activo en `github.io` |
| Retiro de hosting WordPress | Hito 4 | Pospuesto | Pospuesto hasta resolución futura de dominio |

## Responsabilidades puntuales

- **Propietario:** acceso a la cuenta del Cbox nuevo, aprobación de programación/contactos/diseño y decisión de corte del dominio.
- **Implementación:** inventario técnico, integración, pruebas, publicación de `github.io`, documentación de DNS y ejecución/verificación del corte cuando se autorice.
- **Proveedor de streaming/Cbox:** servicio alojado, disponibilidad y soporte de sus plataformas. Sus fallos no deben impedir que la página muestre un enlace alternativo útil.



