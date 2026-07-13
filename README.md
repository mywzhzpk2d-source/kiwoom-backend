# Kiwoom REST API Backend Starter

This backend keeps the Kiwoom App Key and Secret Key off the GitHub Pages frontend.

## 1. Install

```bash
npm install
```

## 2. Configure secrets

Copy `.env.example` to `.env` and fill in your real values.

```bash
cp .env.example .env
```

Never upload `.env` to GitHub.

## 3. Run locally

```bash
npm start
```

Open:

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/kiwoom/connection-test`

The connection-test endpoint only returns success/failure. It never exposes the Kiwoom access token to the browser.

## 4. Frontend architecture

GitHub Pages -> this backend -> Kiwoom REST API

Your frontend should call only this backend. Do not place the Kiwoom App Key or Secret Key in HTML, CSS, or JavaScript.

## 5. Deployment

Deploy this Node.js app to a backend hosting provider. Add these environment variables in the provider's secret/environment settings:

- `KIWOOM_APP_KEY`
- `KIWOOM_SECRET_KEY`
- `KIWOOM_BASE_URL`
- `CORS_ORIGIN`

If Kiwoom requires an allowed source IP, register the public outbound IP used by the deployed backend provider. A hosting provider with a fixed outbound IP is the simplest choice for IP allowlisting.
