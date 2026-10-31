# EDITH: full project context (single source of truth)

Read this fully before writing any code. It replaces earlier discussion notes. Screenshots of every screen (Hero and Plain mode) are shared as PDFs; the numbers shown in them are illustrative sample data, so compute real values from the formulas in section 7.

Make everything as the design prototype as it is.

## 1. What it is

EDITH (Environmental Defence & Impact Tracking Hero) is an India-first air quality and carbon footprint companion, built for the Hack the Circle hackathon (Open Circle, MAIT, Delhi), track: Sustainability & Social Impact.

It shows people the two things about air they normally can't see:

- What the air does to you (the consequence): live AQI on India's CPCB scale, personal exposure, the best time to go out, alerts for family and pets.
- What you do to the air (the cause): your carbon footprint from a 30-second daily check-in plus a monthly electricity bill photo, your biggest source, and cuts in kg CO2 and rupees.

Hackathon facts: Round 1 (online) = PDF + public GitHub repo, due 31 Oct 2026 11:59 PM IST. Round 2 = offline finale at MAIT on 3 Nov 2026, a 6-hour build/demo/pitch. Judged on innovation, problem relevance, feasibility, technical potential (and impact + pitch in the finale). Open-source organiser: the repo must be clean, MIT-licensed, well documented.

## 2. The problem

Headline stat: Air pollution takes about 8 years off a Delhi resident's life (AQLI 2025, University of Chicago: Delhi 8.2 years, average Indian 3.5 years; nearly half of Delhi's pollution comes from local sources).

- Pollution is invisible and the numbers mean nothing. "AQI 340" doesn't tell an ordinary person how much they breathed today, whether parents or children can go out, or when the least harmful time to step out is. Most people guess.
- Carbon tools aren't built for Indian lives. Western units, emission factors, lifestyles and advice (safe cycle lanes, gardens, car-free commutes). Suggestions feel out of reach and get ignored.
- A number, not a direction. No biggest source, no single best change, no savings.
- Used once and forgotten. Long forms, paywalls, nothing to bring you back.
- Cause and consequence are treated separately. AQI apps show air, calculators show emissions, nobody connects them.

Why EDITH when trackers exist: it's the first tool that puts both sides of the same air in one place, built around Indian life, designed for daily use.

## 3. Differentiators

- Indian by design: Indian units, lifestyles, AQI scale (CPCB), grid factor (CEA)
- Personalised: never suggests something that doesn't fit the user's life
- Calm: one plain-language headline first, details on tap
- Gamified (LeetCode/GitHub style): streaks, heatmap, ranks, badges, weekly challenges. Progress is vs the user's OWN start, never vs other people
- Family mode with elders, kids and pets
- EDITH assistant answering from live data
- Diwali mode (seasonal mode)

## 4. Structure

One Next.js project, one codebase, one link:

- Landing page `/`: public pitch page (being designed separately; build LAST).
- App `/app/...`: mobile-first, fully responsive for desktop (bottom tab bar on mobile, sidebar on desktop).
- PWA: installable from the browser ("Add to Home Screen"), no Play Store, no separate native codebase.
- Laptop behaviour: AQI API works the same; geolocation works via the browser prompt (less precise, fine; fallback = pick area manually); Google sign-in works; bill photo = file picker on desktop (camera on phone); install is optional.

First-run flow: Landing -> "Get started" -> Sign in (Continue with Google, or "Try without an account" = guest, data in localStorage on this device) -> Pick your style (Hero / Plain, Hero preselected) -> Setup (4 short sections) -> Home.

Guest mode: everything works locally; Squad/Family shows "Sign in to create your Squad".

All design prototypes are ready and sent as pdf; landing page design is still being built.

## 5. Two modes (same app, same features; only style and labels change)

Hero mode (default): comic-book superhero energy, red-and-blue city-at-night. Deep navy (hero, clean air, progress) and warm red (danger, villain, alerts). Bold black outlines, halftone dots, comic sticker labels, pixel hearts, night skyline. The AQI is the villain, the user is the hero, the carbon footprint is "collateral damage".

