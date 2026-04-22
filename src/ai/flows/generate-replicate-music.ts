'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type GenerateReplicateMusicInput = {
  prompt: string;
  genre: string;
};

export type GenerateReplicateMusicOutput = {
  audioUrl: string;
  audioBase64: string;
};

export async function generateReplicateMusic(
  input: GenerateReplicateMusicInput
): Promise<GenerateReplicateMusicOutput> {
  const { prompt, genre } = input;
  
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  // Combine genre and prompt for better output
  const fullPrompt = `${genre} style, ${prompt}`;

  try {
    console.log("Generating instrumental music with MusicGen:", fullPrompt.slice(0, 80));
    
    const output = await replicate.run(
      "meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3423a1f0b7d7",
      {
        input: {
          prompt: fullPrompt,
          output_format: "wav",
          normalization_strategy: "peak",
          duration: 10
        }
      }
    );

    console.log("MusicGen output type:", typeof output, "constructor:", (output as any)?.constructor?.name);

    // Handle FileOutput or other output formats from modern Replicate SDK
    let audioUrl: string = "";
    let base64Data: string;
    const outputAny = output as any;

    if (outputAny?.constructor?.name === 'FileOutput' || typeof outputAny?.url === 'function') {
      audioUrl = outputAny.url().toString();
      console.log("MusicGen FileOutput URL:", audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else if (typeof output === 'string') {
      audioUrl = output;
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      const str = String(output);
      if (str.startsWith('http')) {
        audioUrl = str;
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
      } else {
        throw new Error(`Unsupported output: ${outputAny?.constructor?.name || typeof output}`);
      }
    }
    
    return {
      audioUrl,
      audioBase64: `data:audio/wav;base64,${base64Data}`
    };
  } catch (error: any) {
    console.error("MusicGen API Error:", error);
    throw new Error(`Failed to generate music: ${error.message}`);
  }
}
