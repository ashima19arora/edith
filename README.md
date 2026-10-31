<p align="center">
  <img src="public/brand/edith-wordmark.png" width="320" alt="EDITH">
</p>

<p align="center">
  <b>Environmental Defence &amp; Impact Tracking Hero</b><br>
  An India-first air quality and carbon footprint companion.<br>
  Dodge the smog. Shrink your share of it.
</p>

<p align="center">
  Built for <b>Hack the Circle</b> (Open Circle, MAIT, Delhi) · Track: Sustainability &amp; Social Impact · <a href="LICENSE">MIT licensed</a>
</p>

<p align="center">
  <b>Team Felix Felicis:</b> Rahul, Diwakar, Kriti, Ashima
</p>

## The problem

Air pollution takes about **8 years** off a Delhi resident's life, against 3.5 years for the average Indian, and nearly half of Delhi's pollution comes from local sources ([AQLI 2025, University of Chicago](https://aqli.epic.uchicago.edu/)).

Yet the tools people have don't help them act on it:

- **The numbers mean nothing.** "AQI 340" doesn't tell you how much you breathed today, whether your parents or children can go out, or when it's least harmful to step outside.
- **Carbon tools aren't built for Indian lives.** They use Western units, emission factors and advice, so the suggestions get ignored.
- **You get a number, not a direction.** There's no biggest source, no single best change, no savings.
- **They're used once and forgotten.** Long forms and paywalls, with nothing to bring you back.
- **Cause and consequence are kept apart.** AQI apps show the air and calculators show emissions, but nobody connects them.

## What EDITH does

EDITH puts both sides of the same air in one place.

| What the air does to you | What you do to the air |
| --- | --- |
| Live AQI on India's CPCB scale | Carbon footprint from a 30-second daily check-in |
| Personal exposure, in cigarettes and "lives" | Corrected each month from your electricity bill |
| The cleanest time to go out today | Your biggest source, in plain words |
| Alerts for family, elders, children and pets | Cuts that fit your life, in kg CO2 and rupees |

### What makes it different

- **Indian by design:** Indian units and lifestyles, the CPCB AQI scale and the CEA grid factor.
- **Personal:** it never suggests something that doesn't fit your life, such as a Metro tip for someone who already takes the Metro.
- **Calm:** one plain-language headline first, with details on tap.
- **Habit-forming:** streaks, a heatmap, ranks and badges, measured only against your own start and never against other people.
- **For the whole family:** elders, children and pets each get their own alerts.
- **An assistant grounded in your data:** EDITH answers from your live air, routine and footprint.
- **Seasonal:** a Diwali mode with this year's rules, the worst hours, and how to protect family and pets.

### Two styles, same app

- **Hero mode:** a comic-book city at night, where the AQI is the villain, you're the hero, and your footprint is "collateral damage".
- **Plain mode:** the same features and layouts, in a clean, minimal design with plain names.

## Project status

EDITH is being built in the open, step by step. This table is kept honest: the screens below are the full design, and not all of them are in the working app yet.

| Part | Status |
| --- | --- |
| Project setup, data model with row-level security | ✅ Built |
| Footprint, AQI, lives and streak calculations, with automated tests | ✅ Built |
| Sign-in, style picker and setup flow, in both modes | ✅ Built |
| Guest mode, with data stored on the device | ✅ Built |
| Google sign-in | ✅ Built, ⏳ being connected to a live Supabase project |
| Home, daily check-in, Air today | ⏳ Designed, next to build |
| My footprint, Progress, Family, EDITH assistant, Settings | ⏳ Designed, to build |
| Reading bill photos with Gemini | ⏳ To build; setup asks for a rough amount for now |
| Installable PWA, landing page | ⏳ To build |

## Screens

These are the design prototypes for the whole app. The numbers in them are sample data; the app computes real values from the formulas below, so some details (such as which source is biggest) will differ.

### Sign-in, style and setup

Sign-in, choosing a style, and 16 quick setup questions with a "why we ask" line under each.

**Hero mode**

<img src="screenshots/setup-hero-01.jpg" width="170" alt="setup screen, hero mode, 1">
<img src="screenshots/setup-hero-02.jpg" width="170" alt="setup screen, hero mode, 2">
<img src="screenshots/setup-hero-03.jpg" width="170" alt="setup screen, hero mode, 3">
<img src="screenshots/setup-hero-04.jpg" width="170" alt="setup screen, hero mode, 4">
<img src="screenshots/setup-hero-05.jpg" width="170" alt="setup screen, hero mode, 5">
<img src="screenshots/setup-hero-06.jpg" width="170" alt="setup screen, hero mode, 6">
<img src="screenshots/setup-hero-07.jpg" width="170" alt="setup screen, hero mode, 7">
<img src="screenshots/setup-hero-08.jpg" width="170" alt="setup screen, hero mode, 8">
<img src="screenshots/setup-hero-09.jpg" width="170" alt="setup screen, hero mode, 9">
<img src="screenshots/setup-hero-10.jpg" width="170" alt="setup screen, hero mode, 10">
<img src="screenshots/setup-hero-11.jpg" width="170" alt="setup screen, hero mode, 11">
<img src="screenshots/setup-hero-12.jpg" width="170" alt="setup screen, hero mode, 12">
<img src="screenshots/setup-hero-13.jpg" width="170" alt="setup screen, hero mode, 13">
<img src="screenshots/setup-hero-14.jpg" width="170" alt="setup screen, hero mode, 14">
<img src="screenshots/setup-hero-15.jpg" width="170" alt="setup screen, hero mode, 15">
<img src="screenshots/setup-hero-16.jpg" width="170" alt="setup screen, hero mode, 16">
<img src="screenshots/setup-hero-17.jpg" width="170" alt="setup screen, hero mode, 17">
<img src="screenshots/setup-hero-18.jpg" width="170" alt="setup screen, hero mode, 18">
<img src="screenshots/setup-hero-19.jpg" width="170" alt="setup screen, hero mode, 19">

**Plain mode**

<img src="screenshots/setup-plain-01.jpg" width="170" alt="setup screen, plain mode, 1">
<img src="screenshots/setup-plain-02.jpg" width="170" alt="setup screen, plain mode, 2">
<img src="screenshots/setup-plain-03.jpg" width="170" alt="setup screen, plain mode, 3">
<img src="screenshots/setup-plain-04.jpg" width="170" alt="setup screen, plain mode, 4">
<img src="screenshots/setup-plain-05.jpg" width="170" alt="setup screen, plain mode, 5">
<img src="screenshots/setup-plain-06.jpg" width="170" alt="setup screen, plain mode, 6">
<img src="screenshots/setup-plain-07.jpg" width="170" alt="setup screen, plain mode, 7">
<img src="screenshots/setup-plain-08.jpg" width="170" alt="setup screen, plain mode, 8">
<img src="screenshots/setup-plain-09.jpg" width="170" alt="setup screen, plain mode, 9">
<img src="screenshots/setup-plain-10.jpg" width="170" alt="setup screen, plain mode, 10">
<img src="screenshots/setup-plain-11.jpg" width="170" alt="setup screen, plain mode, 11">
<img src="screenshots/setup-plain-12.jpg" width="170" alt="setup screen, plain mode, 12">
<img src="screenshots/setup-plain-13.jpg" width="170" alt="setup screen, plain mode, 13">
<img src="screenshots/setup-plain-14.jpg" width="170" alt="setup screen, plain mode, 14">
<img src="screenshots/setup-plain-15.jpg" width="170" alt="setup screen, plain mode, 15">
<img src="screenshots/setup-plain-16.jpg" width="170" alt="setup screen, plain mode, 16">
<img src="screenshots/setup-plain-17.jpg" width="170" alt="setup screen, plain mode, 17">

### Home

How today's air is and what to do about it, readable in about five seconds.

**Hero mode**

<img src="screenshots/home-hero-01.jpg" width="170" alt="home screen, hero mode, 1">

**Plain mode**

<img src="screenshots/home-plain-01.jpg" width="170" alt="home screen, plain mode, 1">

### Daily check-in

Six pre-filled steps. Most days it's just confirming your usual routine.

**Hero mode**

<img src="screenshots/checkin-hero-01.jpg" width="170" alt="checkin screen, hero mode, 1">
<img src="screenshots/checkin-hero-02.jpg" width="170" alt="checkin screen, hero mode, 2">
<img src="screenshots/checkin-hero-03.jpg" width="170" alt="checkin screen, hero mode, 3">
<img src="screenshots/checkin-hero-04.jpg" width="170" alt="checkin screen, hero mode, 4">
<img src="screenshots/checkin-hero-05.jpg" width="170" alt="checkin screen, hero mode, 5">
<img src="screenshots/checkin-hero-06.jpg" width="170" alt="checkin screen, hero mode, 6">
<img src="screenshots/checkin-hero-07.jpg" width="170" alt="checkin screen, hero mode, 7">
<img src="screenshots/checkin-hero-08.jpg" width="170" alt="checkin screen, hero mode, 8">
<img src="screenshots/checkin-hero-09.jpg" width="170" alt="checkin screen, hero mode, 9">
<img src="screenshots/checkin-hero-10.jpg" width="170" alt="checkin screen, hero mode, 10">
<img src="screenshots/checkin-hero-11.jpg" width="170" alt="checkin screen, hero mode, 11">

**Plain mode**

<img src="screenshots/checkin-plain-01.jpg" width="170" alt="checkin screen, plain mode, 1">
<img src="screenshots/checkin-plain-02.jpg" width="170" alt="checkin screen, plain mode, 2">
<img src="screenshots/checkin-plain-03.jpg" width="170" alt="checkin screen, plain mode, 3">
<img src="screenshots/checkin-plain-04.jpg" width="170" alt="checkin screen, plain mode, 4">
<img src="screenshots/checkin-plain-05.jpg" width="170" alt="checkin screen, plain mode, 5">
<img src="screenshots/checkin-plain-06.jpg" width="170" alt="checkin screen, plain mode, 6">
<img src="screenshots/checkin-plain-07.jpg" width="170" alt="checkin screen, plain mode, 7">
<img src="screenshots/checkin-plain-08.jpg" width="170" alt="checkin screen, plain mode, 8">
<img src="screenshots/checkin-plain-09.jpg" width="170" alt="checkin screen, plain mode, 9">
<img src="screenshots/checkin-plain-10.jpg" width="170" alt="checkin screen, plain mode, 10">
<img src="screenshots/checkin-plain-11.jpg" width="170" alt="checkin screen, plain mode, 11">

### Air today

Live AQI, 24-hour forecast, what you breathed, how to stay safe, and the Diwali guide.

**Hero mode**

<img src="screenshots/air-hero-01.jpg" width="170" alt="air screen, hero mode, 1">
<img src="screenshots/air-hero-02.jpg" width="170" alt="air screen, hero mode, 2">
<img src="screenshots/air-hero-03.jpg" width="170" alt="air screen, hero mode, 3">
<img src="screenshots/air-hero-04.jpg" width="170" alt="air screen, hero mode, 4">

**Plain mode**

<img src="screenshots/air-plain-01.jpg" width="170" alt="air screen, plain mode, 1">
<img src="screenshots/air-plain-02.jpg" width="170" alt="air screen, plain mode, 2">
<img src="screenshots/air-plain-03.jpg" width="170" alt="air screen, plain mode, 3">
<img src="screenshots/air-plain-04.jpg" width="170" alt="air screen, plain mode, 4">

### My footprint

Monthly total, breakdown by source, biggest source, and cuts in kg CO2 and rupees.

**Hero mode**

<img src="screenshots/footprint-hero-01.jpg" width="170" alt="footprint screen, hero mode, 1">
<img src="screenshots/footprint-hero-02.jpg" width="170" alt="footprint screen, hero mode, 2">
<img src="screenshots/footprint-hero-03.jpg" width="170" alt="footprint screen, hero mode, 3">
<img src="screenshots/footprint-hero-04.jpg" width="170" alt="footprint screen, hero mode, 4">

**Plain mode**

<img src="screenshots/footprint-plain-01.jpg" width="170" alt="footprint screen, plain mode, 1">
<img src="screenshots/footprint-plain-02.jpg" width="170" alt="footprint screen, plain mode, 2">
<img src="screenshots/footprint-plain-03.jpg" width="170" alt="footprint screen, plain mode, 3">
<img src="screenshots/footprint-plain-04.jpg" width="170" alt="footprint screen, plain mode, 4">

### Progress

Ranks, streaks, a check-in heatmap, weekly challenges and badges. Only ever against your own start.

**Hero mode**

<img src="screenshots/progress-hero-01.jpg" width="170" alt="progress screen, hero mode, 1">
<img src="screenshots/progress-hero-02.jpg" width="170" alt="progress screen, hero mode, 2">

**Plain mode**

<img src="screenshots/progress-plain-01.jpg" width="170" alt="progress screen, plain mode, 1">
<img src="screenshots/progress-plain-02.jpg" width="170" alt="progress screen, plain mode, 2">

### Family

Shared alerts, lung health and footprint for family members, elders, children and pets.

**Hero mode**

<img src="screenshots/family-hero-01.jpg" width="170" alt="family screen, hero mode, 1">
<img src="screenshots/family-hero-02.jpg" width="170" alt="family screen, hero mode, 2">
<img src="screenshots/family-hero-03.jpg" width="170" alt="family screen, hero mode, 3">
<img src="screenshots/family-hero-04.jpg" width="170" alt="family screen, hero mode, 4">
<img src="screenshots/family-hero-05.jpg" width="170" alt="family screen, hero mode, 5">
<img src="screenshots/family-hero-06.jpg" width="170" alt="family screen, hero mode, 6">
<img src="screenshots/family-hero-07.jpg" width="170" alt="family screen, hero mode, 7">

**Plain mode**

<img src="screenshots/family-plain-01.jpg" width="170" alt="family screen, plain mode, 1">
<img src="screenshots/family-plain-02.jpg" width="170" alt="family screen, plain mode, 2">
<img src="screenshots/family-plain-03.jpg" width="170" alt="family screen, plain mode, 3">
<img src="screenshots/family-plain-04.jpg" width="170" alt="family screen, plain mode, 4">
<img src="screenshots/family-plain-05.jpg" width="170" alt="family screen, plain mode, 5">
<img src="screenshots/family-plain-06.jpg" width="170" alt="family screen, plain mode, 6">
<img src="screenshots/family-plain-07.jpg" width="170" alt="family screen, plain mode, 7">

### EDITH assistant

A chat that answers from your live air, routine and footprint data.

**Hero mode**

<img src="screenshots/assistant-hero-01.jpg" width="170" alt="assistant screen, hero mode, 1">
<img src="screenshots/assistant-hero-02.jpg" width="170" alt="assistant screen, hero mode, 2">
<img src="screenshots/assistant-hero-03.jpg" width="170" alt="assistant screen, hero mode, 3">

**Plain mode**

<img src="screenshots/assistant-plain-01.jpg" width="170" alt="assistant screen, plain mode, 1">
<img src="screenshots/assistant-plain-02.jpg" width="170" alt="assistant screen, plain mode, 2">
<img src="screenshots/assistant-plain-03.jpg" width="170" alt="assistant screen, plain mode, 3">

### Settings

Your details, Hero or Plain, location and account.

**Hero mode**

<img src="screenshots/settings-hero-01.jpg" width="170" alt="settings screen, hero mode, 1">
<img src="screenshots/settings-hero-02.jpg" width="170" alt="settings screen, hero mode, 2">
<img src="screenshots/settings-hero-03.jpg" width="170" alt="settings screen, hero mode, 3">

**Plain mode**

<img src="screenshots/settings-plain-01.jpg" width="170" alt="settings screen, plain mode, 1">
<img src="screenshots/settings-plain-02.jpg" width="170" alt="settings screen, plain mode, 2">
<img src="screenshots/settings-plain-03.jpg" width="170" alt="settings screen, plain mode, 3">

### How we calculate

Every number in the app, explained with its source.

**Hero mode**

<img src="screenshots/calculate-hero-01.jpg" width="170" alt="calculate screen, hero mode, 1">
<img src="screenshots/calculate-hero-02.jpg" width="170" alt="calculate screen, hero mode, 2">

**Plain mode**

<img src="screenshots/calculate-plain-01.jpg" width="170" alt="calculate screen, plain mode, 1">
<img src="screenshots/calculate-plain-02.jpg" width="170" alt="calculate screen, plain mode, 2">


## How the numbers work

**Footprint = activity × emission factor.** The sources and estimates are all in [`lib/factors.ts`](lib/factors.ts), with a comment on each value.

| Number | Value | Source |
| --- | --- | --- |
| Grid electricity | 0.727 kg CO2 per kWh | CEA CO2 Baseline Database v20.0 (2023-24) |
| AQI breakpoints | CPCB National AQI bands | [CPCB table, via IES Arthapedia](https://ies.gov.in/arthapedia/concept/national-air-quality-index) |
| Air quality data | Hourly pollutants and forecast | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) |
| Cigarette equivalent | 22 µg/m³ PM2.5 for 24 h ≈ 1 cigarette | Berkeley Earth |
| Household electricity starting estimate | About 180 units a month for 4 people | [CSE analysis of Delhi's power use](https://www.cseindia.org/cse-analysis-of-delhis-power-consumption-paints-a-dark-picture-5877) |
| Food | About 0.6 kg a day vegetarian, 1 kg non-vegetarian | Pathak et al. 2010 (study of Indian diets) |
| Average Indian | 2.2 t CO2 per person per year (2024) | [Global Carbon Project, via Our World in Data](https://ourworldindata.org/co2/country/india) |

**What these numbers are and aren't.** They're estimates to help you plan, not measurements and not medical advice.

- Published figures for Delhi household electricity vary widely, from about 180 to over 500 units a month. EDITH starts from an estimate and corrects it from each home's real bills.
- Transport, delivery, flight and some food factors are EDITH's own placeholders, flagged as such in the code until better Indian sources are added.
- The AQI is computed from modelled Open-Meteo data, so it can differ from a nearby CPCB monitoring station.
- "Lives" is a planning guide to exposure and has no medical meaning.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router), TypeScript, Tailwind CSS |
| Accounts and data | Supabase: Google sign-in, Postgres, row-level security |
| Guest data | Browser storage, behind the same storage interface |
| Air data and place search | Open-Meteo |
| Road distance (optional) | Google Maps Routes API, with an estimate as the fallback |
| AI (planned) | Gemini, on the server only, for bill reading, mission picking and the assistant |
| Hosting | Vercel |

## Run it locally

You need Node.js 20 or newer.

```bash
git clone https://github.com/ashima19arora/edith.git
cd edith
npm install
npm run dev
```

Open http://localhost:3000 and choose **Try without an account**. No keys are needed for guest mode.

To turn on Google sign-in, copy `.env.example` to `.env.local`, add your Supabase keys, and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the Supabase SQL editor.

Other commands:

```bash
npm test        # Calculation and setup tests
npm run lint
npm run build
```

## Project layout

```
app/                  Pages and server routes
  app/                The app: sign-in, style picker, setup
  api/air/            Live AQI for the sign-in screen
  api/distance/       Road distance for a typed address
  auth/callback/      Google sign-in return
components/           Shared UI and comic artwork
lib/
  factors.ts          Every emission and AQI constant, with its source
  aqi.ts              CPCB AQI, Go Time, cigarette equivalent
  footprint.ts        Footprint and bill correction
  lives.ts            Daily lives
  progress.ts         Streaks and ranks
  labels.ts           All Hero and Plain wording
  storage.ts          Guest and signed-in storage
supabase/migrations/  Database tables and access rules
screenshots/          Design prototype screens
```

## Credits

Data and research from the Central Electricity Authority (CEA), the Central Pollution Control Board (CPCB), Open-Meteo, Berkeley Earth, the Air Quality Life Index (AQLI), the Centre for Science and Environment (CSE), and the Global Carbon Project via Our World in Data.

## License

[MIT](LICENSE)

Built with love for India.
