"use client";

import { useState, useCallback } from "react";

const GRID_SIZE = 5; // 5x5 dots = 4x4 boxes
const CELL_SIZE = 56; // px between dots
const DOT_SIZE = 12;
const LINE_THICKNESS = 8;
const TOUCH_TARGET = 24; // invisible tap area

type Line = {
  row: number;
  col: number;
  direction: "h" | "v";
};

function getLineKey(line: Line): string {
  return `${line.row}-${line.col}-${line.direction}`;
}

export default function DotsAndBoxes() {
  const [lines, setLines] = useState<Map<string, 1 | 2>>(new Map());
  const [boxes, setBoxes] = useState<(1 | 2 | null)[][]>(
    Array.from({ length: GRID_SIZE - 1 }, () =>
      Array.from({ length: GRID_SIZE - 1 }, () => null)
    )
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [gameOver, setGameOver] = useState(false);

  const checkBox = useCallback(
    (row: number, col: number, newLines: Map<string, 1 | 2>): boolean => {
      const top = getLineKey({ row, col, direction: "h" });
      const bottom = getLineKey({ row: row + 1, col, direction: "h" });
      const left = getLineKey({ row, col, direction: "v" });
      const right = getLineKey({ row, col: col + 1, direction: "v" });
      return (
        newLines.has(top) &&
        newLines.has(bottom) &&
        newLines.has(left) &&
        newLines.has(right)
      );
    },
    []
  );

  const handleLineClick = useCallback(
    (line: Line) => {
      const key = getLineKey(line);
      if (lines.has(key) || gameOver) return;

      const newLines = new Map(lines);
      newLines.set(key, currentPlayer);
      setLines(newLines);

      let scored = false;
      const newBoxes = boxes.map((row) => [...row]);

      if (line.direction === "h") {
        if (line.row > 0 && checkBox(line.row - 1, line.col, newLines)) {
          newBoxes[line.row - 1][line.col] = currentPlayer;
          scored = true;
        }
        if (line.row < GRID_SIZE - 1 && checkBox(line.row, line.col, newLines)) {
          newBoxes[line.row][line.col] = currentPlayer;
          scored = true;
        }
      } else {
        if (line.col > 0 && checkBox(line.row, line.col - 1, newLines)) {
          newBoxes[line.row][line.col - 1] = currentPlayer;
          scored = true;
        }
        if (line.col < GRID_SIZE - 1 && checkBox(line.row, line.col, newLines)) {
          newBoxes[line.row][line.col] = currentPlayer;
          scored = true;
        }
      }

      setBoxes(newBoxes);

      if (scored) {
        const newScores = { ...scores };
        newScores[currentPlayer] = newBoxes.flat().filter((b) => b === currentPlayer).length;
        setScores(newScores);

        const totalBoxes = (GRID_SIZE - 1) * (GRID_SIZE - 1);
        const filledBoxes = newBoxes.flat().filter((b) => b !== null).length;
        if (filledBoxes === totalBoxes) {
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
        Array.from({ length: GRID_SIZE - 1 }, () => null)
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

  const boardWidth = (GRID_SIZE - 1) * CELL_SIZE + DOT_SIZE;
  const boardHeight = (GRID_SIZE - 1) * CELL_SIZE + DOT_SIZE;

  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Dots & Boxes</h1>

      {/* Scoreboard */}
      <div className="flex gap-4 sm:gap-8 mb-4 sm:mb-6">
        <div
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white font-semibold text-sm sm:text-base ${
            currentPlayer === 1 && !gameOver
              ? "bg-blue-600 ring-2 ring-blue-300"
              : "bg-gray-700"
          }`}
        >
          🔵 P1: {scores[1]}
        </div>
        <div
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white font-semibold text-sm sm:text-base ${
            currentPlayer === 2 && !gameOver
              ? "bg-red-600 ring-2 ring-red-300"
              : "bg-gray-700"
          }`}
        >
          🔴 P2: {scores[2]}
        </div>
      </div>

      {/* Turn indicator */}
      {!gameOver && (
        <p className="text-gray-400 text-sm mb-4">
          {currentPlayer === 1 ? "🔵" : "🔴"} Player {currentPlayer}&apos;s turn
        </p>
      )}

      {/* Game Board */}
      <div className="relative" style={{ width: boardWidth, height: boardHeight }}>
        {/* Boxes (background) */}
        {boxes.map((row, rowIdx) =>
          row.map((owner, colIdx) => (
            <div
              key={`box-${rowIdx}-${colIdx}`}
              className="absolute rounded-sm transition-colors duration-300"
              style={{
                top: rowIdx * CELL_SIZE + DOT_SIZE / 2,
                left: colIdx * CELL_SIZE + DOT_SIZE / 2,
                width: CELL_SIZE - DOT_SIZE + LINE_THICKNESS,
                height: CELL_SIZE - DOT_SIZE + LINE_THICKNESS,
                backgroundColor:
                  owner === 1
                    ? "rgba(59, 130, 246, 0.3)"
                    : owner === 2
                    ? "rgba(239, 68, 68, 0.3)"
                    : "transparent",
              }}
            />
          ))
        )}

        {/* Horizontal lines */}
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE - 1 }, (_, col) => {
            const key = getLineKey({ row, col, direction: "h" });
            const owner = lines.get(key);
            const isDrawn = owner !== undefined;
            return (
              <button
                key={`h-${row}-${col}`}
                onClick={() => handleLineClick({ row, col, direction: "h" })}
                disabled={isDrawn || gameOver}
                className={`absolute rounded-full transition-all ${
                  isDrawn
                    ? owner === 1
                      ? "bg-blue-500"
                      : "bg-red-500"
                    : "bg-gray-700 hover:bg-gray-400 active:bg-gray-300 cursor-pointer"
                }`}
                style={{
                  top: row * CELL_SIZE + DOT_SIZE / 2 - LINE_THICKNESS / 2,
                  left: col * CELL_SIZE + DOT_SIZE,
                  width: CELL_SIZE - DOT_SIZE,
                  height: LINE_THICKNESS,
                  // Larger touch target
                  padding: `${(TOUCH_TARGET - LINE_THICKNESS) / 2}px 0`,
                  boxSizing: "content-box",
                  marginTop: -(TOUCH_TARGET - LINE_THICKNESS) / 2,
                }}
                aria-label={`Horizontal line row ${row} col ${col}`}
              />
            );
          })
        )}

        {/* Vertical lines */}
        {Array.from({ length: GRID_SIZE - 1 }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => {
            const key = getLineKey({ row, col, direction: "v" });
            const owner = lines.get(key);
            const isDrawn = owner !== undefined;
            return (
              <button
                key={`v-${row}-${col}`}
                onClick={() => handleLineClick({ row, col, direction: "v" })}
                disabled={isDrawn || gameOver}
                className={`absolute rounded-full transition-all ${
                  isDrawn
                    ? owner === 1
                      ? "bg-blue-500"
                      : "bg-red-500"
                    : "bg-gray-700 hover:bg-gray-400 active:bg-gray-300 cursor-pointer"
                }`}
                style={{
                  top: row * CELL_SIZE + DOT_SIZE,
                  left: col * CELL_SIZE + DOT_SIZE / 2 - LINE_THICKNESS / 2,
                  width: LINE_THICKNESS,
                  height: CELL_SIZE - DOT_SIZE,
                  // Larger touch target
                  padding: `0 ${(TOUCH_TARGET - LINE_THICKNESS) / 2}px`,
                  boxSizing: "content-box",
                  marginLeft: -(TOUCH_TARGET - LINE_THICKNESS) / 2,
                }}
                aria-label={`Vertical line row ${row} col ${col}`}
              />
            );
          })
        )}

        {/* Dots */}
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => (
            <div
              key={`dot-${row}-${col}`}
              className="absolute bg-white rounded-full pointer-events-none"
              style={{
                top: row * CELL_SIZE,
                left: col * CELL_SIZE,
                width: DOT_SIZE,
                height: DOT_SIZE,
              }}
            />
          ))
        )}
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="mt-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-white mb-2">
            {getWinner() === "Tie"
              ? "It's a tie! 🤝"
              : `${getWinner()} wins! 🎉`}
          </p>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={resetGame}
        className="mt-4 px-6 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm sm:text-base"
      >
        New Game
      </button>

      {/* Build tag */}
      <span className="absolute bottom-4 text-gray-700 text-[10px]">
        build {process.env.NEXT_PUBLIC_BUILD_ID?.slice(0, 7) || "local"} 🎲
      </span>
    </div>
  );
}
