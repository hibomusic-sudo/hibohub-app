
'use server';
/**
 * @fileOverview A Genkit flow for generating an AI music video or dynamic audio visualizer based on a text prompt and an existing song.
 */

import { ai, googleAI } from '@/ai/genkit';
import { z } from 'genkit';
import { Buffer } from 'buffer';

const GenerateVideoFromSongAndPromptInputSchema = z.object({
  songAudioDataUri: z
    .string()
    .describe(
      "The generated song's audio as a data URI."
    ),
  videoStylePrompt: z
    .string()
    .describe(
      "A text prompt describing the desired video style."
    ),
});
export type GenerateVideoFromSongAndPromptInput = z.infer<
  typeof GenerateVideoFromSongAndPromptInputSchema
>;

const GenerateVideoFromSongAndPromptOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "The generated video as a data URI."
    ),
});
export type GenerateVideoFromSongAndPromptOutput = z.infer<
  typeof GenerateVideoFromSongAndPromptOutputSchema
>;

async function fetchAndEncodeVideoAsDataUri(
  videoUrl: string,
  apiKey: string,
  contentType: string = 'video/mp4'
): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  const videoDownloadResponse = await fetch(`${videoUrl}&key=${apiKey}`);

  if (
    !videoDownloadResponse.ok ||
    !videoDownloadResponse.body
  ) {
    throw new Error(
      `Failed to fetch video: ${videoDownloadResponse.statusText}`
    );
  }

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
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    let { operation } = await ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: input.videoStylePrompt,
      config: {
        numberOfVideos: 1,
      },
    });

    if (!operation) {
      throw new Error('Failed to start video generation operation.');
    }

    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      if (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (operation.error) {
      throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    if (!videoPart?.media?.url) {
      throw new Error('Failed to find generated video URL.');
    }

    const videoDataUri = await fetchAndEncodeVideoAsDataUri(
      videoPart.media.url,
      geminiApiKey,
      videoPart.media.contentType || 'video/mp4'
    );

    return {
      videoDataUri,
    };
  }
);
