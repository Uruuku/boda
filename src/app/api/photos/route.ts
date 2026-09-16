// Este archivo NO hace falta tocarlo. Devuelve la lista de fotos del muro y
// permite borrarlas en modo admin. La contraseña se pone en .env.local (ADMIN_PASSWORD).

import { list, del, type ListBlobResult, type ListBlobResultBlob } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Comprueba la contraseña de administrador.
// Si ADMIN_PASSWORD no estuviera configurada en Vercel, la comparación directa
// `password !== process.env.ADMIN_PASSWORD` dejaría pasar un cuerpo sin campo
// `password` (undefined === undefined) y cualquiera podría borrar el muro.
function esAdmin(password: unknown): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) {
    console.error('ADMIN_PASSWORD no está configurada: se deniega todo acceso admin.');
    return false;
  }
  return typeof password === 'string' && password.length > 0 && password === esperada;
}

export async function GET() {
  try {
    // list() devuelve como mucho 1000 fotos por llamada. Sin recorrer el cursor,
    // a partir de la foto 1001 el muro dejaría de mostrar las nuevas.
    const todas: ListBlobResultBlob[] = [];
    let cursor: string | undefined = undefined;

    do {
      const respuesta: ListBlobResult = await list({ prefix: 'boda/', cursor, limit: 1000 });
      todas.push(...respuesta.blobs);
      cursor = respuesta.hasMore ? respuesta.cursor : undefined;
    } while (cursor);

    // Ordenar por fecha (más recientes primero)
    const sortedBlobs = todas.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    // Plan Hobby: list() cuenta como "operacion avanzada" y solo vienen 10.000
    // al mes. Con decenas de invitados refrescando el muro a la vez eso se agota
    // en una tarde, y pasarse deja Vercel Blob bloqueado 30 dias. Cacheando la
    // respuesta en el CDN, todos los invitados comparten una sola consulta cada
    // 20 segundos en lugar de hacer una cada uno.
    return NextResponse.json(sortedBlobs, {
      headers: {
        'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
      },
    });
  } catch (error) {
    console.error('Error al listar fotos:', error);
    return NextResponse.json({ error: 'No se pudieron cargar las fotos' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { url, password } = await request.json();

    if (!esAdmin(password)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!url) {
      return NextResponse.json({ error: 'URL no proporcionada' }, { status: 400 });
    }

    await del(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al borrar foto:', error);
    return NextResponse.json({ error: 'No se pudo borrar la foto' }, { status: 500 });
  }
}
