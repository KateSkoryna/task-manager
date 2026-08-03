import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const { GITHUB_TOKEN, GEMINI_API_KEY, PR_NUMBER, REPO } = process.env;
const MAX_DIFF_LENGTH = 20000;

if (!GITHUB_TOKEN || !GEMINI_API_KEY || !PR_NUMBER || !REPO) {
  console.error('Missing required environment variables');
  process.exit(1);
}

try {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const diffResponse = await fetch(
    `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.diff',
      },
    }
  );

  if (!diffResponse.ok) {
    throw new Error(`GitHub API error: ${diffResponse.status}`);
  }

  const diff = await diffResponse.text();

  if (!diff.trim()) {
    console.log('No diff found, skipping review');
    process.exit(0);
  }

  const truncatedDiff =
    diff.length > MAX_DIFF_LENGTH
      ? diff.slice(0, MAX_DIFF_LENGTH) +
        '\n\n... (diff truncated, too large for review)'
      : diff;

  const systemInstruction = fs.readFileSync('.github/scripts/review-prompt.md', 'utf8');
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: truncatedDiff,
    config: {
      systemInstruction,
    },
  });

  const reviewText = response.text;
  await fetch(
    `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: `## Gemini Code Review\n\n${reviewText}`,
      }),
    }
  );
} catch (error) {
  console.error('Review failed:', error.message);
  process.exit(1);
}
