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
4. Add your environment variable in Vercel if your app uses the Anthropic API:
   - `VITE_ANTHROPIC_API_KEY`
5. Deploy and Vercel will give you a permanent public URL.

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
