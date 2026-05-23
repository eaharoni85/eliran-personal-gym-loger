# Eliran Personal Gym Loger

Small personal workout tracker for iPhone-friendly gym use.

## Features

- A/B workout plans.
- Editable exercise names, notes, order, and custom exercises.
- Strength logging with kg and reps.
- Bike/cardio logging with km, calories, and minutes.
- Reps-only logging for abs/core exercises.
- Automatic rest timer after each logged set.
- Workout duration timer.
- Local workout history and reports.
- Export/import JSON backup.
- Static PWA, so it can be hosted without a backend server.

## Run Locally

From this folder:

```powershell
C:\Users\Elirana\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## iPhone Use

Host this folder as a static site with GitHub Pages, Netlify, or Cloudflare Pages.

Workout data is stored in the browser storage for that exact site URL. Use Export from time to time as a backup.
