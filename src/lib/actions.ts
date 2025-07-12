'use server';

import { categorizeTransaction } from '@/ai/flows/categorize-transaction';
import { z } from 'zod';
import { CATEGORIES } from './constants';

const SuggestionSchema = z.object({
  description: z.string(),
});

export async function getCategorySuggestion(
  description: string
): Promise<{ suggestedCategory?: string; error?: string }> {
  const result = SuggestionSchema.safeParse({ description });
  if (!result.success) {
    return { error: 'Invalid description provided.' };
  }

  try {
    const { suggestedCategory, confidence } = await categorizeTransaction({
      transactionDescription: result.data.description,
    });

    if (confidence > 0.5 && CATEGORIES.includes(suggestedCategory as any)) {
      return { suggestedCategory };
    }
    return { suggestedCategory: 'Other' };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get suggestion from AI.' };
  }
}
