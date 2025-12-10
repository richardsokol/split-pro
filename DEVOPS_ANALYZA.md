# DevOps Analýza projektu Split-Pro

Autor: Richard Sokol  
Dátum: 27. november 2025  
Branch: leftover-penny-issue

## Úvod

Tento dokument popisuje DevOps nástroje a služby používané v projekte Split-Pro. Projekt využíva moderné DevOps praktiky vrátane Continuous Integration (CI), Continuous Deployment (CD), automatizovaného testovania a kontajnerizácie.

---

## 1. GitHub Actions (CI/CD)

### Účel
Automatizácia CI/CD procesov - automatické buildovanie, testovanie a nasadzovanie aplikácie pri zmenách v kóde.

### Konfigurácia
- **Hlavný konfiguračný priečinok:** `.github/workflows/`
- **Súbory:**
  - `.github/workflows/check.yml` - CI pipeline pre pull requesty
  - `.github/workflows/publish.yaml` - CD pipeline pre release
  - `.github/workflows/postgres.yaml` - Build a publikácia DB obrazov

**Fázy vývoja:** Build, Test, Deploy

### 1.1 Workflow: Check (`.github/workflows/check.yml`)

**Účel:** Continuous Integration - automatické testovanie pri pull requestoch

**Spúšťa sa:** Pri každom pull requeste

**Kroky vo vašom projekte:**
1. **Checkout kódu** - Stiahnutie najnovšej verzie kódu z repozitára
2. **Inštalácia pnpm** - Nastavenie package managera pnpm
3. **Inštalácia Node.js** (v22.16.0) - Nastavenie vývojového prostredia
4. **Inštalácia závislostí** - `pnpm install`
5. **Prettier formatting check** - Kontrola formátovania kódu (`pnpm prettier --check .`)
6. **Linting** - Statická analýza kódu (`pnpm lint`) pomocou oxlint
7. **Type checking** - TypeScript kompilácia bez generovania súborov (`pnpm tsgo --noEmit`)
8. **Unit testy** - Spustenie testov (`pnpm test`) pomocou Jest
9. **Build** - Kompilácia Next.js aplikácie (`pnpm build --no-lint`)

**Benefit:** Zabezpečuje, že každý pull request spĺňa kvalitné štandardy pred merge-om do main branchu.

### 1.2 Workflow: Publish Docker (`.github/workflows/publish.yaml`)

**Účel:** Continuous Deployment - automatická publikácia Docker obrazov

**Spúšťa sa:** 
- Pri vytvorení nového tagu (release)
- Manuálne cez workflow_dispatch

**Kroky vo vašom projekte:**
1. **Multi-platform build** - Buildovanie pre amd64 a arm64 architektúry paralelne
2. **Docker build** - Vytvorenie Docker obrazu aplikácie s verziovaním
3. **Tagovanie obrazov:**
   - `latest` / `next` (podľa typu verzie)
   - Git SHA hash
   - Verzované číslo (napr. v1.2.3)
4. **Push do registrov:**
   - DockerHub: `ossapps/splitpro`
   - GitHub Container Registry: `ghcr.io/oss-apps/splitpro`
5. **Vytvorenie a publikácia manifestov** - Multi-platform manifest pre jednotný prístup k obom architektúram

**Benefit:** Automatické vydávanie nových verzií aplikácie ako Docker kontajnery dostupné pre rôzne architektúry.

### 1.3 Workflow: Publish DB Image (`.github/workflows/postgres.yaml`)

**Účel:** Deployment - publikácia vlastných PostgreSQL Docker obrazov

**Spúšťa sa:** Manuálne s parametrami (major/minor verzia Postgresu, base image)

**Kroky vo vašom projekte:**
1. **Build PostgreSQL obrazu** s vlastnými rozšíreniami (pg_cron)
2. **Multi-platform support** - amd64 a arm64
3. **Publikácia** do DockerHub a GHCR

**Benefit:** Vlastné PostgreSQL obrazy s potrebnými rozšíreniami pre projekt.

---

## 2. Docker & Docker Compose (Kontajnerizácia)

### Účel
Kontajnerizácia aplikácie pre konzistentné prostredie naprieč vývojom, testovaním a produkciou. Umožňuje jednoduché nasadenie a škálovanie.

### Konfigurácia
- **Hlavný Dockerfile:** `Dockerfile` - Build aplikácie
- **PostgreSQL Dockerfile:** `docker/postgres/Dockerfile` - Custom DB obraz
- **Dev environment:** `docker/dev/compose.yml` - Lokálny development
- **Prod environment:** `docker/prod/compose.yml` - Produkčné nasadenie

**Fázy vývoja:** Build, Deploy, Development Environment

### 2.1 Hlavný Dockerfile

**Súbor:** `Dockerfile`

