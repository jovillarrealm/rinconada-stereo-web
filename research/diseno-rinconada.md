> **Decisión vigente:** Cbox integrado junto al audio y clima dentro de Programación. Las propuestas de panel móvil y sección Territorio son históricas; ver SPEC.md y STYLE_GUIDE.md.

# Dirección visual para Rinconada Stereo

Investigación al 23 de septiembre de 2026. La propuesta parte de lo confirmado por el propietario: conservar el logotipo blanco adjunto y el azul de cabecera #3676CE como identidad principal; pez como signo secundario modernizable; unir portada y escucha; mantener programación, aunque necesita actualización; ofrecer audio y acceso al chat desde todo el sitio. Los archivos maestros del logo y fotografías con permiso de uso siguen por verificar. Las propuestas visuales de abajo son interpretación de diseño, no rasgos atribuidos a las emisoras citadas.

## Referencias de producto

- [NTS](https://www.nts.live/) da prioridad al estado **Live now**, muestra lo siguiente en la programación y ofrece **Join the Chat** en la navegación. Enseña que escuchar y participar pueden ser acciones de primer nivel, visibles desde el inicio.
- [KEXP](https://www.kexp.org/) mantiene **Listen Live** como acción persistente junto a navegación de contenidos, programación y locutores. La presencia de contenidos alrededor del directo no desplaza al audio.
- [The Lot Radio](https://www.thelotradio.com/) abre con controles de reproducción y la programación del día; la página combina señal, agenda e identidad comunitaria. Su patrón de «hoy al aire» sirve mejor a Rinconada que un top de canciones estático.
- [dublab](https://www.dublab.com/) enuncia en su portada la combinación de directo, programación, archivo, DJs y proyectos. Solo tomar la claridad de la arquitectura: Rinconada puede empezar con menos secciones.

## Tres direcciones para el diseño

| Dirección | Aspecto concreto | Ventaja | Riesgo |
| --- | --- | --- | --- |
| **A. Señal del territorio** | Azul de marca como bloque fuerte de cabecera y franja del reproductor; fondo marfil cálido; tipografía sans clara y titulares expresivos; fotografías propias de Ciénaga, La Rinconada y Pacha; pequeñas líneas topográficas/ondas o contorno del pez como grafismo. Rejilla editorial asimétrica con mucho espacio libre. | Equilibra emisora y lugar; da motivo visual a los pronósticos y a la comunidad. | Requiere escoger imágenes locales auténticas y verificar derechos. |
| **B. Estudio nocturno** | Azul profundo casi negro, blanco y un único acento cálido; carátula o retrato de locutor grande; titulares compactos; indicadores de EN VIVO discretos; programación en tabla clara. El pez puede ser sello monocromo. | Escucha muy enfocada y marca contundente. | Puede verse como una plataforma musical genérica y restar presencia al territorio. |
| **C. Postal sonora** | Fotografía documental a pantalla ancha con superposición azul, gran frase de bienvenida y control de escucha; cuerpo blanco/crema; tres tarjetas de localidades como «ventanas» con clima y relato breve. Pez como firma en secciones y redes. | Muy memorable si existe buen material propio. | Sin fotos buenas pierde calidad; un hero pesado perjudica móvil y carga. |

**Recomendación: A como sistema principal, con un solo momento fotográfico de C.** Mantener el logotipo blanco íntegro sobre el azul existente. Extraer el pez como icono independiente solo desde un archivo fuente de calidad o mediante redibujo aprobado; no sustituir a ciegas el logo maestro de la imagen pequeña. El azul confirmado es #3676CE. Construir una paleta secundaria sobria (marfil para lectura y un acento cálido medido), evitar degradados múltiples, tarjetas genéricas y efectos de audio decorativos que compitan con el player.

### Estructura de la portada única

1. Cabecera: logo, navegación breve (**Inicio**, **Programación**, **Territorio**, **Contacto**) y botón **Abrir chat**.
2. Primer pantallazo: **En vivo desde La Rinconada** / frase corta de la emisora, nombre del programa o «Señal en vivo» cuando no existan metadatos, control grande **Escuchar en vivo**, y chat visible como columna lateral en escritorio. No mostrar canciones ni locutor inventados.
3. «Ahora / después»: bloque de programación con horarios confirmados; hasta actualizarla, rotularla como «programación por confirmar» o publicar solamente las franjas verificadas.
4. «El tiempo en nuestra región»: Ciénaga, La Rinconada y Pacha en tres módulos consistentes, con condición, temperatura y hora de actualización del proveedor. Evitar mapas pesados si las tarjetas resuelven la consulta.
5. Breve identidad de la emisora y contacto con enlaces reales a correo y WhatsApp. Los antiguos Top 5, canciones favoritas y escritos no forman parte de la navegación inicial.

En escritorio, el chat puede estar junto al directo al abrir la portada y seguir disponible desde un botón fijo o la cabecera. En móvil, una acción **Chat** abre un panel de altura controlada; el reproductor queda siempre visible. No duplicar iframes del chat, porque eso genera sesiones y mensajes inconsistentes.

### Player continuo: solución mínima en GitHub Pages

Hacer la primera versión como **un documento HTML con secciones enlazables** (`#programacion`, `#territorio`, `#contacto`) y un único elemento `<audio>` fuera de las secciones. La navegación por anclas mantiene el documento cargado y el audio sigue sonando; el reproductor se muestra grande en el primer pantallazo y compacto/fijo al desplazarse. El mismo documento permite abrir un único chat desde cualquier sección. GitHub Pages sirve un `index.html` estático sin necesidad de servidor de aplicación ([GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)).

Si después se necesitan páginas con URL independientes, cambiar de documento HTML corta la reproducción; entonces haría falta navegación cliente que conserve montado el mismo `<audio>` y actualice la vista/URL. Eso añade estado y manejo de historial, por lo que no se justifica para estas pocas secciones. Abrir otro dominio, pestaña o recargar no conserva la reproducción; no prometer continuidad fuera del documento.

El botón debe iniciar el audio por acción de la persona, sin `autoplay`: los navegadores pueden bloquear reproducción automática ([MDN: autoplay](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/autoplay)) y W3C recomienda iniciar el sonido a petición ([WCAG 1.4.2](https://www.w3.org/WAI/WCAG21/Understanding/audio-control)). Mostrar estado de carga/error y controles etiquetados de reproducir/pausar y volumen; el elemento `<audio>` expone eventos como `playing`, `waiting` y `error` para ello ([MDN: audio](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio)). Para chat en móvil, `<dialog>` nativo aporta manejo de foco y Escape, con botón de cierre explícito ([MDN: dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)).

### Móvil y accesibilidad

- Orden móvil: cabecera corta → título + gran botón de escucha → «ahora/después» → clima → resto. Barra del reproductor fija abajo, con espacio inferior reservado para que no cubra contenido; botón de chat separado de controles de audio y fuera de la zona de gestos del sistema.
- Controles táctiles amplios: WCAG 2.2 fija al menos **24 × 24 CSS px** o separación equivalente como mínimo; apuntar a 44–48 px para controles principales ([W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)).
- El azul #3676CE con blanco puro tiene contraste calculado de aproximadamente **4.53:1**: supera por margen estrecho el mínimo **4.5:1** para texto normal ([W3C 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)). El logo tiene excepción técnica, pero conviene mantenerlo legible.
- Dar foco visible a navegación, player y chat ([W3C: indicador de foco](https://www.w3.org/WAI/WCAG22/Techniques/general/G195)); evitar ondas/parallax continuos y respetar `prefers-reduced-motion` ([W3C C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)).

## Decisiones que faltan antes de producción

- Obtener la versión de mayor resolución o vectorial del logo; revisar el redibujo del pez con el propietario.
- Confirmar URL, formato y política de inserción de la transmisión; con ello probar audio en móvil y navegadores principales.
- Crear el chat nuevo si se perdió la cuenta anterior y verificar si el servicio permite el dominio final; su identidad se puede integrar como panel, no rehacer su sistema.
- Verificar horarios y contactos; conseguir fotografías locales propias o con permiso. El diseño A funciona inicialmente sin fotografía, con color y tipografía como base.

### Evaluación del logo adjunto

El PNG mide aproximadamente 300 × 133 px. Las letras pequeñas de «Emisora Rinconada Stereo» se ven pixeladas incluso a escala natural; usarlo grande en el hero o en pantallas de alta densidad ampliaría ese defecto. Para la primera versión puede aparecer contenido a unos 140–150 CSS px de ancho sobre azul. Para una marca grande conviene localizar el archivo maestro o redibujar **manualmente** letras y pez en vector, con revisión del propietario; un autocalco del PNG deformaría detalles. En móvil, si la leyenda pequeña queda ilegible, añadir el nombre en texto HTML junto al símbolo en vez de agrandar el bitmap.


