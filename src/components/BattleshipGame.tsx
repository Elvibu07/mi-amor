import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { playBattleshipHit, playBattleshipMiss, playCutePop, playWinSound } from '../utils/audio';

interface BattleshipGameProps {
  onBack: () => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  onUpdateScore: (winner: 'Sapo' | 'Mi Rey') => void;
}

type GamePhase = 'setup_sapo' | 'setup_mirey' | 'pass_phone' | 'playing' | 'game_over';
type Orientation = 'horizontal' | 'vertical';
type Player = 'Sapo' | 'Mi Rey';

interface ShipDef {
  id: string;
  name: string;
  size: number;
}

const SHIPS: ShipDef[] = [
  { id: 'carrier', name: 'Portaaviones', size: 4 },
  { id: 'sub', name: 'Submarino', size: 3 },
  { id: 'destroyer', name: 'Destructor', size: 2 },
  { id: 'patrol1', name: 'Patrulla 1', size: 1 },
  { id: 'patrol2', name: 'Patrulla 2', size: 1 },
];

interface PlacedShip {
  id: string;
  name: string;
  cells: number[];
  hits: number[];
}

interface LogEntry {
  id: string;
  attacker: Player;
  coord: string;
  result: 'hit' | 'miss' | 'sunk';
  shipName?: string;
  timeStr: string;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({
  onBack,
  sapoProfile,
  miReyProfile,
  onUpdateScore,
}) => {
  // ── GAME STATE ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('setup_sapo');
  const [passTo, setPassTo] = useState<Player>('Mi Rey'); // used for pass_phone screen

  // Ship Placement State
  const [sapoShips, setSapoShips] = useState<PlacedShip[]>([]);
  const [miReyShips, setMiReyShips] = useState<PlacedShip[]>([]);
  
  const [activeShipIdx, setActiveShipIdx] = useState<number>(0);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  // Battle State
  const [currentTurn, setCurrentTurn] = useState<Player>('Sapo');
  const [sapoBoard, setSapoBoard] = useState<Record<number, 'hit' | 'miss'>>({});
  const [miReyBoard, setMiReyBoard] = useState<Record<number, 'hit' | 'miss'>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const getCoordName = (index: number) => {
    const row = String.fromCharCode(65 + Math.floor(index / 10)); // A-J
    const col = (index % 10) + 1; // 1-10
    return `${row}${col}`;
  };

  const getActiveProfile = () => {
    if (phase === 'setup_sapo') return sapoProfile;
    if (phase === 'setup_mirey') return miReyProfile;
    if (phase === 'playing' || phase === 'game_over') return currentTurn === 'Sapo' ? sapoProfile : miReyProfile;
    return sapoProfile; // fallback
  };

  // ── SETUP PHASE LOGIC ─────────────────────────────────────────────────────
  const currentSetupShips = phase === 'setup_sapo' ? sapoShips : miReyShips;
  const setSetupShips = phase === 'setup_sapo' ? setSapoShips : setMiReyShips;
  
  const isShipPlaced = (shipId: string) => currentSetupShips.some(s => s.id === shipId);
  const getNextUnplacedShipIdx = () => {
    for (let i = 0; i < SHIPS.length; i++) {
      if (!currentSetupShips.some(s => s.id === SHIPS[i].id)) return i;
    }
    return -1;
  };

  const canPlaceShip = (startIdx: number, size: number, ori: Orientation) => {
    const cells: number[] = [];
    const row = Math.floor(startIdx / 10);
    const col = startIdx % 10;

    for (let i = 0; i < size; i++) {
      if (ori === 'horizontal') {
        if (col + i > 9) return null; // out of bounds
        cells.push(startIdx + i);
      } else {
        if (row + i > 9) return null; // out of bounds
        cells.push(startIdx + (i * 10));
      }
    }

    // Check overlaps
    for (const cell of cells) {
      if (currentSetupShips.some(s => s.cells.includes(cell))) return null;
    }

    return cells;
  };

  const handleSetupCellClick = (index: number) => {
    if (activeShipIdx === -1) return; // All placed
    const shipDef = SHIPS[activeShipIdx];
    if (isShipPlaced(shipDef.id)) return;

    const cells = canPlaceShip(index, shipDef.size, orientation);
    if (!cells) {
      // Invalid placement
      return;
    }

    playCutePop();
    setSetupShips(prev => [...prev, { id: shipDef.id, name: shipDef.name, cells, hits: [] }]);
    
    // Auto-select next
    setTimeout(() => {
      setActiveShipIdx(getNextUnplacedShipIdx());
    }, 0);
  };

  const handleRemoveShip = (shipId: string) => {
    playCutePop();
    setSetupShips(prev => prev.filter(s => s.id !== shipId));
    setActiveShipIdx(SHIPS.findIndex(s => s.id === shipId));
  };

  const handleConfirmFleet = () => {
    playCutePop();
    if (phase === 'setup_sapo') {
      setPassTo('Mi Rey');
      setPhase('pass_phone');
    } else if (phase === 'setup_mirey') {
      setPassTo('Sapo'); // Sapo goes first
      setPhase('pass_phone');
    }
  };

  const handlePassPhoneReady = () => {
    playCutePop();
    if (passTo === 'Mi Rey' && phase === 'pass_phone' && miReyShips.length === 0) {
      setPhase('setup_mirey');
      setActiveShipIdx(0);
    } else {
      setPhase('playing');
      setCurrentTurn(passTo);
    }
  };

  // ── PLAYING PHASE LOGIC ───────────────────────────────────────────────────
  const activeOpponentBoard = currentTurn === 'Sapo' ? miReyBoard : sapoBoard;
  const setOpponentBoard = currentTurn === 'Sapo' ? setMiReyBoard : setSapoBoard;
  const opponentShips = currentTurn === 'Sapo' ? miReyShips : sapoShips;
  const setOpponentShips = currentTurn === 'Sapo' ? setMiReyShips : setSapoShips;
  
  const getSapoHealth = () => sapoShips.length > 0 ? (sapoShips.reduce((acc, s) => acc + (s.size - s.hits.length), 0) / SHIPS.reduce((acc, s) => acc + s.size, 0)) * 100 : 100;
  const getMiReyHealth = () => miReyShips.length > 0 ? (miReyShips.reduce((acc, s) => acc + (s.size - s.hits.length), 0) / SHIPS.reduce((acc, s) => acc + s.size, 0)) * 100 : 100;

  const handleAttackCellClick = (index: number) => {
    if (activeOpponentBoard[index]) return; // already attacked

    let hitShip = null;
    let isSunk = false;

    // Check if it's a hit
    const updatedShips = opponentShips.map(ship => {
      if (ship.cells.includes(index)) {
        hitShip = ship;
        const newHits = [...ship.hits, index];
        if (newHits.length === ship.size) isSunk = true;
        return { ...ship, hits: newHits };
      }
      return ship;
    });

    const isHit = !!hitShip;
    setOpponentBoard(prev => ({ ...prev, [index]: isHit ? 'hit' : 'miss' }));
    
    const coordName = getCoordName(index);
    const attackerName = currentTurn;

    if (isHit) {
      playBattleshipHit();
      setOpponentShips(updatedShips);
      
      const newLog: LogEntry = {
        id: Date.now().toString(),
        attacker: attackerName,
        coord: coordName,
        result: isSunk ? 'sunk' : 'hit',
        shipName: isSunk ? hitShip!.name : undefined,
        timeStr: 'Justo ahora',
      };
      setLogs(prev => [newLog, ...prev]);

      // Check win condition
      const allSunk = updatedShips.every(s => s.hits.length === s.size);
      if (allSunk) {
        playWinSound();
        setPhase('game_over');
        onUpdateScore(attackerName);
      }
      // If hit, you get another turn! (do not change currentTurn)
    } else {
      playBattleshipMiss();
      const newLog: LogEntry = {
        id: Date.now().toString(),
        attacker: attackerName,
        coord: coordName,
        result: 'miss',
        timeStr: 'Justo ahora',
      };
      setLogs(prev => [newLog, ...prev]);

      // Miss = lose turn, pass phone
      const nextPlayer = currentTurn === 'Sapo' ? 'Mi Rey' : 'Sapo';
      setPassTo(nextPlayer);
      setPhase('pass_phone');
    }
  };

  const handleReset = () => {
    playCutePop();
    setPhase('setup_sapo');
    setSapoShips([]);
    setMiReyShips([]);
    setSapoBoard({});
    setMiReyBoard({});
    setLogs([]);
    setActiveShipIdx(0);
    setCurrentTurn('Sapo');
  };

  // ── RENDERERS ─────────────────────────────────────────────────────────────

  // 1. SETUP UI
  if (phase === 'setup_sapo' || phase === 'setup_mirey') {
    const profile = getActiveProfile();
    const isReady = currentSetupShips.length === SHIPS.length;

    return (
      <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32">
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
          <div className="flex justify-between items-center">
            <button onClick={onBack} className="flex items-center gap-2 text-xs md:text-sm font-label-caps uppercase text-[#e2bec0] hover:text-white bg-[#2f2348] px-4 py-2 rounded-xl border border-[#5a4042]/30 hover:bg-[#3a2e54] transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver a Juegos
            </button>
            <span className="font-label-mono text-xs text-[#ff5470] uppercase tracking-widest bg-[#ff5470]/10 px-3 py-1 rounded-full border border-[#ff5470]/20">
              Fase de Preparación
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-display-lg text-white mb-2">¡{profile.name}, coloca tu flota!</h2>
            <p className="text-[#e2bec0] font-label-mono text-xs">El otro jugador no debe mirar la pantalla 👀</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Grid */}
            <div className="md:col-span-7 flex justify-center w-full">
              <div className="bg-[#1B112C]/95 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-[#3A2E54]/50 w-full max-w-[450px]">
                <div className="grid grid-cols-10 gap-1.5 w-full aspect-square relative">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const isOccupied = currentSetupShips.some(s => s.cells.includes(i));
                    // Highlight logic for hover could go here, but keeping it simple for mobile
                    return (
                      <button
                        key={i}
                        onClick={() => handleSetupCellClick(i)}
                        className={`w-full h-full rounded-md flex items-center justify-center transition-all ${
                          isOccupied 
                            ? 'bg-[#7adaa1] shadow-[0_0_10px_rgba(122,218,161,0.5)] scale-105' 
                            : 'bg-[#2A1D45]/40 hover:bg-[#3D2C63]/80 border border-[#4A3280]/30'
                        }`}
                      ></button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="md:col-span-5 flex flex-col gap-6">
              <div className="bg-[#2f2348]/70 backdrop-blur-xl border border-[#5a4042]/30 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-headline-md">Tus Barcos</h3>
                  <button 
                    onClick={() => { setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal'); playCutePop(); }}
                    className="flex items-center gap-2 bg-[#221934] px-3 py-1.5 rounded-lg border border-[#5a4042]/50 text-[#e2bec0] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">{orientation === 'horizontal' ? 'swap_horiz' : 'swap_vert'}</span>
                    <span className="font-label-caps text-[10px] uppercase">{orientation}</span>
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {SHIPS.map((ship, idx) => {
                    const placed = currentSetupShips.find(s => s.id === ship.id);
                    const isSelected = activeShipIdx === idx;
                    
                    return (
                      <div 
                        key={ship.id}
                        onClick={() => !placed && setActiveShipIdx(idx)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          placed ? 'bg-[#7adaa1]/10 border-[#7adaa1]/30 opacity-60' 
                          : isSelected ? 'bg-[#ff5470]/20 border-[#ff5470] shadow-[0_0_15px_rgba(255,84,112,0.2)] cursor-pointer' 
                          : 'bg-[#201439] border-[#5a4042]/30 hover:bg-[#2a1d45] cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`font-bold ${placed ? 'text-[#7adaa1]' : isSelected ? 'text-white' : 'text-[#e2bec0]'}`}>{ship.name}</span>
                          <span className="text-[10px] font-label-mono text-[#e2bec0]/70">{ship.size} casillas</span>
                        </div>
                        {placed ? (
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveShip(ship.id); }} className="text-[#ff5470] p-1 bg-[#ff5470]/10 rounded-lg hover:bg-[#ff5470]/20">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        ) : (
                          <div className="flex gap-1">
                            {Array.from({length: ship.size}).map((_, j) => (
                              <div key={j} className={`w-3 h-3 rounded-sm ${isSelected ? 'bg-[#ff5470]' : 'bg-[#5a4042]'}`}></div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleConfirmFleet}
                  disabled={!isReady}
                  className={`w-full mt-6 font-headline-md text-sm py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    isReady 
                      ? 'bg-[#7adaa1] hover:bg-[#8eeabb] text-[#13062b] shadow-[0_4px_0_#4a9b6c] active:shadow-none active:translate-y-1' 
                      : 'bg-[#221934] text-[#5a4042] cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">directions_boat</span>
                  Confirmar Flota
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. PASS PHONE UI
  if (phase === 'pass_phone') {
    const nextProfile = passTo === 'Sapo' ? sapoProfile : miReyProfile;
    const isSetupPass = sapoShips.length === 0 || miReyShips.length === 0;

    return (
      <div className="fixed inset-0 z-50 bg-[#13062b] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 mb-6">
          <img src={nextProfile.avatar} alt={nextProfile.name} className="w-full h-full object-cover rounded-full shadow-[0_0_30px_rgba(122,218,161,0.5)] border-4 border-[#7adaa1]" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display-lg text-white mb-2">¡Pasa el teléfono a {nextProfile.name}!</h2>
        <p className="text-[#e2bec0] font-label-mono mb-12">
          {isSetupPass ? 'Es hora de colocar tu flota en secreto.' : '¡Es tu turno de atacar! Que el otro no mire.'}
        </p>
        <button
          onClick={handlePassPhoneReady}
          className="bg-[#ff5470] hover:bg-[#ff6b84] text-white font-headline-md text-lg px-10 py-4 rounded-2xl shadow-[0_4px_0_#91002c] active:shadow-none active:translate-y-1 transition-all"
        >
          ¡Soy yo, estoy listo!
        </button>
      </div>
    );
  }

  // 3. PLAYING / GAME OVER UI
  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32">
      <div className="flex flex-col w-full max-w-6xl mx-auto gap-6 md:gap-8">
        {/* Top bar with back button */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs md:text-sm font-label-caps uppercase text-[#e2bec0] hover:text-white bg-[#2f2348] px-4 py-2 rounded-xl border border-[#5a4042]/30 hover:bg-[#3a2e54] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Salir de la partida
          </button>
          <span className="font-label-mono text-xs text-[#e2bec0] uppercase tracking-widest">
            Tablero de Ataque
          </span>
        </div>

        {/* Status / Player Score Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Player 1: Sapo */}
          <div className={`flex items-center gap-4 bg-[#2f2348]/70 backdrop-blur-xl p-4 rounded-2xl border ${currentTurn === 'Sapo' && phase !== 'game_over' ? 'border-[#7adaa1] shadow-[0_0_15px_rgba(122,218,161,0.2)]' : 'border-[#5a4042]/30'} relative overflow-hidden transition-all`}>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
              <img src={sapoProfile.avatar} className="w-full h-full object-cover rounded-full shadow-md z-10 relative" />
              <div className={`absolute inset-0 rounded-full ring-4 ${currentTurn === 'Sapo' ? 'ring-[#7adaa1]' : 'ring-transparent'} ring-offset-2 ring-offset-[#2f2348] z-20 transition-all`}></div>
            </div>
            <div className="flex flex-col flex-1 gap-1 z-10">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-white">{sapoProfile.name}</span>
                {currentTurn === 'Sapo' && phase !== 'game_over' && (
                  <span className="text-[10px] font-label-caps text-[#180c30] bg-[#7adaa1] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">Tu Turno</span>
                )}
              </div>
              <div className="w-full bg-[#13062b] rounded-full h-2 overflow-hidden mt-1">
                <div className="bg-[#7adaa1] h-full rounded-full transition-all duration-500" style={{ width: `${getSapoHealth()}%` }}></div>
              </div>
              <div className="text-[10px] text-[#e2bec0] font-label-mono text-right">Flota: {Math.round(getSapoHealth())}%</div>
            </div>
          </div>

          {/* Center Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-display-lg text-[#ffb2b8] drop-shadow-[0_0_16px_rgba(255,178,184,0.4)]">
              {phase === 'game_over' ? '¡Juego Terminado!' : '¡Batalla!'}
            </span>
            <span className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-widest mt-1">
              Hundir la Flota ⚓
            </span>
          </div>

          {/* Player 2: Mi Rey */}
          <div className={`flex items-center gap-4 bg-[#2f2348]/70 backdrop-blur-xl p-4 rounded-2xl border ${currentTurn === 'Mi Rey' && phase !== 'game_over' ? 'border-[#fabc41] shadow-[0_0_15px_rgba(250,188,65,0.2)]' : 'border-[#5a4042]/30'} relative overflow-hidden transition-all`}>
            <div className="flex flex-col flex-1 gap-1 z-10">
              <div className="flex justify-between items-center">
                {currentTurn === 'Mi Rey' && phase !== 'game_over' && (
                  <span className="text-[10px] font-label-caps text-[#2e2a14] bg-[#fabc41] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">Tu Turno</span>
                )}
                <span className="text-base font-bold text-white ml-auto">{miReyProfile.name}</span>
              </div>
              <div className="w-full bg-[#13062b] rounded-full h-2 overflow-hidden mt-1 flex justify-end">
                <div className="bg-[#fabc41] h-full rounded-full transition-all duration-500" style={{ width: `${getMiReyHealth()}%` }}></div>
              </div>
              <div className="text-[10px] text-[#e2bec0] font-label-mono text-left">Flota: {Math.round(getMiReyHealth())}%</div>
            </div>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
              <img src={miReyProfile.avatar} className="w-full h-full object-cover rounded-full shadow-md z-10 relative" />
              <div className={`absolute inset-0 rounded-full ring-4 ${currentTurn === 'Mi Rey' ? 'ring-[#fabc41]' : 'ring-transparent'} ring-offset-2 ring-offset-[#2f2348] z-20 transition-all`}></div>
            </div>
          </div>
        </div>

        {/* Main Grid & Battle Log Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mt-4">
          {/* Game Board (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col items-center w-full relative">
            <h3 className="text-white font-headline-md mb-4 text-center">
              {phase === 'game_over' ? 'Tablero Final' : `Atacando a ${currentTurn === 'Sapo' ? miReyProfile.name : sapoProfile.name}`}
            </h3>
            <div className="bg-[#1B112C]/95 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-[#3A2E54]/50 w-full max-w-[550px]">
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5 w-full aspect-square">
                {Array.from({ length: 100 }).map((_, i) => {
                  const state = activeOpponentBoard[i];
                  const hitShip = opponentShips.find(s => s.cells.includes(i));
                  const isSunk = hitShip && hitShip.hits.length === hitShip.size;
                  
                  return (
                    <button
                      key={i}
                      disabled={phase === 'game_over'}
                      onClick={() => handleAttackCellClick(i)}
                      className={`w-full h-full rounded-md sm:rounded-lg flex items-center justify-center transition-all shadow-inner select-none ${
                        state === 'hit'
                          ? isSunk 
                            ? 'bg-[#91002c] border border-[#ff5470] shadow-[inset_0_0_15px_rgba(255,84,112,0.5)]'
                            : 'bg-[#ff5470]/25 border border-[#ff5470]/60 shadow-[inset_0_0_15px_rgba(255,84,112,0.3)] animate-pop'
                          : state === 'miss'
                          ? 'bg-[#1F1433] border border-[#2F214A]'
                          : 'bg-[#2A1D45]/40 hover:bg-[#3D2C63]/80 border border-[#4A3280]/30 hover:scale-105'
                      }`}
                      title={getCoordName(i)}
                    >
                      {state === 'hit' && (
                        <span className={`material-symbols-outlined ${isSunk ? 'text-white' : 'text-[#ff5470]'} text-sm sm:text-xl drop-shadow-[0_0_10px_rgba(255,84,112,0.8)]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isSunk ? 'sailing' : 'favorite'}
                        </span>
                      )}
                      {state === 'miss' && (
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#5C4D82]"></div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-4 px-2 text-[10px] sm:text-[11px] font-label-mono text-[#e2bec0]">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><span className="text-[#ff5470]">❤️</span> Impacto</span>
                  <span className="flex items-center gap-1">🚢 Hundido</span>
                </div>
                <span>• = Agua</span>
              </div>
            </div>
          </div>

          {/* Battle Log (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#2f2348]/70 backdrop-blur-xl border border-[#5a4042]/30 rounded-3xl p-5 flex flex-col h-[500px] shadow-lg">
              <h3 className="text-lg font-headline-md text-white mb-3 flex items-center gap-2 border-b border-[#5a4042]/30 pb-2 shrink-0">
                <span className="material-symbols-outlined text-[#ff5470]">receipt_long</span>
                Log de Batalla
              </h3>

              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 font-label-mono text-xs">
                {logs.length === 0 && (
                  <p className="text-center text-[#e2bec0]/50 mt-10">La batalla acaba de comenzar. ¡Ataquen!</p>
                )}
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl flex items-start gap-2.5 border ${
                      log.result === 'hit' || log.result === 'sunk'
                        ? 'bg-[#ff5470]/15 border-[#ff5470]/30 text-white'
                        : 'bg-[#201439] border-[#5a4042]/20 text-[#e2bec0]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base mt-0.5 text-[#ff5470]">
                      {log.result === 'hit' ? 'explosion' : log.result === 'sunk' ? 'sailing' : 'target'}
                    </span>
                    <div className="flex-1">
                      <div>
                        <span className={`font-bold ${log.attacker === 'Sapo' ? 'text-[#7adaa1]' : 'text-[#fabc41]'}`}>
                          {log.attacker === 'Sapo' ? sapoProfile.name : miReyProfile.name}
                        </span>{' '}
                        atacó {log.coord}.{' '}
                        <span className="font-bold text-white">
                          {log.result === 'hit' ? '¡Impacto! ❤️ (Tira de nuevo)' : log.result === 'sunk' ? `¡Hundido! (${log.shipName})` : '¡Agua! 🌊'}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5">{log.timeStr}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-auto border-t border-[#5a4042]/30 shrink-0">
                {phase === 'game_over' ? (
                   <button onClick={handleReset} className="w-full bg-[#7adaa1] hover:bg-[#8eeabb] text-[#13062b] font-headline-md text-sm py-3 rounded-xl shadow-[0_4px_0_#4a9b6c] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-base">replay</span>
                    Jugar la Revancha
                  </button>
                ) : (
                  <button onClick={handleReset} className="w-full bg-[#201439] hover:bg-[#2a1d45] border border-[#5a4042]/50 text-[#e2bec0] hover:text-white font-headline-md text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-base">flag</span>
                    Rendirse / Reiniciar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
