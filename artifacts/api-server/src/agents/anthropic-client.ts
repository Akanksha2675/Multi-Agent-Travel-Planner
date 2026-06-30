import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set.");
}

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL = "gemini-2.5-flash";

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  _maxTokens = 8192
): Promise<string> {
  const response = await genai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No text response from Gemini");
  }
  return text;
}

export function parseJSON<T>(text: string): T {
  const match =
    text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const jsonStr = match ? match[1].trim() : text.trim();
  return JSON.parse(jsonStr) as T;
}
