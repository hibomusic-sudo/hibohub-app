'use server';

import Replicate from "replicate";
import fetch from "node-fetch";

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
    const output = await replicate.run(
      "meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3423a1f0b7d7",
      {
        input: {
          prompt: fullPrompt,
          output_format: "wav",
          normalization_strategy: "peak",
          duration: 10 // Restricted to 10 seconds per user request
        }
      }
    ) as string;

    // output is a URL to the generated WAV file
    // We fetch it and convert to base64 so we can upload it easily from frontend 
    // or just pass it to the frontend to upload. 
    // Wait, let's fetch it on the server and return base64 Data URL to be compatible with existing code.
    const response = await fetch(output);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    return {
      audioUrl: output,
      audioBase64: `data:audio/wav;base64,${base64Data}`
    };
  } catch (error: any) {
    console.error("Replicate API Error:", error);
    throw new Error(`Failed to generate music: ${error.message}`);
  }
}
