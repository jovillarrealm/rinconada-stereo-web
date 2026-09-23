# Especificación — Rinconada Stereo V1

Estado: borrador de trabajo, 23 de septiembre de 2026. Dueño del producto: propietario de Rinconada Stereo. Primer destino público: GitHub Pages en `github.io`; `rinconadastereo.com` se decidirá después de validar la V1.

## 1. Propósito y prioridades

Reemplazar la portada de WordPress por un sitio ligero que permita **escuchar la señal en vivo**, conocer la programación y participar en un chat. Prioridad de decisión: **1) carga y respuesta rápidas, 2) calidad visual contemporánea**, sin sacrificar acceso al audio ni claridad. La radio y su territorio son el centro; el sitio no necesita parecer un periódico ni vender publicidad.

## 2. Alcance de V1

Una sola página con enlaces a inicio/escucha, programación y contacto. El chat está junto al reproductor y se alcanza desde cualquier sección; el pronóstico compacto está dentro de Programación. El mismo documento evita recargas al moverse entre secciones. Stack: HTML semántico, CSS propio y JavaScript nativo; archivos estáticos desde una rama de GitHub Pages, sin backend ni compilación. Si vuelven los escritos y requieren plantillas o archivo, se reevaluará Astro estático.

### P0 — necesario para publicar en `github.io`

- **Hero y Señal unificados (sin scroll):** unificar el Hero y la escucha en el primer pantallazo («01 / LA SEÑAL»). En escritorio: distribución en dos columnas (izquierda: mensaje identitario y reproductor directo en vivo; derecha: sala de chat Cbox integrada). En móvil: columna centrada con el reproductor ubicado inmediatamente accesible sin necesidad de desplazarse. Nunca iniciar audio automáticamente. Mostrar conexión/error; mantener reproductor del proveedor en `<details>` como respaldo.
- **Simplificación de enlaces y botones:** suprimir enlaces redundantes que dirigen a la misma página o abren pestañas innecesarias: se eliminan los botones «Conversar» de la cabecera, «Entrar al chat» del hero y «Entra al chat en vivo» de contacto; asimismo se retiran «Abrir el reproductor en otra pestaña» y «Abrir el chat en otra pestaña». Toda la interacción ocurre dentro del documento.
- **Pecesitos («La ciénaga interactiva»):** franja visual e interactiva ubicada inmediatamente antes de la sección «02 / EN LA EMISORA». Implementada con Canvas 2D nativo y ligero (cardumen de 5 a 12 peces que nadan suavemente y responden sutilmente al cursor o toque). Pausa automática de `requestAnimationFrame` mediante `IntersectionObserver` cuando no está en pantalla para no consumir batería ni CPU. Respeta `prefers-reduced-motion` mostrando una composición estática. Decorativo y accesible (`aria-hidden="true"`).
- **Clima regional nativo (alternativa a Forecast7):** sustituir el iframe y script externo de Forecast7 / WeatherWidget.io por un componente nativo ligero que consume el endpoint público de Open-Meteo (`latitude=9.2579&longitude=-74.2599`). Conserva exactamente el espacio asignado en la grilla de Programación (`minmax(280px, 380px)`), renderiza temperatura, estado del cielo y viento con iconos SVG propios y atribución CC BY 4.0, sin cookies, rastreadores ni iframes de terceros.
- **Chat:** mantener en el primer pantallazo (junto al reproductor) la sala Cbox proporcionada (boxid=3560755) en un único iframe con carga diferida. La emisora debe conservar acceso administrativo y filtros básicos en Free.
- **Programación:** conservar la sección «02 / EN LA EMISORA» con horarios vigentes o rótulo transitorio «En actualización» aprobado por el dueño.
- **Contacto:** enlaces directos a correo y WhatsApp tras confirmar destinos vigentes.
- **Identidad:** conservar el logo adjunto y el azul `#3676CE`; los peces del canvas refuerzan la identidad de la ciénaga como signo secundario dinámico.

### Fuera de V1

Escritos antiguos, Top 5, canciones favoritas, publicidad, formulario de contacto, cuentas propias de oyentes, backend propio, analítica que requiera consentimiento y modelos 3D / WebGL pesados.

## 3. Experiencia y criterios de aceptación

