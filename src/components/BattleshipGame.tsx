import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { playBattleshipHit, playBattleshipMiss, playCutePop, playWinSound } from '../utils/audio';
import { useSyncedDoc } from '../lib/useFirestore';

interface BattleshipGameProps {
  onBack: () => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  onUpdateScore: (winner: 'Sapo' | 'Mi Rey') => void;
  currentUser: 'Sapo' | 'Mi Rey';
}

type Orientation = 'horizontal' | 'vertical';

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
  attacker: 'Sapo' | 'Mi Rey';
  coord: string;
  result: 'hit' | 'miss' | 'sunk';
  shipName?: string;
  timeStr: string;
}

interface BattleshipSyncState {
  phase: 'setup' | 'playing' | 'game_over';
  sapoShips: PlacedShip[];
  miReyShips: PlacedShip[];
  sapoBoard: Record<number, 'hit' | 'miss'>; // Sapo's board (attacked by Mi Rey)
  miReyBoard: Record<number, 'hit' | 'miss'>; // Mi Rey's board (attacked by Sapo)
  currentTurn: 'Sapo' | 'Mi Rey';
  logs: LogEntry[];
  sapoReady: boolean;
  miReyReady: boolean;
  winner: 'Sapo' | 'Mi Rey' | null;
}

const defaultState: BattleshipSyncState = {
  phase: 'setup',
  sapoShips: [],
  miReyShips: [],
  sapoBoard: {},
  miReyBoard: {},
  currentTurn: 'Sapo',
  logs: [],
  sapoReady: false,
  miReyReady: false,
  winner: null,
};

