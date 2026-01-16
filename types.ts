
export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type Side = 'white' | 'black'; // White = French (Blue/Black in photo), Black = UK (Red in photo)

export interface ChessPiece {
  id: string;
  type: PieceType;
  side: Side;
  position: [number, number]; // [rank, file] 0-7
  hasMoved: boolean;
}

export enum AIStrategy {
  RANDOM = 'Random',
  MINIMAX = 'Minimax',
  AGGRESSIVE = 'Aggressive',
  GEMINI = 'Gemini (GM)',
}

export interface Move {
  from: [number, number];
  to: [number, number];
  pieceId: string;
  capturedPieceId?: string;
  notation: string;
  timestamp: number;
}

export interface GameState {
  board: (string | null)[][]; // IDs of pieces
  pieces: Record<string, ChessPiece>;
  turn: Side;
  history: Move[];
  isGameOver: boolean;
  winner: Side | 'draw' | null;
  evaluation: number;
}
