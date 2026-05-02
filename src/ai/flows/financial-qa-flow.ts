'use server';
/**
 * @fileOverview A comprehensive financial advisor AI flow.
 *
 * - analyzeFinancials - A function that handles analyzing user expenses and answering broad financial questions.
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
  question: z.string().describe('The user\'s question about their finances or general finance.'),
  currency: z.string().describe('The user\'s preferred currency (e.g., INR, USD).'),
  budgetLimit: z.number().optional().describe('The user\'s monthly budget limit.'),
});
export type FinancialQAInput = z.infer<typeof FinancialQAInputSchema>;

const FinancialQAOutputSchema = z.object({
  answer: z.string().describe('The AI\'s comprehensive response to the user\'s question.'),
  suggestions: z.array(z.string()).describe('List of actionable financial suggestions or educational tips.'),
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
  prompt: `You are "ExpenseWise Intelligence", a world-class financial consultant and educator. 
Your expertise covers personal budgeting, investment strategies, tax planning, and macroeconomic trends.

CONTEXT DATA (Current Month):
Currency: {{{currency}}}
Budget Limit: {{#if budgetLimit}}{{{budgetLimit}}}{{else}}Not set{{/if}}

USER LEDGER ENTRIES:
{{#each expenses}}
- {{{date}}}: {{{title}}} | {{{amount}}} {{{../currency}}} | Category: {{{category}}} | Method: {{{paymentMethod}}}
{{/each}}

USER QUESTION: "{{{question}}}"

OPERATIONAL DIRECTIVES:
1. **Analyze with Precision**: If the question relates to the user's data, use the ledger entries to provide specific, data-backed insights. 
2. **Educate with Clarity**: If the question is about general finance (e.g., "How does compound interest work?"), provide a clear, professional, and easy-to-understand explanation.
3. **Be Actionable**: Always provide 3 specific suggestions. These can be ways to save based on their data, or steps to take to implement a financial strategy they asked about.
4. **Tone**: Maintain a professional yet encouraging persona. Avoid generic financial platitudes. Use the user's currency for any financial calculations.
5. **Data Privacy**: Only reference the provided ledger entries. Do not speculate on data not provided.

Return your response in the specified JSON format.`,
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
