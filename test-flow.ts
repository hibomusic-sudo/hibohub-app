import { config } from 'dotenv';
config({ path: '.env' });

import { generateSongFromPromptAndGenre } from './src/ai/flows/generate-song-from-prompt-and-genre.js';

async function test() {
  try {
    console.log("Testing generation...");
    const result = await generateSongFromPromptAndGenre({
      prompt: "A happy song about coding in Next.js",
      genre: "Dhaanto",
    });
    console.log("Success! Output starts with: ", result.songDataUri.substring(0, 50));
  } catch (error) {
    console.error("Error during generation:");
    console.error(error);
  }
}

test();
