# Guía de estilo — Rinconada Stereo V1

Estado: guía operativa para la V1, 23 de septiembre de 2026. Dirección: **Señal del territorio**. Prioridad: carga rápida, después fuerza visual. Basada en el logo blanco adjunto, el azul de la web actual y la maqueta estática. Se aplica al sitio y al marco que rodea el nuevo Cbox; la apariencia interna del chat se configura en Cbox según lo que permita Free.

## Carácter

La página debe sentirse como una radio cercana y actual: clara, cálida, legible, con la señal al frente y referencias sobrias al territorio. Usar una composición editorial de aire amplio, títulos expresivos y pocos elementos fuertes. Evitar fondos fotográficos genéricos, ondas animadas permanentes, tarjetas decorativas repetidas y efectos que retrasen el primer render.

## Tokens visuales

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

No introducir otro color saturado en la V1. El texto blanco sobre azul de marca se reserva para elementos legibles; comprobar contraste cuando cambie el tono.

## Tipografía, logo y composición

- Fuente sans del sistema/Arial/Helvetica para interfaz y cuerpo; Georgia en cursiva solo como contraste expresivo en titulares. Sin descargar webfonts en la carga inicial.
- Titulares grandes y breves; cuerpo de lectura cómodo, alrededor de 16–20 px según contexto, con interlineado generoso. Evitar texto espaciado en párrafos; el tracking amplio es solo para rótulos cortos.
- Logo blanco íntegro sobre azul. PNG contenido en cabecera; no ampliarlo hasta conseguir maestro o vector. El pez puede aparecer como signo secundario una vez redibujado y aprobado, sin reemplazar el logo principal.
- Ancho máximo de contenido cercano a 1180 px, margen móvil de al menos 18–20 px. Ritmo de espaciado basado en múltiplos de 8 px. Tarjetas con radio moderado (aprox. 16 px); acciones principales tipo píldora, alto táctil mínimo de 44 px.
- En móvil, primero escucha y chat integrado, luego programación con el pronóstico compacto y contacto. Un acceso al chat y otro al audio permanecen localizables desde cualquier sección.
- Sin movimiento continuo; respetar `prefers-reduced-motion`. Foco visible y controles con nombre accesible.

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

