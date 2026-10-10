import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { useSyncedDoc } from '../lib/useFirestore';

interface TuttiFruttiViewProps {
  currentUser: 'Baby' | 'Mi Rey';
  babyProfile: UserProfile;
  miReyProfile: UserProfile;
  onBack: () => void;
}

type Phase = 'lobby' | 'game' | 'review';

interface TuttiFruttiSyncState {
  phase: 'lobby' | 'game' | 'review';
  availableCategories: { id: string; name: string; icon: string }[];
  selectedCategories: { id: string; name: string; icon: string }[];
  currentLetter: string;
  gameStartTime: number | null;
  lastRoundResult?: {
    BabyScore: number;
    MiReyScore: number;
    timestamp: number;
  } | null;
  playersData: {
    Baby: {
      inputs: string[];
      scoresGiven: (number | null)[];
      isReady: boolean;
      inGame: boolean;
      score: number;
    };
    'Mi Rey': {
      inputs: string[];
      scoresGiven: (number | null)[];
      isReady: boolean;
      inGame: boolean;
      score: number;
    };
  };
}

const INITIAL_CATEGORIES = [
  { id: 'c1', name: 'Nombre o Apodo de Pareja', icon: 'favorite' },
  { id: 'c2', name: 'Lugar Para Próxima Cita', icon: 'restaurant' },
  { id: 'c3', name: 'Comida o Antojo Cómplice', icon: 'lunch_dining' },
  { id: 'c4', name: 'Cosa que me Recuerda a Ti', icon: 'redeem' },
  { id: 'c5', name: 'Canción o Película Nuestra', icon: 'movie' },
  { id: 'c6', name: 'Objeto / Regalo Soñado', icon: 'shopping_bag' },
  { id: 'c7', name: 'Palabra Caliente / Sexy', icon: 'local_fire_department' },
  { id: 'c8', name: 'Excusas que Decimos', icon: 'record_voice_over' },
];

