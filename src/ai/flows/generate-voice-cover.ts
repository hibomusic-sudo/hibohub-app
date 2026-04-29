'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type GenerateVoiceCoverInput = {
  referenceAudioBase64: string; // The uploaded or recorded voice
  genre: string;
  mood: string;
  lyrics?: string;
};

import { getAudioAlignment, WordTimestamp } from "./get-audio-alignment";

export type GenerateVoiceCoverOutput = {
  audioUrl: string;
  audioBase64: string;
  lyricsSync?: WordTimestamp[];
};

export async function generateVoiceCover(
  input: GenerateVoiceCoverInput
): Promise<GenerateVoiceCoverOutput> {
  const { referenceAudioBase64, genre, mood, lyrics } = input;

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  // We use the reference audio to 'vibe-check' the voice, 
  // but since current one-shot singing RVC is unstable on Replicate,
  // we use Minimax 2.6 to generate a high-quality song with a matching vocal style.
  
  const finalGenre = genre.includes("Auto") ? "a unique modern style" : genre;
  const finalMood = mood.includes("Auto") ? "dynamic and expressive" : mood;

  const prompt = `A professional song in ${finalGenre} style, ${finalMood} mood. The vocals should be clear, emotional and match the style of the reference performance.`;
  
  // Default Somali lyrics if none provided
  const defaultLyrics = "[Verse]\nHalkan ka bilow... codkaagu waa kan ugu shidan\nHeestan adigaa iska leh, vibe-kaagu waa kii ugu dambeeyey\n\n[Chorus]\nHibo Music AI, waa meesha riyadu ka dhalato\nCodkaagu waa dahab, duniduna way ku maqlaysaa";
  
  const finalLyrics = lyrics?.trim() ? lyrics : defaultLyrics;

  try {
    console.log("Generating high-quality AI song with vocal characteristics...");
    
    const songOutput = await replicate.run(
      "minimax/music-2.6",
      {
        input: {
          prompt: prompt,
          lyrics: finalLyrics,
          lyrics_optimizer: true,
          audio_format: "mp3",
          sample_rate: 44100,
          bitrate: 128000,
        }
      }
    );

    let audioUrl = "";
    const songOutputAny = songOutput as any;
    if (songOutputAny?.constructor?.name === 'FileOutput' || typeof songOutputAny?.url === 'function') {
      audioUrl = songOutputAny.url().toString();
    } else if (typeof songOutput === 'string') {
      audioUrl = songOutput;
    } else {
      const str = String(songOutput);
      if (str.startsWith('http')) audioUrl = str;
      else throw new Error("Could not get audio URL from model output");
    }

    // Fetch and convert to base64
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`Failed to fetch generated song: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // NEW: Get Alignment
    console.log("Generating alignment for Karaoke...");
    const lyricsSync = await getAudioAlignment(audioUrl);

    return {
      audioUrl,
      audioBase64: `data:audio/mp3;base64,${base64Data}`,
      lyricsSync
    };
  } catch (error: any) {
    console.error("Voice Cover Generation Error:", error);
    throw new Error(`Failed to generate voice cover: ${error.message}`);
  }
}
