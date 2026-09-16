# ✅ Guía paso a paso — qué tienes que hacer

Esta es la lista de tareas, en orden. Ve marcando las casillas. Si te pierdes en alguna,
en el `README.md` está todo explicado con más detalle.

> **Truco:** en el código, todos los sitios que puedes cambiar están marcados con el texto
> `>>> CAMBIAR AQUI <<<`. En VS Code pulsa **Ctrl + Shift + F**, escribe `CAMBIAR AQUI` y
> te saldrá la lista completa. Los que ponen **(opcional)** puedes saltártelos.
> Los archivos que empiezan por *"Este archivo NO hace falta tocarlo"*… no los toques 🙂

---

## 0. Antes de empezar: qué necesitas

- [ ] **Node.js** instalado (versión 20 o más): https://nodejs.org → botón verde "LTS".
- [ ] **Visual Studio Code** (o cualquier editor): https://code.visualstudio.com
- [ ] Una cuenta de **GitHub**: https://github.com (gratis).
- [ ] Una cuenta de **Vercel**: https://vercel.com → *Sign up* → *Continue with GitHub* (gratis).
- [ ] Un **Gmail** para recibir las fotos (puede ser el tuyo o el de tu hermana).

---

## 1. Abrir el proyecto

- [ ] Descomprime el ZIP en una carpeta (por ejemplo `Documentos/boda`).
- [ ] Abre VS Code → *File → Open Folder* → elige esa carpeta.
- [ ] Abre un terminal dentro de VS Code (*Terminal → New Terminal*) y ejecuta:
  ```bash
  npm install
  ```
  Tarda un par de minutos. Solo hay que hacerlo una vez.

---

## 2. Poner los nombres y la fecha

Archivo: **`src/config/boda.ts`** — es el único archivo importante.

- [ ] `nombres` → los nombres de la pareja. Ej: `'María & Carlos'`
- [ ] `fechaTexto` → la fecha escrita. Ej: `'Sábado, 20 de Junio de 2027'`
- [ ] `fechaHora` → para la cuenta atrás, en formato `'AÑO-MES-DIATHORA:MIN:SEG'`.
      Ej: 20 de junio de 2027 a las 18:30 → `'2027-06-20T18:30:00'`
- [ ] `url` → de momento déjalo; lo rellenarás en el paso 7.
- [ ] *(opcional)* `bienvenida`, `descripcion`, `nombreZip`.

Cambia solo lo que hay **entre comillas**. Guarda con Ctrl + S.

---

## 3. Poner las fotos

- [ ] Coge una foto de la pareja (mejor **cuadrada**, se ve en redondo), llámala
      **`pareja.jpg`** y **sustituye** la que hay en la carpeta **`public/`**.
- [ ] *(opcional)* La imagen que sale al compartir el enlace por WhatsApp es
      **`src/app/opengraph-image.jpg`** (1200 × 630 px). Sustitúyela con el mismo nombre
      o deja la que hay.
- [ ] *(opcional)* Colores: en `src/app/globals.css`, bloque marcado con `CAMBIAR AQUI`.

---

## 4. Contraseñas y correo (archivo `.env.local`)

- [ ] En la carpeta del proyecto hay un archivo **`.env.example`**. Cópialo y a la copia
      llámala exactamente **`.env.local`** (con el punto delante).
- [ ] Abre `.env.local` y rellena:
  - [ ] `ADMIN_PASSWORD` → la contraseña que quieras para el modo administrador.
  - [ ] `BLOB_READ_WRITE_TOKEN` → todavía no lo tienes; lo consigues en el paso 6.
  - [ ] `SMTP_USER` → el Gmail que **envía** los correos.
  - [ ] `SMTP_PASSWORD` → una **contraseña de aplicación** de ese Gmail (ver cuadro de abajo).
  - [ ] `DESTINATION_EMAIL` → el correo donde quieres **recibir** las fotos (puede ser el mismo).
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` → déjalos como están.

> **Cómo sacar la contraseña de aplicación de Gmail** (no vale la contraseña normal):
> 1. Entra en https://myaccount.google.com → **Seguridad**.
> 2. Activa la **Verificación en 2 pasos** si no la tienes.
> 3. En el buscador de arriba escribe **"Contraseñas de aplicaciones"** → entra → crea una
>    (nombre: "boda") → te da un código de 16 letras. Ese código es `SMTP_PASSWORD`.

---

## 5. Probar en tu ordenador

- [ ] En el terminal de VS Code:
  ```bash
  npm run dev
  ```
- [ ] Abre http://localhost:3000 en el navegador.
- [ ] Comprueba: salen los nombres, la fecha, la foto y la cuenta atrás.
- [ ] *(La subida de fotos aún no funcionará: falta el token de Vercel del paso 6. Normal.)*
- [ ] Para parar el servidor: en el terminal, Ctrl + C.

---

## 6. Publicar en internet (Vercel)

### 6a. Subir el código a GitHub

- [ ] En GitHub: **New repository** → nombre `boda` → **Private** → *Create*.
- [ ] En el terminal de VS Code (dentro de la carpeta del proyecto):
  ```bash
  git init
  git add .
  git commit -m "Web de la boda"
  git branch -M main
  git remote add origin https://github.com/TU_USUARIO/boda.git
  git push -u origin main
  ```
  (cambia `TU_USUARIO` por tu usuario de GitHub; la dirección exacta te la enseña GitHub
  al crear el repositorio). No te preocupes: `.env.local` **no** se sube, está protegido.

### 6b. Desplegar en Vercel

- [ ] En https://vercel.com → **Add New… → Project** → busca el repositorio `boda` → **Import** → **Deploy**.
- [ ] Espera a que termine (1–2 min). Te dará una dirección tipo `https://boda-xxxx.vercel.app`.

