import React, { useState } from 'react';
import { UserProfile } from '../types';
import { playCutePop, playWinSound, playHeartSound } from '../utils/audio';

interface WordSearchGameProps {
  onBack: () => void;
  sapoProfile: UserProfile;
  miReyProfile: UserProfile;
}

interface WordLocation {
  word: string;
  coords: { row: number; col: number }[];
  hint: string;
}

const ROMANTIC_WORDS = [
  'AMOR', 'SAPO', 'REY', 'JUNTOS', 'SIEMPRE', 'TEAMO', 'BESO', 'ABRAZO',
  'NOVIOS', 'CORAZON', 'DULCE', 'CARINO', 'MIMOS', 'FECHAS', 'LOBBY',
  'DISTANCIA', 'CARTAS', 'SUEÑOS', 'VIDA', 'CIELO', 'ESTRELLA', 'MAGIA',
  'LOCO', 'FLOR', 'SOL', 'LUNA', 'ANHELO', 'ILUSION', 'ETERNO', 'PASION'
];

function generateWordSearch(wordList: string[]): { grid: string[][]; words: WordLocation[] } {
  const size = 10;
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
  
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
          if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          const coords = [];
          for (let i = 0; i < word.length; i++) {
            grid[row][col + i] = word[i];
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
          if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          const coords = [];
          for (let i = 0; i < word.length; i++) {
            grid[row + i][col] = word[i];
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
      if (grid[r][c] === '') {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, words: placedWords };
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({
  onBack,
  sapoProfile,
  miReyProfile,
}) => {
  const [gameState, setGameState] = useState(() => generateWordSearch(ROMANTIC_WORDS));
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const { grid, words } = gameState;

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some((cell) => cell.row === r && cell.col === c);
  };

  const isCellFound = (r: number, c: number) => {
    return words.some((w) =>
      foundWords.includes(w.word) &&
      w.coords.some((coord) => coord.row === r && coord.col === c)
    );
  };

  const handleCellClick = (r: number, c: number) => {
    playCutePop();
    const alreadySelected = selectedCells.some((cell) => cell.row === r && cell.col === c);
    let newSelected: { row: number; col: number }[];

    if (alreadySelected) {
      newSelected = selectedCells.filter((cell) => !(cell.row === r && cell.col === c));
    } else {
      newSelected = [...selectedCells, { row: r, col: c }];
    }

    setSelectedCells(newSelected);

    // Check if the selected cells form any of the words
    for (const w of words) {
      if (!foundWords.includes(w.word)) {
        const matchesWord =
          w.coords.length === newSelected.length &&
          w.coords.every((coord) =>
            newSelected.some((sel) => sel.row === coord.row && sel.col === coord.col)
          );

        if (matchesWord) {
          const updated = [...foundWords, w.word];
          setFoundWords(updated);
          setSelectedCells([]);
          playWinSound();
          if (updated.length === words.length) {
            playHeartSound();
          }
          return;
        }
      }
    }
  };

  const handleShowHint = () => {
    const unfound = words.find((w) => !foundWords.includes(w.word));
    if (unfound) {
      setActiveHint(`Pista para "${unfound.word}": ${unfound.hint}`);
      playCutePop();
    } else {
      setActiveHint('¡Ya encontraste todas las palabras!');
    }
  };

  const handleReset = () => {
    setGameState(generateWordSearch(ROMANTIC_WORDS));
    setFoundWords([]);
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
              Sopa de Letras <span className="text-[#ff5470]">🔠</span>
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-[#e2bec0] max-w-lg">
              Busca palabras secretas románticas en nuestra cuadrícula. ¡Cada partida es diferente! 💖
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-[#2f2348] p-4 rounded-2xl w-full md:w-auto min-w-[280px] shadow-xl border border-[#5a4042]/30 flex flex-col gap-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <img
                    alt="Sapo"
                    src={sapoProfile.avatar}
                    className="w-8 h-8 rounded-full border border-[#7adaa1] object-cover"
                  />
                  <img
                    alt="Mi Rey"
                    src={miReyProfile.avatar}
                    className="w-8 h-8 rounded-full border border-[#fabc41] object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col items-end text-white">
                <span className="font-label-caps text-[10px] text-[#ffb2b8] uppercase tracking-wider">
                  Palabras Encontradas
                </span>
                <span className="font-headline-lg text-2xl">
                  {foundWords.length}
                  <span className="text-[#e2bec0]/50 text-base">/{words.length}</span>
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-[#13062b] rounded-full overflow-hidden relative">
              <div
                className="absolute left-0 top-0 h-full bg-[#7adaa1] transition-all duration-500"
                style={{ width: `${words.length > 0 ? (foundWords.length / words.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

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
              {grid.map((row, r) =>
                row.map((letter, c) => {
                  const isFound = isCellFound(r, c);
                  const isSelected = isCellSelected(r, c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`aspect-square flex items-center justify-center font-headline-md text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                        isFound
                          ? 'bg-[#7adaa1]/25 text-[#7adaa1] ring-1 ring-[#7adaa1]/60 shadow-[0_0_12px_rgba(122,218,161,0.4)] font-bold'
                          : isSelected
                          ? 'bg-[#ff5470] text-white font-bold scale-105 shadow-md'
                          : 'bg-[#2f2348]/70 hover:bg-[#3f3359] text-white'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-[#e2bec0] font-label-mono mt-4 text-center">
              Haz clic en las letras para seleccionarlas y formar las palabras ocultas.
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
                Nuevo Juego
              </button>
              <button
                onClick={handleShowHint}
                className="flex-1 bg-transparent border-2 border-[#fabc41] text-[#fabc41] font-headline-md text-sm py-3 px-4 rounded-xl hover:bg-[#fabc41]/10 transition-colors flex items-center justify-center gap-1.5 font-bold"
              >
                <span className="material-symbols-outlined text-base">lightbulb</span>
                Pista
              </button>
            </div>

            <div className="flex-1 bg-[#2f2348] rounded-2xl p-5 shadow-xl border border-[#5a4042]/20 flex flex-col">
              <h3 className="font-label-mono text-xs text-[#fabc41] mb-4 uppercase tracking-widest border-b border-[#5a4042]/30 pb-2 font-bold">
                Palabras a encontrar ({words.length})
              </h3>
              <ul className="flex flex-col gap-2.5">
                {words.map((w) => {
                  const isFound = foundWords.includes(w.word);
                  return (
                    <li
                      key={w.word}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isFound ? 'bg-[#7adaa1]/10' : 'hover:bg-[#3a2e54]/50'
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
                        <div className="w-6 h-6 rounded-full bg-[#7adaa1]/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#7adaa1] text-[16px]">
                            check
                          </span>
                        </div>
                      ) : (
                        <span className="font-label-mono text-[10px] text-[#e2bec0]/70">
                          {w.word.length} LTRS
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              {words.length > 0 && foundWords.length === words.length && (
                <div className="mt-4 p-3 bg-[#7adaa1]/20 border border-[#7adaa1] rounded-xl text-center text-[#7adaa1] text-xs font-bold font-label-mono">
                  🎉 ¡Felicidades! Completaron la sopa de letras de amor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
