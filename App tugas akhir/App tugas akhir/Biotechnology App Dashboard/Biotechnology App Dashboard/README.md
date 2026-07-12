
# Biotechnology App Dashboard

Frontend and Android app for the Inhibition Zone App platform.

## What This Folder Contains

- React + Vite frontend
- Capacitor Android project
- Frontend utilities for API, homography, YOLO, and S/I/R inference
- Automation scripts for daily development and build flow
- Database SQL and PHP API source under `database/`

## Canonical Setup Guide

The full setup, deployment, and troubleshooting guide has been moved to the repository root:

- `../../../../RUN_FROM_START.md`

Use that file for complete Windows setup, ngrok workflow, Python services, Android sync/build, and common fixes.

## Quick Commands (Run In This Folder)

```powershell
npm.cmd ci
npm.cmd run dev
```

Start backend services:

```powershell
npm.cmd run backend:start
```

Android sync/build helpers:

```powershell
npm.cmd run android:sync
npm.cmd run app:run
npm.cmd run app:run:noopen
```

## Additional References

- Database setup notes: `database/README_DATABASE.md`
- Gateway script: `scripts/ngrok-gateway.js`
- Main repository overview: `../../../../README.md`
  ```
