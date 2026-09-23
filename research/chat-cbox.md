> **Actualización:** se decidió usar un Cbox nuevo (`3560755`). Recuperar el Cbox antiguo ya no es requisito para la V1.

# Cbox de Rinconada Stereo: recuperación y reemplazo

Consulta realizada el 23 de septiembre de 2026. Fuentes: documentación y páginas oficiales de Cbox. La identificación `RinconadaStereo` y el ID `855607` proceden del código citado durante la conversación; no son, por sí solos, prueba de propiedad ni de acceso administrativo.

## Conclusión práctica

Antes de crear otra cuenta, vale la pena intentar recuperar la existente. El [artículo de recuperación de Cbox](https://www.cbox.ws/help?id=21) dice que se puede iniciar con el nombre de cuenta o el código de inserción, además del correo, y que el enlace se envía al correo registrado. La [página de recuperación actual](https://www.cbox.ws/forgotpword), sin embargo, solo muestra un campo rotulado «Email address». No hay base para afirmar que el ID `855607` por sí solo revele el correo o dé control. Si no se tiene acceso al correo, Cbox indica [contactar a soporte](https://www.cbox.ws/contact); su ayuda dice que **a veces** puede recuperar una cuenta, sin prometerlo.

## Paso a paso para el propietario

1. Revisar las bandejas propias que posiblemente se usaron para la emisora y buscar mensajes de `cbox.ws`, «Cbox», «RinconadaStereo» y `855607`. Revisar también spam y archivos. La [ayuda de Cbox](https://www.cbox.ws/help?id=28) recomienda verificar la carpeta de spam si no llega un correo esperado.
2. En [Password Recovery](https://www.cbox.ws/forgotpword), probar únicamente direcciones propias a las que aún se tenga acceso. Según [la ayuda](https://www.cbox.ws/help?id=21), el nombre de cuenta o el código de inserción también podrían servir como identificador; la interfaz publicada ahora pide correo. Si se prueban esos identificadores, comprobar si el formulario los acepta, sin suponer que cambiará el destinatario del enlace.
3. Si no se identifica el correo o ya no se controla, usar el [formulario oficial de contacto](https://www.cbox.ws/contact). Indicar el dominio controlado, la URL donde se muestra el chat, `RinconadaStereo` como nombre probable y `855607` como ID del código, y solicitar a Cbox que explique qué prueba de titularidad requiere. No compartir contraseñas. La [ayuda oficial](https://www.cbox.ws/help?id=21) indica que solo en algunas circunstancias recuperan una cuenta sin acceso al correo.
4. Si se recupera el acceso, abrir **Publish** y copiar el código actualizado; Cbox documenta que allí se obtiene el [código de inserción](https://www.cbox.ws/help?id=24). Confirmar que el código muestra el mismo chat y revisar el plan y la configuración del dominio antes de cambiar la web.
5. Si la recuperación no prospera, crear una cuenta nueva con un correo institucional controlado y documentado, desde el [registro oficial](https://www.cbox.ws/signup). Elegir un nombre nuevo si el anterior está ocupado; Cbox indica que cada chat necesita un [nombre de cuenta único](https://www.cbox.ws/help?id=43). Se sustituye entonces el código anterior por el nuevo en la web.

## Inserción en el dominio actual y en una prueba `github.io`

Cbox permite insertar un chat mediante su código de **Publish**. La documentación también explica cómo mostrar el mismo Cbox más de una vez en una página, ajustando los identificadores de frames de cada copia; esto respalda el uso en distintas zonas de una web, aunque cada inserción debe probarse. Véase [ayuda general, «Can I have more than one Cbox on a page?»](https://www.cbox.ws/help?all=1).

La variable crítica en otro dominio es la lista de sitios permitidos. Cbox explica que la opción **«Allow access only at this address»** puede mostrar «Private Cbox» al cargarlo desde una dirección distinta y que se corrige ampliando la dirección permitida o desactivando la opción; véase [ayuda sobre el error](https://www.cbox.ws/help.php?srch=code). Su [guía contra abuso](https://www.cbox.ws/help?id=57) identifica la *site whitelist* como función Premium/Pro. Si está activada para `rinconadastereo.com`, una prueba bajo `github.io` podría fallar. Sin acceso al panel no se puede conocer la configuración actual ni garantizar la inserción simultánea; conviene comprobarla en la prueba real.

## Si se crea un chat nuevo

- Será otra conversación y otra cuenta, con un nombre distinto si `RinconadaStereo` sigue ocupado. [Cbox: cuentas separadas](https://www.cbox.ws/help?id=43).
- No se transfieren automáticamente historial ni ajustes de un Cbox antiguo a uno nuevo, según la [guía de migración de Cbox](https://www.cbox.ws/help?id=93). Cbox tampoco permite [importar archivos de mensajes](https://www.cbox.ws/help?id=88) de vuelta a un chat. Por tanto, no hay base para prometer continuidad del historial.
- El chat antiguo puede seguir existiendo en su URL o en la web vieja mientras conserve allí su código; crear uno nuevo no transfiere ni elimina la cuenta anterior. Esto es una inferencia de que cada Cbox usa una [cuenta separada](https://www.cbox.ws/help?id=43) y requiere su [código propio de inserción](https://www.cbox.ws/help?id=24).
- El plan **Free** actual incluye marca y anuncios Cbox, historial público de 100 mensajes, 150 mensajes/día y 1.000 visitantes/día, según [Planes y precios](https://www.cbox.ws/products). La ayuda de Cbox aclara que superar los límites diarios no suspende automáticamente el chat, aunque una alta concurrencia puede provocar interrupciones; los mensajes más antiguos salen del historial público al llenar su capacidad. Véase [«What happens when my Cbox goes over its limits?»](https://www.cbox.ws/help?all=1).

## Preguntas pendientes para verificar con acceso al panel

Plan de la cuenta actual, identidad exacta de la cuenta, whitelist activa o no, código de inserción vigente y posibilidad de cargar el mismo chat en la URL de prueba. No se puede deducir ninguno de esos estados solo con la documentación pública.