Plain mode: same layouts, clean minimal, soft neutral colours, no stickers, plain names.

Implement modes with a single theme context (mode: 'hero' | 'plain') and ONE label dictionary file so every name below comes from one place. Mode is stored per user (and in localStorage for guests) and switchable in Settings.

### Label dictionary (Hero / Plain)

| Thing | Hero | Plain |
| --- | --- | --- |
| Home tab | The City | Home |
| Air tab | Airspace | Air Today |
| Check-in tab | Canon Event | Check-in |
| Footprint tab | Collateral | My Footprint |
| Progress tab | Ranks | Progress |
| Family page | Squad | Family |
| Assistant | EDITH | EDITH |
| AQI card | Threat | Air Now |
| Best window | Go Time | Best Time Out |
| Health alert | Alert | Health Alert |
| Hearts | Lives | Lung Health |
| Daily mission | Today's Mission | Today's Tip |
| Footprint meter | Collateral Meter | My Footprint |
| Forecast | Threat Forecast | Next 24 Hours |
| Exposure card | Damage Taken | What You Breathed Today |
| Protection | Defence | Stay Safe |
| Pollutants | Villain's Weapons | What's in the Air |
| Week history | Threat History | Past 7 Days |
| Footprint breakdown | Damage Report | Breakdown |
| Cuts | Counter-Moves | Ways to Cut |
| Squad alerts | Squad Alerts | Family Alerts |
| Household footprint | Squad Collateral | Family Footprint |
| Weekly goal | Squad Goal | Family Challenge |
| Diwali sheet | Diwali Watch | Diwali air guide |
| Setup sections | Your Base / Your Patrol / Your Power / Your Fuel | Your Home / Your Routine / Energy at Home / Food & Lifestyle |

Bottom tabs (5): Home, Air, Check-in, Footprint, Progress. Top-right icons on main pages: Family/Squad, Assistant/EDITH, Profile (opens Settings).

## 6. Screens (see PDFs for visuals)

### 6.1 Sign-in, style, setup

Sign-in: logo, tagline, Continue with Google, "Try without an account" (guest).

Pick your style: two preview cards (Hero preselected).

Setup (one question per screen, progress bar, Back/Next, "Later/Skip" on optional, a "why we ask" line under every question):

- Base/Home: location ("Use my location", fallback areas: Dwarka, Rohini, Saket, Noida, Gurugram, Other); people living in home (stepper 1-10); home type (flat / house / PG-hostel); pets (counts: dog, cat, bird, other); extra care (young children, elderly 60+, asthma/breathing issues, heart condition, pregnant, no one; multi-select).
- Patrol/Routine: main daily trip (college, office, school, work from home); distance one way (slider 1-40 km or type address); days a week (1-7); how they get there (Metro, bus, auto, cab, two-wheeler, car, walk, cycle); if own vehicle: fuel (petrol, diesel, CNG, electric) + optional mileage; usual outdoor time blocks (early morning 5-8, morning commute 8-11, afternoon 11-4, evening commute 4-8, night after 8, mostly indoors; multi-select); outdoor exercise (no / mornings / evenings / both).
- Power/Energy at Home: number of ACs + hours a day in summer (1-3, 4-6, 7-10, 10+); cooking fuel (LPG cylinder / PNG / induction-electric) + cylinder lasts (1 / 2 / 3+ months); air purifier (no / one room / most rooms); last electricity bill (snap photo, or rough band: under 1000 / 1000-2500 / 2500-5000 / over 5000, or "Later").
- Fuel/Food & Lifestyle: diet (vegetarian / eggetarian / non-veg) + non-veg frequency (daily / few times a week / rarely); online orders a week (none / 1-3 / 4-7 / 8+); flights last 12 months (domestic round trips 0 / 1-2 / 3-5 / 6+; international 0 / 1 / 2-3 / 4+).

Finish: recap card, then "Enter the city" / "Go to Home".

All answers editable later: Settings -> My details.

### 6.2 Home (The City / Home)

Goal: in 5 seconds the user knows how today's air is and what to do. Top to bottom:

