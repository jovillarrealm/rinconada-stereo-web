> **Decisión vigente (actualizada 23-sep-2026):** HTML/CSS/JS estático sin compiladores. Hero y reproductor unificados en el primer pantallazo (sin scroll). Canvas 2D nativo ultra ligero para el cardumen de peces antes de Programación. Componente de clima nativo con Open-Meteo (reemplaza Forecast7/WeatherWidget.io). Cbox Free (3560755) integrado sin botones redundantes ni enlaces a popups. Ver SPEC.md y PLAN.md.

# Stack para Rinconada Stereo V1

Fecha: 23 de septiembre de 2026. Prioridad acordada: rapidez de carga; después, calidad visual. Alcance: portada con escucha inmediata sin scroll, Cbox integrado en el primer pliegue, franja interactiva de peces en Canvas 2D, clima regional nativo vía Open-Meteo, programación estática y contacto.

## Recomendación

**HTML semántico + CSS propio + JavaScript nativo (~5 KB en total), sin frameworks, Canvas ni WebGL pesado.** Publicar los archivos estáticos de la V1 en GitHub Pages desde una rama. GitHub Pages acepta HTML, CSS y JavaScript directamente. [GitHub Pages: qué es](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

La ventaja es operativa: una sola página y pocas integraciones no requieren Node, dependencias ni pipeline. **No hay una ventaja automática de velocidad frente a Astro o Eleventy si los tres publican los mismos bytes**: los tres entregan HTML estático y pueden enviar cero JavaScript de framework. La velocidad real dependerá del peso de imágenes, fuentes y widgets externos. Esto es una inferencia arquitectónica basada en que Astro prerenderiza HTML estático y sus componentes no añaden JavaScript al navegador por defecto; Eleventy también envía cero JavaScript de cliente por defecto. [Astro: renderizado](https://docs.astro.build/en/guides/on-demand-rendering/), [Astro: componentes](https://docs.astro.build/en/basics/astro-components/), [Eleventy: navegación y JS](https://www.11ty.dev/docs/single-page-applications/).

La calidad visual puede resolverse con diseño CSS: jerarquía tipográfica, espaciado, composición adaptable y el azul `#3676CE`. Ningún generador produce esa calidad por sí solo. Para la V1 conviene usar el logo PNG a su tamaño de presentación y una fuente del sistema: las fuentes descargadas agregan datos y pueden demorar el texto, mientras las imágenes demasiado grandes desperdician bytes. [web.dev: fuentes](https://web.dev/learn/performance/optimize-web-fonts), [web.dev: imágenes](https://web.dev/learn/performance/image-performance).

## Comparación para este alcance

| Opción | HTML y JS enviados | GitHub Pages y mantenimiento | Escritos futuros | Veredicto |
| --- | --- | --- | --- | --- |
| **HTML/CSS/JS sin build** | El HTML está listo para mostrar; solo se envía el JS que se escriba para chat o controles. | Archivos directos en una rama; sin dependencias ni build. | Una cantidad pequeña se puede agregar como páginas HTML; un archivo de escritos repetitivo exigiría plantillas o migración. | **Elegir para V1** por simplicidad y control de recursos. |
| **Astro estático** | Prerenderiza HTML; los componentes `.astro` no añaden runtime de cliente por defecto. CSS se procesa en la compilación. | Requiere Node, dependencias y un workflow de Actions. En una URL de proyecto `github.io/<repo>/` se configura `base`. | Soporta Markdown y colecciones de contenido para una sección editorial. | Cambiar cuando haya un archivo real de escritos, layouts repetidos o muchas imágenes. |
| **Eleventy** | Genera páginas estáticas y no agrega JS de cliente por defecto. | Requiere Node y build/deploy de su carpeta de salida. | Convierte Markdown a HTML y ofrece plantillas; sería una alternativa ligera si se prioriza Markdown. | Válido, pero añade build sin beneficio claro hoy. |
| **Jekyll** | Genera HTML estático; el JS enviado depende de la plantilla. | Integración histórica con Pages, pero instala Ruby/Bundler para desarrollo local; GitHub recomienda Actions para la automatización. | Las publicaciones Markdown son parte central del producto. | Solo elegir si el equipo ya usa Jekyll/Ruby o quiere escribir directamente con su convención. |

Fuentes de la tabla: [GitHub Pages y ramas](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Astro: componentes](https://docs.astro.build/en/basics/astro-components/), [Astro: estilos](https://docs.astro.build/en/guides/styling/), [Astro: despliegue en Pages](https://docs.astro.build/en/guides/deploy/github/), [Astro: colecciones](https://docs.astro.build/en/guides/content-collections/), [Eleventy: JS de cliente](https://www.11ty.dev/docs/single-page-applications/), [Eleventy: inicio](https://www.11ty.dev/), [Jekyll: publicaciones](https://jekyllrb.com/docs/posts/), [GitHub: Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll).

## Decisiones que más afectan la carga

1. **Señal:** usar `<audio controls>` con la URL directa de audio si el proveedor ofrece una URL HTTPS reproducible en navegador. El elemento nativo incluye controles; evitar reproducción automática y probar la URL real en móvil. Si solo hay reproductor incrustado del proveedor, comparar su carga real con el control nativo antes de adoptarlo. [MDN: audio](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio), [MDN: autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
2. **Cbox Free (sala 3560755):** integrado junto al audio en el primer pliegue, con `loading="lazy"`. No requiere botones intermediarios de «Conversar» ni abre popups o pestañas externas.
3. **Clima nativo con Open-Meteo:** reemplaza el script externo y el iframe de Forecast7 / WeatherWidget.io por una llamada `fetch()` a la API abierta de Open-Meteo, con renderizado directo en el DOM mediante iconos SVG locales. Cero rastreadores, cero scripts de terceros y ajuste visual exacto al diseño del sitio.
4. **Pecesitos («La ciénaga interactiva») en Canvas 2D:** un script nativo ultraliviano (~2 KB) sin frameworks 3D. Controlado por `IntersectionObserver` para ejecutar `requestAnimationFrame` solo cuando el usuario tiene la franja a la vista, y desactivado por completo si `prefers-reduced-motion` está activo.
5. **Diseño:** CSS adaptable sin biblioteca de componentes, logo con dimensiones explícitas y texto alternativo, sin imagen decorativa pesada en la primera pantalla.
6. **Accesibilidad:** estructura HTML semántica, controles nativos, foco visible, nombres para botones e `iframe`, y uso completo con teclado.

## Cuándo cambiar

**Pasar a Astro estático** al aprobar una sección de escritos con varias entradas, una portada que las liste y plantillas o metadatos compartidos, o al incorporar muchas fotografías que convenga optimizar durante el build. Astro admite colecciones Markdown y optimización de imágenes en compilación; para Pages usa su Action y configuración de `base` en sitios de proyecto. Esto no exige rehacer el diseño HTML/CSS, aunque sí migrar las plantillas. [Astro: colecciones](https://docs.astro.build/en/guides/content-collections/), [Astro: imágenes](https://docs.astro.build/en/guides/images/), [Astro: Pages](https://docs.astro.build/en/guides/deploy/github/).

**No cambiar de stack solo para añadir más efecto visual.** Primero medir la portada en móvil y ajustar recursos. La estética se puede mejorar con CSS; la carga de los servicios externos será el límite más probable de la V1 (inferencia a verificar con el sitio ya montado). [web.dev: imágenes](https://web.dev/learn/performance/image-performance), [web.dev: carga diferida de iframes](https://web.dev/learn/performance/lazy-load-images-and-iframe-elements).

