# Project Security Rules

- **Zero Client-Side Secrets:** Never expose sensitive API keys (including `GEMINI_API_KEY`, Stripe keys, etc.) in the frontend code or via Vite's `define` or `VITE_` prefixed variables.
- **Backend-Only Keys:** If a third-party API key is required, the application MUST be migrated to a full-stack architecture (Express + Vite) to handle the keys securely on the server side.
- **Environment Variables:** All required keys should be documented in `.env.example` but never committed to the repository with actual values.
