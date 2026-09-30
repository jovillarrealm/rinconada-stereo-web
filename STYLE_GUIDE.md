# Guía de estilo — Rinconada Stereo V1

Estado: guía operativa para la V1, 23 de septiembre de 2026. Dirección: **Señal del territorio**. Prioridad: carga rápida, después fuerza visual. Basada en el logo blanco adjunto, el azul de la web actual y la maqueta estática. Se aplica al sitio y al marco que rodea el nuevo Cbox; la apariencia interna del chat se configura en Cbox según lo que permita Free.

## Carácter e Identidad Institucional

La página debe sentirse como una radio cercana y actual: clara, cálida, legible, con la señal al frente y referencias sobrias al territorio. Usar una composición editorial de aire amplio, títulos expresivos y pocos elementos fuertes. Evitar fondos fotográficos genéricos, ondas animadas permanentes, tarjetas decorativas repetidas y efectos que retrasen el primer render.

### Política de Identidad y Terminología (Regla del Proyecto)
- **Definición oficial:** Rinconada Stereo es una **radio en línea / emisora en directo**, hecha *de la comunidad para la comunidad*, que celebra la música de acordeón, la memoria viva y la cultura ribereña desde La Pacha, Magdalena.
- **Regla estricta:** **NO es una «emisora comunitaria»**. En Colombia, la denominación «emisora comunitaria» corresponde a una figura jurídica y concesión de radiodifusión sonora en frecuencia modulada (FM) otorgada por el Ministerio de Tecnologías de la Información y las Comunicaciones (MinTIC), categoría que no aplica a esta estación digital.
- **Principio de Marketing («Show, don't tell»):** Evitar rótulos institucionales o burocráticos como «de interés social». El valor y la vocación comunitaria se demuestran a través de la cercanía con la gente, los saludos a los corregimientos, la música autóctona y el encuentro con el territorio ribereño.
- **Términos aprobados:** «Radio en línea», «emisora en vivo», «señal digital», «encuentro con tu región», «la voz de la ciénaga», «música y encuentro».
- **Términos prohibidos:** «Emisora comunitaria», «radio comunitaria», «de interés social» (como descriptor o eslogan). Queda terminantemente prohibido su uso en el código, comentarios, metadatos, textos o material gráfico.

## Tokens visuales

### Paleta diurna (Modo claro por defecto)
| Uso | Valor | Regla |
| --- | --- | --- |
| Azul de marca | `#3676CE` | Cabecera, acción principal, acento del chat si está disponible. |
| Azul profundo | `#123663` | Texto o fondo de alto contraste; sección de contacto y marco oscuro. |
| Tinta | `#172D49` | Texto sobre superficies claras. |
| Marfil | `#F8F5ED` | Fondo de lectura del sitio. |
| Blanco | `#FFFFFF` | Superficie de controles, tarjetas y conversación. |
| Línea | `#D7DEEA` | Separaciones discretas. |
| Amarillo cálido | `#F2CE6C` | Acento puntual, foco y grafismo; evitar como texto pequeño sobre marfil. |
| Coral de estado | `#EF704F` | Indicador «en vivo» con etiqueta textual; no usar el color como único aviso. |

### Paleta nocturna (Modo oscuro / Noche en la Ciénaga)
| Uso | Valor | Regla |
| --- | --- | --- |
| Fondo noche | `#071526` | Superficie general en modo oscuro; emula la noche sobre la ciénaga. |
| Tarjetas noche | `#0D2C59` a `#081E3E` | Degradado profundo de alta legibilidad para reproductor, chat y blogs. |
| Tinta clara | `#E4EDF8` | Texto principal de lectura nocturna (contraste > 14:1 con fondo). |
| Bajada / Secundaria | `#ADC2DB` | Textos secundarios y descripciones (contraste > 10:1). |
| Línea noche | `#1B375B` | Bordes y separadores sutiles de componentes. |
| Azul acento noche | `#4D93F7` | Énfasis en títulos `em`, ondas del agua y enlaces activos. |
| Coral / Rojo en vivo | `#FF0D0F` / `#EF704F` | Indicador de señal en directo permanente de alto impacto. |
| Amarillo foco | `#FFD000` / `#F2CE6C` | Foco de accesibilidad, detalles de tema y barras de ecualizador. |

No introducir otro color saturado en la V1. El texto blanco sobre azul de marca se reserva para elementos legibles; comprobar contraste cuando cambie el tono.

## Tipografía, logo y composición

- Fuente sans del sistema/Arial/Helvetica para interfaz y cuerpo; Georgia en cursiva solo como contraste expresivo en titulares. Sin descargar webfonts en la carga inicial.
- Titulares grandes y breves; cuerpo de lectura cómodo, alrededor de 16–20 px según contexto, con interlineado generoso. Evitar texto espaciado en párrafos; el tracking amplio es solo para rótulos cortos.
- Logo blanco íntegro sobre azul. PNG contenido en cabecera; no ampliarlo hasta conseguir maestro o vector. El pez puede aparecer como signo secundario una vez redibujado y aprobado, sin reemplazar el logo principal.
- Ancho máximo de contenido cercano a 1180 px, margen móvil de al menos 18–20 px. Ritmo de espaciado basado en múltiplos de 8 px. Tarjetas con radio moderado (aprox. 16 px); acciones principales tipo píldora, alto táctil mínimo de 44 px.
- En móvil, primero escucha y chat integrado, luego programación con el pronóstico compacto y contacto. Un acceso al chat y otro al audio permanecen localizables desde cualquier sección.
- Sin movimiento continuo; respetar `prefers-reduced-motion`. Foco visible y controles con nombre accesible.

## Componentes de Interfaz y Audio UX

### 1. Cabecera y Conmutador de Tema (Modo Claro / Modo Oscuro)
- La cabecera mantiene el logo centrado y la navegación principal (`Inicio`, `Blogs`, `Contacto`) limpia y equilibrada.
- El botón conmutador de tema (`#theme-toggle`) se sitúa como utilidad en la esquina superior derecha (`top: 1rem; right: 1.5rem` o dentro de una barra de utilidades dedicada), de modo que nunca interrumpa el flujo ni desplace visualmente los enlaces de navegación.
- Cumple con una zona táctil mínima de 44×44 px, íconos SVG nítidos de Sol/Luna y foco con anillo `--yellow`.
- Prevención de parpadeo (anti-FOUC) mediante script inicial síncrono y persistencia en `localStorage.getItem('rinconada_theme')`.

### 2. Mini-reproductor Flotante Persistente (*Sticky Bottom Player*)
- Barra fija al fondo de la pantalla (`position: fixed; bottom: 0; left: 0; right: 0; z-index: 900`).
- Aparece suavemente al hacer scroll cuando los controles superiores del `#reproductor` salen del viewport, y desaparece de inmediato al volver a la zona de escucha.
- Altura ultra-compacta y elegante (aprox. 54–60 px), con fondo desenfocado (`backdrop-filter: blur(14px)`), borde superior con luz suave y acolchado de seguridad móvil (`env(safe-area-inset-bottom)`).
- Componentes esenciales:
  - Botón Play/Pause accesible y sincronizado en tiempo real con el reproductor principal.
  - Indicador de estado sincronizado: azul sutil en reposo/pausa, verde esmeralda con pulso en vivo (`● En directo`) durante la reproducción, amarillo en conexión y rojo únicamente ante fallos de red reales (eliminando falsas impresiones de fallo de carga).
  - Título de la canción sonando con tipografía nítida y elipsis.
  - Control de volumen compacto (botón mute y mini-slider sincronizados bidireccionalmente con el reproductor principal y `localStorage`).
  - Acceso directo a dedicatoria por WhatsApp con el tema actual pre-rellenado.
  - Botón de retorno al reproductor principal («↑») con desplazamiento suave asistido.

### 3. Temporizador de Apagado (*Sleep Timer*)
- Selector de cuenta regresiva integrado con opciones estándar (15, 30, 45, 60 minutos y desactivar).
- Muestra el tiempo restante de forma no invasiva.
- Durante los últimos 30 segundos, ejecuta un desvanecimiento suave (*fade-out*) del volumen antes de pausar la reproducción, protegiendo el descanso del oyente. Al finalizar, restaura el nivel de volumen guardado.

### 4. Memoria Persistente de Volumen
- Guarda y restaura de forma transparente el nivel de volumen (`rinconada_volume`) y estado de silencio (`rinconada_muted`) en `localStorage`.

### 5. Historial de Temas Recientes («Recién sonadas»)
- Lista colapsable accesible que almacena en memoria/sesión hasta las últimas 5 canciones detectadas en la transmisión con su hora local, permitiendo al oyente identificar temas que sonaron previamente.

### 6. Dedicatoria y Compartir por WhatsApp
- Botón directo que sincroniza el título en emisión y genera un enlace `wa.me` con mensaje formateado para enviar saludos o pedir la canción a cabina.

## Chat: traducción visual de la guía a Cbox Free

La sala nueva ya existe en https://www3.cbox.ws/box/?boxid=3560755&boxtag=BrdrSs. Se muestra junto al audio en un único iframe de carga diferida; los enlaces «Conversar» llevan a ese bloque. El CSS del sitio controla la tarjeta exterior, no el contenido del iframe de otro origen.

| Lugar | Configuración objetivo |
| --- | --- |
| Sitio, fuera del iframe | Tarjeta blanca junto al reproductor en escritorio y debajo de él en móvil; título «Chat en vivo», esquinas de 16 px y enlace «Abrir el chat en otra pestaña». El iframe no tapa el audio. |
| Cbox → aspecto | En la cuenta que controla esta sala, usar fondo azul profundo `#123663`, texto blanco, barra/acento `#3676CE` y fuente sans legible. Evitar imágenes de fondo, texto diminuto y exceso de colores. Registrar los nombres reales de los controles una vez se entre al panel. |
| Cbox → Publish | Confirmar que el código generado corresponde al `boxid=3560755` y que carga correctamente bajo `github.io` y, después, bajo el dominio propio. Mantener la URL directa como respaldo. |
| Cbox → seguridad | Confirmar acceso administrativo y configurar filtros básicos del plan Free. Si se necesita borrar o bloquear mensajes manualmente, decidir un plan que incluya moderación antes de prometer esa función. |

La [tabla oficial de Cbox](https://www.cbox.ws/products) indica que Free permite cambiar **colores y fuentes**, pero incluye marca/anuncios; CSS personalizado y moderación manual corresponden a planes pagos. La [ayuda de inserción](https://www.cbox.ws/help?id=24) recomienda tomar el código de **Publish** y ofrece un enlace directo a la sala. No se contratará un plan pago solo por cosmética sin una decisión posterior.

## Comprobación visual antes de publicar

1. Ver portada y chat integrado a 390 px y en escritorio: audio y conversación quedan visibles en orden lógico, no hay desbordamiento horizontal y se puede escribir sin zoom incómodo.
2. Enviar mensajes desde dos invitados y revisar apodos, texto, campo de escritura, foco y colores reales del iframe. Comprobar qué anuncios o marca aparecen en Free.
3. Confirmar que el iframe de Cbox se carga al acercarse a la zona de escucha, sin bloquear el primer pantallazo, y que el enlace directo abre la misma sala.
4. Guardar captura de los ajustes aplicados en el panel Cbox y anotar quién conserva acceso administrativo.