### 6c. Crear el almacén de fotos (Blob)

- [ ] Dentro del proyecto en Vercel: pestaña **Storage** → **Create Database** → **Blob** →
      *Create* → **Connect Project** (elige `boda`).
- [ ] Esto crea solo la variable `BLOB_READ_WRITE_TOKEN` en Vercel.
- [ ] En esa misma pantalla del Blob, pestaña **`.env.local`** → copia el token y pégalo en
      tu `.env.local` del ordenador (para que también funcione en local).

### 6d. Meter el resto de variables en Vercel

- [ ] Proyecto → **Settings → Environment Variables**. Añade, una por una, con el mismo
      nombre y valor que en tu `.env.local`:
  - [ ] `ADMIN_PASSWORD`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASSWORD`
  - [ ] `DESTINATION_EMAIL`
  - [ ] `SMTP_HOST` = `smtp.gmail.com`
  - [ ] `SMTP_PORT` = `465`
  - [ ] `SMTP_SECURE` = `true`
- [ ] Pestaña **Deployments** → los tres puntitos del último → **Redeploy** (para que coja
      las variables nuevas).

---

## 7. Poner la dirección definitiva

- [ ] Copia la dirección que te ha dado Vercel (`https://boda-xxxx.vercel.app`).
- [ ] Pégala en `src/config/boda.ts` → campo `url`.
- [ ] Sube el cambio:
  ```bash
  git add .
  git commit -m "Direccion de la web"
  git push
  ```
  Vercel lo publica solo en un minuto. (Cada vez que cambies algo, estos tres comandos.)

---

## 8. Probar de verdad desde el móvil

- [ ] Abre la dirección en el móvil.
- [ ] Pulsa **"¡Sube tus fotos!"**, elige 2 o 3 fotos, pon un nombre y envía.
- [ ] Debe salir confeti y las fotos deben aparecer en el **Muro de Recuerdos**.
- [ ] Mira el correo (`DESTINATION_EMAIL`): debe haber llegado un email con las fotos adjuntas.
- [ ] Toca **5 veces seguidas** el título "Muro de Recuerdos" → mete `ADMIN_PASSWORD` →
      borra las fotos de prueba con la papelera → cierra con el candado.

---

## 9. El día de la boda

- [ ] Haz un **código QR** con la dirección (por ejemplo en https://www.qr-code-generator.com)
      y ponlo en las mesas / en el photocall, o manda el enlace por el grupo de WhatsApp.
- [ ] No hace falta hacer nada más: la web se cuida sola.

## 10. Después de la boda

- [ ] Entra en modo admin (5 toques + contraseña) y pulsa el botón de **descarga**: te baja
      todas las fotos en uno o varios ZIP.
- [ ] Además las tienes todas en el correo, por si acaso.

---

### Si algo falla

| Problema | Solución |
|---|---|
| Al subir una foto sale error | Falta `BLOB_READ_WRITE_TOKEN` (paso 6c) o no has hecho *Redeploy* (6d). |
| No llega el correo | `SMTP_PASSWORD` tiene que ser la **contraseña de aplicación** de 16 letras, no la normal. Revisa que en Vercel estén las 7 variables. |
| No entra en modo admin | Comprueba `ADMIN_PASSWORD` en Vercel y haz *Redeploy*. |
| La cuenta atrás no sale | `fechaHora` mal escrita. Tiene que ser exactamente `'2027-06-20T18:30:00'` (con la T). |
| He cambiado algo y en la web no se ve | ¿Has hecho `git add .` + `git commit` + `git push`? Espera un minuto y recarga. |
