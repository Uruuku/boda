// Este archivo NO hace falta tocarlo. Comprueba la contraseña del modo admin
// (la que pongas en ADMIN_PASSWORD dentro de .env.local).

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Si ADMIN_PASSWORD no estuviera configurada, una comparación directa
    // aceptaría un cuerpo sin `password` (undefined === undefined) y daría acceso.
    const esperada = process.env.ADMIN_PASSWORD;
    if (!esperada) {
      console.error('ADMIN_PASSWORD no está configurada: se deniega todo acceso admin.');
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    if (typeof password === 'string' && password.length > 0 && password === esperada) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
