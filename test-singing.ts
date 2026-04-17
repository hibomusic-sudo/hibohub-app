import 'dotenv/config';
import { ai, googleAI } from './src/ai/genkit';
import { Buffer } from 'buffer';
import fs from 'fs';

async function testAudioGen() {
  console.log('Testing gemini-2.5-flash singing...');
  try {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      config: {
        responseModalities: ['AUDIO'],
      },
      prompt: "Sing a happy Somali Dhaanto song about love. Sing it with rhythm and melody.",
    });

    if (media && media.url) {
      console.log('Success! Got audio data of length:', media.url.length);
      const base64Data = media.url.includes('base64,')
        ? media.url.substring(media.url.indexOf(',') + 1)
        : media.url;
      const audioBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync('test-song.wav', audioBuffer);
      console.log('Saved to test-song.wav');
    } else {
      console.log('No media returned.');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testAudioGen();
