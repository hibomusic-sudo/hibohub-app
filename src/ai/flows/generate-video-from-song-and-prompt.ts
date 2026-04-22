'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type GenerateVideoFromSongAndPromptInput = {
  songAudioDataUri: string;
  videoStylePrompt: string;
};

export type GenerateVideoFromSongAndPromptOutput = {
  videoDataUri: string;
  videoUrl: string;
};

export async function generateVideoFromSongAndPrompt(
  input: GenerateVideoFromSongAndPromptInput
): Promise<GenerateVideoFromSongAndPromptOutput> {
  const { videoStylePrompt } = input;

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  if (!videoStylePrompt || videoStylePrompt.trim().length === 0) {
    throw new Error("Video style prompt is required.");
  }

  try {
    console.log("Generating video with MiniMax video-01:", videoStylePrompt.slice(0, 80));

    const output = await replicate.run(
      "minimax/video-01",
      {
        input: {
          prompt: videoStylePrompt,
        }
      }
    );

    console.log("Video output type:", typeof output, "constructor:", (output as any)?.constructor?.name);

    // Handle FileOutput or other formats
    let videoUrl: string = "";
    let base64Data: string;
    const outputAny = output as any;

    if (outputAny?.constructor?.name === 'FileOutput' || typeof outputAny?.url === 'function') {
      videoUrl = outputAny.url().toString();
    } else if (typeof output === 'string') {
      videoUrl = output;
    } else {
      const str = String(output);
      if (str.startsWith('http')) {
        videoUrl = str;
      } else {
        throw new Error(`Unsupported video output: ${outputAny?.constructor?.name || typeof output}`);
      }
    }

    console.log("Video URL:", videoUrl);

    // Fetch video and convert to base64 data URI
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    base64Data = Buffer.from(arrayBuffer).toString('base64');

    return {
      videoUrl,
      videoDataUri: `data:video/mp4;base64,${base64Data}`,
    };
  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw new Error(`Failed to generate video: ${error.message}`);
  }
}
