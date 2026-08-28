import React, { useState } from 'react';
import { MemoryItem, UserProfile } from '../types';
import { playCutePop } from '../utils/audio';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface MemoryVaultViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: MemoryItem) => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

export const MemoryVaultView: React.FC<MemoryVaultViewProps> = ({
  memories,
  onAddMemory,
  sapoProfile,
  miReyProfile,
}) => {
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Memory Form state
  const [newQuote, setNewQuote] = useState('');
  const [newLocation, setNewLocation] = useState('Guayaquil');
  const [newDate, setNewDate] = useState('Hoy');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCapturedBy, setNewCapturedBy] = useState<'Sapo' | 'Mi Rey' | 'Together'>('Sapo');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    if (storage) {
      try {
        const fileRef = ref(storage, `memories/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setNewImageUrl(url);
      } catch (err: any) {
        console.error(err);
        setUploadError(
          'Error al subir a Firebase. Es probable que necesites activar las reglas públicas de Storage.'
        );
      } finally {
        setUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.trim()) return;

    const newMem: MemoryItem = {
      id: 'mem-' + Date.now(),
      quote: newQuote.trim(),
      location: newLocation || 'Guayaquil ⇄ Madrid',
      date: newDate || 'Hoy',
      imageUrl: newImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrXJhdnTDkGXibcRSmS19OuEZvTma5vzF05UtT0TrAd9PwKf1c3fBpvP1tdOLtdzS-BN8YCTiwyOv1MY02EBNvtSGR8xJFdU_wolnNUALZZBDSj3Oea9An2oCjf1A-8OBmFueyU169Nw7yoQx6tUBmDhXpCFREU6dbUdAplOvzTgmslPwIjNNdKMOvlt6pTv7wZ_gfumpj573bTJ97sAafYEvFJzdLfoBs3XT4sLaTnPKt1Ele1s5a',
      capturedBy: newCapturedBy,
      rotation: Math.random() > 0.5 ? 'rotate-2' : '-rotate-2',
    };

    onAddMemory(newMem);
    playCutePop();
    setNewQuote('');
    setNewImageUrl('');
    setUploadError(null);
    setIsAddModalOpen(false);
  };

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32">
      <div className="flex flex-col w-full relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-[48px] text-[#ffb2b8] tracking-tight font-display-lg drop-shadow-[0_4px_24px_rgba(255,178,184,0.3)]">
              Memory Vault
            </h1>
            <p className="text-sm md:text-base text-[#e2bec0] mt-1 font-body-md">
              A chronicle of us across distances. Nuestras fotos y momentos inolvidables.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#ff5470] hover:bg-[#ff6b84] text-white px-5 py-2.5 rounded-full font-headline-md text-sm shadow-lg hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Añadir Recuerdo
          </button>
        </div>

        {/* Polaroid Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4 w-full">
          {memories.map((mem) => {
            const isWide = mem.isWide;
            return (
              <div
                key={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className={`bg-[#faf9f6] p-4 pb-6 rounded-sm shadow-[0_12px_24px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-300 relative group ${
                  mem.rotation || ''
                } flex flex-col h-full border border-gray-200 cursor-pointer ${
                  isWide ? 'md:col-span-2 lg:col-span-2 border-2 border-[#ff5470]/40' : ''
                }`}
              >
                {/* Photo container */}
                <div className="w-full overflow-hidden rounded-xs mb-4 shadow-inner bg-stone-200">
                  <img
                    src={mem.imageUrl}
                    alt={mem.quote}
                    className={`w-full ${isWide ? 'aspect-[2/1]' : 'aspect-square'} object-cover group-hover:scale-105 transition-transform duration-500`}
                  />
                </div>

                {/* Top Meta */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] text-[#3a2e54] uppercase tracking-wider font-bold font-label-caps">
                    {mem.date}
                  </span>
                  <span className="text-[12px] text-[#3a2e54] flex items-center gap-1 font-label-mono font-medium">
                    <span className="material-symbols-outlined text-[16px] text-[#43a470]">location_on</span>
                    {mem.location}
                  </span>
                </div>

                {/* Special Title if any */}
                {mem.title && (
                  <h3 className="text-xl md:text-2xl font-headline-lg text-[#b71b40] mb-1 px-1 font-bold text-center">
                    {mem.title}
                  </h3>
                )}

                {/* Quote */}
                <p className={`text-[#180c30] font-headline-md italic mb-4 px-1 flex-grow ${isWide ? 'text-lg text-center' : 'text-sm md:text-base'}`}>
                  "{mem.quote}"
                </p>

                {/* Author footer */}
                <div className={`flex items-center gap-2 mt-auto border-t border-gray-300 pt-3 px-1 ${isWide ? 'justify-center' : ''}`}>
                  {mem.capturedBy === 'Together' ? (
                    <div className="flex -space-x-2">
                      <img
                        alt="Sapo"
                        src={sapoProfile.avatar}
                        className="w-6 h-6 rounded-full border border-[#7adaa1]"
                      />
                      <img
                        alt="Mi Rey"
                        src={miReyProfile.avatar}
                        className="w-6 h-6 rounded-full border border-[#fabc41]"
                      />
                    </div>
                  ) : (
                    <img
                      alt={mem.capturedBy}
                      src={mem.capturedBy === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar}
                      className={`w-6 h-6 rounded-full border ${mem.capturedBy === 'Sapo' ? 'border-[#7adaa1]' : 'border-[#fabc41]'}`}
                    />
                  )}
                  <span className="text-[10px] text-[#3a2e54] font-label-mono uppercase font-bold tracking-wider">
                    {mem.capturedBy === 'Together' ? 'Captured Together' : `Captured by ${mem.capturedBy}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Action Button for mobile */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#ff5470] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(255,84,112,0.4)] hover:scale-110 hover:shadow-[0_12px_32px_rgba(255,84,112,0.6)] transition-all duration-300 z-50 group border border-white/20 sm:hidden"
        >
          <span className="material-symbols-outlined text-[28px] group-hover:rotate-90 transition-transform duration-300">add</span>
        </button>
      </div>

      {/* Lightbox / Memory Detail View Modal */}
      {selectedMemory && (
        <div 
          onClick={() => setSelectedMemory(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#faf9f6] text-[#180c30] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-pop overflow-hidden"
          >
            <button
              onClick={() => setSelectedMemory(null)}
              className="absolute top-4 right-4 bg-[#180c30]/80 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#180c30] transition-colors z-20"
            >
              ✕
            </button>
            <div className="w-full max-h-[60vh] overflow-hidden rounded-xl mb-4 bg-stone-900 flex items-center justify-center">
              <img
                src={selectedMemory.imageUrl}
                alt={selectedMemory.quote}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-label-mono text-stone-600 mb-2">
              <span className="font-bold">{selectedMemory.date}</span>
              <span className="flex items-center gap-1 font-bold text-[#43a470]">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {selectedMemory.location}
              </span>
            </div>
            {selectedMemory.title && (
              <h2 className="font-headline-lg text-2xl text-[#b71b40] mb-2">{selectedMemory.title}</h2>
            )}
            <p className="font-headline-md text-lg italic text-[#25193d] mb-4">
              "{selectedMemory.quote}"
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-stone-300">
              <span className="text-xs font-label-caps uppercase text-stone-500">
                Fotografía para nuestro santuario privado
              </span>
              <span className="text-xs font-bold font-label-mono bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                {selectedMemory.capturedBy}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2E2247] border border-[#5a4042]/30 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative text-white">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-[#e2bec0] hover:text-white w-8 h-8 rounded-full bg-[#201439] flex items-center justify-center"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#ffb2b8] text-3xl">add_photo_alternate</span>
              <h2 className="font-headline-lg text-2xl text-white">Nuevo Recuerdo Polaroid</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider mb-1.5">
                  Frase o Dedicatoria
                </label>
                <textarea
                  required
                  rows={3}
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder="Escribe lo que sentiste en ese momento..."
                  className="w-full bg-[#201439] border border-[#5a4042]/40 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5470]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider mb-1.5">
                    Lugar
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Guayaquil / Madrid"
                    className="w-full bg-[#201439] border border-[#5a4042]/40 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5470]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="Ej. 14 Mar 2024"
                    className="w-full bg-[#201439] border border-[#5a4042]/40 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5470]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider mb-1.5">
                  Foto del Recuerdo
                </label>
                <div className="flex flex-col gap-2 bg-[#201439] border border-[#5a4042]/40 rounded-xl p-3.5">
                  {/* File Selector */}
                  <div className="flex items-center gap-3">
                    <label className="flex-1 bg-[#ff5470] hover:bg-[#ff6b84] text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md">
                      <span className="material-symbols-outlined text-sm">cloud_upload</span>
                      {uploading ? 'Subiendo...' : 'Seleccionar Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-[#e2bec0]/60">O pega una URL abajo</span>
                  </div>

                  {/* Upload status / error */}
                  {uploadError && (
                    <div className="text-[10px] text-[#ff5470] font-label-mono leading-relaxed bg-[#ff5470]/10 p-2.5 rounded-lg border border-[#ff5470]/30 mt-1">
                      ⚠️ {uploadError}
                      <div className="mt-1 text-white/80">
                        Pega las siguientes reglas en la pestaña <b>Rules</b> de Firebase Storage en tu consola de Google:
                        <pre className="bg-black/50 p-2.5 rounded-lg mt-1 text-[9px] font-mono whitespace-pre-wrap select-all text-left">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`}
                        </pre>
                      </div>
                    </div>
                  )}

                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Pega la URL de la imagen aquí..."
                    className="w-full bg-black/30 border border-[#5a4042]/30 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5470] mt-2"
                  />

                  {newImageUrl && (
                    <div className="mt-2 relative rounded-lg overflow-hidden aspect-video bg-black/40 border border-[#ff5470]/20">
                      <img src={newImageUrl} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewImageUrl('')}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-label-mono text-[#e2bec0] uppercase tracking-wider mb-1.5">
                  ¿Quién lo capturó?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCapturedBy('Sapo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-label-caps uppercase border transition-all ${
                      newCapturedBy === 'Sapo'
                        ? 'bg-[#7adaa1] text-[#003920] border-[#7adaa1] font-bold shadow-md'
                        : 'border-[#5a4042]/40 text-[#e2bec0]'
                    }`}
                  >
                    Sapo 🐸
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCapturedBy('Mi Rey')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-label-caps uppercase border transition-all ${
                      newCapturedBy === 'Mi Rey'
                        ? 'bg-[#fabc41] text-[#422d00] border-[#fabc41] font-bold shadow-md'
                        : 'border-[#5a4042]/40 text-[#e2bec0]'
                    }`}
                  >
                    Mi Rey 👑
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCapturedBy('Together')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-label-caps uppercase border transition-all ${
                      newCapturedBy === 'Together'
                        ? 'bg-[#ff5470] text-white border-[#ff5470] font-bold shadow-md'
                        : 'border-[#5a4042]/40 text-[#e2bec0]'
                    }`}
                  >
                    Ambos ❤️
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#ff5470] hover:bg-[#ff6b84] text-white py-3.5 rounded-2xl font-headline-md text-base font-bold shadow-xl active:scale-95 transition-all"
                >
                  Guardar en Memory Vault ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
