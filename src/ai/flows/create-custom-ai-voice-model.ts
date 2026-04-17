
'use server';
/**
 * @fileOverview This file implements a Genkit flow for creating a custom AI voice model from a user's voice sample.
 *
 * - createCustomAiVoiceModel - A function that handles the custom AI voice model creation process.
 * - CreateCustomAiVoiceModelInput - The input type for the createCustomAiVoiceModel function.
 * - CreateCustomAiVoiceModelOutput - The return type for the createCustomAiVoiceModel function.
 */

import { ai, googleAI } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const CreateCustomAiVoiceModelInputSchema = z.object({
  voiceSampleDataUri: z
    .string()
    .describe(
      "A recorded voice sample, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CreateCustomAiVoiceModelInput = z.infer<typeof CreateCustomAiVoiceModelInputSchema>;

// Output Schema
const CreateCustomAiVoiceModelOutputSchema = z.object({
  voiceModelId: z.string().describe('A unique identifier for the newly created custom AI voice model.'),
  message: z.string().describe('A confirmation message indicating the successful creation of the voice model.'),
});
export type CreateCustomAiVoiceModelOutput = z.infer<typeof CreateCustomAiVoiceModelOutputSchema>;

// Wrapper function
export async function createCustomAiVoiceModel(
  input: CreateCustomAiVoiceModelInput
): Promise<CreateCustomAiVoiceModelOutput> {
  return createCustomAiVoiceModelFlow(input);
}

// Genkit Prompt using explicit model reference
const customVoiceModelPrompt = ai.definePrompt({
  name: 'customVoiceModelPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: CreateCustomAiVoiceModelInputSchema },
  output: { schema: CreateCustomAiVoiceModelOutputSchema },
  prompt: `You are an AI assistant tasked with processing a user's voice sample to create a custom AI voice model.
The user has provided a voice sample. Acknowledge the receipt of the voice sample and confirm that a new custom AI voice model has been successfully created.
Assign a unique, fictional ID for this voice model.

Voice Sample: {{media url=voiceSampleDataUri}}

Please return a JSON object with the 'voiceModelId' and a 'message' confirming the creation.
`,
});

// Genkit Flow
const createCustomAiVoiceModelFlow = ai.defineFlow(
  {
    name: 'createCustomAiVoiceModelFlow',
    inputSchema: CreateCustomAiVoiceModelInputSchema,
    outputSchema: CreateCustomAiVoiceModelOutputSchema,
  },
  async (input) => {
    const { output } = await customVoiceModelPrompt(input);
    if (!output) {
      throw new Error('Failed to generate custom AI voice model output.');
    }
    return output;
  }
);
