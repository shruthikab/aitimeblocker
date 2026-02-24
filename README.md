# PlayBlocks — AI Time Blocker

An AI-powered time blocking app for students. Import your calendar, log your assignments, and let Claude generate a balanced study schedule around your existing commitments.

## Features

- **Import calendar** — upload a `.ics` file to bring in your existing events
- **Log assignments** — paste a syllabus and let AWS Bedrock (Claude 3.5 Sonnet) extract tasks automatically, or add them manually
- **Generate a plan** — a greedy scheduling algorithm places work blocks in available slots, respecting your work hours, daily limits, and deadlines
- **Export to calendar** — download the generated schedule as an `.ics` file to import into any calendar app

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Auth | AWS Cognito (OIDC via `react-oidc-context`) |
| AI | AWS Bedrock — Claude 3.5 Sonnet |
| Backend | AWS Lambda (Express.js), API Gateway |
| Database | DynamoDB |
| Infrastructure | AWS Amplify |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito app client ID |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito hosted UI domain |
| `NEXT_PUBLIC_API_BASE_URL` | API Gateway base URL |
| `NEXT_PUBLIC_APP_URL` | App URL for Cognito logout redirect |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AWS Backend Setup

This project uses AWS Amplify to manage backend resources. To deploy your own backend:

1. Install the Amplify CLI: `npm install -g @aws-amplify/cli`
2. Configure it: `amplify configure`
3. Initialize: `amplify init`
4. Push resources: `amplify push`

The backend includes:
- **Auth** — Cognito user pool
- **API** — API Gateway + Lambda (Express.js app in `amplify/backend/function/playblocksfunction/src/`)
- **Storage** — DynamoDB table
- **Hosting** — Amplify Hosting

### Bedrock access

The Lambda function calls AWS Bedrock to parse syllabi. Make sure:
- Bedrock model access is enabled in your AWS account for `claude-3-5-sonnet` in `us-east-1`
- The Lambda execution role has `bedrock:InvokeModel` permission

## Project Structure

```
app/
  page.js               # Landing page
  plan/page.jsx         # Main 3-step planner (Import → Log → Generate)
  api/                  # Next.js API routes (local in-memory storage)
components/
  AuthHeader.jsx        # Cognito auth header
  ImportStep.jsx        # ICS file import UI
  PlanStep.jsx          # Plan generation UI
  TuneStep.jsx          # Preferences/settings
src/lib/
  api.ts                # Client-side API helpers
  storage.ts            # In-memory storage layer (dev)
  ics.ts                # ICS calendar file builder
amplify/backend/
  function/playblocksfunction/src/
    app.js              # Lambda — ICS import, task parsing, plan generation
    index.js            # Lambda handler
```
