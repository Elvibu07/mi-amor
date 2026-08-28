import React from 'react';
import { ViewType, GameScore } from '../types';
import { playCutePop } from '../utils/audio';

interface SalonJuegosViewProps {
  onSelectGame: (game: ViewType) => void;
  gameScore: GameScore;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

export const SalonJuegosView: React.FC<SalonJuegosViewProps> = ({
  onSelectGame,
  gameScore,
  sapoProfile,
  miReyProfile,
}) => {
  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#180c30] pb-32">
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-10">
        {/* Header with scoreboard */}
        <div className="flex flex-col items-center text-center space-y-3 relative">
          <div className="absolute w-[600px] h-[300px] bg-[#fabc41]/10 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

          <div className="inline-flex items-center justify-center bg-[#25193d]/80 px-5 py-2 rounded-full backdrop-blur-sm relative z-10 border border-[#5a4042]/30 shadow-inner">
            <span className="font-label-mono text-xs md:text-sm text-[#fabc41] uppercase tracking-widest flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[18px]">sports_esports</span>
              Arena de Juegos
            </span>
          </div>

          <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl text-[#fabc41] relative z-10 mt-2">
            Salón de Juegos <span className="text-[#ff5470]">🕹️</span>
          </h1>

          <p className="font-body-md text-base md:text-lg text-[#e2bec0] max-w-2xl relative z-10">
            Nuestra colección de minijuegos para mantener viva la chispa y divertirnos a través de la distancia. ¿Quién lleva la delantera?
          </p>

          {/* Scores */}
          <div className="flex gap-4 mt-4 z-10">
            <div className="bg-[#2f2348] px-6 py-3 rounded-2xl flex flex-col items-center border border-[#5a4042]/30 shadow-lg min-w-[120px]">
              <span className="font-label-caps text-[10px] text-[#e2bec0] uppercase tracking-wider mb-0.5">
                Victorias {sapoProfile.name} ({sapoProfile.city})
              </span>
              <span className="font-headline-lg text-3xl sm:text-4xl text-[#ff5470] font-bold">
                {gameScore.victoriasGYE}
              </span>
            </div>
            <div className="bg-[#2f2348] px-6 py-3 rounded-2xl flex flex-col items-center border border-[#5a4042]/30 shadow-lg min-w-[120px]">
              <span className="font-label-caps text-[10px] text-[#e2bec0] uppercase tracking-wider mb-0.5">
                Victorias {miReyProfile.name} ({miReyProfile.city})
              </span>
              <span className="font-headline-lg text-3xl sm:text-4xl text-[#fabc41] font-bold">
                {gameScore.victoriasMAD}
              </span>
            </div>
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Hundir la Flota */}
          <div className="group bg-[#25193d] rounded-2xl p-5 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(255,84,112,0.25)] border border-[#5a4042]/30">
            <div className="w-full h-48 rounded-xl mb-4 relative overflow-hidden bg-[#2f2348] flex items-center justify-center group-hover:bg-[#ff5470]/10 transition-colors">
              <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                ⚓
              </span>
              <div className="absolute top-3 right-3 bg-[#ff5470] text-white px-3 py-1 rounded-full font-label-caps text-[10px] animate-pulse shadow-[0_0_10px_rgba(255,84,112,0.5)] uppercase font-bold">
                Tu Turno
              </div>
            </div>
            <div className="flex-grow flex flex-col">
              <h3 className="font-headline-md text-xl text-white mb-1 group-hover:text-[#ffb2b8] transition-colors">
                Hundir la Flota
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-[#e2bec0] mb-6 flex-grow leading-relaxed">
                Batalla naval de amor. Encuentra los barcos antes de que hundan los tuyos.
              </p>
              <button
                onClick={() => {
                  onSelectGame('battleship');
                  playCutePop();
                }}
                className="w-full py-3 rounded-full font-label-caps text-xs uppercase tracking-wider bg-[#ff5470] text-white shadow-[0_4px_0_#91002c] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-2 group-hover:bg-[#ff6b84] font-bold"
              >
                JUGAR PARTIDA
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              </button>
            </div>
          </div>

          {/* 3 en Raya */}
          <div className="group bg-[#25193d] rounded-2xl p-5 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(250,188,65,0.25)] border border-[#5a4042]/30">
            <div className="w-full h-48 rounded-xl mb-4 relative overflow-hidden bg-[#2f2348] flex items-center justify-center group-hover:bg-[#fabc41]/10 transition-colors">
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-24 h-24 group-hover:scale-110 transition-transform duration-300">
                <div className="bg-[#3a2e54] rounded-sm flex items-center justify-center text-[#fabc41] font-bold text-lg">X</div>
                <div className="bg-[#3a2e54] rounded-sm"></div>
                <div className="bg-[#3a2e54] rounded-sm flex items-center justify-center text-[#ff5470] font-bold text-lg">O</div>
                <div className="bg-[#3a2e54] rounded-sm"></div>
                <div className="bg-[#3a2e54] rounded-sm flex items-center justify-center text-[#fabc41] font-bold text-lg">X</div>
                <div className="bg-[#3a2e54] rounded-sm"></div>
                <div className="bg-[#3a2e54] rounded-sm flex items-center justify-center text-[#ff5470] font-bold text-lg">O</div>
                <div className="bg-[#3a2e54] rounded-sm flex items-center justify-center text-[#ff5470] font-bold text-lg">O</div>
                <div className="bg-[#3a2e54] rounded-sm flex items-center justify-center text-[#fabc41] font-bold text-lg">X</div>
              </div>
            </div>
            <div className="flex-grow flex flex-col">
              <h3 className="font-headline-md text-xl text-white mb-1 group-hover:text-[#fabc41] transition-colors">
                3 en Raya
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-[#e2bec0] mb-6 flex-grow leading-relaxed">
                El clásico de siempre, rápido e intenso. ¿Quién se queda con la revancha?
              </p>
              <button
                onClick={() => {
                  onSelectGame('tictactoe');
                  playCutePop();
                }}
                className="w-full py-3 rounded-full font-label-caps text-xs uppercase tracking-wider bg-[#fabc41] text-[#422d00] shadow-[0_4px_0_#bd8700] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-2 group-hover:bg-[#ffdea8] font-bold"
              >
                JUGAR PARTIDA
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              </button>
            </div>
          </div>

          {/* Sopa de Letras */}
          <div className="group bg-[#25193d] rounded-2xl p-5 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(122,218,161,0.25)] border border-[#5a4042]/30">
            <div className="w-full h-48 rounded-xl mb-4 relative overflow-hidden bg-[#2f2348] flex items-center justify-center group-hover:bg-[#7adaa1]/10 transition-colors">
              <div className="flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-300 font-label-mono font-bold">
                <div className="flex gap-2 text-xl">
                  <span className="text-[#7adaa1]">A</span>
                  <span className="text-[#a9898b]">M</span>
                  <span className="text-[#a9898b]">O</span>
                  <span className="text-[#a9898b]">R</span>
                </div>
                <div className="flex gap-2 text-xl mt-1">
                  <span className="text-[#a9898b]">T</span>
                  <span className="text-[#7adaa1]">E</span>
                  <span className="text-[#a9898b]">X</span>
                  <span className="text-[#a9898b]">T</span>
                </div>
                <div className="flex gap-2 text-xl mt-1">
                  <span className="text-[#a9898b]">L</span>
                  <span className="text-[#a9898b]">U</span>
                  <span className="text-[#7adaa1]">Q</span>
                  <span className="text-[#a9898b]">A</span>
                </div>
              </div>
            </div>
            <div className="flex-grow flex flex-col">
              <h3 className="font-headline-md text-xl text-white mb-1 group-hover:text-[#7adaa1] transition-colors">
                Sopa de Letras
              </h3>
              <p className="font-body-md text-xs sm:text-sm text-[#e2bec0] mb-6 flex-grow leading-relaxed">
                Busca palabras y recuerdos secretos escondidos en nuestra cuadrícula.
              </p>
              <button
                onClick={() => {
                  onSelectGame('sopa-letras');
                  playCutePop();
                }}
                className="w-full py-3 rounded-full font-label-caps text-xs uppercase tracking-wider bg-[#7adaa1] text-[#003920] shadow-[0_4px_0_#43a470] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-2 group-hover:bg-[#95f7bb] font-bold"
              >
                JUGAR PARTIDA
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              </button>
            </div>
          </div>

          {/* Próximamente */}
          <div className="bg-[#25193d]/50 rounded-2xl p-5 flex flex-col h-full opacity-60 border border-[#5a4042]/20">
            <div className="w-full h-48 rounded-xl mb-4 relative overflow-hidden bg-[#2f2348]/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-[#e2bec0]/60">lock</span>
            </div>
            <div className="flex-grow flex flex-col">
              <h3 className="font-headline-md text-xl text-white mb-1">Próximamente ✨</h3>
              <p className="font-body-md text-xs sm:text-sm text-[#e2bec0] mb-6 flex-grow leading-relaxed">
                Nuevos juegos en desarrollo para nuestro santuario privado (Trivia, Parejas).
              </p>
              <div className="w-full py-3 rounded-full font-label-caps text-xs uppercase tracking-wider bg-[#3a2e54] text-[#e2bec0]/60 flex justify-center items-center gap-2 cursor-not-allowed">
                BLOQUEADO
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
