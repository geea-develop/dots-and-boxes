"use client";

import { useState, useCallback } from "react";

const GRID_SIZE = 5; // 5x5 dots = 4x4 boxes

type Line = {
  row: number;
  col: number;
  direction: "h" | "v";
};

type Box = {
  owner: 1 | 2 | null;
};

function getLineKey(line: Line): string {
  return `${line.row}-${line.col}-${line.direction}`;
}

export default function DotsAndBoxes() {
  const [lines, setLines] = useState<Set<string>>(new Set());
  const [boxes, setBoxes] = useState<(1 | 2 | null)[][]>(
    Array.from({ length: GRID_SIZE - 1 }, () =>
      Array.from({ length: GRID_SIZE - 1 }, () => null)
    )
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [gameOver, setGameOver] = useState(false);

  const checkBox = useCallback(
    (row: number, col: number, newLines: Set<string>): boolean => {
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

      const newLines = new Set(lines);
      newLines.add(key);
      setLines(newLines);

      let scored = false;
      const newBoxes = boxes.map((row) => [...row]);

      // Check which boxes this line might complete
      if (line.direction === "h") {
        // Horizontal line: check box above and below
        if (line.row > 0 && checkBox(line.row - 1, line.col, newLines)) {
          newBoxes[line.row - 1][line.col] = currentPlayer;
          scored = true;
        }
        if (
          line.row < GRID_SIZE - 1 &&
          checkBox(line.row, line.col, newLines)
        ) {
          newBoxes[line.row][line.col] = currentPlayer;
          scored = true;
        }
      } else {
        // Vertical line: check box left and right
        if (line.col > 0 && checkBox(line.row, line.col - 1, newLines)) {
          newBoxes[line.row][line.col - 1] = currentPlayer;
          scored = true;
        }
        if (
          line.col < GRID_SIZE - 1 &&
          checkBox(line.row, line.col, newLines)
        ) {
          newBoxes[line.row][line.col] = currentPlayer;
          scored = true;
        }
      }

      setBoxes(newBoxes);

      if (scored) {
        const newScores = { ...scores };
        const pointsScored = newBoxes
          .flat()
          .filter((b) => b === currentPlayer).length;
        newScores[currentPlayer] = pointsScored;
        setScores(newScores);

        // Check game over
        const totalBoxes = (GRID_SIZE - 1) * (GRID_SIZE - 1);
        const filledBoxes = newBoxes.flat().filter((b) => b !== null).length;
        if (filledBoxes === totalBoxes) {
          setGameOver(true);
        }
        // Player scores = gets another turn (don't switch)
      } else {
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      }
    },
    [lines, boxes, currentPlayer, scores, gameOver, checkBox]
  );

  const resetGame = () => {
    setLines(new Set());
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-white mb-6">Dots & Boxes</h1>

      {/* Scoreboard */}
      <div className="flex gap-8 mb-6">
        <div
          className={`px-4 py-2 rounded-lg text-white font-semibold ${
            currentPlayer === 1 && !gameOver
              ? "bg-blue-600 ring-2 ring-blue-300"
              : "bg-gray-700"
          }`}
        >
          Player 1: {scores[1]}
        </div>
        <div
          className={`px-4 py-2 rounded-lg text-white font-semibold ${
            currentPlayer === 2 && !gameOver
              ? "bg-red-600 ring-2 ring-red-300"
              : "bg-gray-700"
          }`}
        >
          Player 2: {scores[2]}
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        {/* Boxes (background) */}
        {boxes.map((row, rowIdx) =>
          row.map((owner, colIdx) => (
            <div
              key={`box-${rowIdx}-${colIdx}`}
              className="absolute rounded-sm"
              style={{
                top: rowIdx * 60 + 10,
                left: colIdx * 60 + 10,
                width: 40,
                height: 40,
                backgroundColor:
                  owner === 1
                    ? "rgba(59, 130, 246, 0.4)"
                    : owner === 2
                    ? "rgba(239, 68, 68, 0.4)"
                    : "transparent",
              }}
            />
          ))
        )}

        {/* Horizontal lines */}
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE - 1 }, (_, col) => {
            const key = getLineKey({ row, col, direction: "h" });
            const isDrawn = lines.has(key);
            return (
              <button
                key={`h-${row}-${col}`}
                onClick={() =>
                  handleLineClick({ row, col, direction: "h" })
                }
                disabled={isDrawn || gameOver}
                className={`absolute rounded-full transition-all ${
                  isDrawn
                    ? "bg-white"
                    : "bg-gray-700 hover:bg-gray-400 cursor-pointer"
                }`}
                style={{
                  top: row * 60 - 3,
                  left: col * 60 + 10,
                  width: 40,
                  height: 6,
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
            const isDrawn = lines.has(key);
            return (
              <button
                key={`v-${row}-${col}`}
                onClick={() =>
                  handleLineClick({ row, col, direction: "v" })
                }
                disabled={isDrawn || gameOver}
                className={`absolute rounded-full transition-all ${
                  isDrawn
                    ? "bg-white"
                    : "bg-gray-700 hover:bg-gray-400 cursor-pointer"
                }`}
                style={{
                  top: row * 60 + 10,
                  left: col * 60 - 3,
                  width: 6,
                  height: 40,
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
              className="absolute w-3 h-3 bg-white rounded-full"
              style={{
                top: row * 60 - 6,
                left: col * 60 - 6,
              }}
            />
          ))
        )}

        {/* Board size placeholder */}
        <div
          style={{
            width: (GRID_SIZE - 1) * 60 + 20,
            height: (GRID_SIZE - 1) * 60 + 20,
          }}
        />
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="mt-6 text-center">
          <p className="text-2xl font-bold text-white mb-2">
            {getWinner() === "Tie"
              ? "It's a tie!"
              : `${getWinner()} wins! 🎉`}
          </p>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={resetGame}
        className="mt-6 px-6 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
      >
        New Game
      </button>
    </div>
  );
}
