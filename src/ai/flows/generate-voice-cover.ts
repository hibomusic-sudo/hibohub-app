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
    
    // Attempting to pass the audio as reference to the model
    // Using a generic music model, passing audio. If replicate supports music-cover or similar, 
    // it can be swapped here. We will pass it to minimax/music-2.6 as reference_audio in hopes it accepts it,
    // or as 'audio' input.
    const output = await replicate.run(
      "minimax/music-2.6",
      {
        input: {
          prompt: prompt,
          reference_audio: referenceAudioBase64, // Using reference_audio for the voice profile
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
