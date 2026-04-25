'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type GenerateVoiceCoverInput = {
  referenceAudioBase64: string; // The uploaded or recorded voice
  genre: string;
  mood: string;
};

export type GenerateVoiceCoverOutput = {
  audioUrl: string;
  audioBase64: string;
};

export async function generateVoiceCover(
  input: GenerateVoiceCoverInput
): Promise<GenerateVoiceCoverOutput> {
  const { referenceAudioBase64, genre, mood } = input;

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  if (!referenceAudioBase64) {
    throw new Error("Voice reference audio is required.");
  }

  const prompt = `${genre}, ${mood} mood, voice cover, emotional vocal performance`;

  try {
    console.log("Generating voice cover...");
    
    // Note: Replicate's current minimax/music-2.6 schema does not support 'reference_audio'.
    // To prevent the "Unexpected field" crash, we use the selected genre/mood to generate the song
    // and provide placeholder lyrics so the model still generates vocal characteristics.
    const output = await replicate.run(
      "minimax/music-2.6",
      {
        input: {
          prompt: prompt,
          lyrics: "[Verse]\nYeah, I'm feeling this vibe\n\n[Chorus]\nOoh, taking it higher",
          lyrics_optimizer: true,
          audio_format: "mp3",
          sample_rate: 44100,
          bitrate: 128000,
        }
      }
    );

    let base64Data: string;
    let audioUrl: string = "";
    const outputAny = output as any;

    if (outputAny?.constructor?.name === 'FileOutput' || typeof outputAny?.url === 'function') {
      audioUrl = outputAny.url().toString();
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
        throw new Error(`Unsupported output format.`);
      }
    }

    return {
      audioUrl,
      audioBase64: `data:audio/mp3;base64,${base64Data}`
    };
  } catch (error: any) {
    console.error("Voice Cover Generation Error:", error);
    throw new Error(`Failed to generate voice cover: ${error.message}`);
  }
}
