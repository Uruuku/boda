// =====================================================================
//
//   >>> CAMBIAR AQUI <<<     CONFIGURACIÓN DE LA BODA
//
//   Este es el archivo MÁS IMPORTANTE. Todos los textos de la web salen
//   de aquí. Cambia lo que hay entre comillas y guarda (Ctrl + S).
//   No borres las comillas ni las comas.
//
// =====================================================================

export const BODA = {
  // >>> CAMBIAR AQUI <<<  Nombres de la pareja, tal cual saldrán en grande en la portada.
  // Ejemplo: 'María & Carlos'
  nombres: 'Marga y Eri',

  // >>> CAMBIAR AQUI <<<  La fecha escrita, tal cual se leerá encima de los nombres.
  // Ejemplo: 'Sábado, 20 de Junio de 2027'
  fechaTexto: 'Sábado, 19 de Septiembre de 2026',

  // >>> CAMBIAR AQUI <<<  Fecha y hora para la CUENTA ATRÁS.
  // Formato obligatorio: AÑO-MES-DIA T HORA:MINUTOS:SEGUNDOS  (sin espacios)
  // Ejemplo: boda el 20 de junio de 2027 a las 18:30  ->  '2027-06-20T18:30:00'
  // Cuando llegue ese momento la cuenta atrás desaparece sola.
  fechaHora: '2026-09-19T19:00:00',

  // >>> CAMBIAR AQUI <<<  Dirección de la web cuando ya esté publicada en Vercel.
  // Primero déjalo así; cuando Vercel te dé la dirección, la pegas aquí.
  // Sirve para que al compartir el enlace por WhatsApp salga la previsualización.
  url: 'https://mi-boda.vercel.app',

  // >>> CAMBIAR AQUI (opcional) <<<  Texto de bienvenida debajo de la cuenta atrás.
  bienvenida:
    '¡Gracias por acompañarnos en este día tan especial! Ayúdanos a capturar cada momento subiendo tus fotos aquí.',

  // >>> CAMBIAR AQUI (opcional) <<<  Descripción corta que sale al compartir el enlace.
  descripcion:
    'Ayúdanos a capturar cada momento de nuestra boda. Sube aquí tus fotos: sin registros, sin descargas.',

  // >>> CAMBIAR AQUI (opcional) <<<  Nombre del archivo ZIP al descargar todas las fotos
  // desde el modo admin. Ejemplo: 'fotos-boda-maria-y-carlos'
  nombreZip: 'fotos-boda',
};