**Účel:** Multi-stage build pre produkčné nasadenie

**Štruktúra vo vašom projekte:**
1. **Base stage:**
   - Alpine Linux (3.21) + Node.js (22.16.0)
   - Inštalácia závislostí cez pnpm
   - Build Next.js aplikácie
2. **Release stage:**
   - Optimalizovaný produkčný obraz
   - Standalone Next.js výstup
   - Prisma migrations a schema
   - Minimálna veľkosť obrazu

**Benefit:** Malé, optimalizované produkčné kontajnery.

### 2.2 Development Compose (`docker/dev/compose.yml`)

**Účel:** Lokálne vývojové prostredie

**Služby:**
1. **PostgreSQL databáza:**
   - Image: `ossapps/postgres`
   - Port: 5432
   - Persistent volumes
   - pg_cron rozšírenie
2. **MinIO (S3 storage):**
   - Port: 9002 (API), 9001 (Console)
   - Lokálne objektové úložisko

**Benefit:** Jednoduchý setup lokálneho vývojového prostredia jedným príkazom `pnpm dx:up`.

### 2.3 Production Compose (`docker/prod/compose.yml`)

**Účel:** Produkčné nasadenie

**Služby:**
1. **PostgreSQL** s health checks
2. **Split-Pro aplikácia:**
   - Latest Docker image
   - Automatické spustenie migrácií
   - Závislosť na healthy databáze

**Benefit:** Jednoduché produkčné nasadenie celého stacku.

---

## 3. Testing Framework (Jest)

### Účel
Automatizované testovanie jednotiek kódu (unit tests) a integračné testy. Zabezpečuje, že zmeny v kóde nerozbijú existujúcu funkcionalitu.

### Konfigurácia
- **Hlavná konfigurácia:** `jest.config.ts` - Kompletný testing setup
- **Zjednodušená konfigurácia:** `jest.simple.config.ts` - Rýchlejšie testy
- **Test súbory:** `src/tests/` - Unit a integračné testy
- **Coverage výstupy:** `coverage/` - HTML, LCOV, JSON reporty
- **Package.json skripty:**
  - `pnpm test` - Spustenie testov
  - `pnpm test:watch` - Watch mode

**Fáza vývoja:** Test

**Použitie vo vašom projekte:**
- **Unit testy** - Testovanie komponentov a funkcií
- **Integrácia s Next.js** - Next/jest preset
- **Coverage reporting** - Generovanie coverage reportov v `coverage/`
- **Custom serialization** - BigInt podpora pre JSON

**Spúšťanie:**
- `pnpm test` - Spustenie všetkých testov
- `pnpm test:watch` - Watch mode pre vývoj
- Automaticky v GitHub Actions pri každom PR

**Benefit:** Zabezpečenie funkčnosti kódu pred nasadením.

---

## 4. Code Quality Tools (Linting & Formatting)

### Účel
Automatická kontrola kvality kódu, dodržiavanie code style štandardov a eliminácia chýb ešte pred spustením aplikácie.

### Konfigurácia
- **Prettier konfigurácia:** `prettier.config.js` - Formátovanie
- **Oxlint:** Spúšťa sa cez `package.json` scripts
  - `pnpm lint` - Statická analýza
  - `pnpm prettier --check .` - Kontrola formátovania
- **TypeScript check:** `pnpm tsgo --noEmit` - Type checking
- **Lint-staged integrácia:** `.lintstagedrc.js` - Pre-commit hooks

**Fáza vývoja:** Build, Pre-commit

### 4.1 Oxlint

**Použitie:**
- Rýchly linter pre JavaScript/TypeScript
- Type-aware linting
- Spúšťa sa v CI/CD pipeline
- Automatické opravy cez `--fix`

### 4.2 Prettier

**Konfigurácia:** `prettier.config.js`

**Použitie:**
- Jednotné formátovanie kódu
- Tailwind CSS plugin
- Automatická kontrola v CI
- Pre-commit hook integrácia

**Benefit:** Konzistentný kód naprieč celým projektom.

---

## 5. Git Hooks (Husky + Lint-staged)

### Účel
Automatická validácia kódu pred každým commitom. Zabezpečuje, že do repozitára sa nedostane nevalidný alebo neformátovaný kód.

### Konfigurácia
- **Husky hooks:** `.husky/pre-commit` - Pre-commit hook script
- **Lint-staged pravidlá:** `.lintstagedrc.js` - Konfigurácia staged súborov
- **Package.json:**
  - `"prepare": "husky"` - Automatická inštalácia hooks
  - `lint-staged` dependency

**Fáza vývoja:** Pre-commit validation

**Použitie vo vašom projekte:**

