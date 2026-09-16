"use client";

// Este archivo NO hace falta tocarlo. Es el "Muro de Recuerdos", el visor de
// fotos y el modo administrador (5 toques en el título + contraseña).

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, RefreshCcw, Heart, ChevronLeft, ChevronRight, Trash2, Lock, X, Download } from 'lucide-react';
import Image from 'next/image';
import { BODA } from '@/config/boda';

interface Photo {
  url: string;
  pathname: string;
  uploadedAt: string;
}

interface ParsedPhoto extends Photo {
  guestName: string;
  message: string;
}

const PHOTOS_PER_PAGE = 10;

export default function Gallery() {
  const [photos, setPhotos] = useState<ParsedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Guardamos la URL, no el objeto: asi el visor sobrevive a los refrescos del muro
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wedding_admin') === 'true';
    }
    return false;
  });
  const clickCountRef = useRef(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [storedPassword, setStoredPassword] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wedding_pass');
    }
    return null;
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  // Efecto para la galería (autofetch)

  const handleTitleClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      setShowAdminLogin(true);
      clickCountRef.current = 0;
    }
    // Opcional: resetear tras 3 segundos
    setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      // Intentamos verificar la contraseña contra un endpoint seguro
      const res = await fetch('/api/photos/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (res.ok) {
        setIsAdmin(true);
        setStoredPassword(passwordInput);
        sessionStorage.setItem('wedding_admin', 'true');
        sessionStorage.setItem('wedding_pass', passwordInput);
        setShowAdminLogin(false);
        setPasswordInput('');
      } else {
        alert('Contraseña incorrecta');
      }
    } catch {
      alert('Error al verificar contraseña');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setStoredPassword(null);
    sessionStorage.removeItem('wedding_admin');
    sessionStorage.removeItem('wedding_pass');
  };

  const handleDelete = async (e: React.MouseEvent, photo: ParsedPhoto) => {
    e.stopPropagation();
    if (!storedPassword) return;
    if (!confirm('¿Estás seguro de que quieres borrar esta foto?')) return;
    
    setIsDeleting(photo.url);
    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: photo.url, password: storedPassword }),
      });

      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.url !== photo.url));
        if (selectedUrl === photo.url) setSelectedUrl(null);
        // Saltarse la cache del CDN para que la foto borrada no reaparezca
        fetchPhotos(true);
      } else {
        alert('Error al borrar la foto');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Descarga todo el muro en uno o varios ZIP. Se hace en el navegador:
  // meter cientos de megas de fotos en una funcion del servidor la reventaria.
  const handleDownloadAll = async () => {
    if (photos.length === 0 || isDownloading) return;

    setIsDownloading(true);
    try {
      // Solo se carga cuando hace falta: los invitados nunca descargan esta libreria.
      const { default: JSZip } = await import('jszip');

      const POR_ARCHIVO = 40;
      const totalPartes = Math.ceil(photos.length / POR_ARCHIVO);

      for (let parte = 0; parte < totalPartes; parte++) {
        const zip = new JSZip();
        const lote = photos.slice(parte * POR_ARCHIVO, (parte + 1) * POR_ARCHIVO);

        for (let i = 0; i < lote.length; i++) {
          const photo = lote[i];
          const numero = parte * POR_ARCHIVO + i + 1;
          setDownloadProgress(`Preparando ${numero} de ${photos.length}...`);
          try {
            const res = await fetch(photo.url);
            if (!res.ok) continue;
            const contenido = await res.blob();
            const extension = photo.pathname.split('.').pop() || 'jpg';
            const nombre =
              photo.guestName.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'Invitado';
            zip.file(`${String(numero).padStart(3, '0')}_${nombre}.${extension}`, contenido);
          } catch (error) {
            // Una foto que falle no debe tumbar la descarga entera
            console.error('No se pudo descargar la foto', photo.url, error);
          }
        }

        setDownloadProgress(`Comprimiendo ${parte + 1} de ${totalPartes}...`);
        // Las fotos ya son JPEG: volver a comprimirlas solo gastaria tiempo.
        const archivo = await zip.generateAsync({ type: 'blob', compression: 'STORE' });

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download =
          totalPartes > 1
            ? `${BODA.nombreZip}-${parte + 1}-de-${totalPartes}.zip`
            : `${BODA.nombreZip}.zip`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        // Liberar demasiado pronto cancelaria la descarga en algunos navegadores
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        if (parte < totalPartes - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    } catch (error) {
      console.error('Error al preparar la descarga:', error);
      alert('Hubo un problema al preparar la descarga.');
    } finally {
      setDownloadProgress(null);
      setIsDownloading(false);
    }
  };

  const parsePhoto = (photo: Photo): ParsedPhoto => {
    const parts = photo.pathname.split('---');
    if (parts.length >= 3) {
      return {
        ...photo,
        guestName: parts[1].replace(/_/g, ' '),
        message: parts[2].replace(/_/g, ' '),
      };
    }
    return { ...photo, guestName: 'Invitado', message: '' };
  };

  const fetchPhotos = useCallback(async (forzarRecarga = false) => {
    try {
      // El muro se cachea 30 s en el CDN para no agotar las operaciones de
      // Vercel Blob. El boton de recargar se salta esa cache para responder ya.
      const res = await fetch(forzarRecarga ? `/api/photos?t=${Date.now()}` : '/api/photos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPhotos(data.map(parsePhoto));
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();

    let intervalo: ReturnType<typeof setInterval> | null = null;

    const arrancar = () => {
      if (intervalo === null) {
        intervalo = setInterval(() => fetchPhotos(), 30000);
      }
    };

    const parar = () => {
      if (intervalo !== null) {
        clearInterval(intervalo);
        intervalo = null;
      }
    };

    // La mayoria de invitados tendra la web abierta con el movil en el bolsillo.
    // Seguir consultando con la pantalla apagada gastaria la cuota de Vercel Blob
    // para nada, asi que solo refrescamos cuando la pagina esta a la vista.
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        parar();
      } else {
        fetchPhotos();
        arrancar();
      }
    };

    // Cuando alguien sube fotos, mostrarlas ya, saltandose la cache del CDN.
    // Se repite a los 3 s porque el almacen tarda un instante en listarlas.
    const alSubirFotos = () => {
      fetchPhotos(true);
      setTimeout(() => fetchPhotos(true), 3000);
    };

    if (!document.hidden) arrancar();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('boda:fotos-subidas', alSubirFotos);

    return () => {
      parar();
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('boda:fotos-subidas', alSubirFotos);
    };
  }, [fetchPhotos]);

  // Lógica de paginación
  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);

  // Al borrar fotos el muro puede encoger por debajo de la pagina que se esta
  // viendo, y entonces se quedaba en blanco y sin paginador para volver.
  // Se ajusta al vuelo en vez de con un efecto, que provoca doble renderizado.
  const paginaActual = Math.min(currentPage, Math.max(1, totalPages));

  const currentPhotos = useMemo(() => {
    const start = (paginaActual - 1) * PHOTOS_PER_PAGE;
    return photos.slice(start, start + PHOTOS_PER_PAGE);
  }, [photos, paginaActual]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba de la galería al cambiar de página
    const galleryElement = document.getElementById('muro-recuerdos');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Visor a pantalla completa ---
  // El indice se recalcula desde la URL: si el muro se refresca mientras alguien
  // mira una foto sigue viendo la misma y las flechas no se descolocan.
  const selectedIndex = useMemo(
    () => (selectedUrl ? photos.findIndex((p) => p.url === selectedUrl) : -1),
    [photos, selectedUrl],
  );
  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : null;
  const hayAnterior = selectedIndex > 0;
  const haySiguiente = selectedIndex >= 0 && selectedIndex < photos.length - 1;

  // Se pasan fotos por el muro entero, no solo por la pagina: la de debajo va
  // siguiendo al visor para que al cerrarlo se quede donde toca.
  const pasarFoto = useCallback(
    (salto: number) => {
      if (selectedIndex < 0) return;
      const destino = selectedIndex + salto;
      if (destino < 0 || destino >= photos.length) return;
      setSelectedUrl(photos[destino].url);
      setCurrentPage(Math.floor(destino / PHOTOS_PER_PAGE) + 1);
    },
    [photos, selectedIndex],
  );

  useEffect(() => {
    if (!selectedUrl) return;

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') pasarFoto(1);
      else if (e.key === 'ArrowLeft') pasarFoto(-1);
      else if (e.key === 'Escape') setSelectedUrl(null);
    };

    // Con el visor abierto el muro de detras no debe moverse al arrastrar
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPulsarTecla);

    return () => {
      document.body.style.overflow = scrollPrevio;
      window.removeEventListener('keydown', alPulsarTecla);
    };
  }, [selectedUrl, pasarFoto]);

  // Deslizar con el dedo, que casi todo el mundo lo vera desde el movil
  const inicioDelToqueRef = useRef<{ x: number; y: number } | null>(null);

  const alEmpezarToque = (e: React.TouchEvent) => {
    const toque = e.touches[0];
    inicioDelToqueRef.current = { x: toque.clientX, y: toque.clientY };
  };

  const alSoltarToque = (e: React.TouchEvent) => {
    const inicio = inicioDelToqueRef.current;
    inicioDelToqueRef.current = null;
    if (!inicio) return;
    const toque = e.changedTouches[0];
    const avanceX = toque.clientX - inicio.x;
    const avanceY = toque.clientY - inicio.y;
    // Solo cuenta si el gesto es largo y claramente horizontal
    if (Math.abs(avanceX) < 50 || Math.abs(avanceX) < Math.abs(avanceY)) return;
    pasarFoto(avanceX < 0 ? 1 : -1);
  };

  return (
    <section id="muro-recuerdos" className="px-4 pb-32 max-w-6xl mx-auto scroll-mt-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-2 gap-4">
        <div className="flex-1">
          <h3 
            className="text-3xl font-serif text-wedding-text cursor-default select-none"
            onClick={handleTitleClick}
          >
            Muro de Recuerdos
          </h3>
          <p className="text-wedding-sage font-medium text-sm mt-1 uppercase tracking-widest">
            {photos.length > 0
              ? `Página ${paginaActual} de ${totalPages} • ${photos.length} momentos`
              : isLoading
                ? 'Cargando…'
                : 'Aún no hay fotos'}
            {isAdmin && <span className="ml-2 text-red-500 font-bold border border-red-200 px-2 py-0.5 rounded text-[10px]">MODO ADMIN</span>}
            {downloadProgress && (
              <span className="ml-2 text-wedding-sage normal-case tracking-normal">{downloadProgress}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading || photos.length === 0}
              className="p-3 bg-wedding-sage/10 hover:bg-wedding-sage/20 text-wedding-sage rounded-full transition-all shadow-sm disabled:opacity-50 disabled:cursor-wait"
              title="Descargar todas las fotos"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={handleLogout}
              className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-all shadow-sm"
              title="Cerrar modo administrador"
            >
              <Lock className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => { setIsLoading(true); fetchPhotos(true); }}
            className="p-3 bg-white/60 hover:bg-white shadow-sm text-wedding-sage rounded-full transition-all active:rotate-180 duration-500"
            title="Actualizar galería"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-wedding-sage mb-4" />
          <p className="text-wedding-text/60 font-serif italic">Preparando el muro de recuerdos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-24 px-6 max-w-sm mx-auto">
          <div className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-wedding-sage/10 shadow-sm">
            <Heart className="w-8 h-8 text-wedding-sage/30 mx-auto mb-4" />
            <p className="text-wedding-text/50 font-serif italic text-lg">Aún no hay momentos compartidos.</p>
            <p className="text-wedding-text/40 text-sm mt-3">¡Anímate a ser el primero en subir una foto!</p>
          </div>
        </div>
      ) : (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 min-h-[400px]">
        {currentPhotos.map((photo) => (
          <div 
            key={photo.url} 
            className="break-inside-avoid group relative bg-white p-3 rounded-xl shadow-md border border-wedding-sage/5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95"
            onClick={() => setSelectedUrl(photo.url)}
          >
            <div className="relative aspect-4/5 rounded-lg overflow-hidden mb-3">
              <Image 
                src={photo.url} 
                alt={`Foto de ${photo.guestName}`} 
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              {isAdmin && (
                <button
                  onClick={(e) => handleDelete(e, photo)}
                  disabled={isDeleting === photo.url}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                  {isDeleting === photo.url ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            
            <div className="px-1">
              <p className="font-serif text-wedding-text text-sm font-bold truncate">
                {photo.guestName}
              </p>
              {photo.message && (
                <p className="text-wedding-text/70 text-xs italic line-clamp-2 mt-1 leading-relaxed">
                  &quot;{photo.message}&quot;
                </p>
              )}
              <p className="text-[10px] text-wedding-gold/60 uppercase tracking-tighter mt-2 font-medium">
                {new Date(photo.uploadedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-16">
          <button
            onClick={() => goToPage(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="p-2 rounded-full hover:bg-wedding-sage/10 text-wedding-sage disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1">
            {paginasVisibles(paginaActual, totalPages).map((page, i) =>
              page === 'hueco' ? (
                <span key={`hueco-${i}`} className="w-6 text-center text-wedding-text/30 select-none">
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-full font-medium transition-all ${
                    paginaActual === page
                      ? 'bg-wedding-sage text-white shadow-md scale-110'
                      : 'text-wedding-text/60 hover:bg-wedding-sage/10'
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => goToPage(paginaActual + 1)}
            disabled={paginaActual === totalPages}
            className="p-2 rounded-full hover:bg-wedding-sage/10 text-wedding-sage disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Modal Admin Login */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-serif text-wedding-text">Acceso Admin</h4>
              <button onClick={() => setShowAdminLogin(false)} className="p-1 hover:bg-black/5 rounded-full">
                <X className="w-6 h-6 text-wedding-text/30" />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <p className="text-sm text-wedding-text/60 italic">Introduce la contraseña para gestionar el muro.</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                placeholder="Contraseña"
                className="w-full border border-wedding-sage/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-sage/30"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-wedding-sage text-white font-semibold py-3 rounded-xl hover:bg-wedding-sageDark transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Visor: se pasan las fotos con las flechas, el teclado o deslizando */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-wedding-text/95 backdrop-blur-md z-60 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setSelectedUrl(null)}
        >
          <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
            <div
              className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl"
              onTouchStart={alEmpezarToque}
              onTouchEnd={alSoltarToque}
            >
              <Image
                key={selectedPhoto.url}
                src={selectedPhoto.url}
                fill
                className="object-contain animate-in fade-in duration-200"
                alt={`Foto de ${selectedPhoto.guestName}`}
                unoptimized
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => pasarFoto(-1)}
                    disabled={!hayAnterior}
                    aria-label="Foto anterior"
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 md:p-4 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
                  </button>
                  <button
                    onClick={() => pasarFoto(1)}
                    disabled={!haySiguiente}
                    aria-label="Foto siguiente"
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 md:p-4 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
                  </button>
                </>
              )}
            </div>

            <div className="text-center text-white max-w-lg">
              <p className="text-2xl font-serif mb-2">{selectedPhoto.guestName}</p>
              {selectedPhoto.message && (
                <p className="text-white/80 italic text-lg leading-relaxed">&quot;{selectedPhoto.message}&quot;</p>
              )}
              {photos.length > 1 && (
                <p className="text-white/40 text-xs uppercase tracking-widest mt-4">
                  {selectedIndex + 1} / {photos.length}
                </p>
              )}
            </div>

            <button
              className="absolute -top-4 -right-4 md:top-0 md:right-0 bg-white/10 hover:bg-white/20 p-4 rounded-full text-white transition-colors z-70"
              onClick={() => setSelectedUrl(null)}
              aria-label="Cerrar"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// Con cientos de fotos, pintar un boton por pagina llenaba el movil de numeros.
// Se muestran solo la primera, la ultima y las vecinas: « 1 … 23 24 25 … 80 ».
function paginasVisibles(actual: number, total: number): (number | 'hueco')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const clave = [1, total, actual, actual - 1, actual + 1];
  const ordenadas = [...new Set(clave)]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const salida: (number | 'hueco')[] = [];
  ordenadas.forEach((pagina, i) => {
    if (i > 0 && pagina - ordenadas[i - 1] > 1) salida.push('hueco');
    salida.push(pagina);
  });
  return salida;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
