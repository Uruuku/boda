import PhotoUploader from '@/components/PhotoUploader';
import Countdown from '@/components/Countdown';
import Gallery from '@/components/Gallery';
import Image from 'next/image';
import { BODA } from '@/config/boda';
import { getDictionary } from '@/dictionaries/getDictionary';
import LanguageSwitcher from '@/components/LanguageSwitcher'; 

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as 'es' | 'en' | 'sq';
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-wedding-bg text-wedding-text relative pb-32">
      
      <LanguageSwitcher lang={lang} />

      <section className="flex flex-col items-center justify-center pt-16 px-6 text-center">
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
          {dict.config.fechaTexto}
        </h2>
        <h1 className="text-5xl font-serif text-wedding-sage mb-6">
          {BODA.nombres}
        </h1>

        <Countdown dict={dict.countdown} />

        <p className="text-lg opacity-80 max-w-md mx-auto mt-6 mb-10 leading-relaxed">
          {dict.config.bienvenida}
        </p>

        <div className="flex bg-white/60 shadow-sm rounded-2xl p-4 max-w-sm w-full text-left items-start gap-4 mb-16">
          <div className="bg-wedding-sage/10 p-3 rounded-full text-wedding-sage">
            📸
          </div>
          <div>
            <h3 className="font-semibold text-wedding-text">{dict.page.instrucciones_titulo}</h3>
            <p className="text-sm opacity-70 mt-1">
              {dict.page.instrucciones_desc}
            </p>
          </div>
        </div>
      </section>

      <Gallery dict={dict.gallery} />
      <PhotoUploader dict={dict.uploader} />
    </main>
  );
}