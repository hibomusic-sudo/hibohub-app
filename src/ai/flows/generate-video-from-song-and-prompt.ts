'use server';
/**
 * @fileOverview A Genkit flow for generating an AI music video or dynamic audio visualizer based on a text prompt and an existing song.
 *
 * - generateVideoFromSongAndPrompt - A function that handles the video generation process.
 * - GenerateVideoFromSongAndPromptInput - The input type for the generateVideoFromSongAndPrompt function.
 * - GenerateVideoFromSongAndPromptOutput - The return type for the generateVideoFromSongAndPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import fetch from 'node-fetch';
import {Buffer} from 'buffer';

const GenerateVideoFromSongAndPromptInputSchema = z.object({
  songAudioDataUri: z
    .string()
    .describe(
      "The generated song's audio as a data URI (e.g., 'data:audio/wav;base64,<base64_encoded_audio>'). While provided, this model primarily uses the text prompt for video generation as it doesn't directly process audio for video output."
    ),
  videoStylePrompt: z
    .string()
    .describe(
      "A text prompt describing the desired video style (e.g., 'Cinematic, Anime, Realistic, abstract visualizer')."
    ),
});
export type GenerateVideoFromSongAndPromptInput = z.infer<
  typeof GenerateVideoFromSongAndPromptInputSchema
>;

const GenerateVideoFromSongAndPromptOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The generated video as a data URI (e.g., 'data:video/mp4;base64,<base64_encoded_video>')."
    ),
});
export type GenerateVideoFromSongAndPromptOutput = z.infer<
  typeof GenerateVideoFromSongAndPromptOutputSchema
>;

// Helper function to fetch video from URL and encode as base64 data URI
async function fetchAndEncodeVideoAsDataUri(
  videoUrl: string,
  apiKey: string,
  contentType: string = 'video/mp4'
): Promise<string> {
  const videoDownloadResponse = await fetch(`${videoUrl}&key=${apiKey}`);

  if (
    !videoDownloadResponse.ok ||
    !videoDownloadResponse.body
  ) {
    throw new Error(
      `Failed to fetch video: ${videoDownloadResponse.statusText}`
    );
  }

  // Read the entire response body into a buffer
  const arrayBuffer = await videoDownloadResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export async function generateVideoFromSongAndPrompt(
  input: GenerateVideoFromSongAndPromptInput
): Promise<GenerateVideoFromSongAndPromptOutput> {
  return generateVideoFromSongAndPromptFlow(input);
}

const generateVideoFromSongAndPromptFlow = ai.defineFlow(
  {
    name: 'generateVideoFromSongAndPromptFlow',
    inputSchema: GenerateVideoFromSongAndPromptInputSchema,
    outputSchema: GenerateVideoFromSongAndPromptOutputSchema,
  },
  async input => {
    let {operation} = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'), // Using Veo 3.0 for video generation
      prompt: input.videoStylePrompt, // Veo model consumes text prompt directly
      config: {
        // Veo 3.0 has fixed duration (8s) and aspect ratio (16:9), and enhancePrompt is always on.
        // No need to specify durationSeconds, aspectRatio, or enhancePrompt for Veo 3.0.
        // personGeneration: 'allow_all', // Example: if generation of people is desired
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation for video generation.');
    }

    // Wait until the operation completes. This can take a significant amount of time.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again to avoid hammering the API
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    if (!videoPart?.media?.url) {
      throw new Error('Failed to find the generated video media part or URL.');
    }

    // IMPORTANT: Make sure GEMINI_API_KEY is available in the environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set.');
    }

    // The contentType is typically video/mp4 for Veo models.
    const videoDataUri = await fetchAndEncodeVideoAsDataUri(
      videoPart.media.url,
      geminiApiKey,
      videoPart.media.contentType || 'video/mp4' // Use provided contentType or default
    );

    return {
      videoDataUri,
    };
  }
);