**Pre-commit hook spúšťa:**
1. **lint-staged** - Formátovanie a linting len zmenených súborov
   - Prettier pre všetky súbory
   - Oxlint pre JS/TS súbory
   - Prisma format pre schema súbory
2. **TypeScript check** - `pnpm tsgo --noEmit`

**Benefit:** Zabránenie commit-u kódu, ktorý nespĺňa kvalitné štandardy.

---

## 6. Prisma (Database DevOps)

### Účel
ORM (Object-Relational Mapping) a nástroj na správu databázovej schémy s automatizovanými migráciami. Zabezpečuje type-safe prístup k databáze a verziované zmeny schémy.

### Konfigurácia
- **Schema definícia:** `prisma/schema.prisma` - Databázová schéma
- **Migrácie:** `prisma/migrations/` - Verziované databázové zmeny
- **Seed data:** `prisma/seed.ts` - Inicializačné dáta
- **Prisma konfigurácia:** `prisma.config.ts`
- **Package.json skripty:**
  - `pnpm db:dev` - Development migrácie
  - `pnpm db:seed` - Seedovanie databázy
  - `pnpm db:studio` - GUI pre databázu
  - `pnpm prisma:prod` - Produkčné migrácie
  - `postinstall` - Automatická generácia Prisma Client

**Fázy vývoja:** Build, Deploy, Development

**Použitie vo vašom projekte:**

### 6.1 Migrations
- **Automatické migrácie** v produkcii (`start` script)
- **Dev migrácie** - `pnpm db:dev`
- **Version control** migrácií v `prisma/migrations/`

### 6.2 Schema Management
- **Schema:** `prisma/schema.prisma`
- **Auto-generation** - Prisma Client sa generuje pri `postinstall`
- **Seed data** - `pnpm db:seed` s checksum verifikáciou

### 6.3 Developer Tools
- **Prisma Studio** - GUI pre databázu (`pnpm db:studio`)

**Benefit:** Type-safe databázové operácie a automatizovaná správa schémy.

---

## 7. Package Management (pnpm)

### Účel
Správa npm závislostí s optimalizáciou diskového priestoru a rýchlosti inštalácie. Zabezpečuje deterministické buildy cez lockfile.

### Konfigurácia
- **Package manager verzia:** `package.json` - `"packageManager": "pnpm@10.11.0"`
- **Lockfile:** `pnpm-lock.yaml` - Zafixované verzie závislostí
- **pnpm konfigurácia v package.json:**
  - `onlyBuiltDependencies` - Optimalizácia buildov
  - `overrides` - Security patches
- **Corepack:** Automatická aktivácia správnej verzie pnpm
- **Workspace setup:** Monorepo podpora (ak potrebné)

**Fáza vývoja:** Build, Dependency Management

**Výhody v projekte:**
- **Rýchlejšia inštalácia** oproti npm/yarn
- **Disk space efficiency** - Hard links miesto duplikátov
- **Strict dependency resolution** - Zabránenie phantom dependencies
- **Monorepo support** - Workspace podpora
- **Build optimizations** - `onlyBuiltDependencies` konfigurácia

**Benefit:** Rýchlejší a efektívnejší build proces.

---

## 8. Next.js Build System

### Účel
Framework a build systém pre React aplikáciu s automatickými optimalizáciami, Server-Side Rendering (SSR) a produkčnými buildmi.

### Konfigurácia
- **Next.js konfigurácia:** `next.config.js` - Build nastavenia, i18n, rewrites
- **TypeScript config:** `tsconfig.json` - Compiler options
- **Environment variables:** `src/env.ts` - Validácia env premenných
- **Next.js metadata:** `next-env.d.ts` - TypeScript definitions
- **Package.json skripty:**
  - `pnpm build` - Produkčný build
  - `pnpm dev` - Development server s Turbopack
  - `pnpm start` - Produkčný server
- **Output:** `.next/` - Build artifacts (standalone mode)

**Fáza vývoja:** Build, Deploy

**Verzia:** 15.4.7

**DevOps funkcie:**
- **Production builds** - Optimalizované standalone výstupy
- **Turbopack** - Rýchly dev server (`--turbopack`)
- **Automatic optimizations** - Code splitting, image optimization
- **Environment variables** - `.env` validation cez `@t3-oss/env-nextjs`

**Benefit:** Produkčne ready web aplikácia s optimalizáciami.

---

## 9. Container Registries

### Účel
Úložisko a distribúcia Docker obrazov pre jednoduchú inštaláciu a nasadenie aplikácie. Dual registry setup pre redundanciu a dostupnosť.

### Konfigurácia
- **GitHub Actions secrets:**
  - `DOCKERHUB_USERNAME` - DockerHub prihlasovacie meno
  - `DOCKERHUB_TOKEN` - DockerHub access token
  - `GITHUB_TOKEN` - Automatický GHCR prístup
