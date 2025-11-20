'use client';
import { useState, useEffect } from 'react';
import { Share } from '@/components/share';
import { url } from '@/lib/metadata';

const SIZE = 4;

const getEmptyBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const addRandomTile = (board: number[][]) => {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return board;
};

const compress = (row: number[]) => row.filter(v => v !== 0);

const merge = (row: number[]) => {
  const newRow: number[] = [];
  let skip = false;
  for (let i = 0; i < row.length; i++) {
    if (skip) { skip = false; continue; }
    if (i + 1 < row.length && row[i] === row[i + 1]) {
      newRow.push(row[i] * 2);
      skip = true;
    } else {
      newRow.push(row[i]);
    }
  }
  return newRow;
};

const moveLeft = (board: number[][]) => {
  const newBoard = board.map(row => {
    const compressed = compress(row);
    const merged = merge(compressed);
    const padded = [...merged, ...Array(SIZE - merged.length).fill(0)];
    return padded;
  });
  return newBoard;
};

const moveRight = (board: number[][]) => {
  const newBoard = board.map(row => {
    const reversed = [...row].reverse();
    const compressed = compress(reversed);
    const merged = merge(compressed);
    const padded = [...merged, ...Array(SIZE - merged.length).fill(0)];
    return padded.reverse();
  });
  return newBoard;
};

const transpose = (board: number[][]) => {
  const newBoard: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      newBoard[c][r] = board[r][c];
    }
  }
  return newBoard;
};

const moveUp = (board: number[][]) => {
  const transposed = transpose(board);
  const moved = moveLeft(transposed);
  return transpose(moved);
};

const moveDown = (board: number[][]) => {
  const transposed = transpose(board);
  const moved = moveRight(transposed);
  return transpose(moved);
};

const hasMoves = (board: number[][]) => {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
};

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(getEmptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let b = getEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  const handleMove = (moveFn: (b: number[][]) => number[][]) => {
    if (gameOver) return;
    const newBoard = moveFn(board);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return;
    const added = addRandomTile(newBoard);
    const newScore = added.flat().reduce((s, v) => s + v, 0);
    setBoard(added);
    setScore(newScore);
    if (!hasMoves(added)) setGameOver(true);
  };

  const handleKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        handleMove(moveUp);
        break;
      case 'ArrowDown':
        handleMove(moveDown);
        break;
      case 'ArrowLeft':
        handleMove(moveLeft);
        break;
      case 'ArrowRight':
        handleMove(moveRight);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [board, gameOver]);

  const tileClass = (value: number) => {
    const base = 'flex items-center justify-center rounded-md text-2xl font-bold';
    const colorMap: Record<number, string> = {
      0: 'bg-gray-200',
      2: 'bg-yellow-200',
      4: 'bg-yellow-300',
      8: 'bg-orange-200',
      16: 'bg-orange-300',
      32: 'bg-orange-400',
      64: 'bg-orange-500',
      128: 'bg-orange-600',
      256: 'bg-orange-700',
      512: 'bg-orange-800',
      1024: 'bg-orange-900',
      2048: 'bg-red-500 text-white',
    };
    return `${base} ${colorMap[value] ?? 'bg-red-600 text-white'}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div key={i} className={tileClass(v)} style={{ width: 80, height: 80 }}>
            {v !== 0 && v}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => handleMove(moveUp)} className="p-2 bg-gray-300 rounded">↑</button>
        <button onClick={() => handleMove(moveLeft)} className="p-2 bg-gray-300 rounded">←</button>
        <button onClick={() => handleMove(moveDown)} className="p-2 bg-gray-300 rounded">↓</button>
        <button onClick={() => handleMove(moveRight)} className="p-2 bg-gray-300 rounded">→</button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="mt-4">
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
