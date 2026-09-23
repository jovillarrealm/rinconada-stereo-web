# Peces bajo el reproductor — viabilidad

Fecha: 23 de septiembre de 2026. Decisión pendiente: aspecto final y grado de interacción.

## Referencia observada

La [página de GPT-6 Astra](https://openai.com/es-ES/index/gpt-6-astra/) expone en su interfaz accesible un campo estelar que se rota arrastrando o con las teclas de flecha. En el navegador de la investigación el área se veía negra y vacía. Por ello, la interacción está confirmada, pero no la apariencia renderizada ni si OpenAI la construyó con Canvas, WebGL, SVG u otra técnica. La propuesta para Rinconada toma la idea de un pequeño campo visual manipulable, sin intentar reproducir el recurso original.

## Encaje en Rinconada Stereo

El sitio ya usa HTML, CSS y JavaScript nativo, y puede publicarse en GitHub Pages. El espacio adecuado es debajo de la tarjeta del reproductor, dentro de la columna de escucha, sin cubrir los controles ni el chat. La cabecera y el logo principal siguen siendo la identidad; los peces son un motivo secundario. Conviene dibujar peces vectoriales nuevos, inspirados en la marca y revisables, porque el PNG del logo es pequeño.

| Opción | Resultado | Coste y límite |
| --- | --- | --- |
| SVG inline + CSS | Tres a cinco siluetas se desplazan lentamente en un área de unos 120–180 px de alto. Sin bibliotecas ni solicitudes de imágenes adicionales. | Evoca el efecto, pero no responde al arrastre. SVG escala sin perder nitidez y CSS permite animaciones. [MDN SVG](https://developer.mozilla.org/en-US/docs/Web/SVG), [MDN CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using). |
| SVG + JavaScript pequeño | El grupo de peces se mueve suavemente y gira al arrastrar o usar flechas; se puede probar con ratón, tacto y teclado. Sigue sin bibliotecas externas. | Es la opción más cercana a la interacción observada; requiere cuidar foco y gestos para no interferir con el audio ni el desplazamiento móvil. |
| Canvas 2D + JavaScript | Permite un cardumen con trayectorias y reacción más orgánicas. [MDN Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). | Más lógica y dibujo continuo. Usar [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), pausar fuera de pantalla con [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) y proporcionar una descripción/acceso equivalente, pues los peces dibujados no son nodos accesibles por sí mismos. |

## Recomendación

Sí es viable en GitHub Pages gratis: la animación corre en el navegador y no necesita servidor. Para conservar la prioridad de velocidad, empezar con SVG inline y CSS, con pocos peces, sin bibliotecas y sin descarga de video o modelo 3D. Si el rasgo importante de la referencia es poder girar el campo, sumar únicamente un controlador pequeño de arrastre y flechas al SVG. Reservar Canvas para cuando se apruebe un cardumen realmente orgánico y se mida que el efecto simple no alcanza.

El efecto debe conservar una composición estática cuando la persona solicita [movimiento reducido](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). Si es solo decorativo, ocultarlo del árbol accesible; si se hace manipulable, darle foco, nombre e instrucciones breves. Ninguna interacción debe ser necesaria para escuchar la radio.

## Prueba antes de incorporarlo

Hacer un prototipo acotado debajo del reproductor y revisar escritorio, teléfono, teclado y movimiento reducido. Comparar carga inicial y fluidez con la página actual, y comprobar que el control de audio y el chat siguen siendo más visibles que la animación.