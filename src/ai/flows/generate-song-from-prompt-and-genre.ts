'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a song based on a text prompt and a selected Somali genre.
 *
 * - generateSongFromPromptAndGenre - A function that orchestrates the song generation process.
 * - GenerateSongFromPromptAndGenreInput - The input type for the generateSongFromPromptAndGenre function.
 * - GenerateSongFromPromptAndGenreOutput - The return type for the generateSongFromPromptAndGenre function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import * as wav from 'wav';
import { Buffer } from 'buffer';

const GenerateSongFromPromptAndGenreInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired song.'),
  genre: z.enum(['Dhaanto', 'Qaraami', 'Afro-Somali', 'Rap']).describe('The Somali genre for the song.'),
});
export type GenerateSongFromPromptAndGenreInput = z.infer<typeof GenerateSongFromPromptAndGenreInputSchema>;

const GenerateSongFromPromptAndGenreOutputSchema = z.object({
  songDataUri: z.string().describe('The generated song as a data URI (audio/wav;base64,...).'),
});
export type GenerateSongFromPromptAndGenreOutput = z.infer<typeof GenerateSongFromPromptAndGenreOutputSchema>;

/**
 * Converts PCM audio data to WAV format (Base64 encoded).
 * @param pcmData The PCM audio data buffer.
 * @param channels Number of audio channels (default: 1).
 * @param rate Sample rate in Hz (default: 24000).
 * @param sampleWidth Sample width in bytes (default: 2).
 * @returns A Promise that resolves with the Base64 encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const songLyricsPrompt = ai.definePrompt({
  name: 'songLyricsPrompt',
  input: { schema: GenerateSongFromPromptAndGenreInputSchema },
  output: { schema: z.string().describe('The generated song lyrics or musical concept.') },
  prompt: `You are an expert songwriter. Create original song lyrics for a song.
The song should be in the {{{genre}}} genre, and the core idea/theme is: "{{{prompt}}}".
Ensure the lyrics are suitable for a mobile app and are concise, around 30-60 words.
`,
});

const generateSongFromPromptAndGenreFlow = ai.defineFlow(
  {
    name: 'generateSongFromPromptAndGenreFlow',
    inputSchema: GenerateSongFromPromptAndGenreInputSchema,
    outputSchema: GenerateSongFromPromptAndGenreOutputSchema,
  },
  async (input) => {
    // Step 1: Generate song lyrics/concept using the text generation model
    const { output: lyrics } = await songLyricsPrompt(input);

    if (!lyrics) {
      throw new Error('Failed to generate song lyrics.');
    }

    // Step 2: Convert the generated lyrics to speech using the TTS model
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // Using a default voice
          },
        },
      },
      prompt: lyrics,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from TTS generation.');
    }

    // Step 3: Convert the PCM audio to WAV format
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      songDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

export async function generateSongFromPromptAndGenre(input: GenerateSongFromPromptAndGenreInput): Promise<GenerateSongFromPromptAndGenreOutput> {
  return generateSongFromPromptAndGenreFlow(input);
}
