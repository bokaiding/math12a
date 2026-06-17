# Math Solver

A beautiful step-by-step math solver powered by Claude.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your API key from https://console.anthropic.com
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## Deployment

Deploy to any Node.js hosting platform (Vercel, Render, Railway, etc.):
- Set `ANTHROPIC_API_KEY` as an environment variable
- The `public/` folder will be served automatically
