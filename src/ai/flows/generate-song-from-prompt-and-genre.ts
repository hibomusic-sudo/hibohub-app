
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a song based on a text prompt and a selected Somali genre.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { Buffer } from 'buffer';

const GenerateSongFromPromptAndGenreInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired song.'),
  genre: z.string().describe('The Somali genre for the song.'),
});
export type GenerateSongFromPromptAndGenreInput = z.infer<typeof GenerateSongFromPromptAndGenreInputSchema>;

const GenerateSongFromPromptAndGenreOutputSchema = z.object({
  songDataUri: z.string().describe('The generated song as a data URI (audio/wav;base64,...).'),
});
export type GenerateSongFromPromptAndGenreOutput = z.infer<typeof GenerateSongFromPromptAndGenreOutputSchema>;

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
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateSongFromPromptAndGenreInputSchema },
  output: { 
    schema: z.object({
      lyrics: z.string().describe('The generated song lyrics.')
    }) 
  },
  prompt: `You are an expert Somali songwriter. Create original song lyrics for a song.
The song should be in the {{{genre}}} genre, capturing its unique rhythm and cultural essence.
The theme is: "{{{prompt}}}".
Ensure the lyrics are suitable for a high-quality studio production and are concise, around 40-70 words.
If the genre is traditional, use poetic Somali language. If modern, use a mix of contemporary and rhythmic phrasing.
`,
});

const generateSongFromPromptAndGenreFlow = ai.defineFlow(
  {
    name: 'generateSongFromPromptAndGenreFlow',
    inputSchema: GenerateSongFromPromptAndGenreInputSchema,
    outputSchema: GenerateSongFromPromptAndGenreOutputSchema,
  },
  async (input) => {
    // 1. Generate Lyrics
    const { output } = await songLyricsPrompt(input);

    if (!output || !output.lyrics) {
      throw new Error('Failed to generate song lyrics.');
    }

    // 2. Generate Audio using the specialized TTS model
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: `Speaker1: ${output.lyrics}`,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from TTS generation.');
    }

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
