import React, { useState, useCallback, useEffect } from 'react';
import { UserProfile } from '../types';
import { playCutePop } from '../utils/audio';
import confetti from 'canvas-confetti';

interface LoginViewProps {
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  onLogin: (user: 'Sapo' | 'Mi Rey') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ sapoProfile, miReyProfile, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [successFor, setSuccessFor] = useState<'Sapo' | 'Mi Rey' | null>(null);

  // Helper to read PINs
  const getSapoPin = () => localStorage.getItem('ourlobby_pin_sapo') || '1111';
  const getMiReyPin = () => localStorage.getItem('ourlobby_pin_mirey') || '0000';

  const handleKey = useCallback(
    (digit: string) => {
      if (successFor) return; // Block input if already succeeded

      if (digit === 'back') {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (pin.length >= 4) return;
      const next = pin + digit;
      setPin(next);

      if (next.length === 4) {
        const sapoPin = getSapoPin();
        const miReyPin = getMiReyPin();

        if (next === sapoPin) {
          setSuccessFor('Sapo');
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#7adaa1', '#eaddff'] });
          setTimeout(() => onLogin('Sapo'), 800);
        } else if (next === miReyPin) {
          setSuccessFor('Mi Rey');
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#fabc41', '#eaddff'] });
          setTimeout(() => onLogin('Mi Rey'), 800);
        } else {
          // Error
          setError(true);
          setShake(true);
          playCutePop();
          setTimeout(() => {
            setPin('');
            setError(false);
            setShake(false);
          }, 600);
        }
      }
    },
    [pin, successFor, onLogin]
  );

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleKey('back');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const dots = Array(4).fill(0).map((_, i) => i < pin.length);
  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  // Determine colors based on success
  const accentColor = successFor === 'Sapo' ? '#7adaa1' : successFor === 'Mi Rey' ? '#fabc41' : '#ff5470';

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/login-bg.png')` }}
    >
      {/* Dark overlay to ensure readability */}
      <div className="absolute inset-0 bg-[#180c30]/70 backdrop-blur-[2px]"></div>

      {/* Ambient background on top of overlay */}
      <div className="absolute inset-0 pointer-events-none transition-colors duration-1000 z-0"
           style={{ backgroundColor: successFor ? `${accentColor}10` : 'transparent' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff5470]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#fabc41]/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#7adaa1]/5 rounded-full blur-[80px]" />
      </div>

      {/* Stars */}
      {Array(20).fill(0).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Central Lock / Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="relative mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 ${successFor ? 'scale-110 shadow-[0_0_50px_rgba(255,255,255,0.3)]' : 'bg-[#2E2247]/50 shadow-[0_0_30px_rgba(255,84,112,0.15)] border border-[#ff5470]/20 animate-pulse'}`}
                 style={{ backgroundColor: successFor ? accentColor : undefined }}>
              <span className={`material-symbols-outlined text-4xl transition-all duration-500 ${successFor ? 'text-[#180c30]' : 'text-[#ff5470]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {successFor ? 'favorite' : 'lock'}
              </span>
            </div>
            
            {/* Avatars pop out on success */}
            {successFor && (
              <img 
                src={successFor === 'Sapo' ? sapoProfile.avatar : miReyProfile.avatar} 
                alt="Avatar" 
                className="absolute inset-0 w-24 h-24 rounded-full object-cover border-4 border-[#180c30] animate-pop"
              />
            )}
          </div>
          
          <h1 className="font-display-lg text-4xl text-white tracking-tight mb-2">Our Lobby</h1>
          <p className="font-body-md text-[#e2bec0]/70 text-sm">
            {successFor ? `¡Bienvenido/a mi amor! 💖` : 'Introduce tu llave secreta'}
          </p>
        </div>

        {/* PIN Pad Container */}
        <div className="bg-[#2E2247]/80 backdrop-blur-xl border border-[#5a4042]/30 rounded-[2rem] p-8 shadow-2xl w-full">
          {/* PIN dots */}
          <div className={`flex justify-center gap-5 mb-8 ${shake ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}
            style={{ animation: shake ? 'shake 0.5s ease-in-out' : undefined }}>
            {dots.map((filled, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  successFor
                    ? 'scale-110'
                    : error
                    ? 'bg-[#ff5470] border-[#ff5470]'
                    : filled
                    ? 'border-[#eaddff] bg-[#eaddff] scale-110 shadow-[0_0_10px_rgba(234,221,255,0.5)]'
                    : 'border-[#5a4042]/50'
                }`}
                style={{ 
                  backgroundColor: successFor ? accentColor : undefined,
                  borderColor: successFor ? accentColor : undefined
                }}
              />
            ))}
          </div>

          {/* Numeric keypad */}
          <div className={`grid grid-cols-3 gap-4 transition-opacity duration-300 ${successFor ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {keypadButtons.map((btn, i) => {
              if (btn === '') return <div key={i} />;
              return (
                <button
                  key={i}
                  onClick={() => handleKey(btn)}
                  disabled={!!successFor}
                  className={`
                    h-16 rounded-2xl font-headline-md text-2xl transition-all duration-150
                    active:scale-90 select-none
                    ${btn === 'back'
                      ? 'bg-[#5a4042]/30 text-[#e2bec0] hover:bg-[#5a4042]/50 flex items-center justify-center'
                      : 'bg-[#221934] text-white hover:bg-[#3a2e54] hover:shadow-[0_0_16px_rgba(255,84,112,0.2)] border border-[#5a4042]/20'}
                  `}
                >
                  {btn === 'back'
                    ? <span className="material-symbols-outlined text-2xl">backspace</span>
                    : btn}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-[10px] text-[#e2bec0]/30 font-label-mono uppercase tracking-widest text-center">
          Privado • Solo para los dos • Since 2026
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};
