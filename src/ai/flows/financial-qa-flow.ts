'use server';
/**
 * @fileOverview A financial advisor AI flow.
 *
 * - analyzeFinancials - A function that handles analyzing user expenses and answering questions.
 * - FinancialQAInput - The input type for the flow.
 * - FinancialQAOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialQAInputSchema = z.object({
  expenses: z.array(z.object({
    title: z.string(),
    amount: z.number(),
    category: z.string(),
    date: z.string(),
    paymentMethod: z.string(),
  })).describe('The list of user expenses for the current period.'),
  question: z.string().describe('The user\'s question about their finances.'),
  currency: z.string().describe('The user\'s preferred currency (e.g., INR, USD).'),
  budgetLimit: z.number().optional().describe('The user\'s monthly budget limit.'),
});
export type FinancialQAInput = z.infer<typeof FinancialQAInputSchema>;

const FinancialQAOutputSchema = z.object({
  answer: z.string().describe('The AI\'s response to the user\'s question.'),
  suggestions: z.array(z.string()).describe('List of actionable financial suggestions based on the data.'),
  sentiment: z.enum(['positive', 'neutral', 'cautionary']).describe('The general tone of the advice.'),
});
export type FinancialQAOutput = z.infer<typeof FinancialQAOutputSchema>;

export async function analyzeFinancials(input: FinancialQAInput): Promise<FinancialQAOutput> {
  return financialQAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialQAPrompt',
  input: { schema: FinancialQAInputSchema },
  output: { schema: FinancialQAOutputSchema },
  prompt: `You are "ExpenseWise AI", a highly skilled and empathetic financial advisor. 
Your goal is to help the user understand their spending patterns and make better financial decisions.

Analyze the following expense data for this month:
Currency: {{{currency}}}
Budget Limit: {{#if budgetLimit}}{{{budgetLimit}}}{{else}}Not set{{/if}}

Expenses:
{{#each expenses}}
- {{{date}}}: {{{title}}} | {{{amount}}} {{{../currency}}} | Category: {{{category}}} | Method: {{{paymentMethod}}}
{{/each}}

User Question: "{{{question}}}"

Guidelines:
1. Be specific. Mention exact categories or large expenses if relevant.
2. If they are over budget or spending too much in one area (like "Food" or "Shopping"), provide gentle but firm advice.
3. If they are doing well, encourage them.
4. Keep suggestions actionable (e.g., "Try to limit eating out to twice a week to save ~500 INR").
5. Return your analysis in the specified JSON format.`,
});

const financialQAFlow = ai.defineFlow(
  {
    name: 'financialQAFlow',
    inputSchema: FinancialQAInputSchema,
    outputSchema: FinancialQAOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('AI failed to generate a response');
    return output;
  }
);
