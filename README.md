# CattleAI

This is a Vite + React app that can be deployed as a public website.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open the local URL printed by Vite (`http://localhost:5173`).

## Deploy to Vercel (recommended)

1. Create a GitHub repository and push this project to it.
2. Sign in at https://vercel.com and import the repository.
3. Use the following settings if prompted:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add your environment variable in Vercel:
   - `VITE_ANTHROPIC_API_KEY`
5. Deploy and Vercel will give you a permanent public URL.

## Local environment setup

1. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Add your Anthropics API key to `.env`.
3. Run locally with:
   ```bash
   npm install
   npm run dev
   ```

## Important

- GitHub Pages cannot safely store a secret API key for the Anthropic API.
- For working image predictions, use Vercel or local deployment with `VITE_ANTHROPIC_API_KEY` set.
 - For working image predictions, use Vercel (recommended) or local deployment.

Serverless API (recommended)

1. This project includes a serverless API at `api/predict.js` for Vercel. It keeps your Anthropic API key secret on the server.
2. On Vercel set an environment variable named `ANTHROPIC_API_KEY` (do NOT use the `VITE_` prefix for server vars).
3. Deploy the repo to Vercel. The frontend will call `/api/predict` and the API will forward the image to Anthropic.

Local testing

1. For local testing you can create a `.env` from `.env.example` and add `VITE_ANTHROPIC_API_KEY` (used only if you run without the serverless API).
2. To use the serverless function locally use Vercel CLI (`vercel dev`) and set `ANTHROPIC_API_KEY` in the environment.

## Deploy with Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

When asked, choose the current project directory and allow Vercel to use `npm run build`.

## Notes

- This app is a static frontend built by Vite.
- If you keep the API key in `VITE_ANTHROPIC_API_KEY`, it will be included in the browser bundle, so for production you should move API requests to a server-side endpoint for better security.
- Once deployed, Vercel provides a permanent link you can open anytime.
