import PhotoUploader from '@/components/PhotoUploader';
import Countdown from '@/components/Countdown';
import Gallery from '@/components/Gallery';
import Image from 'next/image';
import { BODA } from '@/config/boda';

// Este archivo NO hace falta tocarlo: los nombres, la fecha y los textos
// salen de src/config/boda.ts. Solo hay una cosa que cambiar, marcada abajo.

export default function Home() {
  return (
    <main className="min-h-screen bg-wedding-bg text-wedding-text relative pb-32">
      {/* Sección Hero */}
      <section className="flex flex-col items-center justify-center pt-16 px-6 text-center">
        {/* >>> CAMBIAR AQUI <<<
            La foto de la pareja es el ARCHIVO  public/pareja.jpg
            Sustituye ese archivo por la foto real (mismo nombre: pareja.jpg).
            Mejor si es cuadrada, porque se muestra en redondo.
            El código de abajo NO hay que tocarlo. */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-wedding-gold/20 scale-110"></div>
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl">
            <Image 
              src="/pareja.jpg" 
              alt={BODA.nombres} 
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <h2 className="text-wedding-gold tracking-widest uppercase text-sm font-semibold mb-3">
          {BODA.fechaTexto}
        </h2>
        <h1 className="text-5xl font-serif text-wedding-sage mb-6">
          {BODA.nombres}
        </h1>

        <Countdown />

        <p className="text-lg opacity-80 max-w-md mx-auto mt-6 mb-10 leading-relaxed">
          {BODA.bienvenida}
        </p>

        {/* >>> CAMBIAR AQUI (opcional) <<<  Cajita de instrucciones. Puedes cambiar
            el título "Cero complicaciones" y la frase de debajo si quieres. */}
        <div className="flex bg-white/60 shadow-sm rounded-2xl p-4 max-w-sm w-full text-left items-start gap-4 mb-16">
          <div className="bg-wedding-sage/10 p-3 rounded-full text-wedding-sage">
            📸
          </div>
          <div>
            <h3 className="font-semibold text-wedding-text">Cero complicaciones</h3>
            <p className="text-sm opacity-70 mt-1">
              Selecciona las fotos de tu galería, las que quieras, y aparecerán en el muro.
            </p>
          </div>
        </div>
      </section>

      {/* Galería de fotos */}
      <Gallery />

      {/* Componente Cliente que maneja la lógica y el Botón Flotante */}
      <PhotoUploader />
    </main>
  );
}