export const TuttiFruttiView: React.FC<TuttiFruttiViewProps> = ({
  currentUser,
  babyProfile,
  miReyProfile,
  onBack,
}) => {
  const defaultGameState: TuttiFruttiSyncState = {
    phase: 'lobby',
    availableCategories: INITIAL_CATEGORIES,
    selectedCategories: INITIAL_CATEGORIES.slice(0, 6),
    currentLetter: '?',
    gameStartTime: null,
    playersData: {
      Baby: { inputs: ['', '', '', '', '', ''], scoresGiven: [0, 0, 0, 0, 0, 0], isReady: false, inGame: false, score: 0 },
      'Mi Rey': { inputs: ['', '', '', '', '', ''], scoresGiven: [0, 0, 0, 0, 0, 0], isReady: false, inGame: false, score: 0 },
    }
  };

  const [gameState, setGameState] = useSyncedDoc<TuttiFruttiSyncState>(
    'games',
    'tuttifrutti',
    'ourlobby_tuttifrutti',
    defaultGameState
  );

  const { phase, availableCategories, selectedCategories, currentLetter, playersData, gameStartTime } = gameState;
  const myData = playersData[currentUser];
  const opponentData = playersData[currentUser === 'Baby' ? 'Mi Rey' : 'Baby'];

  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [localLetter, setLocalLetter] = useState('?');
  const displayLetter = isSpinning ? localLetter : currentLetter;
  
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameInputs, setGameInputs] = useState<string[]>(['', '', '', '', '', '']);

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  const lastSeenResultRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState.lastRoundResult && gameState.lastRoundResult.timestamp !== lastSeenResultRef.current) {
      lastSeenResultRef.current = gameState.lastRoundResult.timestamp;
      
      const myScore = currentUser === 'Baby' ? gameState.lastRoundResult.BabyScore : gameState.lastRoundResult.MiReyScore;
      const oppScore = currentUser === 'Baby' ? gameState.lastRoundResult.MiReyScore : gameState.lastRoundResult.BabyScore;
      
      const oppName = currentUser === 'Baby' ? miReyProfile.name : babyProfile.name;
      setCustomAlert({
        isOpen: true,
        title: '¡Ronda Terminada!',
        message: `Sumaste: ${myScore} puntos.\n${oppName} sumó: ${oppScore} puntos.`,
        type: 'success'
      });
    }
  }, [gameState.lastRoundResult, currentUser, babyProfile.name, miReyProfile.name]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'game' && gameStartTime && playersData.Baby.inGame && playersData['Mi Rey'].inGame) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining === 0 && !myData.isReady) {
          submitGame();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, gameStartTime, myData.isReady, playersData]);

  // Transition to game when both are inGame
  useEffect(() => {
    if (phase === 'lobby' && playersData.Baby.inGame && playersData['Mi Rey'].inGame && !gameStartTime) {
      setGameState(prev => ({
        ...prev,
        phase: 'game',
        gameStartTime: Date.now()
      }));
    }
  }, [phase, playersData, gameStartTime, setGameState]);

  // Transition to Review automatically when both are ready
  useEffect(() => {
    if (phase === 'game' && playersData.Baby.isReady && playersData['Mi Rey'].isReady) {
      setGameState(prev => ({ ...prev, phase: 'review' }));
    }
  }, [phase, playersData]);

  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'L', 'M', 'P', 'R', 'S', 'T', 'V'];
    let spins = 0;
    const interval = setInterval(() => {
      setLocalLetter(letters[Math.floor(Math.random() * letters.length)]);
      spins++;
      if (spins > 15) {
        clearInterval(interval);
        setIsSpinning(false);
        const finalLetter = letters[Math.floor(Math.random() * letters.length)];
        setLocalLetter(finalLetter);
        setGameState(prev => ({ ...prev, currentLetter: finalLetter }));
      }
    }, 100);
  };

  const startGame = () => {
    if (currentLetter === '?') {
      setCustomAlert({ isOpen: true, title: 'Falta la letra', message: "¡Gira la ruleta para elegir la letra primero!", type: 'warning' });
      return;
    }
    if (selectedCategories.length !== 6) {
      setCustomAlert({ isOpen: true, title: 'Categorías Incompletas', message: "Debes elegir exactamente 6 categorías.", type: 'warning' });
      return;
    }
    setGameInputs(['', '', '', '', '', '']);
    setTimeRemaining(60);
    setGameState(prev => ({
      ...prev,
      playersData: {
        ...prev.playersData,
        [currentUser]: { 
          ...prev.playersData[currentUser], 
          inputs: ['', '', '', '', '', ''], 
          isReady: false, 
          inGame: true 
        }
      }
    }));
  };

  const submitGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStartTime: 1, // Fuerza a que el tiempo se acabe instantáneamente para el otro jugador
      playersData: {
        ...prev.playersData,
        [currentUser]: {
          ...prev.playersData[currentUser],
          inputs: gameInputs,
          isReady: true,
        }
      }
    }));
  };

  const getAutoScore = (oppStr: string, myStr: string, letter: string): number | null => {
    const opp = oppStr.trim().toLowerCase();
    const my = myStr.trim().toLowerCase();
    
    if (opp === '') return 0;
    
    // Normalize to ignore accents (e.g. 'á' becomes 'a')
    const oppNormalized = opp.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const letterNormalized = letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    if (letter !== '?' && !oppNormalized.startsWith(letterNormalized)) return 0;
    if (opp === my) return 50;
    return null;
  };

  const toggleCategory = (cat: typeof INITIAL_CATEGORIES[0]) => {
    setGameState(prev => {
      const selected = prev.selectedCategories;
      if (selected.find(c => c.id === cat.id)) {
        return { ...prev, selectedCategories: selected.filter(c => c.id !== cat.id) };
      } else {
        if (selected.length < 6) {
          return { ...prev, selectedCategories: [...selected, cat] };
        }
      }
      return prev;
    });
  };

  const opponentProfile = currentUser === 'Baby' ? miReyProfile : babyProfile;

  // VENTANA 1: LOBBY (Interfaz 1)
  const renderLobby = () => (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 w-full max-w-5xl mx-auto">
      
      {/* Main Header Card */}
      <div className="bg-[#1b122f] p-6 rounded-2xl w-full border border-[#3b2d59] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[#fabc41] font-label-caps text-xs md:text-sm font-bold tracking-widest mb-3">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            EDICIÓN ESPECIAL AMOR A DISTANCIA <span className="text-[#ff5470] ml-2">Modo Libre</span>
            <button 
              onClick={() => {
                if(window.confirm('¿Reiniciar todos los datos a cero para hacer otra prueba?')) {
                  setGameState(defaultGameState);
                }
              }}
              className="ml-auto px-3 py-1 bg-[#ff5470]/20 text-[#ff5470] border border-[#ff5470]/50 rounded-full font-label-caps text-[10px] hover:bg-[#ff5470] hover:text-white transition-colors flex items-center shadow-sm"
            >
              <span className="material-symbols-outlined text-[12px] mr-1">restart_alt</span>
              Reset
            </button>
          </div>
          <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-3">
            Tutti Frutti <span className="text-[#fabc41]">del Amor</span> <span className="text-3xl">🍓</span>
          </h1>
          <p className="text-[#a499b8] font-body-sm md:text-base max-w-xl leading-relaxed">
            El reto definitivo entre nosotros. Piensa rápido, escribe con el corazón y prepárate para debatir cada respuesta y perder.
          </p>
        </div>
        
        {/* Profiles */}
        <div className="bg-[#120a22] p-5 rounded-2xl border border-[#3b2d59] flex items-center gap-6 md:gap-8 shrink-0 shadow-inner">
          <div className="flex flex-col items-center gap-1.5 relative">
            <div className="relative">
              <img src={babyProfile.avatar} className="w-16 h-16 rounded-full border-2 border-[#7adaa1] object-cover shadow-[0_0_15px_rgba(122,218,161,0.3)]" />
              <div className="absolute -bottom-1 -right-1 bg-[#7adaa1] text-[#120a22] rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              </div>
            </div>
            <span className="text-white font-label-caps text-xs mt-1 uppercase">{babyProfile.name} 🐸</span>
            <div className="flex items-center gap-1 bg-[#7adaa1]/10 px-2.5 py-0.5 rounded-full border border-[#7adaa1]/30">
               <span className="material-symbols-outlined text-[#7adaa1] text-[12px]">workspace_premium</span>
               <span className="text-[#7adaa1] font-label-mono text-[10px] font-bold tracking-widest">{playersData.Baby.score} PTS</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1.5 text-[#ff5470]">
             <span className="material-symbols-outlined text-2xl animate-pulse">favorite</span>
             <span className="font-label-mono text-[10px] tracking-widest text-[#a499b8]">4.200 km</span>
          </div>
          
          <div className="flex flex-col items-center gap-1.5 relative">
            <div className="relative">
              <img src={miReyProfile.avatar} className="w-16 h-16 rounded-full border-2 border-[#fabc41] object-cover shadow-[0_0_15px_rgba(250,188,65,0.3)]" />
              <div className="absolute -bottom-1 -right-1 bg-[#fabc41] text-[#120a22] rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              </div>
            </div>
            <span className="text-white font-label-caps text-xs mt-1 uppercase">{miReyProfile.name} 👑</span>
            <div className="flex items-center gap-1 bg-[#fabc41]/10 px-2.5 py-0.5 rounded-full border border-[#fabc41]/30">
               <span className="material-symbols-outlined text-[#fabc41] text-[12px]">workspace_premium</span>
               <span className="text-[#fabc41] font-label-mono text-[10px] font-bold tracking-widest">{playersData['Mi Rey'].score} PTS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Left Card (Letter Roulette) */}
        <div className="bg-[#1b122f] p-6 lg:p-8 rounded-2xl border border-[#3b2d59] flex flex-col items-center justify-between shadow-lg">
          <div className="w-full flex justify-between items-center mb-8">
            <span className="text-[#a499b8] font-label-caps text-xs font-bold tracking-widest">LETRA DE LA RONDA</span>
            <span className="bg-[#120a22] text-[#fabc41] border border-[#fabc41]/30 px-3 py-1 rounded-full font-label-mono text-[10px]">Dificultad: Amor</span>
          </div>
          
          <div className="relative w-48 h-48 flex items-center justify-center my-6">
            <div className="absolute inset-0 bg-[#fabc41]/10 blur-2xl rounded-full"></div>
            <div className={`absolute inset-0 border-2 border-dashed border-[#fabc41]/40 rounded-full transition-transform duration-[3000ms] ${isSpinning ? 'animate-spin' : ''}`}></div>
            <div className="absolute inset-4 bg-[#120a22] border border-[#fabc41]/20 rounded-full flex items-center justify-center shadow-inner">
              <span className="text-[#fabc41] font-display-lg text-7xl font-bold z-10 drop-shadow-[0_0_15px_rgba(250,188,65,0.5)]">
                {displayLetter}
              </span>
            </div>
          </div>

          <p className="text-[#a499b8] text-center font-body-sm mb-8 px-4 leading-relaxed">
            Todas las respuestas deberán comenzar exclusivamente con la letra <strong className="text-[#fabc41]">"{displayLetter}"</strong>.
          </p>
          
          <button 
            onClick={spinRoulette}
            disabled={isSpinning}
            className="w-full bg-[#251a3d] hover:bg-[#2d2148] border border-[#3b2d59] text-[#fabc41] font-headline-sm py-4 rounded-xl flex justify-center items-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined text-[20px]">casino</span>
            Girar Letra al Azar
          </button>
        </div>

        {/* Right Card (Categories) */}
        <div className="bg-[#1b122f] p-6 lg:p-8 rounded-2xl border border-[#3b2d59] flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-white font-headline-md flex items-center gap-3 text-2xl">
              <span className="material-symbols-outlined text-[#ff5470] text-2xl">category</span>
              6 Categorías Activas
            </h3>
            <button 
              onClick={() => setIsEditingCategories(!isEditingCategories)}
              className="border border-[#fabc41]/30 text-[#fabc41] px-5 py-2 rounded-full font-label-caps text-xs flex items-center gap-2 hover:bg-[#fabc41]/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">{isEditingCategories ? 'check' : 'edit'}</span> 
              {isEditingCategories ? 'Confirmar' : 'Personalizar'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow content-start">
            {(isEditingCategories ? availableCategories : selectedCategories).map((cat, idx) => {
              const isSelected = selectedCategories.find(c => c.id === cat.id);
              return (
                <div key={cat.id} className="relative group">
                  <button
                    onClick={() => isEditingCategories && toggleCategory(cat)}
                    disabled={!isEditingCategories}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 text-left transition-all ${
                      isSelected 
                        ? 'bg-[#120a22] border-[#3b2d59] border hover:border-[#ff5470]/50 shadow-inner' 
                        : 'bg-transparent border-transparent border opacity-50 hover:bg-[#120a22]'
                    } ${!isEditingCategories && 'cursor-default hover:border-[#3b2d59]'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#ff5470]/10 text-[#ff5470]' : 'bg-[#3b2d59]/50 text-[#a499b8]'}`}>
                      <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[#a499b8] font-label-mono text-[10px] uppercase tracking-wider mb-1">
                        Cat. {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className={`font-headline-sm text-sm truncate ${isSelected ? 'text-white' : 'text-[#a499b8]'}`}>
                        {cat.name.length > 20 ? cat.name.substring(0, 18) + '...' : cat.name}
                      </span>
                    </div>
                  </button>
                  {/* Delete button (only visible when editing) */}
                  {isEditingCategories && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setGameState(prev => ({
                          ...prev,
                          availableCategories: prev.availableCategories.filter(c => c.id !== cat.id),
                          selectedCategories: prev.selectedCategories.filter(c => c.id !== cat.id),
                        }));
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-[#ff5470] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Category Section (only when editing) */}
          {isEditingCategories && (
            <div className="mt-4 flex gap-2">
              <input 
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Escribe una nueva categoría..."
                className="flex-1 bg-[#120a22] border border-[#3b2d59] rounded-xl px-4 py-3 text-white font-body-sm outline-none focus:border-[#fabc41] transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    const newCat = { id: `custom-${Date.now()}`, name: newCategoryName.trim(), icon: 'extension' };
                    setGameState(prev => ({ ...prev, availableCategories: [...prev.availableCategories, newCat] }));
                    setNewCategoryName('');
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (newCategoryName.trim()) {
                    const newCat = { id: `custom-${Date.now()}`, name: newCategoryName.trim(), icon: 'extension' };
                    setGameState(prev => ({ ...prev, availableCategories: [...prev.availableCategories, newCat] }));
                    setNewCategoryName('');
                  }
                }}
                disabled={!newCategoryName.trim()}
                className="bg-[#fabc41] text-[#422d00] px-5 py-3 rounded-xl flex items-center justify-center shadow-md font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          )}
          
          <button 
            onClick={startGame}
            disabled={currentLetter === '?' || selectedCategories.length !== 6}
            className="w-full mt-8 bg-gradient-to-r from-[#ff5470] to-[#fabc41] text-white font-headline-md py-5 rounded-xl shadow-[0_5px_25px_rgba(255,84,112,0.4)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:grayscale disabled:hover:opacity-50 disabled:active:scale-100"
          >
            <span className="text-xl">🚀</span> ¡Empezar a Jugar! <span className="text-xl">🚀</span>
          </button>
        </div>
      </div>

    </div>
  );

  // VENTANA 2: EN PARTIDA (Interfaz 2)
  const renderGame = () => {
    const isWaitingForOpponent = !playersData.Baby.inGame || !playersData['Mi Rey'].inGame;
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    
    const myCompleted = gameInputs.filter(val => val.trim().length > 0).length;
    const opponentCompleted = opponentData.inputs.filter(val => val.trim().length > 0).length;
    
    const myProfile = currentUser === 'Baby' ? babyProfile : miReyProfile;
    const myCity = currentUser === 'Baby' ? 'Ecuador, Guayaquil' : 'CABA, Argentina';
    const opponentCity = currentUser === 'Baby' ? 'CABA, Argentina' : 'Ecuador, Guayaquil';
    
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Arena Bar (Opponent Status) */}
        <div className="bg-[#1b122f] p-4 sm:p-6 rounded-3xl border border-[#3b2d59] flex items-center justify-between shadow-lg relative overflow-hidden">
          {/* Sapo (Líder) side */}
          <div className="flex items-center gap-4 z-10 w-[30%] bg-gradient-to-r from-[#120a22] to-transparent p-3 rounded-2xl">
            <div className="relative shrink-0">
              <img src={currentUser === 'Baby' ? babyProfile.avatar : miReyProfile.avatar} alt="Me" className="w-16 h-16 rounded-full border-2 border-[#7adaa1] shadow-[0_0_15px_rgba(122,218,161,0.2)] object-cover" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#7adaa1] text-[#003920] px-2 py-0.5 rounded-full text-[9px] font-label-caps whitespace-nowrap shadow-md font-bold">
                LÍDER
              </div>
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-headline-md text-xl text-white">{myProfile.name}</span>
                <span className="material-symbols-outlined text-[#7adaa1] text-sm">verified</span>
              </div>
              <span className="font-label-mono text-[#7adaa1] text-[10px] tracking-widest mt-1">{myCompleted}/6 Listas • {myCity}</span>
            </div>
          </div>

          {/* Central Timer Orb */}
          <div className="flex flex-col items-center z-10 w-[30%]">
            <div className="w-24 h-24 rounded-full bg-[#120a22] flex items-center justify-center shadow-inner border border-[#3b2d59] relative">
              <span className="font-display-lg text-5xl text-[#fabc41] drop-shadow-[0_0_15px_rgba(250,188,65,0.4)]">{currentLetter}</span>
              {/* Magic Rune Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.15]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(250,188,65,0.1)" strokeWidth="3" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="#fabc41" strokeWidth="3" strokeDasharray="301" strokeDashoffset={301 - (301 * timeRemaining) / 60} className="transition-all duration-1000 linear" />
              </svg>
            </div>
            <span className={`font-label-mono text-xs mt-4 flex items-center gap-1 tracking-widest ${timeRemaining <= 10 && !isWaitingForOpponent ? 'text-[#ff5470] animate-pulse' : 'text-[#fabc41]'}`}>
              <span className="material-symbols-outlined text-[14px]">timer</span>
              {isWaitingForOpponent 
                ? `Esperando a ${opponentProfile.name}...` 
                : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} restantes`}
            </span>
          </div>

          {/* Mi Rey side */}
          <div className="flex items-center gap-4 z-10 w-[30%] justify-end bg-gradient-to-l from-[#120a22] to-transparent p-3 rounded-2xl">
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#fabc41] text-sm">auto_awesome</span>
                <span className="font-headline-md text-xl text-white">{opponentProfile.name}</span>
              </div>
              <span className="font-label-mono text-white/50 text-[10px] tracking-widest mt-1">{opponentCity} • {opponentCompleted}/6 Completadas</span>
            </div>
            <div className="relative shrink-0">
              <img src={opponentProfile.avatar} alt="Opponent" className="w-16 h-16 rounded-full border-2 border-[#fabc41] shadow-[0_0_15px_rgba(250,188,65,0.2)] object-cover opacity-90" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#fabc41] text-[#422d00] px-2 py-0.5 rounded-full text-[9px] font-label-caps whitespace-nowrap shadow-md animate-pulse font-bold">
                ESCRIBIENDO
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3 font-label-caps text-xs tracking-widest text-white/70">
            <span className="text-[#ff5470] font-bold">RUNA ACTIVA: LETRA {currentLetter}</span>
            <span>•</span>
            <span>6 Categorías Mágicas en Duelo</span>
          </div>
          <div className="flex items-center gap-1.5 font-label-mono text-[10px] text-[#7adaa1] tracking-widest">
            Guardado automático activo <span className="material-symbols-outlined text-[14px]">cloud_done</span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {selectedCategories.map((cat, idx) => (
            <div key={idx} className="bg-[#25193d] rounded-2xl border border-[#3b2d59] overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-[#fabc41]/50 focus-within:border-[#fabc41]/50 transition-all shadow-md group">
              
              {/* Card Header */}
              <div className="px-5 py-3 border-b border-[#3b2d59]/50 flex justify-between items-center bg-[#1b122f]/50">
                <div className="flex items-center gap-2">
                  <div className="bg-[#ff5470] text-white text-[10px] font-bold font-label-mono w-5 h-5 rounded-full flex items-center justify-center">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <span className="font-label-caps text-xs text-white/80">{cat.name}</span>
                </div>
                {gameInputs[idx].length > 0 ? (
                  <div className="bg-[#7adaa1]/20 text-[#7adaa1] border border-[#7adaa1]/30 px-2.5 py-0.5 rounded-full text-[10px] font-label-caps flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[12px]">check</span> Listo
                  </div>
                ) : (
                  <div className="bg-[#fabc41]/20 text-[#fabc41] border border-[#fabc41]/30 px-2.5 py-0.5 rounded-full text-[10px] font-label-caps flex items-center gap-1 font-bold animate-pulse">
                    <span className="material-symbols-outlined text-[12px]">edit</span> Escribiendo
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <div className="relative bg-[#130d22]">
                {isWaitingForOpponent && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#130d22]/80 backdrop-blur-sm">
                    <span className="text-[#fabc41] font-label-mono text-xs tracking-widest animate-pulse">Esperando conexión...</span>
                  </div>
                )}
                <input
                  type="text"
                  value={gameInputs[idx]}
                  disabled={isWaitingForOpponent || myData.isReady}
                  onChange={(e) => {
                    const newInputs = [...gameInputs];
                    newInputs[idx] = e.target.value;
                    setGameInputs(newInputs);
                  }}
                  placeholder={isWaitingForOpponent ? "" : `Escribe aquí...`}
                  className={`w-full bg-transparent text-white font-headline-md text-lg p-5 pr-14 outline-none placeholder:text-white/20 transition-all ${isWaitingForOpponent ? 'opacity-50' : ''}`}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#fabc41] font-display-lg text-2xl opacity-60 pointer-events-none">{currentLetter}</span>
              </div>

              {/* Card Footer (Opponent Preview) */}
              <div className="px-5 py-3 border-t border-[#3b2d59]/50 bg-[#1b122f]/50 flex justify-between items-center">
                <span className="font-label-mono text-[10px] tracking-wide text-white/60">
                  {opponentProfile.name} <span className="italic text-[#fabc41] animate-pulse">escribiendo...</span>
                </span>
                <span className="font-label-mono text-[9px] text-[#7adaa1] tracking-widest uppercase">Guardado</span>
              </div>

            </div>
          ))}
        </div>

        {/* Mega BASTA Button */}
        <div className="flex flex-col items-center mt-4">
          <button 
            onClick={submitGame}
            disabled={myData.isReady || isWaitingForOpponent}
            className={`px-12 py-5 text-white font-display-lg text-3xl rounded-full shadow-[0_8px_0_#b71b40] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-4 group mb-3 ${(myData.isReady || isWaitingForOpponent) ? 'bg-[#3b2d59] shadow-none transform translate-y-2 cursor-not-allowed opacity-50' : 'bg-[#ff5470]'}`}
          >
            <div className={`w-8 h-8 rounded-full shadow-inner border-2 shrink-0 [clip-path:polygon(50%_0%,90%_20%,100%_60%,75%_100%,25%_100%,0%_60%,10%_20%)] ${(myData.isReady || isWaitingForOpponent) ? 'bg-white/20 border-white/30' : 'bg-gradient-to-tr from-[#b71b40] to-[#ff5470] border-white/80'}`}></div>
            {myData.isReady ? 'ESPERANDO AL OPONENTE...' : isWaitingForOpponent ? 'ESPERANDO CONEXIÓN...' : '¡BASTA PARA TODOS! ✨'}
          </button>
          <span className="font-label-mono text-[10px] sm:text-xs text-[#fabc41]/80 tracking-widest uppercase">
            Presiona para congelar la arena y enviar a votación inmediata a {opponentProfile.name}.
          </span>
        </div>

      </div>
    );
  };

  // VENTANA 3: CALIFICACIÓN (Interfaz 3 con Lógica de Calificación Cruzada)
  const renderReview = () => (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
      
      {/* Header */}
      <div className="bg-[#1b122f] p-6 sm:p-8 rounded-3xl border border-[#3b2d59] flex flex-col gap-8 shadow-lg mb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Part: Ronda and Letter */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-20 h-20 rounded-2xl bg-[#25193d] border border-[#3b2d59] flex flex-col items-center justify-center relative shrink-0 shadow-inner">
              <span className="text-[#fabc41] font-label-mono text-[9px] tracking-widest uppercase mb-1">Veredicto</span>
              <span className="text-[#ff5470] font-display-lg text-4xl leading-none font-bold">{currentLetter === '?' ? 'A' : currentLetter}</span>
              <div className="absolute -top-1.5 -right-1.5 bg-[#fabc41] w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[#1b122f]">
                 <span className="material-symbols-outlined text-[10px] text-[#422d00] font-bold">star</span>
              </div>
            </div>
            <div>
               <div className="flex items-center gap-1.5 font-label-mono text-[10px] text-[#7adaa1] tracking-widest uppercase mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7adaa1] animate-pulse"></div>
                  En Veredicto Cara a Cara
               </div>
               <h2 className="text-white font-headline-md text-2xl sm:text-3xl">Tutti Frutti Romántico</h2>
               <p className="text-[#a499b8] font-body-sm mt-1">Califica con amor, debate con justicia o cede por cariño.</p>
            </div>
          </div>

          {/* Right Part: Points */}
          <div className="flex items-center gap-3 shrink-0 bg-[#25193d]/50 p-2 rounded-2xl border border-[#3b2d59]/50">
             <div className="bg-[#1b122f] border border-[#3b2d59] px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-inner">
                <img src={currentUser === 'Baby' ? babyProfile.avatar : miReyProfile.avatar} className="w-10 h-10 rounded-full border border-[#7adaa1]" />
                <div className="flex flex-col items-end">
                   <span className="text-white/70 font-label-caps text-[10px] tracking-widest uppercase">{currentUser === 'Baby' ? babyProfile.name : miReyProfile.name}</span>
                   <span className="text-[#a499b8] font-headline-md text-2xl leading-none">{myData.score} <span className="text-[10px]">PTS</span></span>
                </div>
             </div>
             <div className="text-[#fabc41] bg-[#120a22] w-6 h-6 rounded-full flex items-center justify-center shadow-inner border border-[#3b2d59]/50">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
             </div>
             <div className="bg-[#1b122f] border border-[#3b2d59] px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-inner">
                <div className="flex flex-col items-start">
                   <span className="text-white/70 font-label-caps text-[10px] tracking-widest uppercase">{opponentProfile.name}</span>
                   <span className="text-[#fabc41] font-headline-md text-2xl leading-none font-bold">{opponentData.score} <span className="text-[10px]">PTS</span></span>
                </div>
                <img src={opponentProfile.avatar} className="w-10 h-10 rounded-full border border-[#fabc41]" />
             </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
             <span className="text-white/70 font-label-mono text-[10px] tracking-widest uppercase">
                Progreso de tu evaluación: {opponentData.inputs.filter((_, idx) => myData.scoresGiven[idx] !== null || getAutoScore(opponentData.inputs[idx], myData.inputs[idx], currentLetter) !== null).length} de 6 listas
             </span>
             <span className="text-[#fabc41] font-label-mono text-[10px] tracking-widest uppercase font-bold">
                {Math.round((opponentData.inputs.filter((_, idx) => myData.scoresGiven[idx] !== null || getAutoScore(opponentData.inputs[idx], myData.inputs[idx], currentLetter) !== null).length / 6) * 100)}% validado
             </span>
          </div>
          <div className="w-full h-2.5 bg-[#25193d] rounded-full overflow-hidden flex shadow-inner">
             <div className="bg-gradient-to-r from-[#ff5470] to-[#fabc41] rounded-full h-full shadow-[0_0_10px_rgba(250,188,65,0.5)] transition-all" style={{ width: `${(opponentData.inputs.filter((_, idx) => myData.scoresGiven[idx] !== null || getAutoScore(opponentData.inputs[idx], myData.inputs[idx], currentLetter) !== null).length / 6) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Evaluation Cards */}
      <div className="flex flex-col gap-6">
        {selectedCategories.map((cat, idx) => {
          const autoScore = getAutoScore(opponentData.inputs[idx], myData.inputs[idx], currentLetter);
          const currentScore = autoScore !== null ? autoScore : myData.scoresGiven[idx];
          const isAutoGraded = autoScore !== null;
          const oppAutoScore = getAutoScore(myData.inputs[idx], opponentData.inputs[idx], currentLetter);
          const oppIsEvaluated = oppAutoScore !== null || (opponentData.scoresGiven[idx] !== undefined && opponentData.scoresGiven[idx] !== null);
          const oppScoreValue = oppAutoScore !== null ? oppAutoScore : opponentData.scoresGiven[idx];

          return (
          <div key={idx} className="bg-[#1b122f] rounded-2xl border border-[#3b2d59] overflow-hidden flex flex-col transition-all shadow-md">
            
             {/* Header */}
             <div className="px-5 py-4 border-b border-[#3b2d59]/50 flex justify-between items-center bg-[#1b122f]/80">
                <div className="flex items-center gap-2">
                  <span className="text-[#ff5470] font-headline-md text-xl leading-none font-bold">{idx + 1}</span>
                  <span className="text-[#fabc41] font-label-caps text-[10px] tracking-widest ml-1">CATEGORÍA</span>
                  <h3 className="text-white font-headline-sm text-lg ml-1">{cat.name}</h3>
                </div>
                <div className={`hidden sm:flex items-center gap-1.5 font-label-mono text-[10px] tracking-widest uppercase ${oppIsEvaluated ? 'text-[#7adaa1]' : 'text-[#fabc41]'}`}>
                   <span className="material-symbols-outlined text-[14px]">
                     {oppIsEvaluated ? 'check_circle' : 'hourglass_empty'}
                   </span>
                   {oppIsEvaluated 
                      ? `Te dio ${oppScoreValue} Puntos` 
                      : 'Esperando su veredicto'}
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
               {/* Sapo Side (Own answer) */}
               <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-[#3b2d59]/50 flex flex-col gap-3 relative bg-gradient-to-br from-[#120a22]/30 to-transparent">
                  <div className="flex flex-col gap-1">
                     <span className="text-white font-headline-md text-base">
                       Tú escribiste:
                     </span>
                     <div className="text-white font-headline-md text-base sm:text-lg mt-1 break-all">
                        {gameInputs[idx] || <span className="italic opacity-50">Sin respuesta...</span>}
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-center mt-auto pt-4">
                     <span className="text-white/70 font-label-caps text-[10px] tracking-widest text-center">
                       Esperando calificación de {opponentProfile.name}...
                     </span>
                  </div>
               </div>

               {/* Mi Rey Side (Opponent answer) */}
               <div className="p-4 sm:p-5 flex flex-col gap-3 relative bg-gradient-to-bl from-[#120a22]/30 to-transparent">
                  <div className="flex flex-col gap-1">
                     <span className="text-white font-headline-md text-base">
                       {opponentProfile.name} escribió:
                     </span>
                     <div className="text-white font-headline-md text-base sm:text-lg mt-1 break-all">
                        {opponentData.inputs[idx] || <span className="italic text-white/50">Sin respuesta...</span>}
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-auto pt-4">
                     {isAutoGraded && (
                       <div className="bg-[#ff5470]/10 border border-[#ff5470]/30 rounded-xl px-3 py-1 text-center font-label-caps text-[10px] text-[#ff5470]">
                         Validación automática del sistema
                       </div>
                     )}
                     <div className="flex gap-2">
                       <button 
                         disabled={isAutoGraded}
                         onClick={() => {
                           if(isAutoGraded) return;
                           const newScores = [...myData.scoresGiven];
                           newScores[idx] = 100;
                           setGameState(prev => ({
                             ...prev,
                             playersData: {
                               ...prev.playersData,
                               [currentUser]: { ...prev.playersData[currentUser], scoresGiven: newScores }
                             }
                           }));
                         }}
                         className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 bg-transparent border-none text-white hover:bg-[#3b2d59]/20 rounded-xl transition-colors group ${currentScore === 100 ? 'bg-[#7adaa1]/20 text-[#7adaa1]' : ''} ${isAutoGraded ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}>
                          <span className={`material-symbols-outlined text-[18px] transition-colors ${currentScore === 100 ? 'text-[#7adaa1]' : 'text-white/70 group-hover:text-white'}`}>workspace_premium</span>
                          <span className="font-label-mono text-[9px] sm:text-[10px] font-bold">100 (Única)</span>
                       </button>
                       <button 
                         disabled={isAutoGraded}
                         onClick={() => {
                           if(isAutoGraded) return;
                           const newScores = [...myData.scoresGiven];
                           newScores[idx] = 50;
                           setGameState(prev => ({
                             ...prev,
                             playersData: {
                               ...prev.playersData,
                               [currentUser]: { ...prev.playersData[currentUser], scoresGiven: newScores }
                             }
                           }));
                         }}
                         className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 bg-transparent border-none text-white hover:bg-[#3b2d59]/20 rounded-xl transition-colors group ${currentScore === 50 ? 'bg-[#fabc41]/20 text-[#fabc41]' : ''} ${isAutoGraded ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}>
                          <span className={`material-symbols-outlined text-[18px] transition-colors ${currentScore === 50 ? 'text-[#fabc41]' : 'text-white/70 group-hover:text-white'}`}>handshake</span>
                          <span className="font-label-mono text-[9px] sm:text-[10px] font-bold">50 (Igual)</span>
                       </button>
                       <button 
                         disabled={isAutoGraded}
                         onClick={() => {
                           if(isAutoGraded) return;
                           const newScores = [...myData.scoresGiven];
                           newScores[idx] = 0;
                           setGameState(prev => ({
                             ...prev,
                             playersData: {
                               ...prev.playersData,
                               [currentUser]: { ...prev.playersData[currentUser], scoresGiven: newScores }
                             }
                           }));
                         }}
                         className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 bg-transparent border-none text-white hover:bg-[#ff5470]/10 rounded-xl transition-colors group ${currentScore === 0 ? 'bg-[#ff5470]/20 text-[#ff5470]' : ''} ${isAutoGraded ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}>
                          <span className={`material-symbols-outlined text-[18px] transition-colors ${currentScore === 0 ? 'text-[#ff5470]' : 'text-white/70 group-hover:text-[#ff5470]'}`}>block</span>
                          <span className="font-label-mono text-[9px] sm:text-[10px] font-bold">0 (Inventó)</span>
                       </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Footer Sticky Bar */}
      <div className="mt-4 bg-[#25193d] rounded-2xl border border-[#3b2d59] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-full bg-[#fabc41] flex items-center justify-center text-[#422d00] shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-3xl">gavel</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[#fabc41] font-label-caps text-[10px] sm:text-xs tracking-widest">Cierre de Evaluación</span>
              <span className="text-white font-body-sm sm:font-body-md mt-0.5">Ambos jugadores deben sellar el pacto con un beso digital</span>
           </div>
        </div>
        <button 
          onClick={() => {
            // Calcular puntaje total de mi oponente basado en MIS calificaciones a él + sistema
            const opponentRoundScore = opponentData.inputs.reduce((total, _, idx) => {
              const auto = getAutoScore(opponentData.inputs[idx], myData.inputs[idx], currentLetter);
              const score = auto !== null ? auto : (myData.scoresGiven[idx] || 0);
              return total + score;
            }, 0);
            
            // Si el oponente no ha votado por mi, no podemos cerrar todavía
            const opponentFinished = myData.inputs.every((_, idx) => {
              const auto = getAutoScore(myData.inputs[idx], opponentData.inputs[idx], currentLetter);
              return auto !== null || (opponentData.scoresGiven[idx] !== undefined && opponentData.scoresGiven[idx] !== null);
            });

            if (!opponentFinished) {
               setCustomAlert({ isOpen: true, title: 'Paciencia...', message: `Espera a que ${opponentProfile.name} termine de calificarte.`, type: 'info' });
               return;
            }

            const myRoundScore = myData.inputs.reduce((total, _, idx) => {
              const auto = getAutoScore(myData.inputs[idx], opponentData.inputs[idx], currentLetter);
              const score = auto !== null ? auto : (opponentData.scoresGiven[idx] || 0);
              return total + score;
            }, 0);
            
            // Set both scores and reset global state!
            setGameState(prev => ({
              ...prev,
              phase: 'lobby',
              currentLetter: '?',
              gameStartTime: null,
              lastRoundResult: {
                BabyScore: currentUser === 'Baby' ? myRoundScore : opponentRoundScore,
                MiReyScore: currentUser === 'Mi Rey' ? myRoundScore : opponentRoundScore,
                timestamp: Date.now()
              },
              playersData: {
                Baby: {
                  ...prev.playersData.Baby,
                  score: prev.playersData.Baby.score + (currentUser === 'Baby' ? myRoundScore : opponentRoundScore),
                  inputs: ['', '', '', '', '', ''],
                  scoresGiven: [null, null, null, null, null, null],
                  isReady: false,
                  inGame: false,
                },
                'Mi Rey': {
                  ...prev.playersData['Mi Rey'],
                  score: prev.playersData['Mi Rey'].score + (currentUser === 'Mi Rey' ? myRoundScore : opponentRoundScore),
                  inputs: ['', '', '', '', '', ''],
                  scoresGiven: [null, null, null, null, null, null],
                  isReady: false,
                  inGame: false,
                }
              }
            }));
          }} 
          className="w-full md:w-auto px-8 py-4 bg-[#ff5470] text-white font-headline-md text-lg rounded-2xl shadow-[0_6px_0_#b71b40] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 group shrink-0"
        >
           <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">handshake</span> Cerrar y Sumar Puntos
        </button>
      </div>

    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full bg-[#120a22] p-4 md:p-8 font-sans pb-24">
      {/* Background ambient light */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#3b2d59]/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <div className="max-w-6xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between bg-[#1f1633] p-3 sm:p-4 rounded-xl mb-8 border border-[#3b2d59] gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-[#3b2d59] flex items-center justify-center text-white hover:bg-[#ff5470] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
            <div className="flex items-center gap-2 text-[#fabc41] font-label-caps text-xs tracking-wider">
              <span className="material-symbols-outlined text-[16px]">star</span> MODO CO-OP
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#130d22] rounded-full p-1 border border-[#3b2d59] overflow-x-auto no-scrollbar w-full lg:w-auto">
            <button 
              onClick={() => setGameState(prev => ({ ...prev, phase: 'lobby' }))}
              className={`px-5 py-2 rounded-full font-label-caps text-xs flex items-center gap-2 transition-all shrink-0 ${phase === 'lobby' && !myData.inGame ? 'bg-[#ff5470] text-white shadow-[0_0_10px_rgba(255,84,112,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. Ruleta & Lobby
            </button>
            <button 
              onClick={() => setGameState(prev => ({ ...prev, phase: 'game' }))}
              className={`px-5 py-2 rounded-full font-label-caps text-xs flex items-center gap-2 transition-all shrink-0 ${(phase === 'game' || myData.inGame) && phase !== 'review' ? 'bg-[#ff5470] text-white shadow-[0_0_10px_rgba(255,84,112,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[16px]">timer</span> 2. Duelo en Vivo
            </button>
            <button 
              onClick={() => setGameState(prev => ({ ...prev, phase: 'review' }))}
              className={`px-5 py-2 rounded-full font-label-caps text-xs flex items-center gap-2 transition-all shrink-0 ${phase === 'review' ? 'bg-[#ff5470] text-white shadow-[0_0_10px_rgba(255,84,112,0.4)]' : 'text-white/50 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span> 3. Votación y Risas
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#7adaa1] font-label-caps text-xs tracking-wider">
            <div className="w-2 h-2 rounded-full bg-[#7adaa1] animate-pulse shadow-[0_0_8px_rgba(122,218,161,0.8)]"></div>
            P2P Sincronizado
          </div>
        </div>

        {phase === 'lobby' && !myData.inGame && renderLobby()}
        {(phase === 'game' || myData.inGame) && phase !== 'review' && renderGame()}
        {phase === 'review' && renderReview()}
      </div>

      {/* Custom Alert Modal */}
      {customAlert?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#120a22]/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setCustomAlert(null)}></div>
          
          {/* Modal Card */}
          <div className="relative bg-[#1b122f] border border-[#3b2d59] rounded-3xl p-6 md:p-8 w-full max-w-sm flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-300">
            {/* Icon based on type */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${
              customAlert.type === 'success' ? 'bg-[#7adaa1]/20 text-[#7adaa1] border border-[#7adaa1]/50' :
              customAlert.type === 'warning' ? 'bg-[#fabc41]/20 text-[#fabc41] border border-[#fabc41]/50' :
              'bg-[#ff5470]/20 text-[#ff5470] border border-[#ff5470]/50'
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {customAlert.type === 'success' ? 'workspace_premium' :
                 customAlert.type === 'warning' ? 'warning' : 'info'}
              </span>
            </div>
            
            <h3 className="text-white font-headline-md text-2xl mb-2">{customAlert.title}</h3>
            
            <div className="text-[#a499b8] font-body-sm md:text-base whitespace-pre-line mb-8 leading-relaxed">
              {customAlert.message}
            </div>
            
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full bg-[#3b2d59] hover:bg-[#ff5470] text-white font-label-caps text-sm tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95 border border-[#3b2d59]/50"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