- Headline in a speech bubble (Hero) / plain card: one sentence from AQI + Go Time, e.g. "Heavy air today! Stay in till 2, then you're good to go." / "Clean skies! Perfect day for a walk."
- Alert / Health Alert (only if AQI is Poor or worse AND household has children, elderly, or breathing/heart issues; pets get their own line): "Keep the little ones and Dadi inside till 2 PM."
- Threat / Air Now card: AQI number (CPCB), category pill, 0-500 coloured meter, small line "= N cigarettes if out all day" (N = PM2.5 24h mean / 22).
- Collateral Meter / My Footprint card: "142 kg CO2 so far this month" + comparison with the SAME DATE last month ("26 kg less than this date last month"); first month: "Your first month: we're learning your routine." Taps through to Footprint.
- Go Time / Best Time Out: cleanest window today + small hourly strip.
- Today's Mission / Today's Tip: one action picked from ~30 fixed missions by Gemini using user data (rule-based fallback if AI fails); shows kg CO2 and rupees saved computed from the user's real distance, vehicle, mileage, fuel price, Metro fare; Accept button.
- Lives / Lung Health: 5 pixel hearts/day (rules in 7.5). Text: "Your usual routine will cost 3 lives today. Shift your walk to Go Time and keep 2 more."
- Monthly bill card (once a month): "New month! Snap last month's electricity bill."
- Streak + check-in button ("Log today's Canon Event" / "Do today's check-in", "4 taps - 30 sec").

### 6.3 Daily check-in (Canon Event / Check-in)

Opens as a step flow (bottom sheet/full screen) from Home, and as the Check-in tab (with today's status, "Log a one-off", bill status, last 7 days; missed days can be filled up to 2 days late). Six steps, one per screen, every step PREFILLED (from setup on first check-in; from yesterday afterwards; travel prefilled only on the user's usual travel days), each with a "Looks right ->" button; Done screen only after all steps.

- Meals: Breakfast / Lunch / Dinner rows (+ add snack/extra meal); chips: Veg, Veg + dairy (paneer/cheese/milk-heavy), Egg, Chicken, Fish, Mutton, Skipped.
- Travel: list of trips (keep / change / remove / + add); mode (Metro, bus, auto, cab, two-wheeler, car, walk, cycle; cab/car: alone or shared); duration in MINUTES (5-120), converted to km by typical speed.
- Energy: summer: AC hours in the day (slider) + night (off / part / whole). Winter: room heater hours + geyser (no / short / long). Only shown if user has the appliance. Season by month (Nov-Feb winter, Mar-Oct summer; keep configurable).
- Deliveries: steppers for food orders, quick groceries, parcels.
- Outdoors: the user's usual time blocks as tick chips with each block's AQI category; tick/untick to match today.
- Mission: "Did you pull off today's mission?" Yes / Partly / No (only if accepted).

Done screen: streak +1, today's recap (kg CO2, mission), lives kept.

One-offs ("Rare Event" / "Log something extra"): flight (from/to, one-way/return), long train/bus trip, big purchase, guests/party.

### 6.4 Airspace / Air Today

Header (area, last updated, refresh; top-right Diwali chip only during Diwali week + a few days after; Diwali 2026 = 8 Nov). Cards: Now (AQI, category, 0-500 meter, main pollutant in plain words); Forecast (24h bars coloured by category, Go Time highlighted, worst hours, Tomorrow row); Damage Taken / What You Breathed Today (lives with timeline of where they went, cigarettes "so far" vs "if out all day", one tip); Defence / Stay Safe (3-4 actions that change with AQI category; personalised for children/elderly/breathing issues and pets: dogs "walk during Go Time, keep it short", birds "keep away from open windows and smoke", cats/other "keep indoors"); Villain's Weapons / What's in the Air (PM2.5, PM10, NO2, O3, CO, SO2, collapsed, one-line explanations); Threat History / Past 7 Days (7 coloured blocks); expandable "Why our number is different" (CPCB scale vs US AQI).

