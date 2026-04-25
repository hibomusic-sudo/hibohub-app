
'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export async function getAudioAlignment(audioUrl: string): Promise<WordTimestamp[]> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not configured.");
  }

  try {
    console.log("Aligning audio with text using Whisper...");
    
    // We use a model that supports word-level timestamps
    // villesau/whisper-timestamped is excellent for this
    const output = await replicate.run(
      "villesau/whisper-timestamped:c922b0a0f64da9c305a41a4aa67634289895c104e769a79796798a798a",
      {
        input: {
          audio: audioUrl,
          language: "so", // Set to Somali for best results, or auto
          word_timestamps: true,
          initial_prompt: "Hibo Music AI, Somali lyrics, music, song"
        }
      }
    );

    const result = output as any;
    const wordTimestamps: WordTimestamp[] = [];

    if (result.segments) {
      result.segments.forEach((segment: any) => {
        if (segment.words) {
          segment.words.forEach((w: any) => {
            wordTimestamps.push({
              word: w.text || w.word,
              start: w.start,
              end: w.end
            });
          });
        }
      });
    }

    return wordTimestamps;
  } catch (error: any) {
    console.error("Alignment Error:", error);
    // If alignment fails, we return an empty array rather than crashing the whole generation
    return [];
  }
}
