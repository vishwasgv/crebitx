# CREBITX - Complete Application

This repository contains both frontend and backend for the CREBITX application.

## Structure

```
├── crebitx/          # Next.js Frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
└── crebitx-backend/  # NestJS Backend
    ├── src/
    ├── migrations/
    └── package.json
```

## Quick Start

### Backend
```bash
cd crebitx-backend
docker-compose up -d
```

### Frontend
```bash
cd crebitx
npm install
npm run dev
```

## Documentation

- Frontend: See `crebitx/README.md`
- Backend: See `crebitx-backend/README.md`
- Setup Guide: See `SETUP.md`
