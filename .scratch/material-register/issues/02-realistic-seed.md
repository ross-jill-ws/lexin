# 02 — Realistic seed + one-command database setup

**What to build:** A developer can turn a brand-new database into a fully populated Material Register with one command. The register then holds 5,000 realistic industrial materials across about 8 Australian plants and about 25 real manufacturers, and the data is identical on every run.

**Blocked by:** 01 — Walking skeleton

**Status:** done

> **Amended 2026-11-18.** `test/seed.test.ts` (the HTTP-seam check against `lexin_test`) was removed with the test database; `test/seed-generator.test.ts` remains. The benchmark that reused the generator is gone; the seed CLI still takes `--count` and `--database-url`.

- [x] Seed uses Faker with a fixed seed combined with curated domain catalogues: category templates tied to plausible manufacturers, material types, units of measure, price ranges and realistic MPN formats (e.g. SKF deep groove ball bearings with MPN like 6205-2RS1, Gates V-belts, Parker hydraulics, Loctite/Mobil consumables, steel plate raw materials)
- [x] About 8 plants (1000 Brisbane, 1100 Gladstone, 1200 Mackay, 2000 Sydney, 2100 Newcastle, 3000 Melbourne, 4000 Perth, 4100 Kalgoorlie) and about 25 manufacturers
- [x] 5,000 materials numbered MAT-000001 to MAT-005000
- [x] Weighted distributions: roughly 75% Active / 15% Obsolete / 10% Pending Review; quantity skewed low; updated-at spread over the last three years
- [x] Inserts are batched inside a single transaction
- [x] Idempotent: re-running truncates tables and restarts identities, with no duplicates
- [x] Deterministic: two runs produce identical data
- [x] The generator accepts a row count and target database so the benchmark (ticket 08) can reuse it
- [x] Root `db:seed` and `db:setup` (up → migrate → seed on a fresh database) work
- [x] The placeholder seed from ticket 01 is replaced

## Comments

**Implemented (ticket 02).**

- `apps/backend/src/db/seed/catalogue.ts`: curated domain catalogues. These hold the 8 plants, 25 real manufacturers, and 23 weighted category templates. Each template ties a material type, unit of measure and price band to plausible manufacturers and their real part-number formats. Examples: SKF/FAG/NSK/Timken deep groove ball bearings (`6205-2RS1`, `6308-2RSR`, `6204DDU`), spherical and tapered roller bearings, Gates V-belts (`B57`) and PowerGrip GT belts, Parker JIC/ORFS fittings (`8 F5OX-S`) and hose, Rexroth valves, Festo/SMC cylinders, Siemens/Schneider/ABB contactors, VSDs and motors, ifm/SICK sensors, Atlas Copco compressor spares, Loctite, Mobil/Shell oils and greases, 3M abrasives and PPE, BlueScope plate and InfraBuild sections, and Norbar/Hilti/Fluke tools.
- `apps/backend/src/db/seed/generate.ts`: `generateSeed({ count, seed, referenceDate })` is a pure generator. It uses a private seeded Faker instance and produces `MAT-000001…` sequentially. Status is weighted 75/15/10. Quantity is `floor(500 · u⁴)`, so it skews heavily low (median about 30, roughly 20% zero). Updated-at is spread over the 3 years before `referenceDate`.
- `apps/backend/src/db/seed.ts`: `seedDatabase(url, options)` runs a single transaction. It does `TRUNCATE … RESTART IDENTITY CASCADE`, inserts plants and manufacturers, then inserts materials in batches of 1,000. It also works as a CLI: `pnpm db:seed [--count N] [--database-url URL]`, which ticket 08 can reuse for the 200k benchmark DB.
- Root `db:setup` = `db:up && db:migrate && db:seed`. It was verified on the dev DB, and two CLI runs gave an identical md5 over all material rows. The placeholder seed is gone.
- Tests: `test/seed.test.ts` covers the HTTP seam. It seeds lexin_test, then checks that `GET /api/materials` reports 5,000/200 pages, and that re-seeding gives an identical first page with ids included and no duplicates. `test/seed-generator.test.ts` covers numbering, the status mix, quantity skew, the date spread, determinism, plants and manufacturers, referential coverage of all types, plants and brands, and realistic MPNs.

**Deviations / decisions**

- I added a second test seam, the pure `generateSeed` interface. The API has no filters yet (ticket 06), so distributions and catalogue realism can't be observed over HTTP.
- Determinism needs a fixed "now". Updated-at is spread over the 3 years before a fixed `referenceDate` (2026-11-01), not before the wall clock, so the data ages slowly. Callers can override it.
- The catalogue tests were written after the catalogue data. They characterise data that already existed rather than driving red-then-green.
