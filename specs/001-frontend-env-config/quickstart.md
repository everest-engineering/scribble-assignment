# quickstart.md

Steps to run the frontend locally with environment overrides:

1. Copy the example env file to a local override:

   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. Edit `frontend/.env.local` and set `VITE_API_URL` and any feature flags.

3. Validate required variables:

   ```bash
   cd frontend
   node ./scripts/validate-env.js
   ```

4. Start the dev server:

   ```bash
   npm run dev --workspace frontend
   ```

Notes:

- `.env.local` is gitignored. Do not commit secrets.
- To switch presets, use `.env.development` or `.env.staging` files and rebuild.
