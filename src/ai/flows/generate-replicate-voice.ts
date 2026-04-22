'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type GenerateReplicateVoiceInput = {
  text: string;
  voice?: string;
  emotion?: string;
};

export type GenerateReplicateVoiceOutput = {
  audioUrl: string;
  audioBase64: string;
};

export async function generateReplicateVoice(
  input: GenerateReplicateVoiceInput
): Promise<GenerateReplicateVoiceOutput> {
  const { text, voice = "Friendly_Person", emotion = "happy" } = input;

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for voice generation.");
  }

  try {
    const output = await replicate.run(
      "minimax/speech-02-turbo",
      {
        input: {
          text: text.trim(),
          voice_id: voice,
          emotion: emotion,
          speed: 1.0,
          volume: 1.0,
          pitch: 0,
          audio_format: "mp3",
          sample_rate: 32000,
        }
      }
    );

    // DEBUG: log what minimax actually returns
    console.log("Replicate output type:", typeof output);
    console.log("Replicate output constructor:", output?.constructor?.name);

    // minimax/speech-02-turbo via modern Replicate client returns a FileOutput object
    // FileOutput has .url() method and .blob() method
    let base64Data: string;
    let audioUrl: string = "";

    const outputAny = output as any;

    if (outputAny?.constructor?.name === 'FileOutput' || typeof outputAny?.url === 'function') {
      // Modern Replicate client FileOutput — get URL then fetch
      audioUrl = outputAny.url().toString();
      console.log("FileOutput URL:", audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else if (output instanceof Buffer) {
      base64Data = output.toString('base64');
    } else if (output && typeof (output as any)[Symbol.asyncIterator] === 'function') {
      // ReadableStream — collect chunks
      const chunks: Uint8Array[] = [];
      for await (const chunk of output as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      base64Data = buffer.toString('base64');
    } else if (typeof output === 'string') {
      audioUrl = output;
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      throw new Error(`Unsupported output type: ${outputAny?.constructor?.name || typeof output}`);
    }

    return {
      audioUrl,
      audioBase64: `data:audio/mp3;base64,${base64Data}`
    };
  } catch (error: any) {
    console.error("Replicate Voice API Error:", error);
    throw new Error(`Failed to generate voice: ${error.message}`);
  }
}
