import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(req: Request) {
  try {
    const { mood, loveLanguage, comfortLevel } = await req.json();

    const prompt = `You are a relationship engagement AI. Your goal is to create highly personalized, non-repetitive daily activities for a couple.
Based on the following parameters:
- Mood: ${mood || 'Neutral'}
- Love Language: ${loveLanguage || 'Words of Affirmation'}
- Comfort Level: ${comfortLevel || 3} (out of 5)

Generate a personalized activity.
You must return a strict JSON payload exactly matching this interface:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "intensity": number // 1-5
}
Never return markdown formatting or backticks, just the raw JSON object.`;

    // Add a timeout to the OpenAI call to prevent hanging
    const completionPromise = openai.chat.completions.create({
      model: "minimaxai/minimax-m2.7",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI Model Timeout")), 15000)
    );

    const completion = await Promise.race([completionPromise, timeoutPromise]) as any;

    const content = completion.choices[0]?.message?.content || "";
    // Clean up any potential markdown formatting if the model disobeys
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const task = JSON.parse(cleanedContent);

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error generating task:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate task" }, { status: 500 });
  }
}
