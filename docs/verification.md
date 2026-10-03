# Verificaciones del proyecto

Un resultado de `npm test` significa que pasaron las comprobaciones de `checks.cjs`. No demuestra que la UI conserve su geometría ni que CLS o LCP se mantengan.

## Alcance de cada comprobación

| Comprobación | Qué cubre | Qué no cubre |
| --- | --- | --- |
| `npm test` / `node checks.cjs` | Comprobaciones de fuentes, CSS y comportamiento con simulaciones de DOM, audio y service worker | Renderizado real, captura visual, reproducción real, CLS, LCP |
| `git diff --check` | Errores de espacios del diff | Funcionamiento y apariencia |
| Chrome DevTools MCP | Renderizado de Chrome, estados de UI, dimensiones, consola, red y trazas de rendimiento | Otros motores de navegador, teléfonos físicos, experiencia de usuarios en producción |

Al comunicar resultados, indicar el comando o herramienta utilizado, perfiles, estado anterior comparado, número de muestras, métricas, evidencia y limitaciones. No describir comprobaciones simuladas como una prueba de navegador.

## Chrome DevTools MCP instalado

Registrado en la configuración global de Codex como `chrome-devtools`, con la versión oficial 1.10.1:

```powershell
codex mcp add chrome-devtools -- npx.cmd -y chrome-devtools-mcp@1.10.1 --headless --isolated --no-usage-statistics --no-performance-crux
codex mcp get chrome-devtools
```

El servidor utiliza Chrome aislado. Las estadísticas del MCP y las consultas CrUX están desactivadas. La instalación se comprobó con una negociación MCP `initialize`, listado de herramientas y apertura de una página mediante `new_page`; no basta con tener una entrada en el archivo de configuración.

Para utilizarlo en esta sesión, se llamó al servidor por stdio desde un cliente MCP local. La sesión no incorporó nuevas herramientas a su catálogo después de la instalación. El cliente anuncia la raíz del proyecto mediante `roots/list` y guarda las invocaciones completas, incluidas las respuestas de DevTools.

Fuentes de configuración: [Chrome DevTools MCP oficial](https://github.com/ChromeDevTools/chrome-devtools-mcp), [registro de servidores en Codex](https://developers.openai.com/learn/docs-mcp).

## Repetir la comparación de los iconos de WhatsApp

Desde la raíz del proyecto, con Node, npm y Chrome instalados:

```powershell
npm install --prefix screenshots/devtools-tools --no-save --package-lock=false chrome-devtools-mcp@1.10.1
node scripts/verify-whatsapp-ui.cjs --runs=3 --baseline=86b91a9d6fec696bde39262c9f87536d96a54767
node scripts/summarize-whatsapp-ui.cjs
```

Estos comandos no agregan dependencias al sitio. `screenshots/` está ignorado en Git. No despliegan cambios, no inician reproducción de radio y no envían mensajes al chat.

El script sirve dos variantes locales: `index.html` y `styles.css` del commit indicado para «before» y los archivos de trabajo para «after». Ambos usan los mismos recursos y JavaScript del árbol de trabajo; esta comparación aísla el cambio de iconos y sus estilos. Para otro cambio, revisar qué archivos deben formar parte del estado anterior.

- Escritorio: 1440 × 900; móvil emulado: 390 × 844, DPR 1 y eventos táctiles.
- Ambos temas, CPU ralentizada 4× y red Fast 4G de DevTools.
- Tres pares antes/después por perfil, alternando el orden en la segunda repetición.
- Contextos aislados por muestra y archivos locales con `Cache-Control: no-store`.
- El servidor de prueba devuelve 404 para el service worker para excluir cachés previas. Ese error de consola es esperado en ambas variantes.
- Observación de carga durante al menos cinco segundos. Cbox, metadatos y clima utilizan sus servicios reales; pueden variar entre muestras.
- `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `evaluate_script`, `take_snapshot`, `take_screenshot`, `hover`, herramientas de consola y red.
- Capturas del estado inicial, el botón principal al pasar el cursor, el reproductor flotante al desplazarse y su botón al pasar el cursor, en la primera muestra de cada variante y perfil.
- Comparación de cajas de los componentes medidos, desbordamiento horizontal, colores blanco/negro, visibilidad del reproductor y conservación del emoji del chat.

`summarize-whatsapp-ui.cjs` comprueba que estén completas las muestras, valida los estados de los iconos y del chat, y señala diferencias de geometría superiores a 0,1 px. El análisis de LCP se comunica con medianas y rangos; el script no convierte variaciones de laboratorio en una garantía sobre producción.

## Interpretar CLS y LCP

El `PerformanceObserver` de la página principal no ve los desplazamientos dentro de un iframe de otro origen. Por eso se registran por separado CLS de la página principal y CLS de la traza de Chrome, que incluye frames secundarios. Un CLS de cero en la página principal no permite afirmar que todo el documento tenga CLS cero.

Las trazas guardan los eventos `LayoutShift` y su indicador `is_main_frame`; los análisis `CLSCulprits` ayudan a localizar los responsables. LCP se registra antes de hover o scroll, porque una interacción puede finalizar su observación. Las mediciones se realizan antes de inspeccionar estados de los botones.

Estas son mediciones de laboratorio en localhost, con Chrome headless y carga ralentizada. No incluyen la latencia de Cloudflare, caché real del service worker, distribución geográfica ni el percentil 75 de usuarios reales. La red de terceros sigue siendo variable. No presentar estos resultados como un Core Web Vitals de producción.

Resultados del cambio de WhatsApp: [informe](verification-whatsapp.md).
