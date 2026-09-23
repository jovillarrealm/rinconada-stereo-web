# Rinconada Stereo — maqueta estática

Stack: HTML, CSS y JavaScript nativo. No requiere npm, compilación ni servidor de aplicación. La portada y la escucha viven en una sola página; las secciones se enlazan con anclas.

## Ver localmente

Abrir `index.html` directamente o servir esta carpeta con cualquier servidor HTTP local. El control de audio usa una URL HTTPS de la señal detectada en el reproductor actual. El reproductor alternativo carga el proveedor original al abrir el detalle.

## Publicar primero en GitHub Pages

1. Crear un repositorio público, por ejemplo `rinconada-stereo-web`.
2. Subir los archivos de esta carpeta a la raíz de la rama `main`.
3. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch**. Seleccionar `main` y `/ (root)`, y guardar.
4. Abrir `https://USUARIO.github.io/rinconada-stereo-web/` y comprobar audio, chat, clima, navegación y móvil antes de tocar el DNS del dominio.

## Pendiente para publicar como sitio definitivo

- El Cbox nuevo está integrado en index.html, junto al reproductor y con carga diferida. Falta probar conversación real y confirmar acceso administrativo, filtros y aspecto de la sala.
- Probar la señal directa en navegadores y teléfonos reales. El navegador integrado usado durante la maqueta se cerró al intentar reproducirla; el reproductor original se conserva como alternativa.
- Confirmar programación y datos de contacto vigentes. Hasta entonces se muestra “En actualización”.
- Conseguir el logo maestro o vector para mejorar su nitidez. El PNG adjunto se muestra a tamaño contenido.
- El widget del clima se muestra discretamente dentro de Programación y usa un pronóstico regional de San Sebastián de Buenavista; no corresponde a una estación meteorológica ubicada en la ciénaga.

Investigación y fuentes: `research/stack-rinconada.md`, `research/diseno-rinconada.md`, `research/clima-rinconada.md`.

## Documentos del proyecto

- [Especificación](SPEC.md): alcance y criterios de aceptación.
- [Plan](PLAN.md): hitos, pruebas, publicación en GitHub Pages y reversión del dominio.

- [Guía de estilo](STYLE_GUIDE.md): identidad visual y configuración visual del Cbox nuevo.