- **Registry endpoints:**
  - DockerHub: `ossapps/splitpro`, `ossapps/postgres`
  - GHCR: `ghcr.io/oss-apps/splitpro`, `ghcr.io/oss-apps/postgres`
- **Build workflow:** `.github/workflows/publish.yaml` - Automatická publikácia
- **Multi-platform manifests:** Automatic creation pre amd64/arm64

**Fáza vývoja:** Deploy, Distribution

**Použitie:**
- **DockerHub:** `ossapps/splitpro`, `ossapps/postgres`
- **GHCR:** `ghcr.io/oss-apps/splitpro`, `ghcr.io/oss-apps/postgres`

**Channels:**
- `latest` - Stabilné release verzie
- `next` - Development builds
- Tagged versions - Špecifické verzie (v1.2.3)
- Git SHA - Build z konkrétneho commitu

**Benefit:** Jednoduchá distribúcia a inštalácia pre používateľov.

---

## 10. Monitoring & Observability

### Účel
Sledovanie kvality kódu cez test coverage a príprava na runtime monitoring. Pomáha identifikovať neotestované časti kódu.

### Konfigurácia
- **Coverage konfigurácia:** `jest.config.ts` - `coverageProvider: 'v8'`
- **Coverage výstupy:** `coverage/` priečinok:
  - `coverage/lcov-report/index.html` - HTML report
  - `coverage/lcov.info` - LCOV formát
  - `coverage/coverage-final.json` - JSON dáta
  - `coverage/clover.xml` - Clover XML
- **Instrumentation:** `src/instrumentation.ts` - Runtime monitoring setup
- **Run script:** `run-coverage.sh` - Coverage generovanie

### 10.1 Coverage Reporting

**Nástroj:** Jest Coverage (v8 provider)

**Výstupy:**
- HTML report (`coverage/lcov-report/index.html`)
- LCOV format (`coverage/lcov.info`)
- JSON (`coverage/coverage-final.json`)
- Clover XML (`coverage/clover.xml`)

**Použitie:** Sledovanie test coverage cez čas.

### 10.2 Error Tracking Potential

**Prítomné:** Instrumentation setup (`src/instrumentation.ts`)

**Benefit:** Pripravené na integráciu monitorovacích nástrojov (Sentry, New Relic, etc.).

---

## Zhrnutie DevOps Pipeline

### Vývojový cyklus:

1. **Lokálny vývoj:**
   - `pnpm dx` - Setup dev environment (Docker Compose)
   - `pnpm dev` - Turbopack dev server
   - Pre-commit hooks - Automatická validácia

2. **Pull Request:**
   - GitHub Actions: Check workflow
   - Prettier, Lint, Tests, TypeScript, Build
   - Blokuje merge pri chybách

3. **Merge do main:**
   - Kód je otestovaný a validovaný

4. **Release (tag):**
   - GitHub Actions: Publish workflow
   - Multi-platform Docker builds
   - Publikácia do registrov
   - Automatické verzie

5. **Deployment:**
   - Pull Docker image
   - Docker Compose produkčný stack
   - Automatické migrácie

---

## Silné stránky DevOps setup-u

1. ✅ **Kompletný CI/CD pipeline** s automatizáciou
2. ✅ **Multi-platform support** (amd64, arm64)
3. ✅ **Kvalitné nástroje** (TypeScript, Oxlint, Prettier, Jest)
4. ✅ **Kontajnerizácia** pre jednoduché nasadenie
5. ✅ **Pre-commit validácia** zabezpečuje kvalitu
6. ✅ **Automatické verzie a tagovanie**
7. ✅ **Dual registry publikácia** (DockerHub + GHCR)
8. ✅ **Database migrations** automatizácia

---

## Možné vylepšenia

1. ❌ **Continuous Monitoring** - Chýba integrácia s Sentry/New Relic
2. ❌ **Performance monitoring** - APM nástroje
3. ❌ **Automated security scanning** - Dependabot, Snyk
4. ❌ **E2E testy** - Playwright/Cypress v CI
5. ❌ **Automated changelog generation**
6. ❌ **Staging environment** pipeline

---

## Záver

Projekt Split-Pro má vynikajúco nastavený DevOps proces s pokrytím všetkých hlavných fáz vývoja:

- **Build** ✅ - GitHub Actions, Next.js, pnpm
- **Test** ✅ - Jest, Type checking, Linting
- **Deploy** ✅ - Docker, Multi-platform, Dual registry
- **Development** ✅ - Docker Compose, Husky, Lint-staged
- **Monitoring** ⚠️ - Parciálne (coverage, ale chýba runtime monitoring)

Projekt využíva moderné nástroje a best practices, čo umožňuje rýchly a spoľahlivý vývoj a nasadzovanie aplikácie.
