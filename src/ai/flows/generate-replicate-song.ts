'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type GenerateReplicateSongInput = {
  lyrics: string;
  style: string;
  isInstrumental?: boolean;
};

export type GenerateReplicateSongOutput = {
  audioUrl: string;
  audioBase64: string;
};

export async function generateReplicateSong(
  input: GenerateReplicateSongInput
): Promise<GenerateReplicateSongOutput> {
  const { lyrics, style, isInstrumental } = input;

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  if (!isInstrumental && (!lyrics || lyrics.trim().length === 0)) {
    throw new Error("Lyrics are required for song generation.");
  }

  // Build structured lyrics with section tags if not already present
  let structuredLyrics = lyrics ? lyrics.trim() : "";
  if (!isInstrumental && !structuredLyrics.includes('[Verse]') && !structuredLyrics.includes('[Chorus]')) {
    // Auto-add structure tags for user convenience
    const lines = structuredLyrics.split('\n').filter(l => l.trim());
    if (lines.length <= 4) {
      structuredLyrics = `[Verse]\n${lines.join('\n')}\n\n[Chorus]\n${lines.join('\n')}`;
    } else {
      const mid = Math.ceil(lines.length / 2);
      structuredLyrics = `[Verse]\n${lines.slice(0, mid).join('\n')}\n\n[Chorus]\n${lines.slice(mid).join('\n')}`;
    }
  }

  if (isInstrumental) {
    structuredLyrics = ""; // Ensure minimax/music-2.6 generates instrumental
  }

  // Build style prompt
  const prompt = `${style}, emotional, melodic, warm vocal, rhythmic`;

  try {
    console.log("Generating song with MiniMax Music 2.6...");
    console.log("Prompt:", prompt);
    console.log("Lyrics:", structuredLyrics.slice(0, 100));

    const output = await replicate.run(
      "minimax/music-2.6",
      {
        input: {
          prompt: prompt,
          lyrics: structuredLyrics,
          lyrics_optimizer: true,
          audio_format: "mp3",
          sample_rate: 44100,
          bitrate: 128000,
        }
      }
    );

    console.log("MiniMax Music 2.6 output type:", typeof output, "constructor:", (output as any)?.constructor?.name);

    // Handle FileOutput or other formats
    let base64Data: string;
    let audioUrl: string = "";
    const outputAny = output as any;

    if (outputAny?.constructor?.name === 'FileOutput' || typeof outputAny?.url === 'function') {
      audioUrl = outputAny.url().toString();
      console.log("Song URL:", audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch song: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else if (typeof output === 'string') {
      audioUrl = output;
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch song: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else if (output instanceof Buffer) {
      base64Data = output.toString('base64');
    } else {
      const str = String(output);
      if (str.startsWith('http')) {
        audioUrl = str;
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
      } else {
        throw new Error(`Unsupported output: ${outputAny?.constructor?.name || typeof output}`);
      }
    }

    return {
      audioUrl,
      audioBase64: `data:audio/mp3;base64,${base64Data}`
    };
  } catch (error: any) {
    console.error("Song Generation Error:", error);
    throw new Error(`Failed to generate song: ${error.message}`);
  }
}
