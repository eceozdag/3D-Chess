
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Side, ChessPiece, Move, AIStrategy } from './types';
import { getValidMoves, getNotation } from './services/chessLogic';
import { getGeminiMove, getGMCommentary } from './services/geminiService';
import ChessScene from './components/ChessScene';
import { Trophy, History, Shield, Sword, RefreshCcw, MessageSquare, Info, Target } from 'lucide-react';

const createInitialState = (): GameState => {
  const pieces: Record<string, ChessPiece> = {};
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

  const addPiece = (type: ChessPiece['type'], side: Side, r: number, f: number) => {
    const id = `${side}-${type}-${r}-${f}`;
    pieces[id] = { id, type, side, position: [r, f], hasMoved: false };
    board[r][f] = id;
  };

  const setupSide = (side: Side, mainRank: number, pawnRank: number) => {
    const types: ChessPiece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    types.forEach((t, f) => addPiece(t, side, mainRank, f));
    for (let f = 0; f < 8; f++) addPiece('pawn', side, pawnRank, f);
  };

  setupSide('white', 0, 1); // French (White) starts at bottom
  setupSide('black', 7, 6); // UK (Black) starts at top

  return {
    board,
    pieces,
    turn: 'white',
    history: [],
    isGameOver: false,
    winner: null,
    evaluation: 0,
  };
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [whiteStrategy, setWhiteStrategy] = useState<AIStrategy>(AIStrategy.RANDOM);
  const [blackStrategy, setBlackStrategy] = useState<AIStrategy>(AIStrategy.GEMINI);
  const [isPaused, setIsPaused] = useState(false);
  const [commentary, setCommentary] = useState<string>("The battle lines are drawn...");
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [evalMode, setEvalMode] = useState<'total' | 'diff'>('diff');
  
  const moveTimeoutRef = useRef<number | null>(null);

  const calculateEvaluation = (pieces: Record<string, ChessPiece>) => {
    const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
    let score = 0;
    Object.values(pieces).forEach(p => {
      score += (p.side === 'white' ? 1 : -1) * values[p.type];
    });
    return score;
  };

  const makeMove = useCallback((from: [number, number], to: [number, number]) => {
    setGameState(prev => {
      const pieceId = prev.board[from[0]][from[1]];
      if (!pieceId) return prev;

      const piece = prev.pieces[pieceId];
      const targetPieceId = prev.board[to[0]][to[1]];
      const isCapture = !!targetPieceId;

      const newPieces = { ...prev.pieces };
      if (targetPieceId) delete newPieces[targetPieceId];

      newPieces[pieceId] = {
        ...piece,
        position: to,
        hasMoved: true,
      };

      const newBoard = prev.board.map(row => [...row]);
      newBoard[from[0]][from[1]] = null;
      newBoard[to[0]][to[1]] = pieceId;

      const moveNotation = getNotation(piece, to, isCapture);
      const newMove: Move = {
        from,
        to,
        pieceId,
        capturedPieceId: targetPieceId || undefined,
        notation: moveNotation,
        timestamp: Date.now(),
      };

      const newEval = calculateEvaluation(newPieces);

      let gameOver = false;
      let winner: Side | 'draw' | null = null;
      if (targetPieceId && prev.pieces[targetPieceId].type === 'king') {
        gameOver = true;
        winner = piece.side;
      }

      return {
        ...prev,
        pieces: newPieces,
        board: newBoard,
        turn: prev.turn === 'white' ? 'black' : 'white',
        history: [...prev.history, newMove],
        evaluation: newEval,
        isGameOver: gameOver,
        winner,
      };
    });
  }, []);

  const getAIMove = useCallback(async () => {
    if (gameState.isGameOver || isPaused || isProcessingMove) return;

    setIsProcessingMove(true);
    const currentStrategy = gameState.turn === 'white' ? whiteStrategy : blackStrategy;
    let selectedMove: { from: [number, number], to: [number, number] } | null = null;

    if (currentStrategy === AIStrategy.GEMINI) {
      selectedMove = await getGeminiMove(gameState);
    } 

    if (!selectedMove) {
      const allPieces = Object.values(gameState.pieces) as ChessPiece[];
      const availablePieces = allPieces.filter(p => p.side === gameState.turn);
      const movesWithPieces = availablePieces.map(p => ({
        piece: p,
        moves: getValidMoves(p, gameState.pieces)
      })).filter(m => m.moves.length > 0);

      if (movesWithPieces.length > 0) {
        // More aggressive selection: Prefer captures if strategy is aggressive
        const possibleMoves = movesWithPieces.flatMap(p => p.moves.map(m => ({ from: p.piece.position, to: m, target: gameState.board[m[0]][m[1]] })));
        const captures = possibleMoves.filter(m => m.target);
        
        if (captures.length > 0 && Math.random() > 0.4) {
          const move = captures[Math.floor(Math.random() * captures.length)];
          selectedMove = { from: move.from, to: move.to };
        } else {
          const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          selectedMove = { from: randomMove.from, to: randomMove.to };
        }
      }
    }

    if (selectedMove) {
      makeMove(selectedMove.from, selectedMove.to);
      if (gameState.history.length % 4 === 0) {
        const lastMove = gameState.history[gameState.history.length - 1];
        if (lastMove) {
          getGMCommentary(lastMove, gameState.evaluation).then(setCommentary);
        }
      }
    } else {
        setGameState(prev => ({...prev, isGameOver: true, winner: 'draw'}));
    }
    setIsProcessingMove(false);
  }, [gameState, whiteStrategy, blackStrategy, isPaused, isProcessingMove, makeMove]);

  useEffect(() => {
    if (!gameState.isGameOver && !isPaused) {
      // Much faster delay (600ms vs 1500ms)
      moveTimeoutRef.current = window.setTimeout(getAIMove, 600) as unknown as number;
    }
    return () => {
      if (moveTimeoutRef.current) window.clearTimeout(moveTimeoutRef.current);
    };
  }, [getAIMove, gameState.isGameOver, isPaused]);

  const restartGame = () => {
    setGameState(createInitialState());
    setCommentary("Charge! The dawn brings glory!");
    setIsPaused(false);
  };

  const getArmyPower = (side: Side) => {
    const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
    return (Object.values(gameState.pieces) as ChessPiece[])
      .filter(p => p.side === side)
      .reduce((acc, p) => acc + values[p.type], 0);
  };

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row bg-[#0a0a0a] text-white select-none">
      <div className="flex-1 relative overflow-hidden">
        <ChessScene gameState={gameState} />
        
        <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
            <h1 className="text-xl font-bold tracking-tighter uppercase italic flex items-center gap-2">
              <Sword className="w-5 h-5 text-red-500 animate-pulse" />
              Blitz Napoleonic
            </h1>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">High-Speed Command Simulation</p>
          </div>

          <div 
            className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-6 cursor-pointer pointer-events-auto hover:bg-white/5 transition-colors"
            onClick={() => setEvalMode(prev => prev === 'total' ? 'diff' : 'total')}
          >
             <div className="flex flex-col">
                <span className="text-[10px] uppercase text-blue-400 font-bold">French Power</span>
                <span className="text-lg font-mono text-blue-100">{getArmyPower('white')}</span>
             </div>
             <div className="flex flex-col items-center justify-center">
                <Target className={`w-4 h-4 ${gameState.evaluation >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                <span className={`text-[10px] font-mono mt-1 ${gameState.evaluation >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                   {gameState.evaluation >= 0 ? `+${gameState.evaluation}` : gameState.evaluation}
                </span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] uppercase text-red-500 font-bold text-right">British Power</span>
                <span className="text-lg font-mono text-red-100 text-right">{getArmyPower('black')}</span>
             </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg pointer-events-none">
           <div className="bg-black/80 backdrop-blur-lg p-4 rounded-2xl border border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.15)] flex gap-4 items-start transform transition-all">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-yellow-600 tracking-widest">Marshal's Report</span>
                <p className="text-xs italic text-gray-200 mt-0.5 leading-relaxed">"{commentary}"</p>
              </div>
           </div>
        </div>
      </div>

      <div className="w-full md:w-[350px] bg-[#111111] border-l border-white/5 flex flex-col shadow-2xl z-10">
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          <section className="mb-6">
            <h2 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Command Center
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[10px] font-bold text-blue-400 uppercase mb-1.5 block">French Marshal</label>
                <select 
                  className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500"
                  value={whiteStrategy}
                  onChange={(e) => setWhiteStrategy(e.target.value as AIStrategy)}
                >
                  {Object.values(AIStrategy).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <label className="text-[10px] font-bold text-red-400 uppercase mb-1.5 block">British General</label>
                <select 
                  className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs focus:ring-1 focus:ring-red-500"
                  value={blackStrategy}
                  onChange={(e) => setBlackStrategy(e.target.value as AIStrategy)}
                >
                  {Object.values(AIStrategy).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                <History className="w-3 h-3" /> Battlefield Log
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {gameState.history.map((move, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 bg-white/5 rounded border border-white/5">
                  <span className="text-gray-600 font-mono w-4">{i + 1}.</span>
                  <span className={i % 2 === 0 ? 'text-blue-300' : 'text-red-300'}>{move.notation}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
            >
              {isPaused ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Pause'}
            </button>
            <button 
              onClick={restartGame}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5">
           <div className="flex items-center gap-2 text-gray-600">
             <Info className="w-3 h-3" />
             <p className="text-[9px] leading-tight uppercase tracking-tight">
               Blitz Mode: Active | AI Reasoning: Gemini 3 Flash
             </p>
           </div>
        </div>
      </div>

      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-[#111] p-10 rounded-3xl border border-white/10 text-center shadow-2xl max-w-sm mx-4">
            <Trophy className="w-10 h-10 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">
              {gameState.winner === 'draw' ? 'Truce Declared' : 'Victory!'}
            </h2>
            <p className="text-xs text-gray-400 mb-6 font-serif px-4">
              {gameState.winner === 'white' ? 'Napoleon has shattered the coalition lines!' : 
               gameState.winner === 'black' ? 'The British defensive lines held firm!' : 
               'Neither side could find a decisive advantage on the field.'}
            </p>
            <button 
              onClick={restartGame}
              className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