export const BattleshipGame: React.FC<BattleshipGameProps> = ({
  onBack,
  sapoProfile,
  miReyProfile,
  onUpdateScore,
  currentUser,
}) => {
  const [gameState, setGameState] = useSyncedDoc<BattleshipSyncState>(
    'shared',
    'battleship_state',
    'ourlobby_battleship',
    defaultState
  );

  const {
    phase = 'setup',
    sapoShips = [],
    miReyShips = [],
    sapoBoard = {},
    miReyBoard = {},
    currentTurn = 'Sapo',
    logs = [],
    sapoReady = false,
    miReyReady = false,
    winner = null,
  } = gameState || defaultState;

  // Local Ship Placement State (to allow placing ships locally before confirming)
  const [localShips, setLocalShips] = useState<PlacedShip[]>([]);
  const [activeShipIdx, setActiveShipIdx] = useState<number>(0);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  // Reset local state if we enter setup phase
  useEffect(() => {
    if (phase === 'setup') {
      const isPlayerReady = currentUser === 'Sapo' ? sapoReady : miReyReady;
      if (!isPlayerReady) {
        setLocalShips([]);
        setActiveShipIdx(0);
      }
    }
  }, [phase, sapoReady, miReyReady, currentUser]);

  // Sync phase change to playing when both players are ready
  useEffect(() => {
    if (phase === 'setup' && sapoReady && miReyReady) {
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentTurn: 'Sapo', // Sapo (Elvia) goes first
      }));
    }
  }, [phase, sapoReady, miReyReady]);

  // Coordinate naming helper (e.g. A1, J10)
  const getCoordName = (index: number) => {
    const row = String.fromCharCode(65 + Math.floor(index / 10)); // A-J
    const col = (index % 10) + 1; // 1-10
    return `${row}${col}`;
  };

  const isShipPlaced = (shipId: string) => localShips.some(s => s.id === shipId);
  
  const getNextUnplacedShipIdx = (currentPlaced: PlacedShip[]) => {
    for (let i = 0; i < SHIPS.length; i++) {
      if (!currentPlaced.some(s => s.id === SHIPS[i].id)) return i;
    }
    return -1;
  };

  const canPlaceShip = (startIdx: number, size: number, ori: Orientation, currentPlaced: PlacedShip[]) => {
    const cells: number[] = [];
    const row = Math.floor(startIdx / 10);
    const col = startIdx % 10;

    for (let i = 0; i < size; i++) {
      if (ori === 'horizontal') {
        if (col + i > 9) return null;
        cells.push(startIdx + i);
      } else {
        if (row + i > 9) return null;
        cells.push(startIdx + (i * 10));
      }
    }

    // Check overlaps
    for (const cell of cells) {
      if (currentPlaced.some(s => s.cells.includes(cell))) return null;
    }

    return cells;
  };

  const handleSetupCellClick = (index: number) => {
    if (activeShipIdx === -1) return;
    const shipDef = SHIPS[activeShipIdx];
    if (isShipPlaced(shipDef.id)) return;

    const cells = canPlaceShip(index, shipDef.size, orientation, localShips);
    if (!cells) return;

    playCutePop();
    const updated = [...localShips, { id: shipDef.id, name: shipDef.name, cells, hits: [] }];
    setLocalShips(updated);
    
    // Select next unplaced ship
    setTimeout(() => {
      setActiveShipIdx(getNextUnplacedShipIdx(updated));
    }, 0);
  };

  const handleRemoveShip = (shipId: string) => {
    playCutePop();
    const updated = localShips.filter(s => s.id !== shipId);
    setLocalShips(updated);
    setActiveShipIdx(SHIPS.findIndex(s => s.id === shipId));
  };

  const handleConfirmFleet = () => {
    playCutePop();
    if (currentUser === 'Sapo') {
      setGameState(prev => ({
        ...prev,
        sapoShips: localShips,
        sapoReady: true,
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        miReyShips: localShips,
        miReyReady: true,
      }));
    }
  };

  // Attack handlers
  const handleAttackCellClick = (index: number) => {
    if (currentTurn !== currentUser || phase !== 'playing') return;

    const activeOpponentBoard = currentUser === 'Sapo' ? miReyBoard : sapoBoard;
    if (activeOpponentBoard[index]) return; // Already attacked

    const opponentShips = currentUser === 'Sapo' ? miReyShips : sapoShips;
    
    let hitShip = null;
    let isSunk = false;

    // Check hit
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
    const coordName = getCoordName(index);

    const newLog: LogEntry = {
      id: Date.now().toString(),
      attacker: currentUser,
      coord: coordName,
      result: isHit ? (isSunk ? 'sunk' : 'hit') : 'miss',
      timeStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    if (isSunk && hitShip) {
      newLog.shipName = (hitShip as PlacedShip).name;
    }

    const nextLogs = [newLog, ...logs];
    const isGameOver = isHit && updatedShips.every(s => s.hits.length === s.size);

    if (isGameOver) {
      playWinSound();
      setGameState(prev => ({
        ...prev,
        sapoShips: currentUser === 'Sapo' ? sapoShips : updatedShips,
        miReyShips: currentUser === 'Mi Rey' ? miReyShips : updatedShips,
        sapoBoard: currentUser === 'Mi Rey' ? { ...sapoBoard, [index]: 'hit' as const } : sapoBoard,
        miReyBoard: currentUser === 'Sapo' ? { ...miReyBoard, [index]: 'hit' as const } : miReyBoard,
        logs: nextLogs,
        phase: 'game_over',
        winner: currentUser,
      }));
      onUpdateScore(currentUser);
      return;
    }

    if (isHit) {
      playBattleshipHit();
      setGameState(prev => ({
        ...prev,
        sapoShips: currentUser === 'Sapo' ? sapoShips : updatedShips,
        miReyShips: currentUser === 'Mi Rey' ? miReyShips : updatedShips,
        sapoBoard: currentUser === 'Mi Rey' ? { ...sapoBoard, [index]: 'hit' as const } : sapoBoard,
        miReyBoard: currentUser === 'Sapo' ? { ...miReyBoard, [index]: 'hit' as const } : miReyBoard,
        logs: nextLogs,
      }));
    } else {
      playBattleshipMiss();
      // Miss switches turn
      setGameState(prev => ({
        ...prev,
        sapoBoard: currentUser === 'Mi Rey' ? { ...sapoBoard, [index]: 'miss' as const } : sapoBoard,
        miReyBoard: currentUser === 'Sapo' ? { ...miReyBoard, [index]: 'miss' as const } : miReyBoard,
        logs: nextLogs,
        currentTurn: currentUser === 'Sapo' ? 'Mi Rey' : 'Sapo',
      }));
    }
  };

  const handleReset = () => {
    playCutePop();
    setGameState(defaultState);
    setLocalShips([]);
    setActiveShipIdx(0);
  };

  // Health helpers (percentage of non-sunk ship blocks remaining)
  const getHealth = (ships: PlacedShip[]) => {
    if (ships.length === 0) return 100;
    const totalCells = SHIPS.reduce((acc, s) => acc + s.size, 0);
    const hitCells = ships.reduce((acc, s) => acc + s.hits.length, 0);
    return ((totalCells - hitCells) / totalCells) * 100;
  };

  const sapoHealth = getHealth(sapoShips);
  const miReyHealth = getHealth(miReyShips);

  // Render setup screen
  if (phase === 'setup') {
    const isPlayerReady = currentUser === 'Sapo' ? sapoReady : miReyReady;
    const isFleetComplete = localShips.length === SHIPS.length;

    if (isPlayerReady) {
      const otherPlayerName = currentUser === 'Sapo' ? miReyProfile.name : sapoProfile.name;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 p-6 text-white">
          <span className="material-symbols-outlined text-6xl text-[#7adaa1] animate-pulse">sailing</span>
          <h2 className="text-3xl font-display-lg">¡Flota confirmada! 🚢</h2>
          <p className="text-[#e2bec0] max-w-md font-label-mono text-sm leading-relaxed">
            Esperando a que <span className="text-[#fabc41] font-bold">{otherPlayerName}</span> coloque su flota para empezar la batalla...
          </p>
          <button onClick={onBack} className="bg-[#2f2348] border border-[#5a4042]/30 px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider text-[#e2bec0] hover:text-white font-bold transition-all">
            Volver al Lobby
          </button>
        </div>
      );
    }

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
            <h2 className="text-3xl font-display-lg text-white mb-2">¡Coloca tu flota, {currentUser === 'Sapo' ? sapoProfile.name : miReyProfile.name}! ⚓</h2>
            <p className="text-[#e2bec0] font-label-mono text-xs">Posiciona tus 5 barcos en la cuadrícula de batalla.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Grid */}
            <div className="md:col-span-7 flex justify-center w-full">
              <div className="bg-[#1B112C]/95 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-[#3A2E54]/50 w-full max-w-[450px]">
                <div className="grid grid-cols-10 gap-1.5 w-full aspect-square relative">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const isOccupied = localShips.some(s => s.cells.includes(i));
                    return (
                      <button
                        key={i}
                        onClick={() => handleSetupCellClick(i)}
                        className={`w-full h-full rounded-md flex items-center justify-center transition-all ${
                          isOccupied 
                            ? 'bg-[#7adaa1] shadow-[0_0_10px_rgba(122,218,161,0.5)] scale-105' 
                            : 'bg-[#2A1D45]/40 hover:bg-[#3D2C63]/80 border border-[#4A3280]/30 cursor-pointer'
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
                    <span className="font-label-caps text-[10px] uppercase font-bold">{orientation === 'horizontal' ? 'Horiz' : 'Vert'}</span>
                  </button>
                </div>
                
                <div className="flex flex-col gap-3">
                  {SHIPS.map((ship, idx) => {
                    const placed = localShips.find(s => s.id === ship.id);
                    const isSelected = activeShipIdx === idx;
                    
                    return (
                      <div 
                        key={ship.id}
                        onClick={() => !placed && setActiveShipIdx(idx)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          placed ? 'bg-[#7adaa1]/10 border-[#7adaa1]/30 opacity-60' 
                          : isSelected ? 'bg-[#ff5470]/20 border-[#ff5470] shadow-[0_0_15px_rgba(255,84,112,0.2)] cursor-pointer font-bold' 
                          : 'bg-[#201439] border-[#5a4042]/30 hover:bg-[#2a1d45] cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`${placed ? 'text-[#7adaa1]' : isSelected ? 'text-white' : 'text-[#e2bec0]'}`}>{ship.name}</span>
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
                  disabled={!isFleetComplete}
                  className={`w-full mt-6 font-headline-md text-sm py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    isFleetComplete 
                      ? 'bg-[#7adaa1] hover:bg-[#8eeabb] text-[#13062b] shadow-[0_4px_0_#4a9b6c] active:shadow-none active:translate-y-1 cursor-pointer' 
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

  // playing or game_over layout
  const isSapo = currentUser === 'Sapo';
  const myBoard = isSapo ? sapoBoard : miReyBoard;
  const opponentBoard = isSapo ? miReyBoard : sapoBoard;
  const myShips = isSapo ? sapoShips : miReyShips;
  const opponentShips = isSapo ? miReyShips : sapoShips;

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#221934] pb-32">
      <div className="flex flex-col w-full max-w-6xl mx-auto gap-6 md:gap-8 text-white">
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
            Combate en Tiempo Real 📡
          </span>
        </div>

        {/* Prominent Winner Banner if Game Over */}
        {phase === 'game_over' && winner && (
          <div className="bg-[#7adaa1]/20 border-2 border-[#7adaa1] rounded-[2rem] p-6 text-center shadow-[0_0_30px_rgba(122,218,161,0.2)] animate-bounce mb-2">
            <h2 className="text-3xl sm:text-4xl font-display-lg text-[#7adaa1] font-bold mb-1">
              🏆 ¡Victoria de {winner === 'Sapo' ? sapoProfile.name : miReyProfile.name}! 🏆
            </h2>
            <p className="text-white text-sm font-label-mono uppercase tracking-wider">
              ¡Ha hundido toda la flota enemiga! 🎉🚢💥
            </p>
          </div>
        )}

        {/* Status / Player Score Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Player 1: Sapo */}
          <div className={`flex items-center gap-4 bg-[#2f2348]/70 backdrop-blur-xl p-4 rounded-2xl border ${currentTurn === 'Sapo' && phase === 'playing' ? 'border-[#7adaa1] shadow-[0_0_15px_rgba(122,218,161,0.2)]' : 'border-[#5a4042]/30'} relative overflow-hidden transition-all`}>
            <div className="relative w-14 h-14 shrink-0">
              <img src={sapoProfile.avatar} className="w-full h-full object-cover rounded-full shadow-md z-10 relative" />
              <div className={`absolute inset-0 rounded-full ring-4 ${currentTurn === 'Sapo' && phase === 'playing' ? 'ring-[#7adaa1]' : 'ring-transparent'} ring-offset-2 ring-offset-[#2f2348] z-20 transition-all`}></div>
            </div>
            <div className="flex flex-col flex-1 gap-1 z-10">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-white">{sapoProfile.name}</span>
                {currentTurn === 'Sapo' && phase === 'playing' && (
                  <span className="text-[10px] font-label-caps text-[#180c30] bg-[#7adaa1] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">Atacando</span>
                )}
              </div>
              <div className="w-full bg-[#13062b] rounded-full h-2 overflow-hidden mt-1">
                <div className="bg-[#7adaa1] h-full rounded-full transition-all duration-500" style={{ width: `${sapoHealth}%` }}></div>
              </div>
              <div className="text-[10px] text-[#e2bec0] font-label-mono text-right">Flota: {Math.round(sapoHealth)}%</div>
            </div>
          </div>

          {/* Center Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-display-lg text-[#ffb2b8] drop-shadow-[0_0_16px_rgba(255,178,184,0.4)]">
              {phase === 'game_over' ? 'Fin de la Partida' : '¡Batalla Naval!'}
            </span>
            <span className="text-xs font-label-mono text-[#e2bec0] uppercase tracking-widest mt-1">
              {currentTurn === currentUser && phase === 'playing' ? '🟢 ¡Es tu turno de disparar!' : '🔴 Esperando turno del rival...'}
            </span>
          </div>

          {/* Player 2: Mi Rey */}
          <div className={`flex items-center gap-4 bg-[#2f2348]/70 backdrop-blur-xl p-4 rounded-2xl border ${currentTurn === 'Mi Rey' && phase === 'playing' ? 'border-[#fabc41] shadow-[0_0_15px_rgba(250,188,65,0.2)]' : 'border-[#5a4042]/30'} relative overflow-hidden transition-all`}>
            <div className="flex flex-col flex-1 gap-1 z-10">
              <div className="flex justify-between items-center">
                {currentTurn === 'Mi Rey' && phase === 'playing' && (
                  <span className="text-[10px] font-label-caps text-[#2e2a14] bg-[#fabc41] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse">Atacando</span>
                )}
                <span className="text-base font-bold text-white ml-auto">{miReyProfile.name}</span>
              </div>
              <div className="w-full bg-[#13062b] rounded-full h-2 overflow-hidden mt-1 flex justify-end">
                <div className="bg-[#fabc41] h-full rounded-full transition-all duration-500" style={{ width: `${miReyHealth}%` }}></div>
              </div>
              <div className="text-[10px] text-[#e2bec0] font-label-mono text-left">Flota: {Math.round(miReyHealth)}%</div>
            </div>
            <div className="relative w-14 h-14 shrink-0">
              <img src={miReyProfile.avatar} className="w-full h-full object-cover rounded-full shadow-md z-10 relative" />
              <div className={`absolute inset-0 rounded-full ring-4 ${currentTurn === 'Mi Rey' && phase === 'playing' ? 'ring-[#fabc41]' : 'ring-transparent'} ring-offset-2 ring-offset-[#2f2348] z-20 transition-all`}></div>
            </div>
          </div>
        </div>

        {/* Grids and Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Board Area (Attacking and Defensive) */}
          <div className="lg:col-span-8 flex flex-col gap-8 w-full items-center">
            {/* Board 1: Attack Board (Your targeting of the opponent's grid) */}
            <div className="w-full max-w-[500px] flex flex-col items-center">
              <h3 className="text-sm font-label-mono text-[#ffb2b8] mb-3 uppercase tracking-wider">
                🎯 Tablero de Ataque (Radar Enemigo)
              </h3>
              <div className="bg-[#1B112C]/95 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl shadow-2xl border border-[#3A2E54]/50 w-full aspect-square">
                <div className="grid grid-cols-10 gap-1 w-full h-full">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const state = opponentBoard[i];
                    // Find if Sapo has hit Mi Rey's ships in this cell, and if it's sunk
                    const opponentShipHit = opponentShips.find(s => s.cells.includes(i));
                    const isSunk = opponentShipHit && opponentShipHit.hits.length === opponentShipHit.size;
                    const isMyTurn = currentTurn === currentUser && phase === 'playing';

                    return (
                      <button
                        key={i}
                        disabled={!isMyTurn || state !== undefined}
                        onClick={() => handleAttackCellClick(i)}
                        className={`w-full h-full rounded-md flex items-center justify-center transition-all ${
                          state === 'hit'
                            ? isSunk 
                              ? 'bg-[#91002c] border border-[#ff5470] shadow-[inset_0_0_15px_rgba(255,84,112,0.5)]'
                              : 'bg-[#ff5470]/30 border border-[#ff5470]/60'
                            : state === 'miss'
                            ? 'bg-[#1F1433] border border-[#2F214A]'
                            : isMyTurn
                            ? 'bg-[#2A1D45]/40 hover:bg-[#3D2C63]/80 border border-[#4A3280]/30 hover:scale-105 cursor-pointer'
                            : 'bg-[#2A1D45]/20 border border-[#4A3280]/10 cursor-not-allowed'
                        }`}
                      >
                        {state === 'hit' && (
                          <span className={`material-symbols-outlined ${isSunk ? 'text-white' : 'text-[#ff5470]'} text-[10px] sm:text-base`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isSunk ? 'sailing' : 'favorite'}
                          </span>
                        )}
                        {state === 'miss' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5c4d82]/60"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Board 2: Defensive Board (Your ships and opponent's attacks on you) */}
            <div className="w-full max-w-[320px] flex flex-col items-center opacity-85">
              <h3 className="text-xs font-label-mono text-[#7adaa1] mb-2 uppercase tracking-wider">
                🛡️ Mi Flota (Tablero de Defensa)
              </h3>
              <div className="bg-[#1B112C]/80 p-3 rounded-2xl border border-[#3A2E54]/30 w-full aspect-square">
                <div className="grid grid-cols-10 gap-1 w-full h-full">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const state = myBoard[i]; // Opponent attacks on my board
                    const hasMyShip = myShips.some(s => s.cells.includes(i));
                    
                    return (
                      <div
                        key={i}
                        className={`w-full h-full rounded-sm flex items-center justify-center text-[8px] ${
                          hasMyShip
                            ? state === 'hit'
                              ? 'bg-[#91002c] text-white border border-[#ff5470]'
                              : 'bg-[#7adaa1]/40 border border-[#7adaa1]/30'
                            : state === 'miss'
                            ? 'bg-[#1F1433]'
                            : 'bg-[#2A1D45]/10 border border-[#4A3280]/5'
                        }`}
                      >
                        {state === 'hit' && <span>💥</span>}
                        {state === 'miss' && <div className="w-1 h-1 rounded-full bg-[#5c4d82]/40"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="lg:col-span-4 flex flex-col gap-4 w-full">
            <div className="bg-[#2f2348]/70 backdrop-blur-xl border border-[#5a4042]/30 rounded-3xl p-5 flex flex-col h-[500px] shadow-lg w-full">
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
                          {log.result === 'hit' ? '¡Impacto! ❤️ (Sigue atacando)' : log.result === 'sunk' ? `¡Hundido! (${log.shipName})` : '¡Agua! 🌊'}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5">{log.timeStr}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-auto border-t border-[#5a4042]/30 shrink-0">
                <button onClick={handleReset} className="w-full bg-[#ff5470] hover:bg-[#ff6b84] text-white font-headline-md text-sm py-3 rounded-xl shadow-[0_4px_0_#91002c] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-base">replay</span>
                  Reiniciar / Nueva Partida
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