| ID | Criterio verificable |
| --- | --- |
| A1 | En móvil y escritorio, la persona encuentra el reproductor inmediatamente al abrir la portada sin tener que hacer scroll («above the fold») y puede iniciar la señal con un solo toque. Si la señal nativa falla, el respaldo en `<details>` está disponible en el mismo lugar. |
| A2 | En escritorio se aprecian dos columnas integradas (audio y mensaje a la izquierda, chat a la derecha). En móvil el reproductor aparece en la parte superior sobre el chat. |
| A3 | No existen botones ni enlaces redundantes («Conversar», «Entrar al chat», «Abrir en otra pestaña»). La navegación en cabecera mantiene Inicio, Programación y Contacto. |
| A4 | Entre la sección de señal (01) y programación (02) se visualiza la franja de los pecesitos en Canvas 2D; los peces se mueven de forma fluida, responden sutilmente a la interacción y se detienen automáticamente si la sección no está visible o si el sistema tiene activado `prefers-reduced-motion`. |
| A5 | El espacio del clima en Programación muestra el clima regional de La Pacha / San Sebastián mediante el componente nativo de Open-Meteo, con datos reales, iconos SVG limpios y enlace de atribución visible, sin depender de scripts de Forecast7 ni mostrar publicidad externa. |
| A6 | El chat integrado Cbox permite enviar y recibir mensajes sin desbordar el contenedor ni abrir popups. |
| A7 | La programación y los enlaces de contacto (correo y WhatsApp) abren los destinos aprobados. |
| A8 | Se puede recorrer navegación, controles y enlaces con teclado; el foco es visible; la página no desborda horizontalmente a 320 px. |
| A9 | La portada inicial no descarga scripts de widgets pesados ni ejecuta bucles en segundo plano; el audio usa `preload="none"`. La URL `github.io` sirve la página con HTTPS. |

La velocidad se medirá en móvil en la URL publicada, registrando peso inicial, solicitudes externas, LCP y CLS. Se corregirán problemas concretos antes del dominio final; no se dará por rápida solo porque sea estática. Se probará al menos Android/Chrome, iPhone/Safari y un navegador de escritorio; si falta un dispositivo, se documentará la limitación.

## 4. Dependencias, restricciones y decisiones pendientes

- La transmisión y el reproductor pertenecen al proveedor actual. La maqueta usa `https://play14.tikast.com:22012/stream` y respalda con el iframe de Virtualtronics; la reproducción directa **no se ha validado**. No cambiar el servicio de streaming como parte de esta migración.
- Cbox Free es servicio externo y admite colores y fuentes, pero muestra marca/anuncios; publica límites de 100 mensajes visibles, 150 mensajes por día y 1.000 visitantes por día. La moderación manual y el CSS propio figuran en planes pagos. Probar la sala real antes de decidir si esos límites requieren otro plan.
- El widget meteorológico actual apunta a San Sebastián de Buenavista. Verificar que esa referencia represente bien el entorno deseado; no prometer precisión a escala de la ciénaga.
- Faltan: acceso administrativo y correo dueño de la nueva sala Cbox, acceso a GitHub, programación aprobada, confirmación de contactos, logo maestro y acceso de lectura a DNS/hosting para inventario. El correo antiguo de Cbox no es requisito.
- GitHub Pages será público; no guardar secretos, exportaciones de WordPress ni datos personales en el repositorio. El dominio y el correo del dominio se administran por separado.

## 5. Estado de la maqueta actual

Ya existen index.html, styles.css, app.js y el logo local. Hay diseño adaptable, navegación por anclas, audio nativo con alternativa, chat integrado junto al audio y pronóstico compacto en Programación. **No equivale a V1 aceptada:** Cbox nuevo está insertado pero sin prueba de conversación ni acceso administrativo; audio directo sin prueba real; programación provisional; contactos tomados de la web anterior aún por confirmar; falta dar acceso persistente al reproductor al desplazarse y probar rutas heredadas. Estas brechas se resuelven en el plan.

## Fuentes de las decisiones de plataforma

[GitHub Pages: publicación desde una rama](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [GitHub Pages: dominio propio](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) · [Cbox: planes](https://www.cbox.ws/products) · [WeatherWidget.io: términos](https://weatherwidget.io/terms/). Investigación ampliada en `research/`.



