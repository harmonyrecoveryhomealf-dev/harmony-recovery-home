# Harmony Recovery Home — Stripe Checkout integration

## Qué es esto
Esta carpeta es tu sitio web completo (`index.html`) más un pequeño backend
(`/api`) que crea y confirma pagos de depósito con Stripe. La clave secreta
de Stripe (`STRIPE_SECRET_KEY`) solo vive en el servidor, nunca en el HTML
que ve el visitante.

Esto **no puede correr dentro del enlace de claude.ai** donde tienes la
página ahora, porque ese enlace solo sirve una página estática, sin
servidor propio ni variables de entorno. Por eso este paquete está armado
para desplegarse en **Vercel** (gratis, y es quien te da el servidor y el
lugar para guardar las claves).

## Paso 1 — Crea el proyecto en Vercel
1. Entra a vercel.com y crea una cuenta (puedes usar tu correo de Google).
2. En el dashboard, elige "Add New… → Project".
3. Sube esta carpeta completa (arrástrala) o conéctala desde un repositorio
   de GitHub si prefieres tenerla ahí primero.
4. Deja la configuración por defecto — Vercel detecta solo la carpeta
   `/api` y crea las funciones automáticamente.

## Paso 2 — Pon tus claves de Stripe
En el proyecto ya creado en Vercel:
**Settings → Environment Variables → Add New**

Agrega, una por una (marca las tres casillas Production, Preview y
Development en cada una):

| Nombre | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | tu clave secreta de Stripe (empieza con `sk_test_…` en modo prueba, `sk_live_…` en modo real) |
| `STRIPE_PUBLISHABLE_KEY` | tu clave pública (`pk_test_…` o `pk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | la generas en el Paso 4 |
| `DEPOSIT_AMOUNT_CENTS` | el monto de tu depósito, en centavos. Ejemplo: `15000` = $150.00 |

Encuentras tus claves de Stripe en el Dashboard de Stripe → Developers →
API keys. **Nunca las escribas dentro del código ni las compartas.**

Después de agregar o cambiar una variable, tienes que volver a desplegar
("Redeploy") para que el cambio se aplique.

## Paso 3 — Despliega
Botón "Deploy" en Vercel. Te da una dirección como
`https://harmony-recovery-home.vercel.app`. Esa es tu página real ya con
el pago funcionando.

## Paso 4 — Configura el webhook en Stripe
1. Stripe Dashboard → Developers → Webhooks → "Add endpoint".
2. URL del endpoint: `https://TU-DOMINIO/api/webhook`
3. Evento a escuchar: `checkout.session.completed`
4. Al crearlo, Stripe te da un "Signing secret" (`whsec_...`). Cópialo y
   agrégalo en Vercel como `STRIPE_WEBHOOK_SECRET` (Paso 2), y vuelve a
   desplegar.

## Paso 5 — Prueba en modo de prueba (Test Mode)
Con las claves `sk_test_…` / `pk_test_…` puestas, ve a tu página, llena el
formulario de reservación y toca "Pay deposit". Usa una tarjeta de prueba
de Stripe, por ejemplo:
- Número: `4242 4242 4242 4242`
- Fecha: cualquier fecha futura
- CVC: cualquier 3 dígitos

Si el pago se completa, deberías ver la página `success.html` y el pago
aparecer en Stripe Dashboard → Payments (en modo prueba).

## Paso 6 — Pasar a modo real (Live Mode)
Cuando todo funcione en modo prueba:
1. En Stripe, activa tu cuenta para pagos reales si no lo has hecho.
2. En Vercel, reemplaza los valores de `STRIPE_SECRET_KEY` y
   `STRIPE_PUBLISHABLE_KEY` por tus claves que empiezan con `sk_live_` y
   `pk_live_`.
3. Crea un webhook nuevo en Stripe apuntando a la misma URL, pero en modo
   Live (Stripe maneja modo prueba y modo real por separado), y actualiza
   `STRIPE_WEBHOOK_SECRET` con el nuevo valor.
4. Vuelve a desplegar.

No hay que tocar ni una línea de código para pasar de prueba a real: solo
cambias los valores de las variables de entorno.

## Cómo funciona el botón "Pay deposit"
El botón ya existente en tu página, en la sección de Reserve, ahora hace
esto al tocarlo:
1. Revisa que el formulario de reservación (nombre, correo, fechas) esté
   completo.
2. Le pide a `/api/create-checkout-session` que cree una sesión de pago,
   enviándole el nombre, correo y fechas.
3. El servidor decide el monto a cobrar usando `DEPOSIT_AMOUNT_CENTS` — el
   visitante nunca puede cambiar cuánto se le cobra.
4. Redirige al visitante a la página de pago segura de Stripe.
5. Al terminar, Stripe lo regresa a `success.html` o a `cancel.html`.

## Dónde queda guardada la información de la reservación
Stripe guarda, junto con cada pago, el nombre, el teléfono y las fechas
que mandó el formulario (los ves en Stripe Dashboard → Payments → el pago
→ "Metadata"). Como esta página no tiene una base de datos propia, ese es
el registro permanente del pago. Si más adelante quieres que además te
llegue un correo automático o se guarde en una hoja de cálculo, se puede
agregar, pero necesitaría un servicio más (por ejemplo, un servicio de
correo como Resend) — avísame cuando quieras ese paso.

## Lo que falta que me digas
- **El monto del depósito** (para poner en `DEPOSIT_AMOUNT_CENTS`). No lo
  inventé porque es una decisión de negocio tuya.
- Si quieres que el dominio final sea uno propio (por ejemplo
  harmonyrecoveryhome.com) en vez de el `…vercel.app` que te da Vercel:
  eso se conecta en Vercel → Settings → Domains, una vez que compres el
  dominio.
