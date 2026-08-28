import React from 'react';
import { UserProfile } from '../types';
import { playCutePop, playWinSound, playHeartSound } from '../utils/audio';
import { useSyncedDoc } from '../lib/useFirestore';

interface TicTacToeGameProps {
  onBack: () => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  onUpdateScore: (winner: 'Sapo' | 'Mi Rey') => void;
  currentUser: 'Sapo' | 'Mi Rey';
}

interface TicTacToeSyncState {
  board: string[];
  currentPlayer: 'X' | 'O'; // X = Sapo (❤️), O = Mi Rey (⭐)
  gameActive: boolean;
  winningCombo: number[] | null;
  scoreX: number;
  scoreO: number;
}

const defaultState: TicTacToeSyncState = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  gameActive: true,
  winningCombo: null,
  scoreX: 0,
  scoreO: 0,
};

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  onBack,
  sapoProfile,
  miReyProfile,
  onUpdateScore,
  currentUser,
}) => {
  const [gameState, setGameState] = useSyncedDoc<TicTacToeSyncState>(
    'shared',
    'tictactoe_state',
    'ourlobby_tictactoe',
    defaultState
  );

  const { board, currentPlayer, gameActive, winningCombo, scoreX, scoreO } = gameState;

  const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6],            // Diagonals
  ];

  // Helper to determine if it's the current player's turn to play
  const isMyTurn = (currentUser === 'Sapo' && currentPlayer === 'X') || 
                   (currentUser === 'Mi Rey' && currentPlayer === 'O');

  const handleCellClick = (index: number) => {
    if (!isMyTurn || board[index] !== '' || !gameActive) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    
    playCutePop();

    // Check Win
    let won = false;
    let combo: number[] | null = null;

    for (let i = 0; i < winConditions.length; i++) {
      const [a, b, c] = winConditions[i];
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        won = true;
        combo = winConditions[i];
        break;
      }
    }

    if (won && combo) {
      playWinSound();
      const newScoreX = currentPlayer === 'X' ? scoreX + 1 : scoreX;
      const newScoreO = currentPlayer === 'O' ? scoreO + 1 : scoreO;
      
      setGameState({
        board: newBoard,
        currentPlayer: currentPlayer, // Keep as the winner's mark for UI
        gameActive: false,
        winningCombo: combo,
        scoreX: newScoreX,
        scoreO: newScoreO,
      });

      // Update global scoreboard
      onUpdateScore(currentPlayer === 'X' ? 'Sapo' : 'Mi Rey');
      return;
    }

    if (!newBoard.includes('')) {
      // Draw
      playHeartSound();
      setGameState({
        board: newBoard,
        currentPlayer: currentPlayer,
        gameActive: false,
        winningCombo: null,
        scoreX,
        scoreO,
      });
      return;
    }

    // Switch player
    setGameState({
      board: newBoard,
      currentPlayer: currentPlayer === 'X' ? 'O' : 'X',
      gameActive,
      winningCombo,
      scoreX,
      scoreO,
    });
  };

  const handleReset = () => {
    playCutePop();
    setGameState({
      board: Array(9).fill(''),
      currentPlayer: 'X', // Sapo goes first on reset
      gameActive: true,
      winningCombo: null,
      scoreX,
      scoreO,
    });
  };

  const handleResetAll = () => {
    playCutePop();
    setGameState(defaultState);
  };

  const isDraw = !board.includes('') && !winningCombo;

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#180c30] pb-32">
      <div className="flex flex-col w-full max-w-4xl mx-auto items-center">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs md:text-sm font-label-caps uppercase text-[#e2bec0] hover:text-white bg-[#2f2348] px-4 py-2 rounded-xl border border-[#5a4042]/30 hover:bg-[#3a2e54] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver a Juegos
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
            3 en Raya <span className="text-[#fabc41] drop-shadow-[0_0_15px_rgba(250,188,65,0.6)]">⭐</span>
          </h1>
          <p className="font-label-mono text-xs text-[#e2bec0] uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 h-px bg-[#5a4042]"></span>
            Duelo en tiempo real ⚡
            <span className="w-8 h-px bg-[#5a4042]"></span>
          </p>
        </div>

        {/* Scorecard & Turn Indicator */}
        <div className="flex w-full max-w-xl justify-between items-center bg-[#2f2348]/70 backdrop-blur-md rounded-[2.5rem] p-3 shadow-2xl border border-white/5 relative mb-6">
          {/* Active Turn Indicator */}
          <div
            className={`absolute w-[calc(50%-12px)] h-[calc(100%-24px)] bg-[#3a2e54]/90 backdrop-blur-lg rounded-[2rem] transition-transform duration-500 ease-in-out left-3 shadow-inner border border-white/10 ${
              currentPlayer === 'O' ? 'translate-x-[calc(100%+24px)]' : 'translate-x-0'
            }`}
          ></div>

          {/* Player 1: Sapo */}
          <div
            className={`flex-1 flex items-center justify-start gap-3 md:gap-4 px-4 sm:px-6 py-3 relative z-10 transition-opacity ${
              currentPlayer === 'X' ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <div className="relative">
              <img
                alt="Sapo Avatar"
                src={sapoProfile.avatar}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-[#ff5470] shadow-[0_0_20px_rgba(255,84,112,0.4)]"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#ff5470] rounded-full flex items-center justify-center text-[10px] sm:text-xs text-white font-bold border-2 border-[#2f2348]">
                ❤️
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-sm sm:text-base text-white leading-tight">
                {sapoProfile.name}
              </span>
              <span className="font-headline-lg text-2xl sm:text-3xl leading-none text-[#ff5470] font-bold mt-0.5">
                {scoreX}
              </span>
            </div>
          </div>

          {/* VS Badge */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#13062b] flex items-center justify-center z-10 shadow-inner border border-white/10 shrink-0">
            <span className="font-label-mono text-xs sm:text-sm text-[#e2bec0] font-bold">VS</span>
          </div>

          {/* Player 2: Mi Rey */}
          <div
            className={`flex-1 flex items-center justify-end gap-3 md:gap-4 px-4 sm:px-6 py-3 relative z-10 transition-opacity ${
              currentPlayer === 'O' ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <div className="flex flex-col items-end">
              <span className="font-headline-md text-sm sm:text-base text-white leading-tight">
                {miReyProfile.name}
              </span>
              <span className="font-headline-lg text-2xl sm:text-3xl leading-none text-[#fabc41] font-bold mt-0.5">
                {scoreO}
              </span>
            </div>
            <div className="relative">
              <img
                alt="Mi Rey Avatar"
                src={miReyProfile.avatar}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-[#fabc41] shadow-[0_0_20px_rgba(250,188,65,0.3)]"
              />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#fabc41] rounded-full flex items-center justify-center text-[10px] sm:text-xs text-[#422d00] font-bold border-2 border-[#2f2348]">
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center my-2">
          <div className="w-full h-full grid grid-cols-3 gap-3 p-4 sm:p-5 bg-[#2f2348]/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/5 relative z-10">
            {board.map((cell, idx) => {
              const isWinningCell = winningCombo?.includes(idx);

              return (
                <button
                  key={idx}
                  disabled={!isMyTurn && gameActive}
                  onClick={() => handleCellClick(idx)}
                  className={`rounded-2xl sm:rounded-[1.75rem] flex items-center justify-center text-4xl sm:text-6xl font-bold transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_8px_16px_rgba(0,0,0,0.3)] border border-white/5 ${
                    isWinningCell
                      ? 'bg-[#ff5470]/30 border-[#ff5470] scale-105 ring-2 ring-[#ff5470]'
                      : isMyTurn && gameActive && board[idx] === ''
                      ? 'bg-[#3a2e54]/50 hover:bg-[#3a2e54]/90 hover:-translate-y-1 cursor-pointer'
                      : 'bg-[#3a2e54]/30 cursor-not-allowed opacity-80'
                  } active:translate-y-0`}
                >
                  {cell === 'X' && (
                    <span className="text-[#ff5470] animate-pop drop-shadow-[0_0_15px_rgba(255,84,112,0.8)] leading-none select-none">
                      ❤️
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className="text-[#fabc41] animate-pop drop-shadow-[0_0_15px_rgba(250,188,65,0.8)] leading-none select-none">
                      ⭐
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Message & Reset */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="font-headline-lg text-lg sm:text-xl text-white text-center min-h-[32px]">
            {winningCombo ? (
              <span className={`animate-bounce font-bold ${currentPlayer === 'X' ? 'text-[#ff5470]' : 'text-[#fabc41]'}`}>
                ¡{currentPlayer === 'X' ? sapoProfile.name : miReyProfile.name} ha ganado! 🏆🎉
              </span>
            ) : isDraw ? (
              <span className="text-[#e2bec0] font-bold">¡Empate de amor! 🤝</span>
            ) : (
              <span className={currentPlayer === 'X' ? 'text-[#ff5470] animate-pulse' : 'text-[#fabc41] animate-pulse'}>
                {isMyTurn ? '¡Es tu turno!' : `Esperando a ${currentPlayer === 'X' ? sapoProfile.name : miReyProfile.name}...`}
              </span>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="bg-[#ff5470] hover:bg-[#ff6b84] text-white font-label-caps text-xs sm:text-sm uppercase tracking-widest py-3.5 px-6 rounded-full shadow-[0_0_24px_rgba(255,84,112,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group font-bold"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-rotate-180 transition-transform duration-500">
                refresh
              </span>
              Siguiente Ronda
            </button>
            <button
              onClick={handleResetAll}
              className="bg-[#201439] hover:bg-[#2a1d45] border border-[#5a4042]/50 text-[#e2bec0] hover:text-white font-label-caps text-xs sm:text-sm uppercase tracking-widest py-3.5 px-6 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold"
            >
              Reiniciar Marcador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
