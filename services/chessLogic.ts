
import { ChessPiece, Side, Move, PieceType } from '../types';

export const getValidMoves = (piece: ChessPiece, pieces: Record<string, ChessPiece>): [number, number][] => {
  const moves: [number, number][] = [];
  const { position, side, type } = piece;
  const [r, f] = position;

  const isOccupied = (rank: number, file: number) => {
    return Object.values(pieces).find(p => p.position[0] === rank && p.position[1] === file);
  };

  const addMoveIfValid = (rank: number, file: number): boolean => {
    if (rank < 0 || rank > 7 || file < 0 || file > 7) return false;
    const target = isOccupied(rank, file);
    if (!target) {
      moves.push([rank, file]);
      return true;
    } else if (target.side !== side) {
      moves.push([rank, file]);
      return false;
    }
    return false;
  };

  const slidingMoves = (directions: [number, number][]) => {
    directions.forEach(([dr, df]) => {
      let nr = r + dr;
      let nf = f + df;
      while (nr >= 0 && nr <= 7 && nf >= 0 && nf <= 7) {
        const target = isOccupied(nr, nf);
        if (!target) {
          moves.push([nr, nf]);
        } else {
          if (target.side !== side) moves.push([nr, nf]);
          break;
        }
        nr += dr;
        nf += df;
      }
    });
  };

  switch (type) {
    case 'pawn':
      const dir = side === 'white' ? 1 : -1;
      // Forward
      if (!isOccupied(r + dir, f)) {
        moves.push([r + dir, f]);
        if (!piece.hasMoved && !isOccupied(r + 2 * dir, f)) {
          moves.push([r + 2 * dir, f]);
        }
      }
      // Captures
      [[dir, 1], [dir, -1]].forEach(([dr, df]) => {
        const target = isOccupied(r + dr, f + df);
        if (target && target.side !== side) moves.push([r + dr, f + df]);
      });
      break;
    case 'knight':
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, df]) => {
        addMoveIfValid(r + dr, f + df);
      });
      break;
    case 'bishop':
      slidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;
    case 'rook':
      slidingMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
    case 'queen':
      slidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
    case 'king':
      [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, df]) => {
        addMoveIfValid(r + dr, f + df);
      });
      break;
  }

  return moves;
};

export const getNotation = (piece: ChessPiece, to: [number, number], isCapture: boolean): string => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const pStr = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
  return `${pStr}${isCapture ? 'x' : ''}${files[to[1]]}${to[0] + 1}`;
};
