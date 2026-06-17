const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const SYSTEM_PROMPT = `You are an expert math tutor. Respond ONLY with a valid JSON object — no markdown, no fences, no preamble.

JSON shape:
{
  "problem": "restate the problem in one clear sentence",
  "steps": [
    {
      "heading": "short action title",
      "body": "plain-English explanation of what you do and why (you may embed inline LaTeX using $...$ syntax)",
      "math": "the key LaTeX expression for this step — use display math, e.g. x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}"
    }
  ],
  "answer": "the final answer as a LaTeX expression, e.g. x = 3 \\\\text{ and } x = \\\\frac{1}{3}",
  "note": "one genuinely useful tip, shortcut, or common pitfall — plain English"
}

CRITICAL rules:
- ALL mathematical expressions MUST be valid KaTeX/LaTeX
- Use \\frac{a}{b} for fractions, \\sqrt{x} for roots, x^{2} for powers, \\pm for ±, \\int for integrals, \\infty for infinity, \\theta \\pi \\alpha etc for Greek
- "math" field: always a single LaTeX string rendered in display mode (no surrounding $$ needed)
- "answer" field: LaTeX string, will be rendered large — keep it concise
- "body" fields: plain English; embed short inline math with $...$ when helpful
- 3–7 steps; more only if genuinely needed
- Return ONLY the raw JSON object`;

app.post('/api/solve', async (req, res) => {
  try {
    const { text, image, mimeType } = req.body;
    
    const userContent = image
      ? [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
          { type: 'text', text: text ? `Solve the math problem in this image. Extra context: ${text}` : 'Read and solve the math problem in this image.' }
        ]
      : `Solve this math problem:\n\n${text}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API error ${response.status}`);
    }
    
    const raw = (data.content?.[0]?.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const solution = JSON.parse(raw);
    res.json(solution);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Math Solver server running on http://localhost:${PORT}`);
  console.log(`Place your ANTHROPIC_API_KEY in a .env file`);
});