Diwali sheet: cracker rules for the user's area THIS year loaded from a config file (config/diwali.ts: status, permitted hours, official notice URL; never hardcode claims), when it'll be worst (after 8 PM, next morning heavy), protect family (windows closed before evening, one clean room with purifier, N95, medical help button: call 112), protect pets (quiet inner room, ID tags, birds away from smoke), report a violation (Green Delhi app, noise portal ngms.delhi.gov.in, helpline 155271; "Report without confronting anyone").

### 6.5 Collateral / My Footprint

Cards: this month (kg CO2 so far + same-date comparison; toggle This month / Last 6 months); Damage Report / Breakdown (bars: Electricity, Cooking gas, Travel, Food, Deliveries, Flights & one-offs with kg and %; biggest source labelled; Electricity bar labelled "estimated" for the current month and "from your bill" once a bill is uploaded); Counter-Moves / Ways to Cut (3 tips that fit the user, kg and rupees per month, "Make it a mission"); 6-month trend; "In perspective" (yearly pace vs average Indian about 2 t/yr); last month's bill card; expandable "How we calculate".

Demo persona: the demo user rides a petrol two-wheeler 12 km to college, 6 days a week, in early November, so Travel must be the biggest source (little AC in Delhi now). Compute from data; do not hardcode. (Some screenshots show Electricity as biggest: that is outdated sample data.)

### 6.6 Ranks / Progress

Rank card with progress to next rank. Hero ranks: Origin Story -> Friendly Neighbour -> Rooftop Runner -> Masked Vigilante -> City Guardian -> Multiverse Legend (Plain: Level 1-6). Heatmap, last 12 weeks: Hero = night skyline where each square is a building window (dark = missed, lit = checked in, brighter = + mission done); Plain = green squares. Current + longest streak. Weekly personal challenge with progress bar. Badges (original art): Suit Up (first check-in), Seven-Day Saga (7-day streak), Great Responsibility (30-day streak), Rail Rider (3+ Metro days in a week), Cool Head (AC under own average for a week), Fewer Drops (half usual deliveries for a week), Diyas Only (no crackers logged in Diwali week), Assemble! (Squad with 2+ members), Paper Trail (upload 3 bills), Clean Escape (go out in Go Time 5 times). XP: daily check-in +10; mission done +20; weekly challenge +50; bill uploaded +30; 7-day streak +50; 30-day streak +200; Squad Goal completed +75 each member. Rank thresholds: configurable (sample: 0 / 200 / 500 / 1000 / 2000 / 4000 XP).

### 6.7 Squad / Family (supporting page, from top-right icon)

Two member types: app members (own login, own check-ins) and profiles (elder / child / pet; managed by an app member; name, care needs, usual outdoor times; alerts and lives are estimated). Flow: create household or join with invite link; invite link /join/CODE shared via WhatsApp (wa.me); Google sign-in then joins. Page: squad card with avatars; Squad Alerts (per person/pet, only when AQI is bad); everyone's Lives with tap-to-see breakdown; Squad Collateral (Shared = electricity + LPG, entered once; Personal = travel, food, deliveries; each app member's total as a plain bar, no ranking, members see totals not details); Squad Goal (one weekly goal from fixed rules, e.g. "Cut AC by 1 hour a night"); family streak (days every app member checked in) with who's done today and a Nudge button that opens WhatsApp with a prefilled message; manage (edit household/profiles, leave). Guests see "Sign in to create your Squad".

### 6.8 EDITH assistant (supporting page)

Full-screen chat from the top-right icon. Gemini with the user's live data injected as context (today's and tomorrow's AQI forecast, routine, household incl. pets, footprint). Greeting + suggested chips ("When should I go for a walk today?", "Is it safe for Dadi to go out?", "Can I take Eva out now?", "Why is my footprint high this month?", "What's one easy change I can make?", "Is it okay to open the windows?", Diwali: "When will the air be worst tonight?"). Answers = short plain text + small data card where useful (forecast strip, member lives, footprint bars, tip card with "Accept as today's mission"). Input: text, mic (browser speech recognition, optional), send. Health answers carry "EDITH isn't a doctor. For breathing trouble or chest pain, get medical help." Ground answers in the numbers; if the AI call fails, show a friendly fallback and rule-based answers for the chip questions.

