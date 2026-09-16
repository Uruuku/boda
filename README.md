# 💍 Web de fotos para una boda

> 👉 **¿Es la primera vez que abres esto?** Ve directo a **[GUIA-PASO-A-PASO.md](./GUIA-PASO-A-PASO.md)**:
> es una lista de tareas en orden con casillas para ir marcando. Este README es la
> explicación más detallada por si te atascas en algún punto.
>
> En el código, todo lo que puedes cambiar está marcado con `>>> CAMBIAR AQUI <<<`
> (búscalo con Ctrl + Shift + F en VS Code).

Una web para el móvil, sin registros ni descargas, donde los invitados suben sus fotos
y aparecen al momento en un **muro de recuerdos** que todos pueden ver.

**Qué incluye**

- Portada con la foto de la pareja, la fecha y una **cuenta atrás** hasta la boda.
- Botón grande **"¡Sube tus fotos!"**: el invitado elige las fotos de su galería, pone su
  nombre y un mensaje (opcionales) y listo. Confeti al terminar.
- Las fotos se comprimen en el móvil antes de enviarse (no gastan datos de más) y se
  mandan por tandas, así se puede subir el carrete entero sin que se corte.
- **Muro de recuerdos** con paginación, visor a pantalla completa (flechas, teclado y
  deslizar con el dedo) y refresco automático.
- **Modo administrador escondido** para borrar fotos subidas por error y descargar
  todo el muro en ZIP.
- **Copia de seguridad por correo**: cada vez que alguien sube fotos, llegan también
  adjuntas a un email (el que tú pongas). Si el muro se llena, siguen llegando por ahí.

**Con qué está hecho:** Next.js 16, React 19, Tailwind CSS 4 y Vercel Blob (almacén de
las fotos). Todo cabe en el plan gratuito de Vercel.

---

## 1. Personalizar la web (5 minutos)

Solo hay que tocar **dos cosas**:

### a) Los textos → `src/config/boda.ts`

Abre ese archivo y cambia lo que hay entre comillas:

```ts
nombres:    'Novia & Novio',                 // p. ej. 'María & Carlos'
fechaTexto: 'Sábado, 1 de Enero de 2027',    // la fecha tal cual saldrá escrita
fechaHora:  '2027-01-01T18:00:00',           // para la cuenta atrás: AÑO-MES-DIAThora
url:        'https://mi-boda.vercel.app',    // la dirección que te dé Vercel (paso 3)
bienvenida: '...',                           // texto debajo de la cuenta atrás
```

### b) Las fotos

- `public/pareja.jpg` → la foto de la pareja (sale en redondo en la portada; mejor cuadrada).
- `src/app/opengraph-image.jpg` → la imagen que sale al compartir el enlace por WhatsApp
  (1200×630 px). Si no quieres complicarte, deja la que hay o bórrala.

Los colores están en `src/app/globals.css` (`--color-wedding-sage`, `--color-wedding-gold`…).

---

## 2. Probarla en tu ordenador

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 20 o superior).

1. Copia el archivo `.env.example` y renómbralo a **`.env.local`**. Ábrelo y rellena:
   - `ADMIN_PASSWORD`: la contraseña que quieras para el modo administrador.
   - `BLOB_READ_WRITE_TOKEN`: se consigue en el paso 3 (sin él la web arranca, pero al
     subir una foto dará error).
   - `SMTP_USER`, `SMTP_PASSWORD` y `DESTINATION_EMAIL`: tu correo, para recibir las fotos
     (ver el apartado **Correo de respaldo** más abajo). Si lo dejas vacío, la web funciona
     igual pero sin email.
2. Abre un terminal en esta carpeta y ejecuta:

   ```bash
   npm install
   npm run dev
   ```

3. Entra en [http://localhost:3000](http://localhost:3000).
   *(Truco: pulsa F12 en el navegador y activa la vista de móvil para verla como los invitados).*

---

## 3. Publicarla en internet (gratis, con Vercel)

1. Sube esta carpeta a un repositorio de **GitHub** (sin la carpeta `node_modules`).
2. Entra en [vercel.com](https://vercel.com), crea una cuenta con GitHub y pulsa
   **Add New → Project** → elige el repositorio → **Deploy**.
3. Crea el almacén de fotos: en el proyecto de Vercel ve a **Storage → Create Database →
   Blob** y conéctalo al proyecto. Esto añade solo la variable `BLOB_READ_WRITE_TOKEN`.
   - Para usarla también en tu ordenador: en esa misma pantalla, pestaña **`.env.local`**,
     copia el token y pégalo en tu `.env.local`.
4. Añade el resto de variables en **Settings → Environment Variables** (una a una,
   igual que en tu `.env.local`):
   - `ADMIN_PASSWORD`
   - `SMTP_USER`, `SMTP_PASSWORD`, `DESTINATION_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
5. Ve a **Deployments** y pulsa **Redeploy** para que coja las variables.
6. Copia la dirección que te da Vercel (`https://loquesea.vercel.app`), pégala en `url`
   dentro de `src/config/boda.ts` y sube el cambio a GitHub (Vercel vuelve a publicar solo).

Comparte ese enlace con los invitados (o hazte un código QR con él para las mesas).

---

## 4. Correo de respaldo (tu Gmail)

Las fotos se guardan en Vercel, pero además puedes recibirlas por email para tenerlas a
salvo aunque el muro se llene. Con una cuenta de **Gmail**:

1. Entra en tu cuenta de Google → **Seguridad** → activa la **Verificación en 2 pasos**
   (si no la tienes ya).
2. En el buscador de la configuración de Google escribe **"Contraseñas de aplicaciones"**,
   crea una (ponle el nombre que quieras, p. ej. "boda") y copia el código de 16 letras.
3. En `.env.local` (y en Vercel):
   - `SMTP_USER` = tu Gmail (desde el que se envían los correos).
   - `SMTP_PASSWORD` = el código de 16 letras del paso 2 (**no** tu contraseña normal).
   - `DESTINATION_EMAIL` = el correo donde quieres recibir las fotos (puede ser el mismo).
   - `SMTP_HOST`, `SMTP_PORT` y `SMTP_SECURE` déjalos como están en `.env.example`.

Cada vez que un invitado suba fotos te llegará un email con su nombre, su mensaje y las
fotos adjuntas.

---

## 5. Modo administrador

Para que no lo vean los invitados, no hay ningún botón a la vista:

1. Toca **5 veces seguidas** el título **"Muro de Recuerdos"**.
2. Escribe la contraseña (`ADMIN_PASSWORD`).

Aparece una etiqueta roja **MODO ADMIN** y:
- Cada foto tiene una papelera para borrarla.
- Un botón de descarga baja **todas las fotos** en ZIP (en varios archivos si son muchas).
- El candado cierra el modo admin.

---

## Límites del plan gratuito de Vercel (para estar tranquilo)

- **Almacén Blob:** 1 GB. Cada foto se guarda a 2200 px (~0,5–1 MB), así que caben
  unos 1.000–2.000 momentos. Si se llena, las fotos nuevas dejan de salir en el muro pero
  **siguen llegando por correo** (si lo has configurado).
- Las fotos originales siempre se quedan en el móvil del invitado: la web no las borra.
- Después de la boda, entra en modo admin y descarga el ZIP para tener todas las fotos.
