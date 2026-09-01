import React, { useState } from 'react';
import { UserProfile } from '../types';
import { playCutePop } from '../utils/audio';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface SettingsViewProps {
  currentUser: 'Sapo' | 'Mi Rey';
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  onUpdateSapoProfile: (profile: UserProfile) => void;
  onUpdateMiReyProfile: (profile: UserProfile) => void;
  onBackToLobby: () => void;
}

// Popular timezones with friendly names
const TIMEZONES = [
  { label: '🇪🇨 Guayaquil / Quito (UTC−5)', value: 'America/Guayaquil' },
  { label: '🇲🇽 Ciudad de México (UTC−6)', value: 'America/Mexico_City' },
  { label: '🇨🇴 Bogotá / Lima (UTC−5)', value: 'America/Bogota' },
  { label: '🇻🇪 Caracas (UTC−4)', value: 'America/Caracas' },
  { label: '🇧🇷 São Paulo (UTC−3)', value: 'America/Sao_Paulo' },
  { label: '🇦🇷 Buenos Aires (UTC−3)', value: 'America/Argentina/Buenos_Aires' },
  { label: '🇨🇱 Santiago (UTC−3/−4)', value: 'America/Santiago' },
  { label: '🇺🇸 Nueva York (UTC−5/−4)', value: 'America/New_York' },
  { label: '🇺🇸 Los Ángeles (UTC−8/−7)', value: 'America/Los_Angeles' },
  { label: '🇬🇧 Londres (UTC+0/+1)', value: 'Europe/London' },
  { label: '🇦🇷 Argentina (UTC+1/+2)', value: 'America/Argentina/Buenos_Aires' },
  { label: '🇫🇷 París (UTC+1/+2)', value: 'Europe/Paris' },
  { label: '🇩🇪 Berlín (UTC+1/+2)', value: 'Europe/Berlin' },
  { label: '🇮🇹 Roma (UTC+1/+2)', value: 'Europe/Rome' },
  { label: '🇯🇵 Tokio (UTC+9)', value: 'Asia/Tokyo' },
  { label: '🇨🇳 Pekín (UTC+8)', value: 'Asia/Shanghai' },
  { label: '🇦🇪 Dubái (UTC+4)', value: 'Asia/Dubai' },
  { label: '🇮🇳 Nueva Delhi (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: '🇦🇺 Sídney (UTC+10/+11)', value: 'Australia/Sydney' },
];

// Quick-pick preset locations
const LOCATION_PRESETS = [
  { city: 'Guayaquil', country: 'Ecuador', timezone: 'America/Guayaquil', flag: '🇪🇨' },
  { city: 'Argentina', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { city: 'Ciudad de México', country: 'México', timezone: 'America/Mexico_City', flag: '🇲🇽' },
  { city: 'Bogotá', country: 'Colombia', timezone: 'America/Bogota', flag: '🇨🇴' },
  { city: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { city: 'São Paulo', country: 'Brasil', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { city: 'Miami', country: 'EE.UU.', timezone: 'America/New_York', flag: '🇺🇸' },
  { city: 'Nueva York', country: 'EE.UU.', timezone: 'America/New_York', flag: '🇺🇸' },
  { city: 'Los Ángeles', country: 'EE.UU.', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { city: 'Londres', country: 'Reino Unido', timezone: 'Europe/London', flag: '🇬🇧' },
  { city: 'París', country: 'Francia', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { city: 'Tokio', country: 'Japón', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
];

interface ProfileEditorProps {
  label: string;
  emoji?: string;
  accentColor: string;
  profile: UserProfile;
  otherProfilePin: string;
  onSave: (updated: UserProfile) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ label, emoji = '', accentColor, profile, otherProfilePin, onSave }) => {
  const [name, setName] = useState(profile.name);
  const [status, setStatus] = useState(profile.statusPhrase);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState(profile.country);
  const [timezone, setTimezone] = useState(
    // Map legacy UTC string to IANA timezone
    profile.timezone?.startsWith('America/') || profile.timezone?.startsWith('Europe/') || profile.timezone?.startsWith('Asia/')
      ? profile.timezone
      : profile.city === 'Guayaquil' ? 'America/Guayaquil' : 'America/Argentina/Buenos_Aires'
  );
  const [push, setPush] = useState(profile.pushAlerts);
  const [sound, setSound] = useState(profile.soundEffects);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showLocationPresets, setShowLocationPresets] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isTraveling, setIsTraveling] = useState(profile.isTraveling || false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    if (storage) {
      try {
        const fileRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        setAvatar(url);
      } catch (err: any) {
        console.error(err);
        setUploadError('Error al subir avatar a Firebase.');
      } finally {
        setUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setCity(preset.city);
    setCountry(preset.country);
    setTimezone(preset.timezone);
    setShowLocationPresets(false);
    playCutePop();
  };

  const handleSave = () => {
    // Validate PIN if provided
    if (pin) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setPinError('El PIN debe tener 4 dígitos numéricos');
        return;
      }
      if (pin !== confirmPin) {
        setPinError('Los PINs no coinciden');
        return;
      }
      
      const otherUserPin = otherProfilePin || (label === 'Mi Rey' ? '1111' : '0000');
      
      if (pin === otherUserPin) {
        setPinError('El PIN debe ser diferente al de tu pareja');
        return;
      }

      setPin('');
      setConfirmPin('');
    }
    setPinError('');

    onSave({
      ...profile,
      name,
      statusPhrase: status,
      avatar,
      pin: pin || profile.pin,
      city,
      country,
      timezone,
      isTraveling,
      pushAlerts: push,
      soundEffects: sound,
    });

    setSavedFlash(true);
    playCutePop();
    setTimeout(() => setSavedFlash(false), 2000);
  };

  // Preview current time in selected timezone
  const previewTime = new Date().toLocaleTimeString('es-ES', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex flex-col gap-5 bg-[#25193d]/80 p-6 rounded-2xl border border-[#5a4042]/20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={avatar}
            alt={`Avatar ${label}`}
            className="w-20 h-20 rounded-full object-cover shadow-xl"
            style={{ border: `3px solid ${accentColor}60`, boxShadow: `0 0 20px ${accentColor}30` }}
          />
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-[#25193d]"
            style={{ background: accentColor }}
          >
            {emoji}
          </div>
          {isTraveling && (
            <div className="absolute -top-1 -right-1 bg-[#fabc41] text-[#180c30] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              ✈️ viaje
            </div>
          )}
        </div>
        <div>
          <span className="font-label-mono text-xs uppercase tracking-widest font-bold" style={{ color: accentColor }}>
            {label}
          </span>
          <h2 className="font-headline-md text-xl text-white">{name}</h2>
          <p className="text-[11px] text-[#e2bec0]/50 font-label-mono">{city}, {country} • {previewTime}</p>
        </div>
        {savedFlash && (
          <span className="ml-auto text-[10px] font-label-caps text-[#7adaa1] bg-[#7adaa1]/20 px-2 py-1 rounded-full border border-[#7adaa1]/30 animate-pop">
            ✓ Guardado
          </span>
        )}
      </div>

      {/* Name & Status */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="font-label-caps text-[10px] text-[#e2bec0]/60 uppercase tracking-wider">Nombre</label>
          <div className="bg-[#2f2348] rounded-xl px-4 py-2.5 flex items-center gap-2 border border-[#5a4042]/30">
            <span className="material-symbols-outlined text-[#e2bec0]/40 text-sm">person</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent text-white w-full outline-none font-body-md text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label-caps text-[10px] text-[#e2bec0]/60 uppercase tracking-wider">Frase de Estado</label>
          <div className="bg-[#2f2348] rounded-xl px-4 py-2.5 flex items-center gap-2 border border-[#5a4042]/30">
            <span className="material-symbols-outlined text-[#e2bec0]/40 text-sm">format_quote</span>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent text-white w-full outline-none font-body-md text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label-caps text-[10px] text-[#e2bec0]/60 uppercase tracking-wider">Foto de Perfil (Avatar)</label>
          <div className="flex flex-col gap-2 bg-[#201439] border border-[#5a4042]/40 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <label className="flex-1 bg-[#ff5470] hover:bg-[#ff6b84] text-white text-xs font-bold py-2 px-3 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md">
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                {uploading ? 'Subiendo...' : 'Seleccionar Foto'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-[#e2bec0]/60">O pega una URL</span>
            </div>

            {uploadError && (
              <span className="text-[9px] text-[#ff5470] font-label-mono bg-[#ff5470]/10 p-2 rounded-lg border border-[#ff5470]/20 mt-1">
                ⚠️ {uploadError}
              </span>
            )}

            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="bg-black/30 rounded-lg px-3 py-1.5 text-white w-full outline-none font-label-mono text-[10px] border border-[#5a4042]/20 mt-1"
              placeholder="Pega la URL del avatar..."
            />
          </div>
        </div>
      </div>

      {/* ── LOCATION SECTION ── */}
      <div className="border-t border-[#5a4042]/20 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: accentColor }}>location_on</span>
            <label className="font-label-caps text-[10px] text-[#e2bec0]/60 uppercase tracking-wider">Ubicación Actual</label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] text-[#fabc41] font-label-caps uppercase tracking-wide">
              {isTraveling ? '✈️ De viaje' : 'En casa'}
            </span>
            <div
              onClick={() => setIsTraveling(!isTraveling)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isTraveling ? 'bg-[#fabc41]' : 'bg-[#3a2e54]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isTraveling ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>

        {/* Quick location presets */}
        <button
          onClick={() => setShowLocationPresets(!showLocationPresets)}
          className="w-full flex items-center justify-between bg-[#2f2348] hover:bg-[#3a2e54] rounded-xl px-4 py-3 border border-[#5a4042]/30 transition-colors mb-2 group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {LOCATION_PRESETS.find(p => p.city === city)?.flag || '🌍'}
            </span>
            <span className="text-white text-sm font-medium">{city}, {country}</span>
          </div>
          <div className="flex items-center gap-1 text-[#e2bec0]/50 text-xs">
            <span className="font-label-mono">{previewTime}</span>
            <span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform">{showLocationPresets ? 'expand_less' : 'expand_more'}</span>
          </div>
        </button>

        {/* Preset grid */}
        {showLocationPresets && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 animate-pop">
            {LOCATION_PRESETS.map((preset) => (
              <button
                key={preset.city}
                onClick={() => handlePreset(preset)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 border ${
                  city === preset.city
                    ? 'border-[#7adaa1]/50 text-[#7adaa1]'
                    : 'border-[#5a4042]/20 text-[#e2bec0]/70 hover:text-white'
                }`}
                style={{ background: city === preset.city ? `${accentColor}15` : '#2f2348' }}
              >
                <span>{preset.flag}</span>
                <span className="truncate">{preset.city}</span>
              </button>
            ))}
          </div>
        )}

        {/* Manual input */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[9px] text-[#e2bec0]/40 uppercase tracking-wider">Ciudad</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-[#2f2348] rounded-xl px-3 py-2 text-white text-xs w-full outline-none border border-[#5a4042]/30"
              placeholder="Ej: Guayaquil"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[9px] text-[#e2bec0]/40 uppercase tracking-wider">País</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-[#2f2348] rounded-xl px-3 py-2 text-white text-xs w-full outline-none border border-[#5a4042]/30"
              placeholder="Ej: Ecuador"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="font-label-caps text-[9px] text-[#e2bec0]/40 uppercase tracking-wider">Zona Horaria</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="bg-[#2f2348] rounded-xl px-3 py-2 text-white text-xs w-full outline-none border border-[#5a4042]/30 cursor-pointer appearance-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p className="text-[9px] text-[#e2bec0]/30 font-label-mono mt-0.5">
            Hora actual allá: <span style={{ color: accentColor }}>{previewTime}</span>
          </p>
        </div>
      </div>

      {/* ── PIN SECTION ── */}
      <div className="border-t border-[#5a4042]/20 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-base" style={{ color: accentColor }}>lock</span>
          <label className="font-label-caps text-[10px] text-[#e2bec0]/60 uppercase tracking-wider">Cambiar PIN de Acceso</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[9px] text-[#e2bec0]/40 uppercase tracking-wider">Nuevo PIN (4 dígitos)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="bg-[#2f2348] rounded-xl px-3 py-2 text-white text-center font-label-mono text-lg w-full outline-none border border-[#5a4042]/30 tracking-[0.5em]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[9px] text-[#e2bec0]/40 uppercase tracking-wider">Confirmar PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="bg-[#2f2348] rounded-xl px-3 py-2 text-white text-center font-label-mono text-lg w-full outline-none border border-[#5a4042]/30 tracking-[0.5em]"
            />
          </div>
        </div>
        {pinError && <p className="text-[10px] text-[#ff5470] mt-1">{pinError}</p>}
        {!pin && <p className="text-[9px] text-[#e2bec0]/30 font-label-mono mt-1">Deja vacío para mantener el PIN actual</p>}
      </div>

      {/* Toggles */}
      <div className="border-t border-[#5a4042]/20 pt-4 flex flex-col gap-2">
        <label className="flex items-center justify-between bg-[#2f2348] p-3 rounded-xl cursor-pointer">
          <span className="text-xs text-white font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>notifications_active</span>
            Alertas Push
          </span>
          <input
            type="checkbox"
            checked={push}
            onChange={(e) => setPush(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
            style={{ accentColor }}
          />
        </label>
        <label className="flex items-center justify-between bg-[#2f2348] p-3 rounded-xl cursor-pointer">
          <span className="text-xs text-white font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: accentColor }}>volume_up</span>
            Efectos de Sonido
          </span>
          <input
            type="checkbox"
            checked={sound}
            onChange={(e) => setSound(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
            style={{ accentColor }}
          />
        </label>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="py-2.5 rounded-xl font-label-caps uppercase text-xs tracking-wider font-bold shadow-md active:scale-95 transition-all text-[#180c30]"
        style={{ background: accentColor, boxShadow: `0 4px 16px ${accentColor}40` }}
      >
        Guardar {label} ✓
      </button>
    </div>
  );
};

// ── Main Settings View ─────────────────────────────────────────────────────────
export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  sapoProfile,
  miReyProfile,
  onUpdateSapoProfile,
  onUpdateMiReyProfile,
  onBackToLobby,
}) => {
  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#180c30] pb-32">
      <div className="flex flex-col w-full max-w-5xl mx-auto gap-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 text-xs font-label-caps uppercase text-[#e2bec0] hover:text-white bg-[#2f2348] px-4 py-2 rounded-xl border border-[#5a4042]/30 hover:bg-[#3a2e54] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver
          </button>
          <div>
            <h1 className="font-headline-lg text-2xl md:text-3xl text-white">Configuración</h1>
            <p className="text-xs text-[#e2bec0]/40 font-label-mono mt-0.5">
              Cambia ubicación si estás de viaje ✈️
            </p>
          </div>
        </div>

        {/* Profile card (Only show current user) */}
        <div className="w-full max-w-2xl mx-auto">
          {currentUser === 'Sapo' ? (
            <ProfileEditor
              label={sapoProfile.name}
              
              accentColor="#7adaa1"
              profile={sapoProfile}
              otherProfilePin={miReyProfile.pin || '0000'}
              onSave={onUpdateSapoProfile}
            />
          ) : (
            <ProfileEditor
              label={miReyProfile.name}
              emoji=""
              accentColor="#fabc41"
              profile={miReyProfile}
              otherProfilePin={sapoProfile.pin || '1111'}
              onSave={onUpdateMiReyProfile}
            />
          )}
        </div>


      </div>
    </div>
  );
};