### 6.9 Settings (from profile avatar, top right)

Profile card (name, rank, XP) or guest banner ("Sign in to save your data"); My details (the 4 setup sections); Look (Hero / Plain toggle); Location (access status, change city); Squad link; Account (Google email, sign out); About (version, GitHub link, "How we calculate", sign-off "Built with love for India"). How we calculate page: expandable sections: 1 Your carbon footprint (activity x factor), 2 How your monthly number stays accurate, 3 Air quality (AQI), 4 Cigarettes and Lives, 5 What these numbers are and aren't; plus Sources (CEA, CPCB, Open-Meteo, Berkeley Earth, AQLI 2025).

## 7. The engine (put ALL constants in one lib/factors.ts with a source comment per value)

### 7.1 Footprint = activity x emission factor

- Electricity: 0.727 kg CO2 per kWh (CEA CO2 Baseline Database v20.0, Dec 2024, weighted average, 2023-24). 300 units = about 218 kg.
- LPG: about 42 kg CO2 per 14.2 kg cylinder; spread across the refill cycle (1 month = 30 days, 2 = 60, 3+ = 90). PNG: placeholder estimate per household per day. Induction: add to electricity estimate.
- Petrol: about 2.3 kg CO2 per litre (diesel ~2.7, CNG ~2.0 per kg-equivalent; document). Own vehicle: km / mileage x fuel factor; defaults when mileage skipped (two-wheeler ~45 km/l, car ~15 km/l). Shared cab/car: divide by passengers (assume 2 shared).
- Per-passenger-km factors (placeholders, flag as estimates, cite in README): Metro low (~0.03), bus (~0.05), auto-CNG (~0.08), cab (~0.15, /2 if shared), two-wheeler and car from fuel maths, walk/cycle 0.
- Minutes -> km speeds (Delhi typical): Metro 35 km/h, bus 15, auto 20, cab 22, two-wheeler 25, car 22, cycle 12, walk 5.
- Food per meal (placeholders): veg < veg+dairy < egg < chicken/fish < mutton (order must hold; e.g. 0.4 / 0.7 / 0.8 / 1.5 / 1.3 / 3.5 kg), skipped = 0.
- Deliveries per order (placeholders): food order, quick grocery, parcel (three separate factors).
- Flights (placeholders): domestic round trip ~300 kg, international round trip ~1500 kg, counted in the month logged; setup's 12-month count is spread across the year in the monthly view.
- Electricity estimate, daily: base kWh/day from household size and home type (e.g. 2 + 1.5 x people) + AC (ACs x 1.2 kW x hours; night: part = 3 h, whole = 7 h) + heater 1.5 kW x hours + geyser (short 0.5 kWh / long 1.5 kWh). Multiply by 0.727.
- Bill correction loop: the electricity bill arrives AFTER the month ends. During the month electricity is ESTIMATED daily. When the user uploads LAST month's bill, Gemini vision reads units + billing period; the real units replace that month's estimate (label "from your bill"), and a calibration ratio = actual / estimated (clamped 0.5-2.0, smoothed) adjusts future estimates. "Same date last month" comparisons use corrected numbers.

### 7.2 AQI (India CPCB)

Source: Open-Meteo Air Quality API (free, no key): `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=..&longitude=..&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&past_days=1&forecast_days=2&timezone=Asia%2FKolkata`. Geocoding: Open-Meteo geocoding API. Convert to Indian AQI with CPCB breakpoints (sub-index per pollutant by linear interpolation; AQI = max sub-index). Verify the table against the official CPCB NAQI document and cite it.

- PM2.5 (ug/m3) -> 0-30:0-50, 31-60:51-100, 61-90:101-200, 91-120:201-300, 121-250:301-400, 250+:401-500
- PM10 -> 0-50, 51-100, 101-250, 251-350, 351-430, 430+ (same index bands)
- NO2 -> 0-40, 41-80, 81-180, 181-280, 281-400, 400+
- O3 (8h) -> 0-50, 51-100, 101-168, 169-208, 209-748, 748+
- CO (mg/m3, convert from ug/m3 /1000) -> 0-1.0, 1.1-2.0, 2.1-10, 10-17, 17-34, 34+
- SO2 -> 0-40, 41-80, 81-380, 381-800, 801-1600, 1600+

