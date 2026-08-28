import React, { useState } from 'react';
import { UserProfile } from '../types';
import { playCutePop, playWinSound, playHeartSound } from '../utils/audio';
import { useSyncedDoc } from '../lib/useFirestore';

interface WordSearchGameProps {
  onBack: () => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
  currentUser: 'Sapo' | 'Mi Rey';
  onUpdateScore: (winner: 'Sapo' | 'Mi Rey') => void;
}

interface WordLocation {
  word: string;
  coords: { row: number; col: number }[];
  hint: string;
}

interface FoundWordInfo {
  word: string;
  foundBy: 'Sapo' | 'Mi Rey';
}

interface WordSearchSyncState {
  grid: string[]; // Flat 100-element array to avoid Firestore's nested array limitation
  words: WordLocation[];
  foundWords: FoundWordInfo[];
  gameActive: boolean;
  winner: 'Sapo' | 'Mi Rey' | 'Empate' | null;
}

const ROMANTIC_WORDS = [
  'AMOR', 'SAPO', 'REY', 'JUNTOS', 'SIEMPRE', 'TEAMO', 'BESO', 'ABRAZO',
  'NOVIOS', 'CORAZON', 'DULCE', 'CARINO', 'MIMOS', 'FECHAS', 'LOBBY',
  'DISTANCIA', 'CARTAS', 'SUEÑOS', 'VIDA', 'CIELO', 'ESTRELLA', 'MAGIA',
  'LOCO', 'FLOR', 'SOL', 'LUNA', 'ANHELO', 'ILUSION', 'ETERNO', 'PASION'
];

function generateWordSearch(wordList: string[]): { grid: string[]; words: WordLocation[] } {
  const size = 10;
  const grid2D: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
  
  // Pick 6 random unique words
  const shuffled = [...wordList].sort(() => 0.5 - Math.random());
  const selectedWords = shuffled.slice(0, 6);
  const placedWords: WordLocation[] = [];

  for (const word of selectedWords) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 150) {
      attempts++;
      const isHorizontal = Math.random() > 0.5;
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (isHorizontal) {
        if (col + word.length > size) continue;
        // Check overlaps
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid2D[row][col + i] !== '' && grid2D[row][col + i] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          const coords = [];
          for (let i = 0; i < word.length; i++) {
            grid2D[row][col + i] = word[i];
            coords.push({ row, col: col + i });
          }
          placedWords.push({
            word,
            coords,
            hint: `Fila ${row + 1} horizontal`,
          });
          placed = true;
        }
      } else {
        if (row + word.length > size) continue;
        // Check overlaps
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid2D[row + i][col] !== '' && grid2D[row + i][col] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          const coords = [];
          for (let i = 0; i < word.length; i++) {
            grid2D[row + i][col] = word[i];
            coords.push({ row: row + i, col });
          }
          placedWords.push({
            word,
            coords,
            hint: `Columna ${col + 1} vertical`,
          });
          placed = true;
        }
      }
    }
  }

  // Fill empty spots with random letters
  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid2D[r][c] === '') {
        grid2D[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid: grid2D.flat(), words: placedWords };
}

