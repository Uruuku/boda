"use client";

import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X, Camera } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';

const FOTOS_POR_ENVIO = 10;
const AVISO_MUCHAS_FOTOS = 25;

export default function PhotoUploader({ dict }: { dict: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasError) return;
    const temporizador = setTimeout(() => setHasError(null), 6000);
    return () => clearTimeout(temporizador);
  }, [hasError]);

  const handleButtonClick = () => {
    setSuccessMessage(null); setHasError(null); setUploadProgress(0);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (filesArray.length === 0) return;
    setSelectedFiles(filesArray);
    setPreviews(prev => { prev.forEach(url => URL.revokeObjectURL(url)); return filesArray.map(f => URL.createObjectURL(f)); });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false); setSelectedFiles([]); setGuestName(''); setMessage('');
    setPreviews(prev => { prev.forEach(url => URL.revokeObjectURL(url)); return []; });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fireConfetti = () => {
    const duration = 3000; const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, colors: ['#D4AF37', '#F5E6AD', '#B8860B', '#FFF9E3'] };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const comprimir = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    try {
      const comprimida = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2200, useWebWorker: true });
      return new File([comprimida], file.name, { type: file.type, lastModified: Date.now() });
    } catch { return file; }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true); setHasError(null); setSuccessMessage(null);
    const total = selectedFiles.length;
    let enviadas = 0; let algunaSoloPorEmail = false;

    try {
      for (let inicio = 0; inicio < total; inicio += FOTOS_POR_ENVIO) {
        const lote = selectedFiles.slice(inicio, inicio + FOTOS_POR_ENVIO);
        const formData = new FormData();
        for (let i = 0; i < lote.length; i++) {
          setUploadProgress(Math.round(((inicio + i) / total) * 100));
          formData.append('files', await comprimir(lote[i]));
        }
        formData.append('guestName', guestName || 'Invitado');
        formData.append('message', message);
        
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Falló subida');
        const datos = await response.json().catch(() => null);
        if (datos?.storageFull) algunaSoloPorEmail = true;

        enviadas += lote.length;
        setUploadProgress(Math.round((enviadas / total) * 100));
        window.dispatchEvent(new Event('boda:fotos-subidas'));
      }
      
      setSuccessMessage(algunaSoloPorEmail ? dict.exito_lleno : `${total} ${total > 1 ? dict.fotos : dict.una_foto} ${dict.exito_normal}`);
      if (!algunaSoloPorEmail) fireConfetti();
      setTimeout(() => setSuccessMessage(null), 6000);
      resetForm();

    } catch {
      setHasError(dict.error_general);
    } finally { setIsUploading(false); }
  };

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />

      {successMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-xl border shadow-xl z-50 flex items-center gap-3">
          <CheckCircle2 className="text-wedding-sage w-6 h-6" />
          <span className="font-medium text-wedding-text">{successMessage}</span>
        </div>
      )}

      {hasError && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-red-50 px-6 py-4 rounded-xl border shadow-xl z-50 flex items-center gap-3">
          <AlertCircle className="text-red-500 w-6 h-6" />
          <span className="font-medium text-red-700">{hasError}</span>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-wedding-bg w-full max-w-lg rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-wedding-text">
                {dict.compartir} {selectedFiles.length > 1 ? `${selectedFiles.length} ${dict.momentos}` : dict.un_momento}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-black/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {previews.map((url, i) => (
                <div key={i} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-wedding-sage/20">
                  <Image src={url} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>

            {selectedFiles.length >= AVISO_MUCHAS_FOTOS && (
              <div className="flex items-start gap-3 bg-wedding-gold/10 p-3 mb-4 rounded-xl">
                <AlertCircle className="w-5 h-5 text-wedding-gold" />
                <p className="text-sm text-wedding-text/70">{dict.aviso_muchas_fotos}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-wedding-text/70 mb-1 ml-1">{dict.nombre_label}</label>
                <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={dict.nombre_placeholder} className="w-full border rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-wedding-text/70 mb-1 ml-1">{dict.mensaje_label}</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={dict.mensaje_placeholder} rows={3} className="w-full border rounded-xl px-4 py-3" />
              </div>
            </div>

            <button onClick={handleUpload} disabled={isUploading} className="w-full mt-8 bg-wedding-sage text-white py-4 rounded-xl flex items-center justify-center gap-2">
              {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>{dict.subiendo} {uploadProgress}%</span></> : <><UploadCloud className="w-5 h-5" /><span>{dict.enviar} {selectedFiles.length > 1 ? `${selectedFiles.length} ${dict.fotos}` : dict.una_foto}</span></>}
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-8 left-0 right-0 px-4 z-40 flex justify-center">
        <button onClick={handleButtonClick} className="w-full max-w-md bg-wedding-sage text-white shadow-2xl rounded-full py-5 px-6 text-xl font-semibold flex items-center justify-center gap-3">
          <Camera className="w-7 h-7 text-wedding-gold" />
          <span>{dict.boton_principal}</span>
        </button>
      </div>
    </>
  );
}