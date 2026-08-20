"use client";

import { useState, useCallback } from "react";

const GRID_SIZE = 5; // 5x5 dots = 4x4 boxes

type LineDir = "h" | "v";
type Theme = "classic" | "highcontrast" | "shapes";

const THEMES: Record<Theme, {
  label: string;
  p1: { line: string; glow: string; box: string; badge: string; icon: string };
  p2: { line: string; glow: string; box: string; badge: string; icon: string };
}> = {
  classic: {
    label: "Classic",
    p1: { line: "bg-blue-400", glow: "shadow-[0_0_8px_rgba(96,165,250,0.6)]", box: "bg-blue-500/30 border border-blue-500/50", badge: "bg-blue-600 ring-blue-300", icon: "🔵" },
    p2: { line: "bg-red-400", glow: "shadow-[0_0_8px_rgba(248,113,113,0.6)]", box: "bg-red-500/30 border border-red-500/50", badge: "bg-red-600 ring-red-300", icon: "🔴" },
  },
  highcontrast: {
    label: "High Contrast",
    p1: { line: "bg-yellow-300", glow: "shadow-[0_0_8px_rgba(253,224,71,0.6)]", box: "bg-yellow-400/25 border border-yellow-400/50", badge: "bg-yellow-600 ring-yellow-300", icon: "🟡" },
    p2: { line: "bg-purple-400", glow: "shadow-[0_0_8px_rgba(192,132,252,0.6)]", box: "bg-purple-500/25 border border-purple-400/50", badge: "bg-purple-600 ring-purple-300", icon: "🟣" },
  },
  shapes: {
    label: "Shapes",
    p1: { line: "bg-cyan-300", glow: "shadow-[0_0_8px_rgba(103,232,249,0.6)]", box: "bg-cyan-500/20 border-2 border-dashed border-cyan-400/60", badge: "bg-cyan-600 ring-cyan-300", icon: "▬" },
    p2: { line: "bg-orange-400", glow: "shadow-[0_0_8px_rgba(251,146,60,0.6)]", box: "bg-orange-500/20 border-2 border-dotted border-orange-400/60", badge: "bg-orange-600 ring-orange-300", icon: "◆" },
  },
};

function lineKey(row: number, col: number, dir: LineDir): string {
  return `${row}-${col}-${dir}`;
}

