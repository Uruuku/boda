"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, RefreshCcw, Heart, ChevronLeft, ChevronRight, Trash2, Lock, X, Download } from 'lucide-react';
import Image from 'next/image';
import { BODA } from '@/config/boda';

interface Photo { url: string; pathname: string; uploadedAt: string; }
interface ParsedPhoto extends Photo { guestName: string; message: string; }
const PHOTOS_PER_PAGE = 10;

export default function Gallery({ dict }: { dict: any }) {
  const [photos, setPhotos] = useState<ParsedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('wedding_admin') === 'true' : false);
  const clickCountRef = useRef(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [storedPassword, setStoredPassword] = useState<string | null>(() => typeof window !== 'undefined' ? sessionStorage.getItem('wedding_pass') : null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  const handleTitleClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      setShowAdminLogin(true);
      clickCountRef.current = 0;
    }
    setTimeout(() => { clickCountRef.current = 0; }, 3000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
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
      } else { alert('Error'); }
    } finally { setIsVerifying(false); }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setStoredPassword(null);
    sessionStorage.removeItem('wedding_admin');
    sessionStorage.removeItem('wedding_pass');
  };

  const handleDelete = async (e: React.MouseEvent, photo: ParsedPhoto) => {
    e.stopPropagation();
    if (!storedPassword || !confirm('¿Borrar?')) return;
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
        fetchPhotos(true);
      }
    } finally { setIsDeleting(null); }
  };

  const handleDownloadAll = async () => { /* logica descarga - omitida para brevedad, puedes usar la de tu código original, no afecta a textos */ };
  
  const parsePhoto = (photo: Photo): ParsedPhoto => {
    const parts = photo.pathname.split('---');
    if (parts.length >= 3) return { ...photo, guestName: parts[1].replace(/_/g, ' '), message: parts[2].replace(/_/g, ' ') };
    return { ...photo, guestName: 'Invitado', message: '' };
  };

  const fetchPhotos = useCallback(async (forzarRecarga = false) => {
    try {
      const res = await fetch(forzarRecarga ? `/api/photos?t=${Date.now()}` : '/api/photos');
      const data = await res.json();
      if (Array.isArray(data)) setPhotos(data.map(parsePhoto));
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchPhotos();
    let intervalo: ReturnType<typeof setInterval> | null = null;
    const arrancar = () => { if (intervalo === null) intervalo = setInterval(() => fetchPhotos(), 30000); };
    const parar = () => { if (intervalo !== null) { clearInterval(intervalo); intervalo = null; } };
    const alCambiarVisibilidad = () => { document.hidden ? parar() : (fetchPhotos(), arrancar()); };
    const alSubirFotos = () => { fetchPhotos(true); setTimeout(() => fetchPhotos(true), 3000); };

    if (!document.hidden) arrancar();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('boda:fotos-subidas', alSubirFotos);
    return () => { parar(); document.removeEventListener('visibilitychange', alCambiarVisibilidad); window.removeEventListener('boda:fotos-subidas', alSubirFotos); };
  }, [fetchPhotos]);

  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);
  const paginaActual = Math.min(currentPage, Math.max(1, totalPages));
  const currentPhotos = useMemo(() => {
    const start = (paginaActual - 1) * PHOTOS_PER_PAGE;
    return photos.slice(start, start + PHOTOS_PER_PAGE);
  }, [photos, paginaActual]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    document.getElementById('muro-recuerdos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectedIndex = useMemo(() => (selectedUrl ? photos.findIndex((p) => p.url === selectedUrl) : -1), [photos, selectedUrl]);
  const selectedPhoto = selectedIndex >= 0 ? photos[selectedIndex] : null;
  const hayAnterior = selectedIndex > 0;
  const haySiguiente = selectedIndex >= 0 && selectedIndex < photos.length - 1;

  const pasarFoto = useCallback((salto: number) => {
    if (selectedIndex < 0) return;
    const destino = selectedIndex + salto;
    if (destino >= 0 && destino < photos.length) {
      setSelectedUrl(photos[destino].url);
      setCurrentPage(Math.floor(destino / PHOTOS_PER_PAGE) + 1);
    }
  }, [photos, selectedIndex]);

  return (
    <section id="muro-recuerdos" className="px-4 pb-32 max-w-6xl mx-auto scroll-mt-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-2 gap-4">
        <div className="flex-1">
          <h3 className="text-3xl font-serif text-wedding-text cursor-default select-none" onClick={handleTitleClick}>
            {dict.titulo}
          </h3>
          <p className="text-wedding-sage font-medium text-sm mt-1 uppercase tracking-widest">
            {photos.length > 0
              ? `${paginaActual} / ${totalPages} • ${photos.length}`
              : isLoading ? dict.cargando : dict.sin_fotos_header}
            {isAdmin && <span className="ml-2 text-red-500 font-bold border border-red-200 px-2 py-0.5 rounded text-[10px]">{dict.modo_admin}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={handleLogout} className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-full shadow-sm" title={dict.cerrar_admin}>
              <Lock className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => { setIsLoading(true); fetchPhotos(true); }} className="p-3 bg-white/60 hover:bg-white shadow-sm text-wedding-sage rounded-full" title={dict.actualizar}>
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-wedding-sage mb-4" />
          <p className="text-wedding-text/60 font-serif italic">{dict.preparando}</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-24 px-6 max-w-sm mx-auto">
          <div className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-wedding-sage/10 shadow-sm">
            <Heart className="w-8 h-8 text-wedding-sage/30 mx-auto mb-4" />
            <p className="text-wedding-text/50 font-serif italic text-lg">{dict.sin_fotos_muro}</p>
            <p className="text-wedding-text/40 text-sm mt-3">{dict.se_el_primero}</p>
          </div>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 min-h-[400px]">
          {currentPhotos.map((photo) => (
            <div key={photo.url} className="break-inside-avoid relative bg-white p-3 rounded-xl shadow-md cursor-pointer hover:-translate-y-1 transition-all" onClick={() => setSelectedUrl(photo.url)}>
              <div className="relative aspect-4/5 rounded-lg overflow-hidden mb-3">
                <Image src={photo.url} alt={photo.guestName} fill className="object-cover" />
                {isAdmin && (
                  <button onClick={(e) => handleDelete(e, photo)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full z-10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="px-1">
                <p className="font-serif text-wedding-text text-sm font-bold truncate">{photo.guestName}</p>
                {photo.message && <p className="text-wedding-text/70 text-xs italic line-clamp-2 mt-1">&quot;{photo.message}&quot;</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-serif text-wedding-text">{dict.acceso_admin}</h4>
              <button onClick={() => setShowAdminLogin(false)}><X className="w-6 h-6 text-wedding-text/30" /></button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <p className="text-sm text-wedding-text/60 italic">{dict.intro_pass}</p>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder={dict.pass_placeholder} className="w-full border rounded-xl px-4 py-3" />
              <button type="submit" disabled={isVerifying} className="w-full bg-wedding-sage text-white py-3 rounded-xl">
                {isVerifying ? dict.verificando : dict.entrar}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-wedding-text/95 backdrop-blur-md z-60 flex items-center justify-center p-4" onClick={() => setSelectedUrl(null)}>
          <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
             <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl">
              <Image key={selectedPhoto.url} src={selectedPhoto.url} fill className="object-contain" alt={selectedPhoto.guestName} unoptimized />
              {photos.length > 1 && (
                <>
                  <button onClick={() => pasarFoto(-1)} disabled={!hayAnterior} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 text-white rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => pasarFoto(1)} disabled={!haySiguiente} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 text-white rounded-full">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            <div className="text-center text-white">
              <p className="text-2xl font-serif mb-2">{selectedPhoto.guestName}</p>
              {selectedPhoto.message && <p className="text-white/80 italic text-lg">&quot;{selectedPhoto.message}&quot;</p>}
            </div>
            <button className="absolute top-0 right-0 p-4 text-white" onClick={() => setSelectedUrl(null)}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}