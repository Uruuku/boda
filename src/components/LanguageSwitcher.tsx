"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageSwitcher({ lang }: { lang: 'es' | 'en' | 'sq' }) {
  const [showSplash, setShowSplash] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    // Comprobamos si el usuario ya eligió idioma antes
    const hasSelected = localStorage.getItem('langSelected');
    if (!hasSelected) {
      setShowSplash(true);
      // Ocultamos el scroll del fondo mientras se elige idioma
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const changeLanguage = (newLang: string) => {
    localStorage.setItem('langSelected', 'true');
    setShowSplash(false);
    document.body.style.overflow = 'auto';
    
    // Cambiamos el idioma en la URL actual (ej: /es/... -> /sq/...)
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPath);
  };

  // Evitamos problemas de hidratación renderizando solo cuando estemos en el cliente
  if (!isMounted) return null;

  // 1. PANTALLA INICIAL (El Triángulo de Banderas)
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-wedding-bg z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500 p-4">
        <h2 className="text-xl md:text-2xl font-serif text-wedding-text mb-12 text-center leading-relaxed">
          Elige tu idioma<br/>
          <span className="opacity-70 text-lg">Zgjidh gjuhën</span><br/>
          <span className="opacity-70 text-lg">Choose your language</span>
        </h2>
        
        {/* Layout en Triángulo */}
        <div className="flex flex-col items-center gap-6 md:gap-8">
          {/* Arriba: Español */}
          <button 
            onClick={() => changeLanguage('es')} 
            className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-xl flex items-center justify-center text-5xl md:text-6xl hover:scale-110 transition-transform border border-wedding-sage/20"
          >
            🇪🇸
          </button>
          
          {/* Abajo: Albanés e Inglés */}
          <div className="flex gap-8 md:gap-12">
            <button 
              onClick={() => changeLanguage('sq')} 
              className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-xl flex items-center justify-center text-5xl md:text-6xl hover:scale-110 transition-transform border border-wedding-sage/20"
            >
              🇦🇱
            </button>
            <button 
              onClick={() => changeLanguage('en')} 
              className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white shadow-xl flex items-center justify-center text-5xl md:text-6xl hover:scale-110 transition-transform border border-wedding-sage/20"
            >
              🇬🇧
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. BOTONES PERSISTENTES (Esquina superior)
  const flags = { es: '🇪🇸', sq: '🇦🇱', en: '🇬🇧' };
  
  return (
    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex gap-2 bg-white/40 backdrop-blur-md p-2 rounded-full border border-wedding-sage/10 shadow-sm">
      {(['es', 'sq', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => changeLanguage(l)}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl shadow-sm transition-all ${
            lang === l 
              ? 'bg-wedding-sage text-white scale-110 ring-2 ring-wedding-gold/50' 
              : 'bg-white hover:bg-wedding-sage/10 grayscale-[40%]'
          }`}
          title={`Cambiar a ${l}`}
        >
          {flags[l]}
        </button>
      ))}
    </div>
  );
}