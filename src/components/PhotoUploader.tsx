"use client";

// Este archivo NO hace falta tocarlo. Es el botón "¡Sube tus fotos!" y el
// formulario de envío. Solo hay dos textos de ejemplo opcionales marcados abajo.

import { useState, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X, Camera } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';

// Las fotos se mandan por tandas en vez de todas en una peticion. Asi da igual
// que alguien seleccione el carrete entero: cada envio es pequeño, entra de
// sobra en el minuto que da Vercel, y lo que ya ha subido queda a salvo aunque
// se caiga el wifi a mitad.
const FOTOS_POR_ENVIO = 10;

// A partir de aqui avisamos de que la cosa va para largo, para que nadie cierre
// el movil pensando que se ha colgado.
const AVISO_MUCHAS_FOTOS = 25;

export default function PhotoUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);

  // Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // El aviso rojo se quedaba clavado en pantalla hasta que volvieran a pulsar el
  // boton. Que se vaya solo, como cualquier notificacion.
  useEffect(() => {
    if (!hasError) return;
    const temporizador = setTimeout(() => setHasError(null), 6000);
    return () => clearTimeout(temporizador);
  }, [hasError]);

  const handleButtonClick = () => {
    setSuccessMessage(null);
    setHasError(null);
    setUploadProgress(0);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(event.target.files ?? []);

    // Vaciar el input SIEMPRE. Si no, al elegir las mismas fotos por segunda vez
    // el navegador no avisa del cambio y el boton parece muerto.
    event.target.value = '';

    if (filesArray.length === 0) return;

    setSelectedFiles(filesArray);
    setPreviews((anteriores) => {
      anteriores.forEach((url) => URL.revokeObjectURL(url));
      return filesArray.map((file) => URL.createObjectURL(file));
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedFiles([]);
    setPreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
    setGuestName('');
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      const colors = ['#D4AF37', '#F5E6AD', '#B8860B', '#FFF9E3'];

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: colors
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: colors
      });
    }, 250);
  };

  // Encoge la foto antes de mandarla. Si el navegador no sabe con su propio
  // formato (el HEIC del iPhone, por ejemplo) se manda el original: mejor una
  // foto grande que ninguna.
  //
  // 2200 px es la unica copia que queda de cada foto: la original se queda en
  // el movil del invitado y al correo de respaldo llega esta misma, no otra.
  // A 1600 px solo se podia imprimir a 13x10 cm; a 2200 llega a 18x13.
  //
  // El tope de peso va a la par que el ancho a proposito. Con 1 MB la foto se
  // agrandaba y luego se machacaba para que cupiera, y quedaba grande pero
  // fea; asi manda el ancho y el peso solo actua de tope de seguridad.
  const comprimir = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    try {
      const comprimida = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2200,
        useWebWorker: true,
      });
      // De Blob a File para conservar el nombre y la extension originales
      return new File([comprimida], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
    } catch (errorDeCompresion) {
      console.warn('No se pudo comprimir, se envía el original:', errorDeCompresion);
      return file;
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setHasError(null);
    setSuccessMessage(null);

    const total = selectedFiles.length;
    let enviadas = 0;
    let algunaSoloPorEmail = false;

    try {
      for (let inicio = 0; inicio < total; inicio += FOTOS_POR_ENVIO) {
        const lote = selectedFiles.slice(inicio, inicio + FOTOS_POR_ENVIO);
        const formData = new FormData();

        for (let i = 0; i < lote.length; i++) {
          setUploadProgress(Math.round(((inicio + i) / total) * 100));
          formData.append('files', await comprimir(lote[i]));
        }

        formData.append('guestName', guestName || 'Invitado Anónimo');
        formData.append('message', message);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Ha fallado la subida de las fotos.');
        }

        // El servidor avisa si el muro esta lleno y ha tirado solo de email.
        // Antes no se leia y saliamos celebrando una foto que nadie iba a ver.
        const datos = await response.json().catch(() => null);
        if (datos?.storageFull) algunaSoloPorEmail = true;

        enviadas += lote.length;
        setUploadProgress(Math.round((enviadas / total) * 100));

        // Avisar al muro tanda a tanda para que las fotos vayan apareciendo
        // segun se suben, en vez de todas de golpe al final.
        window.dispatchEvent(new Event('boda:fotos-subidas'));
      }

      if (algunaSoloPorEmail) {
        setSuccessMessage('Fotos recibidas y guardadas a salvo 🤍 (el muro está lleno, así que tardarán en verse)');
      } else {
        setSuccessMessage(`¡${total > 1 ? `${total} fotos enviadas` : 'Foto enviada'} con éxito! Gracias 🤍`);
        fireConfetti();
      }

      setTimeout(() => setSuccessMessage(null), 6000);
      resetForm();

    } catch (error) {
      console.error('Error procesando archivos:', error);

      if (enviadas > 0) {
        // Lo ya subido esta a salvo: dejamos seleccionadas solo las que faltan
        // para que puedan reintentar sin duplicar las que si llegaron.
        setHasError(`Se han subido ${enviadas} de ${total} fotos. Pulsa "Enviar" otra vez para las que faltan.`);
        setPreviews((anteriores) => {
          anteriores.slice(0, enviadas).forEach((url) => URL.revokeObjectURL(url));
          return anteriores.slice(enviadas);
        });
        setSelectedFiles((anteriores) => anteriores.slice(enviadas));
        setUploadProgress(0);
      } else {
        setHasError('Hubo un problema al enviar las fotos. Inténtalo de nuevo.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Notificaciones */}
      {successMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-xl border border-wedding-sage/30 shadow-xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-10 max-w-[90vw]">
          <CheckCircle2 className="text-wedding-sage w-6 h-6 shrink-0" />
          <span className="font-medium text-wedding-text">{successMessage}</span>
        </div>
      )}

      {hasError && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-red-50 px-6 py-4 rounded-xl border border-red-200 shadow-xl z-50 flex items-center gap-3 max-w-[90vw]">
          <AlertCircle className="text-red-500 w-6 h-6 shrink-0" />
          <span className="font-medium text-red-700">{hasError}</span>
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-wedding-bg w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-wedding-text">
                  Compartir {selectedFiles.length > 1 ? `${selectedFiles.length} momentos` : 'un momento'}
                </h3>
                <button
                  onClick={resetForm}
                  disabled={isUploading}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors disabled:opacity-30"
                >
                  <X className="w-6 h-6 text-wedding-text/50" />
                </button>
              </div>

              {/* Previews de fotos */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                {previews.map((url, i) => (
                  <div key={i} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-wedding-sage/20">
                    <Image src={url} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>

              {selectedFiles.length >= AVISO_MUCHAS_FOTOS && !isUploading && (
                <div className="flex items-start gap-3 bg-wedding-gold/10 border border-wedding-gold/20 rounded-xl p-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-wedding-gold shrink-0 mt-0.5" />
                  <p className="text-sm text-wedding-text/70">
                    Son muchas fotos: puede tardar un par de minutos. Deja esta pantalla abierta hasta que termine.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-wedding-text/70 mb-1 ml-1">Tu nombre (opcional)</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ej: Familia García" /* >>> CAMBIAR AQUI (opcional) <<< texto de ejemplo */
                    className="w-full bg-white border border-wedding-sage/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-sage/30 transition-all text-wedding-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-wedding-text/70 mb-1 ml-1">Mensaje (opcional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="¡Vivan los novios!" /* >>> CAMBIAR AQUI (opcional) <<< texto de ejemplo */
                    rows={3}
                    className="w-full bg-white border border-wedding-sage/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-wedding-sage/30 transition-all text-wedding-text resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-8 bg-wedding-sage hover:bg-wedding-sageDark text-white font-semibold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Subiendo... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    <span>Enviar {selectedFiles.length > 1 ? `${selectedFiles.length} fotos` : 'foto'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante principal */}
      <div className="fixed bottom-8 left-0 right-0 px-4 z-40 flex justify-center">
        <button
          onClick={handleButtonClick}
          disabled={isUploading || showForm}
          className="w-full max-w-md bg-wedding-sage hover:bg-wedding-sageDark transition-colors text-white shadow-2xl rounded-full py-5 px-6 text-xl font-semibold flex items-center justify-center gap-3 active:scale-95 disabled:opacity-90 disabled:scale-100"
          style={{ boxShadow: '0 10px 40px -10px rgba(124, 152, 133, 0.7)' }}
        >
          <Camera className="w-7 h-7 text-wedding-gold" />
          <span>¡Sube tus fotos!</span>
        </button>
      </div>
    </>
  );
}
