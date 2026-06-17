require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
    const { text, imageBase64, imageType } = req.body;

    const userContent = imageBase64
      ? [
          { type: 'image', source: { type: 'base64', media_type: imageType, data: imageBase64 } },
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const rawText = (data.content?.[0]?.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    
    res.json(JSON.parse(rawText));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Failed to solve problem' });
  }
});

app.listen(PORT, () => {
  console.log(`🧮 Math Solver API running on http://localhost:${PORT}`);
});