const initialGameData = generateWordSearch(ROMANTIC_WORDS);
const defaultState: WordSearchSyncState = {
  grid: initialGameData.grid,
  words: initialGameData.words,
  foundWords: [],
  gameActive: true,
  winner: null,
};

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
  onBack,
  sapoProfile,
  miReyProfile,
  currentUser,
  onUpdateScore,
}) => {
  const [gameState, setGameState] = useSyncedDoc<WordSearchSyncState>(
    'shared',
    'wordsearch_state',
    'ourlobby_wordsearch',
    defaultState
  );

  const { grid = defaultState.grid, words = defaultState.words, foundWords = [], gameActive = true, winner = null } = gameState || defaultState;
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const sapoScore = foundWords.filter(w => w.foundBy === 'Sapo').length;
  const miReyScore = foundWords.filter(w => w.foundBy === 'Mi Rey').length;

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some((cell) => cell.row === r && cell.col === c);
  };

  // Find who found a given cell
  const getCellFoundBy = (r: number, c: number): 'Sapo' | 'Mi Rey' | null => {
    for (const w of words) {
      const foundInfo = foundWords.find(f => f.word === w.word);
      if (foundInfo && w.coords.some(coord => coord.row === r && coord.col === c)) {
        return foundInfo.foundBy;
      }
    }
    return null;
  };

  const handleCellClick = (r: number, c: number) => {
    if (!gameActive) return;
    playCutePop();

    // Don't allow selecting cells that are already part of a found word
    if (getCellFoundBy(r, c) !== null) return;

    const alreadySelected = selectedCells.some((cell) => cell.row === r && cell.col === c);
    let newSelected: { row: number; col: number }[];

    if (alreadySelected) {
      newSelected = selectedCells.filter((cell) => !(cell.row === r && cell.col === c));
    } else {
      newSelected = [...selectedCells, { row: r, col: c }];
    }

    setSelectedCells(newSelected);

    // Check if selected cells match any unfound words
    for (const w of words) {
      const isAlreadyFound = foundWords.some(f => f.word === w.word);
      if (!isAlreadyFound) {
        const matchesWord =
          w.coords.length === newSelected.length &&
          w.coords.every((coord) =>
            newSelected.some((sel) => sel.row === coord.row && sel.col === coord.col)
          );

        if (matchesWord) {
          playWinSound();
          const updatedFoundWords = [...foundWords, { word: w.word, foundBy: currentUser }];
          const isFinished = updatedFoundWords.length === words.length;

          let gameWinner = null;
          let active = true;

          if (isFinished) {
            playHeartSound();
            active = false;
            // Calculate who found more words
            const finalSapoScore = updatedFoundWords.filter(f => f.foundBy === 'Sapo').length;
            const finalMiReyScore = updatedFoundWords.filter(f => f.foundBy === 'Mi Rey').length;
            
            if (finalSapoScore > finalMiReyScore) {
              gameWinner = 'Sapo' as const;
            } else if (finalMiReyScore > finalSapoScore) {
              gameWinner = 'Mi Rey' as const;
            } else {
              gameWinner = 'Empate' as const;
            }

            if (gameWinner && gameWinner !== 'Empate') {
              onUpdateScore(gameWinner);
            }
          }

          setGameState({
            grid,
            words,
            foundWords: updatedFoundWords,
            gameActive: active,
            winner: gameWinner,
          });

          setSelectedCells([]);
          return;
        }
      }
    }
  };

  const handleShowHint = () => {
    const unfound = words.find((w) => !foundWords.some(f => f.word === w.word));
    if (unfound) {
      setActiveHint(`Pista para una palabra: ${unfound.hint}`);
      playCutePop();
    } else {
      setActiveHint('¡Ya encontraron todas las palabras!');
    }
  };

  const handleReset = () => {
    const nextGame = generateWordSearch(ROMANTIC_WORDS);
    setGameState({
      grid: nextGame.grid,
      words: nextGame.words,
      foundWords: [],
      gameActive: true,
      winner: null,
    });
    setSelectedCells([]);
    setActiveHint(null);
    playCutePop();
  };

  return (
    <div className="relative pt-6 px-4 md:px-8 min-h-screen bg-[#180c30] pb-32">
      <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">
        {/* Back button */}
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs md:text-sm font-label-caps uppercase text-[#e2bec0] hover:text-white bg-[#2f2348] px-4 py-2 rounded-xl border border-[#5a4042]/30 hover:bg-[#3a2e54] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver a Juegos
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex flex-col gap-1 text-white">
            <h1 className="font-display-lg text-3xl sm:text-4xl">
              Sopa de Letras Competitiva 🔠🏆
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-[#e2bec0] max-w-lg">
              ¡Carrera de velocidad! Encuentra las palabras antes que tu pareja. Las celdas se colorean según quién las encuentre primero.
            </p>
          </div>

          {/* Combined Progress Box */}
          <div className="bg-[#2f2348] p-4 rounded-2xl w-full md:w-auto min-w-[340px] shadow-xl border border-[#5a4042]/30 flex flex-col gap-3">
            <div className="flex justify-between items-center text-white">
              {/* Sapo Score */}
              <div className="flex items-center gap-2.5">
                <img
                  alt="Sapo"
                  src={sapoProfile.avatar}
                  className="w-10 h-10 rounded-full border-2 border-[#7adaa1] object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#7adaa1] uppercase font-bold tracking-wider">{sapoProfile.name}</span>
                  <span className="text-xl font-bold">{sapoScore} <span className="text-xs text-[#e2bec0]/60">encontradas</span></span>
                </div>
              </div>

              <div className="text-[#e2bec0]/40 font-bold text-sm px-2">VS</div>

              {/* Mi Rey Score */}
              <div className="flex items-center gap-2.5 text-right">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#fabc41] uppercase font-bold tracking-wider">{miReyProfile.name}</span>
                  <span className="text-xl font-bold">{miReyScore} <span className="text-xs text-[#e2bec0]/60">encontradas</span></span>
                </div>
                <img
                  alt="Mi Rey"
                  src={miReyProfile.avatar}
                  className="w-10 h-10 rounded-full border-2 border-[#fabc41] object-cover"
                />
              </div>
            </div>

            {/* General progress bar */}
            <div className="w-full h-2 bg-[#13062b] rounded-full overflow-hidden relative">
              <div
                className="absolute left-0 top-0 h-full bg-[#7adaa1] transition-all duration-500"
                style={{ width: `${words.length > 0 ? (foundWords.length / words.length) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-[9px] text-[#e2bec0]/60 text-center font-label-mono uppercase">
              Progreso total: {foundWords.length} / {words.length} palabras
            </div>
          </div>
        </div>

        {/* Winner Announcement Banner */}
        {!gameActive && winner && (
          <div className="bg-[#7adaa1]/20 border-2 border-[#7adaa1] rounded-[2rem] p-6 text-center shadow-[0_0_30px_rgba(122,218,161,0.2)] animate-bounce">
            <h2 className="text-3xl sm:text-4xl font-display-lg text-[#7adaa1] font-bold mb-1">
              {winner === 'Empate' ? '🤝 ¡Empate de velocidad! 🤝' : `🏆 ¡Ganador: ${winner === 'Sapo' ? sapoProfile.name : miReyProfile.name}! 🏆`}
            </h2>
            <p className="text-white text-sm font-label-mono uppercase tracking-wider">
              {winner === 'Empate' ? '¡Ambos encontraron la misma cantidad de palabras!' : '¡Fue más veloz encontrando las palabras de amor! 💖'}
            </p>
          </div>
        )}

        {activeHint && (
          <div className="bg-[#fabc41]/15 border border-[#fabc41]/40 text-[#fabc41] px-4 py-2.5 rounded-xl text-sm font-label-mono animate-pop flex items-center justify-between">
            <span>💡 {activeHint}</span>
            <button onClick={() => setActiveHint(null)} className="text-white hover:text-[#fabc41]">✕</button>
          </div>
        )}

        {/* Main Game Grid & Side Panel */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 10x10 Word Grid */}
          <div className="flex-1 flex flex-col items-center bg-[#25193d] p-4 sm:p-6 rounded-3xl shadow-xl border border-[#5a4042]/30">
            <div className="grid grid-cols-10 gap-1 sm:gap-2 bg-[#3a2e54]/50 p-2 sm:p-4 rounded-2xl select-none max-w-[500px] w-full">
              {grid.map((letter, index) => {
                const r = Math.floor(index / 10);
                const c = index % 10;
                const cellOwner = getCellFoundBy(r, c);
                const isSelected = isCellSelected(r, c);

                return (
                  <button
                    key={index}
                    onClick={() => handleCellClick(r, c)}
                    className={`aspect-square flex items-center justify-center font-headline-md text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                      cellOwner === 'Sapo'
                        ? 'bg-[#7adaa1]/30 text-[#7adaa1] ring-2 ring-[#7adaa1] font-bold shadow-[0_0_12px_rgba(122,218,161,0.3)]'
                        : cellOwner === 'Mi Rey'
                        ? 'bg-[#fabc41]/30 text-[#fabc41] ring-2 ring-[#fabc41] font-bold shadow-[0_0_12px_rgba(250,188,65,0.3)]'
                        : isSelected
                        ? 'bg-[#ff5470] text-white font-bold scale-105 shadow-md'
                        : gameActive
                        ? 'bg-[#2f2348]/70 hover:bg-[#3f3359] text-white'
                        : 'bg-[#2f2348]/30 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#e2bec0] font-label-mono mt-4 text-center text-white">
              Sostén y haz clic en las celdas para marcar una palabra. ¡Apúrate antes que tu pareja!
            </p>
          </div>

          {/* Side Panel: Words List & Actions */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-[#ff5470] text-white font-headline-md text-sm py-3 px-4 rounded-xl shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Nuevo Tablero
              </button>
              <button
                onClick={handleShowHint}
                className="flex-1 bg-transparent border-2 border-[#fabc41] text-[#fabc41] font-headline-md text-sm py-3 px-4 rounded-xl hover:bg-[#fabc41]/10 transition-colors flex items-center justify-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-base">lightbulb</span>
                Pista
              </button>
            </div>

            <div className="flex-1 bg-[#2f2348] rounded-2xl p-5 shadow-xl border border-[#5a4042]/20 flex flex-col text-white">
              <h3 className="font-label-mono text-xs text-[#fabc41] mb-4 uppercase tracking-widest border-b border-[#5a4042]/30 pb-2 font-bold">
                Palabras a encontrar ({words.length})
              </h3>
              <ul className="flex flex-col gap-2.5">
                {words.map((w) => {
                  const foundInfo = foundWords.find(f => f.word === w.word);
                  const isFound = !!foundInfo;

                  return (
                    <li
                      key={w.word}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isFound 
                          ? foundInfo.foundBy === 'Sapo' 
                            ? 'bg-[#7adaa1]/10 border border-[#7adaa1]/20'
                            : 'bg-[#fabc41]/10 border border-[#fabc41]/20'
                          : 'hover:bg-[#3a2e54]/50'
                      }`}
                    >
                      <span
                        className={`font-headline-md text-base tracking-wider ${
                          isFound
                            ? 'text-[#e2bec0]/60 line-through'
                            : 'text-white font-bold'
                        }`}
                      >
                        {w.word}
                      </span>
                      {isFound ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          foundInfo.foundBy === 'Sapo' 
                            ? 'bg-[#7adaa1]/20 text-[#7adaa1]'
                            : 'bg-[#fabc41]/20 text-[#fabc41]'
                        }`}>
                          {foundInfo.foundBy === 'Sapo' ? sapoProfile.name : miReyProfile.name}
                        </span>
                      ) : (
                        <span className="font-label-mono text-[10px] text-[#e2bec0]/70">
                          {w.word.length} LTRS
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
