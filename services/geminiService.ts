
import { GoogleGenAI } from "@google/genai";
import { GameState, Move } from "../types";

// Initialize the GoogleGenAI client with the required named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiMove = async (gameState: GameState): Promise<{ from: [number, number], to: [number, number] } | null> => {
  try {
    const prompt = `You are a Grandmaster chess engine. 
    Current Turn: ${gameState.turn}
    Board State: ${JSON.stringify(Object.values(gameState.pieces).map(p => ({ t: p.type, s: p.side, p: p.position })))}
    History: ${gameState.history.map(h => h.notation).join(', ')}
    
    Return the best move in JSON format: {"from": [rank, file], "to": [rank, file]}. 
    Only valid moves.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    // Use response.text directly (it's a property, not a method).
    const result = JSON.parse(response.text || '{}');
    if (result && typeof result.from !== 'undefined' && typeof result.to !== 'undefined') return result;
    return null;
  } catch (error) {
    console.error("Gemini Move Error:", error);
    return null;
  }
};

export const getGMCommentary = async (move: Move, evalScore: number): Promise<string> => {
  try {
    const prompt = `You are a witty Napoleonic-era Grandmaster. 
    A move was just played: ${move.notation}. 
    The current evaluation is: ${evalScore}.
    Provide a one-sentence commentary in the style of a 19th-century military general. Keep it under 20 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    // Use response.text directly.
    return response.text || "A bold maneuver upon the field of honor!";
  } catch (error) {
    return "The lines hold steady, for now.";
  }
};