export default function DotsAndBoxes() {
  const [lines, setLines] = useState<Map<string, 1 | 2>>(new Map());
  const [boxes, setBoxes] = useState<(1 | 2 | null)[][]>(
    Array.from({ length: GRID_SIZE - 1 }, () =>
      Array(GRID_SIZE - 1).fill(null)
    )
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [theme, setTheme] = useState<Theme>("classic");

  const colors = THEMES[theme];

  const checkBox = useCallback(
    (row: number, col: number, newLines: Map<string, 1 | 2>): boolean => {
      return (
        newLines.has(lineKey(row, col, "h")) &&
        newLines.has(lineKey(row + 1, col, "h")) &&
        newLines.has(lineKey(row, col, "v")) &&
        newLines.has(lineKey(row, col + 1, "v"))
      );
    },
    []
  );

  const handleLineClick = useCallback(
    (row: number, col: number, dir: LineDir) => {
      const key = lineKey(row, col, dir);
      if (lines.has(key) || gameOver) return;

      const newLines = new Map(lines);
      newLines.set(key, currentPlayer);
      setLines(newLines);

      let scored = false;
      const newBoxes = boxes.map((r) => [...r]);

      if (dir === "h") {
        if (row > 0 && checkBox(row - 1, col, newLines)) {
          newBoxes[row - 1][col] = currentPlayer;
          scored = true;
        }
        if (row < GRID_SIZE - 1 && checkBox(row, col, newLines)) {
          newBoxes[row][col] = currentPlayer;
          scored = true;
        }
      } else {
        if (col > 0 && checkBox(row, col - 1, newLines)) {
          newBoxes[row][col - 1] = currentPlayer;
          scored = true;
        }
        if (col < GRID_SIZE - 1 && checkBox(row, col, newLines)) {
          newBoxes[row][col] = currentPlayer;
          scored = true;
        }
      }

      setBoxes(newBoxes);

      if (scored) {
        const newScores = { ...scores };
        newScores[currentPlayer] = newBoxes
          .flat()
          .filter((b) => b === currentPlayer).length;
        setScores(newScores);

        const totalBoxes = (GRID_SIZE - 1) * (GRID_SIZE - 1);
        if (newBoxes.flat().filter((b) => b !== null).length === totalBoxes) {
          setGameOver(true);
        }
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
    },
    [lines, boxes, currentPlayer, scores, gameOver, checkBox]
  );

  const resetGame = () => {
    setLines(new Map());
    setBoxes(
      Array.from({ length: GRID_SIZE - 1 }, () =>
        Array(GRID_SIZE - 1).fill(null)
      )
    );
    setCurrentPlayer(1);
    setScores({ 1: 0, 2: 0 });
    setGameOver(false);
  };

  const getWinner = () => {
    if (scores[1] > scores[2]) return "Player 1";
    if (scores[2] > scores[1]) return "Player 2";
    return "Tie";
  };

  const gridSize = GRID_SIZE * 2 - 1;

  const getPlayerStyle = (player: 1 | 2) => {
    return player === 1 ? colors.p1 : colors.p2;
  };

  const renderCell = (r: number, c: number) => {
    const isRowEven = r % 2 === 0;
    const isColEven = c % 2 === 0;

    // Dot
    if (isRowEven && isColEven) {
      return (
        <div key={`${r}-${c}`} className="flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full" />
        </div>
      );
    }

    // Horizontal line
    if (isRowEven && !isColEven) {
      const row = r / 2;
      const col = (c - 1) / 2;
      const key = lineKey(row, col, "h");
      const owner = lines.get(key);
      const isDrawn = owner !== undefined;
      const style = owner ? getPlayerStyle(owner) : null;

      return (
        <button
          key={`${r}-${c}`}
          onClick={() => handleLineClick(row, col, "h")}
          disabled={isDrawn || gameOver}
          className={`w-full h-full flex items-center justify-center rounded-sm transition-all ${
            !isDrawn && !gameOver ? "cursor-pointer active:scale-95" : ""
          }`}
          aria-label={`Horizontal line row ${row + 1} col ${col + 1}${isDrawn ? ` — Player ${owner}` : ""}`}
        >
          <div
            className={`w-full rounded-full transition-all ${
              isDrawn
                ? `${style!.line} h-2.5 ${style!.glow}`
                : "bg-gray-600 h-1.5 hover:bg-gray-400 hover:h-2.5"
            }`}
          />
        </button>
      );
    }

    // Vertical line
    if (!isRowEven && isColEven) {
      const row = (r - 1) / 2;
      const col = c / 2;
      const key = lineKey(row, col, "v");
      const owner = lines.get(key);
      const isDrawn = owner !== undefined;
      const style = owner ? getPlayerStyle(owner) : null;

      return (
        <button
          key={`${r}-${c}`}
          onClick={() => handleLineClick(row, col, "v")}
          disabled={isDrawn || gameOver}
          className={`w-full h-full flex items-center justify-center rounded-sm transition-all ${
            !isDrawn && !gameOver ? "cursor-pointer active:scale-95" : ""
          }`}
          aria-label={`Vertical line row ${row + 1} col ${col + 1}${isDrawn ? ` — Player ${owner}` : ""}`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isDrawn
                ? `${style!.line} w-2.5 ${style!.glow}`
                : "bg-gray-600 w-1.5 hover:bg-gray-400 hover:w-2.5"
            }`}
          />
        </button>
      );
    }

    // Box
    const boxRow = (r - 1) / 2;
    const boxCol = (c - 1) / 2;
    const owner = boxes[boxRow]?.[boxCol];
    const style = owner ? getPlayerStyle(owner) : null;

    return (
      <div
        key={`${r}-${c}`}
        className={`w-full h-full rounded-md transition-all duration-300 flex items-center justify-center ${
          owner ? style!.box : ""
        }`}
      >
        {owner && (
          <span className="text-lg opacity-60">{getPlayerStyle(owner).icon}</span>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Dots & Boxes
      </h1>

      {/* Theme selector */}
      <div className="flex gap-1.5 mb-3" role="radiogroup" aria-label="Color theme">
        {(Object.keys(THEMES) as Theme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              theme === t
                ? "bg-white text-gray-900"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
            role="radio"
            aria-checked={theme === t}
          >
            {THEMES[t].label}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="flex gap-4 mb-2">
        <div
          className={`px-4 py-2 rounded-lg text-white font-bold text-base ${
            currentPlayer === 1 && !gameOver
              ? `${colors.p1.badge} ring-2 scale-105`
              : "bg-gray-700"
          } transition-all`}
        >
          {colors.p1.icon} P1: {scores[1]}
        </div>
        <div
          className={`px-4 py-2 rounded-lg text-white font-bold text-base ${
            currentPlayer === 2 && !gameOver
              ? `${colors.p2.badge} ring-2 scale-105`
              : "bg-gray-700"
          } transition-all`}
        >
          {colors.p2.icon} P2: {scores[2]}
        </div>
      </div>

      {/* Turn indicator */}
      {!gameOver && (
        <p className="text-gray-400 text-sm mb-3">
          {currentPlayer === 1 ? colors.p1.icon : colors.p2.icon} Player {currentPlayer}&apos;s turn
        </p>
      )}

      {/* Game Board */}
      <div
        className="grid w-full max-w-[340px] aspect-square"
        style={{
          gridTemplateColumns: Array.from({ length: gridSize }, (_, i) =>
            i % 2 === 0 ? "16px" : "1fr"
          ).join(" "),
          gridTemplateRows: Array.from({ length: gridSize }, (_, i) =>
            i % 2 === 0 ? "16px" : "1fr"
          ).join(" "),
        }}
        role="grid"
        aria-label="Game board"
      >
        {Array.from({ length: gridSize }, (_, r) =>
          Array.from({ length: gridSize }, (_, c) => renderCell(r, c))
        )}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="mt-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-white">
            {getWinner() === "Tie"
              ? "It&apos;s a tie! 🤝"
              : `${getWinner()} wins! 🎉`}
          </p>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={resetGame}
        className="mt-4 px-6 py-2.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
      >
        New Game
      </button>

      {/* Build tag */}
      <span className="absolute bottom-3 text-gray-700 text-[10px]">
        build {process.env.NEXT_PUBLIC_BUILD_ID?.slice(0, 7) || "local"} 🎲
      </span>
    </div>
  );
}
