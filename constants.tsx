
export const INITIAL_BOARD_SIZE = 8;
export const SQUARE_SIZE = 1;
export const BOARD_OFFSET = (INITIAL_BOARD_SIZE * SQUARE_SIZE) / 2 - 0.5;

export const PIECE_VALUES: Record<string, number> = {
  pawn: 10,
  knight: 30,
  bishop: 30,
  rook: 50,
  queen: 90,
  king: 900,
};

// Map colors: French (White) = Imperial Blue, UK (Black) = Scarlet Red
export const COLORS = {
  french: '#002395', // Rich French Blue
  uk: '#d4213d',     // British Scarlet
  boardLight: '#ecf0f1',
  boardDark: '#2c3e50',
  gold: '#d4af37'
};
