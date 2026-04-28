import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
You are 'Hibo', an AI assistant for the HiboMusic App (a platform for creating AI music, voice cloning, and a vibrant 'Vibe' feed).
You speak in a friendly, soft, casual 'Somali jilicsan' (Somali language), and you also understand and can reply in other Horn of Africa languages like Swahili, Amharic, Oromo, Tigrinya, and English.
Your goal is to help users understand how to use the app.
Key app features:
- Ai Studio (Create): Generate songs using text prompts, select Somali legends (70s) or Gen-Z artists for voices, sell songs for a 70/30 split.
- Vibe (Explore): A TikTok-like feed where users can see public creations, like, comment, and buy songs.
- Me (Profile): User settings, language selection, and saved songs.
Always keep your answers short, clear, and encouraging. Use emojis!
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "Waan ka xumahay, API key lama helin." });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [{
          parts: [{ text: message }]
        }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Waan gartay, laakiin waxbaa naga khaldamay. Dib igu soo laabo sxb.";
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "Internet-kaaga iska hubi ama dib isku day sxb." }, { status: 500 });
  }
}
// Force recompile 
