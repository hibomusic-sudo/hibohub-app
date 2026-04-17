import { config } from 'dotenv';
config();

import '@/ai/flows/create-custom-ai-voice-model.ts';
import '@/ai/flows/generate-song-from-prompt-and-genre.ts';
import '@/ai/flows/generate-video-from-song-and-prompt.ts';