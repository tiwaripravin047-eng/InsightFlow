# InsightFlow Frontend (Track B)

AI-Powered Feedback Intelligence OS — Next.js 16 Web Dashboard & Analytics UI.

## Overview
- **Framework**: Next.js 16 (App Router + Turbopack)
- **Styling**: TailwindCSS & Custom Design System (Dark/Neutral Theme)
- **Charts**: Apache ECharts & Recharts
- **Icons**: Lucide React
- **Testing**: Vitest & Testing Library

## Quick Start
`ash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start development server
pnpm dev
`
Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts
- pnpm dev: Starts the Next.js development server with Turbopack
- pnpm build: Creates an optimized production build
- pnpm start: Runs the built production server
- pnpm test: Runs the Vitest test suite
- pnpm typecheck: Runs TypeScript type validation
- pnpm lint: Runs ESLint checks

## Environment Variables
- NEXT_PUBLIC_API_URL: Backend API base URL (default: \http://localhost:8000\)
- NEXT_PUBLIC_USE_MOCKS: Set to \	rue\ to use fixture mocks matching \API_CONTRACTS.md\ or \alse\ to call the live FastAPI backend.
