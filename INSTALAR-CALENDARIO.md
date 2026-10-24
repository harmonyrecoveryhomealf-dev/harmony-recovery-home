# Conectar la disponibilidad de Harmony

Estado: código preparado; NO instalado ni probado contra Google/Vercel en producción.
Este paquete cambia solo el calendario y la validación de fechas antes del depósito.

## 1. Permitir que el servidor lea la hoja privada (una sola vez)

1. En Google Cloud Console, crea o selecciona un proyecto y habilita Google Sheets API.
2. En IAM y administración > Cuentas de servicio, crea una cuenta de servicio para Harmony. No necesita roles generales de acceso al proyecto ni delegación de todo el dominio.
3. En esa cuenta, Claves > Agregar clave > Crear nueva clave > JSON. Guárdala de forma privada: NO la subas a GitHub ni la pegues en este chat.
4. Copia el correo de la cuenta de servicio (termina en iam.gserviceaccount.com).
5. En tu Google Sheet, Compartir: agrega SOLO ese correo como Lector. La hoja permanece restringida. La cuenta puede leer el archivo, por lo que conviene reservar esta hoja exclusivamente para disponibilidad; el código solo solicita A:B y no publica las notas.

Referencia oficial: https://developers.google.com/identity/protocols/oauth2/service-account

## 2. Configurar Vercel (antes de publicar)

En harmony-recovery-v2-2 > Settings > Environment Variables, crea para Production:

- GOOGLE_SERVICE_ACCOUNT_JSON: contenido completo del archivo JSON privado. Trátalo como secreto.
- GOOGLE_SHEET_ID: 1q9RYxU-LKcNgNycXgl5wIRJmLZyWS1GMFcJ_rOh3E5g
- GOOGLE_SHEET_RANGE: Sheet1!A2:B1000

No cambies las variables existentes de Stripe. No subas el JSON privado al repositorio.
Si no completas estos pasos, la nueva versión NO permitirá reservas/pagos porque no puede verificar las fechas.

## 3. Subir los archivos a GitHub

Descomprime este ZIP. En harmonyrecoveryhomealf-dev/harmony-recovery-home, rama main,
usa Add file > Upload files y arrastra JUNTOS:

- index.html (reemplaza el original)
- api (incluye availability.js y create-checkout-session.js)
- lib (incluye availability.js)

Conserva las carpetas api y lib. No borres otros archivos del repositorio.
Guarda con Commit changes. El proyecto conectado de Vercel debe desplegar la nueva versión.
Si el repositorio cambió desde el commit dec708cdf8b30c9bd40811d89c78d072ddf536a6,
no sobrescribas index.html: primero integra estos cambios con la versión nueva.

## 4. Verificar antes de aceptar reservas

1. Espera que el despliegue de Vercel muestre Ready.
2. Abre la sección Reserve. Debe decir Availability updated / Disponibilidad actualizada.
3. Con los datos actuales, 23 de octubre a 23 de noviembre de 2026 deben estar bloqueados, ambos incluidos.
4. Cambia un período de prueba en la hoja y vuelve a cargar la web. Comprueba que cambie.
5. Restablece las fechas reales. Nunca hagas un pago real para probar la conexión.
6. Si dice que no pudo verificar fechas, comprueba permisos del correo de servicio, API habilitada, variables y nombre Sheet1.

## Uso habitual

A = Desde; B = Hasta. Usa fechas reales de Sheets con formato MM/DD/YYYY o texto YYYY-MM-DD.
Cada fila es un período bloqueado, incluidos el primer y último día.
Para reabrir un período, borra AMBAS fechas de esa fila. No dejes solo una fecha.
C = Nota, no afecta al calendario y no se solicita desde el servidor.
La página consulta al abrirla, cada 60 segundos, al volver a ella y antes del pago.
No garantiza actualización instantánea ni reserva automática de cupos.

IMPORTANTE: este cambio lee bloqueos manuales; no escribe las reservas pagadas en Sheets.
Las reservas nuevas deben añadirse a la hoja. No resuelve por sí solo reservas simultáneas.
Si falla Google o hay fechas inválidas, deja de permitir seleccionar/pagar hasta verificar disponibilidad.

## Revertir

En Vercel se puede volver al despliegue anterior. Ese despliegue anterior no lee la hoja.
