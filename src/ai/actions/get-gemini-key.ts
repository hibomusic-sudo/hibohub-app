'use server';

export async function getGeminiLiveKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY not found in server environment');
  }
  return key;
}
