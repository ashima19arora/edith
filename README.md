# EDITH

**Environmental Defence & Impact Tracking Hero**: an India-first air quality and carbon footprint companion, built for the Hack the Circle hackathon (Open Circle, MAIT, Delhi).

EDITH shows both sides of the same air: what the air does to you (live AQI on India's CPCB scale, personal exposure, the best time to go out) and what you do to the air (your carbon footprint, its biggest source, and cuts in kg CO2 and rupees).

Status: early development. Project setup only; features are being added step by step.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # optional: the app runs without keys
npm run dev
```

Open http://localhost:3000.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Supabase, Vercel.

## License

[MIT](LICENSE)
