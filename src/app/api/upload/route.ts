// Este archivo NO hace falta tocarlo. Recibe las fotos, las guarda en Vercel Blob
// y manda el correo de respaldo. El correo se configura en .env.local, no aquí.

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { put } from '@vercel/blob';
import { BODA } from '@/config/boda';

export const maxDuration = 60;

// Quita tildes y eñes y deja solo caracteres seguros para la ruta del fichero.
// "Familia García Muñoz" -> "Familia_Garcia_Munoz"
function limpiarParaRuta(texto: string, maxLongitud: number) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, maxLongitud);
}

// El correo de respaldo es opcional: si no se han puesto las variables SMTP en
// .env.local / Vercel, la web funciona igual y las fotos solo van al muro.
const emailConfigurado = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.DESTINATION_EMAIL,
);

export async function POST(request: Request) {
  let files: File[] = [];
  let guestName = 'Anónimo';
  let message = '';
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  const blobUrls: string[] = [];
  let subidasAlMuro = 0;

  try {
    const formData = await request.formData();
    files = formData.getAll('files') as File[];
    guestName = (formData.get('guestName') as string) || 'Anónimo';
    message = (formData.get('message') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se encontraron archivos' }, { status: 400 });
    }

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Intentar subir al muro (Vercel Blob)
      try {
        const nombreSeguro = limpiarParaRuta(guestName, 40) || 'Invitado';
        const mensajeSeguro = limpiarParaRuta(message, 60);
        const ficheroSeguro = limpiarParaRuta(file.name.replace(/\.[^.]+$/, ''), 40) || 'foto';
        const extension = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || '.jpg').toLowerCase();
        const fileName = `boda/${Date.now()}---${nombreSeguro}---${mensajeSeguro}---${ficheroSeguro}${extension}`;

        const blob = await put(fileName, buffer, {
          access: 'public',
          addRandomSuffix: true,
        });
        blobUrls.push(blob.url);
        subidasAlMuro++;
      } catch (blobError) {
        console.error('Error subiendo a Vercel Blob (posible falta de espacio):', blobError);
        // No lanzamos el error: seguimos para que al menos salga el email
      }

      // Preparar para email (esto se hace siempre, haya espacio en el muro o no)
      attachments.push({
        filename: file.name,
        content: buffer,
        contentType: file.type,
      });
    }
  } catch (error) {
    // Si ni siquiera pudimos leer los ficheros no hay nada que salvar
    console.error('Error crítico leyendo los archivos:', error);
    return NextResponse.json({ error: 'Hubo un problema al procesar las fotos' }, { status: 500 });
  }

  const storageFull = subidasAlMuro === 0;

  // Enviar Email (respaldo). Va aislado: si el correo falla pero la foto ya está
  // en el muro, la subida NO debe darse por fallida o el invitado la repetiría.
  let emailEnviado = false;
  if (emailConfigurado) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        // Sin estos límites un Gmail lento dejaría al invitado esperando
        // hasta que Vercel corta la función (60 s) antes de darle una respuesta.
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 40000,
      });

      await transporter.sendMail({
        from: `"Boda ${BODA.nombres}" <${process.env.SMTP_USER}>`,
        to: process.env.DESTINATION_EMAIL,
        subject: `📸 ${storageFull ? '[SOLO EMAIL] ' : ''}Nuevas fotos de ${guestName}`,
        text: `¡Hola! ${guestName} ha subido ${files.length} fotos.\n\n` +
              `Mensaje: ${message || 'Sin mensaje'}\n\n` +
              (storageFull
                ? '⚠️ NOTA: El almacenamiento de la web está lleno. Estas fotos NO aparecerán en el muro, pero aquí las tienes a salvo.'
                : `Puedes verlas en la web o en los archivos adjuntos de este correo.\n\nURLs:\n${blobUrls.join('\n')}`),
        attachments: attachments,
      });
      emailEnviado = true;
    } catch (emailError) {
      console.error('Error enviando el email de respaldo:', emailError);
    }
  }

  // Solo es un fallo real si no se ha salvado la foto por ninguna de las dos vías.
  if (storageFull && !emailEnviado) {
    console.error('FALLO TOTAL: ni muro ni email. Fotos perdidas de:', guestName);
    return NextResponse.json({ error: 'Hubo un problema al procesar las fotos' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    storageFull,
    emailEnviado,
    message: storageFull ? 'Fotos enviadas por email (muro lleno)' : 'Fotos publicadas',
  });
}
