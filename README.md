# Red Dog: Shift Breaker

An original browser-based side-scrolling arcade RPG inspired by classic 16-bit action games and the absurdity of keeping an Arctic mine/mill running.

Choose one of three classes — **Metallurgist**, **Operator**, or **Mill Mechanic** — then fight through mill hazards, gain XP, level up, and survive the shift.

## Controls

- `A / D` or `← / →` — move
- `W`, `↑`, or `Space` — jump
- `J` — basic attack
- `K` — class ability
- `Shift` or `L` — dodge
- `E` — interact / continue dialogue
- `P` — pause

## Local development

```bash
npm install
npm run dev
```

## Cloudflare Workers deployment

This project uses **Workers Static Assets** with the site in `public/` and a tiny Worker in `src/worker.js`.

```bash
npm install
npm run deploy
```

For Cloudflare Git integration, leave the build command blank and use the default deploy command `npx wrangler deploy`. The production branch is `main`.

## Current prototype

- Three distinct playable classes
- Side-scrolling movement, jumping, melee/ranged combat and dodge invulnerability
- XP, leveling, health pickups and class abilities
- Multi-stage wave encounters
- Red Dog-flavored dialogue and mill hazards
- First boss encounter: **The Exciter Stator, Destroyer of Schedules**
- Responsive canvas that works in a desktop browser and scales down for mobile

All visuals are original procedural/canvas art; there are no copied game sprites or assets.