Categories: Good 0-50, Satisfactory 51-100, Moderate 101-200, Poor 201-300, Very Poor 301-400, Severe 401-500.

Headline AQI uses the CPCB 24-hour-average method (trailing 24 h mean of hourly values); hourly strips run the hourly concentration through the same breakpoints (label as hourly index). Cache API responses (e.g. 15 min) and fall back to the last good value if the API fails.

Go Time = contiguous 2-hour window (daytime, e.g. 6 AM-9 PM) with the lowest forecast hourly index.

### 7.3 Cigarette equivalent

24-hour mean PM2.5 / 22 (Berkeley Earth: 22 ug/m3 for 24 h ~ 1 cigarette). "Out all day" = full-day mean; "so far" = from the user's actual outdoor blocks (indoors counts at a reduced factor, purifier lowers it further).

### 7.4 Missions

~30 fixed missions in a config file, each with applicability rules (e.g. Metro mission only if user has a personal vehicle for the trip) and a savings formula (kg CO2 and rupees from the user's real distance, mileage, fuel price in a config, Metro fare by distance). Gemini picks/personalises one from the applicable set; rules pick the biggest-sector mission if AI fails. Never suggest something that doesn't apply.

### 7.5 Lives (hearts)

5 per day. Predicted loss per usual outdoor hour by hourly category: Good/Satisfactory 0, Moderate 0.25, Poor 0.5, Very Poor 1, Severe 1.5. Indoors without a purifier on a Very Poor/Severe day: 0.5 total; with a purifier: 0. Morning = predicted from routine; the check-in's outdoor blocks adjust the final count. Floor at 0. A planning guide, not medical.

### 7.6 Streaks, XP, challenges

Streak = consecutive days with a completed check-in (late fill up to 2 days allowed). Family streak = consecutive days all app members checked in. XP/ranks/badges per 6.6. Squad Goal and weekly challenge are rule-based (compare this week's check-in numbers with last week's); no AI needed.

## 8. Data model (Supabase Postgres + Row Level Security)

- profiles (id = auth user, display_name, mode, onboarded)
- user_setup (user_id, jsonb of all setup answers, location lat/lng/area, updated_at)
- households (id, name, invite_code), household_members (household_id, user_id, role)
- household_profiles (id, household_id, kind: elder|child|pet, name, care_needs[], pet_type, outdoor_blocks[])
- checkins (user_id, date, meals jsonb, trips jsonb, energy jsonb, deliveries jsonb, outdoor_blocks jsonb, mission_status, co2_breakdown jsonb, lives_kept, unique(user_id, date))
- one_offs (user_id, date, kind, details jsonb, co2_kg)
- bills (user_id, period_start, period_end, units, source: photo|manual, created_at)
- missions_log (user_id, date, mission_id, accepted, status, saved_kg, saved_inr)
- xp_events (user_id, date, kind, xp), badges (user_id, badge_id, earned_at)

Guests: same shape in localStorage behind one storage interface (adapter pattern) so UI code doesn't care. Guest data is not shared or synced.

## 9. Stack and integrations

Next.js (App Router) + TypeScript + Tailwind; Supabase (Google OAuth, Postgres, RLS); Open-Meteo (AQI + geocoding); Gemini (server-side route handlers only; model name from env GEMINI_MODEL, check the current docs): bill reading (vision), mission picking, EDITH chat; PWA via Serwist or equivalent (manifest + service worker + icons); Vercel hosting. Secrets only in env vars (.env.local, documented in .env.example); never in client code or git. Planned later (do NOT build now): Gmail delivery-order parsing, indoor ESP32 PM2.5 sensor, Maps distance, trends/area comparisons.

## 10. Honesty and quality rules

- Credit all sources and data providers; MIT license.
- Mobile-first, fully responsive. Accessible contrast, readable even in Hero mode.
- If something can't be finished, ship a working simpler version with a clear "coming soon" rather than a broken feature.
