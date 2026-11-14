# SkyRush

SkyRush is a full-stack real-time 2D Aviator / Crash style multiplayer casino gaming platform.

## Architecture & Structure

This repository is organized as a monorepo containing three core components:

* **[`server/`](./server/)**: NestJS WebSocket game backend and API engine (PostgreSQL, Redis, Socket.IO).
* **[`game/`](./game/)**: Hardware-accelerated 60 FPS HTML5 Canvas crash game frontend client (Vite, JavaScript).
* **[`admin/`](./admin/)**: Admin management portal, player analytics, cashier approvals, and streamer HUD (Next.js 16, React 19, Tailwind CSS).

## Quick Start

### 1. Game Server
```bash
cd server
npm install
npm run start:dev
```

### 2. Player Game Client
```bash
cd game
npm install
npm run dev
```

### 3. Casino Admin Dashboard
```bash
cd admin
npm install
npm run dev
```

## Docker Deployment

Each service contains its own standalone `Dockerfile` and configuration for containerized deployment.
