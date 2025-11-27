import { GoogleGenAI } from "@google/genai";
import { TimeLog } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  analyzeAttendance: async (logs: TimeLog[]) => {
    const client = getClient();
    if (!client) return "Gemini API Key is missing. Please check your configuration.";

    // Simplify data for the prompt to save tokens
    const simpleLogs = logs.slice(0, 50).map(l => ({
      employee: l.userName,
      date: l.date,
      hours: l.durationMinutes ? (l.durationMinutes / 60).toFixed(1) : 'Active',
      start: l.checkIn.split('T')[1].substring(0, 5)
    }));

    const prompt = `
      You are an expert HR Analyst. Analyze the following attendance data for a company.
      Provide a concise, premium-style summary of:
      1. Overall attendance trends.
      2. Any employees working excessive hours (burnout risk).
      3. Any patterns of lateness (assuming 9:00 AM start).
      4. A positive observation.

      Data: ${JSON.stringify(simpleLogs)}

      Format the response in professional markdown with clear headings. Keep it brief.
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Unable to generate insights at this moment. Please try again later.";
    }
  }
};