'use server';
/**
 * @fileOverview This file implements a Genkit flow that analyzes library visitor data
 * and generates natural language summaries of visitor trends, peak usage times, and anomalies.
 *
 * - adminVisitorTrendSummaries - A function that handles the generation of visitor trend summaries.
 * - AdminVisitorTrendSummariesInput - The input type for the adminVisitorTrendSummaries function.
 * - AdminVisitorTrendSummariesOutput - The return type for the adminVisitorTrendSummaries function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VisitorEntrySchema = z.object({
  timestamp: z.string().datetime().describe('The ISO 8601 formatted timestamp of the visitor entry.'),
  purposeOfVisit: z.string().describe('The purpose of the visit, e.g., Reading Books, Research, Computer Use, Assignments.'),
});

const AdminVisitorTrendSummariesInputSchema = z.object({
  periodDescription: z.string().describe('A brief description of the period being analyzed (e.g., "last week", "month of October", "daily statistics for June 15th").'),
  visitorEntries: z.array(VisitorEntrySchema).describe('An array of visitor entries for the specified period.'),
});
export type AdminVisitorTrendSummariesInput = z.infer<typeof AdminVisitorTrendSummariesInputSchema>;

const AdminVisitorTrendSummariesOutputSchema = z.object({
  summary: z.string().describe('A natural language summary of visitor trends, including peak usage times and any identified anomalies.'),
});
export type AdminVisitorTrendSummariesOutput = z.infer<typeof AdminVisitorTrendSummariesOutputSchema>;

export async function adminVisitorTrendSummaries(
  input: AdminVisitorTrendSummariesInput
): Promise<AdminVisitorTrendSummariesOutput> {
  return adminVisitorTrendSummariesFlow(input);
}

const summarizeTrendsPrompt = ai.definePrompt({
  name: 'summarizeVisitorTrendsPrompt',
  input: { schema: AdminVisitorTrendSummariesInputSchema },
  output: { schema: AdminVisitorTrendSummariesOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing library visitor data. Your task is to provide a concise, natural language summary of visitor trends for the given period.\n\nAnalyze the following visitor entries for the period: {{{periodDescription}}}\n\nIdentify:\n1.  **Overall Trends**: Are visits increasing, decreasing, or stable?\n2.  **Peak Usage Times**: What are the busiest times of day or days of the week?\n3.  **Popular Purposes**: Which purposes of visit are most common?\n4.  **Anomalies**: Are there any unusual spikes or dips in visitor numbers, or unexpected patterns in visit purposes?\n\nVisitor Entries (timestamp, purpose of visit):\n{{#each visitorEntries}}\n- {{this.timestamp}}, {{this.purposeOfVisit}}\n{{/each}}\n\nIf there are no visitor entries for the period, state that clearly.\n\nProvide the summary in a paragraph format.`,
});

const adminVisitorTrendSummariesFlow = ai.defineFlow(
  {
    name: 'adminVisitorTrendSummariesFlow',
    inputSchema: AdminVisitorTrendSummariesInputSchema,
    outputSchema: AdminVisitorTrendSummariesOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeTrendsPrompt(input);
    return output!;
  }
);
