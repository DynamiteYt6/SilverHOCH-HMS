# Silver HOCH Hotel Management System (HMS) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue) ![React](https://img.shields.io/badge/React-18-blueviolet) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

[![GitHub Repo stars](https://img.shields.io/github/stars/DynamiteYt6/SilverHOCH-HMS?style=social)](https://github.com/DynamiteYt6/SilverHOCH-HMS)

A comprehensive full-stack hotel management system designed for small hotels to manage daily operations including room bookings, short stays, inventory sales, payments, and end-of-day reconciliation.

## 🚀 Quick Start

```bash
git clone https://github.com/DynamiteYt6/SilverHOCH-HMS.git
cd SilverHOCH-HMS

# Backend
cd server && npm i && npx prisma generate && npx prisma migrate dev && npx tsx prisma/seed.ts && npm run dev

# Frontend (new tab)
cd client && npm i && npm run dev
```

**Default Login:** `admin` / `admin123` | Backend: `localhost:3000` | Frontend: `localhost:5173`

## 📖 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Development](#development)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Troubleshooting](#troubleshooting)
- [Current Status](#current-status)

## Overview

Silver HOCH HMS is an internal hotel management system built for a 20-room hotel. The system streamlines operations for front desk staff, drinks sellers, and administrators with role-based access control and real-time room management.

## Features

### Room Management
- Manage 20 rooms across two floors
- Real-time status (Available, Occupied, Cleaning, Reserved)
- Visual layout, Fan/AC types, color-coded UI

### Booking System
- Overnight & Short Stay (90min timer, overstay detection)
- Auto-pricing: Fan ₦10k overnight/₦4k short, AC ₦20k/₦10k
- Countdown timers, business rules validation

### Payments & Inventory
- Cash/POS/Transfer payments
- Drinks/condom sales, auto-stock, role permissions

### Reports & Reconciliation
- End-of-day summaries, Excel export
- Day locking, revenue breakdowns, dashboard charts

### Frontend
- React UI, dark/light theme, responsive, real-time updates

## Tech Stack

### Backend
- Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL
- JWT, bcrypt, tsx, dotenv

### Frontend
- React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, Context API

## Installation

### Prerequisites
- Node.js ≥16, PostgreSQL ≥13, npm

### Backend Setup (server/)
```bash
npm install
# .env: DATABASE_URL, JWT_SECRET, PORT=3000
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```

**Seeds:** admin/admin123, sample rooms

### Frontend Setup (client/)
```bash
npm install
npm run dev
```

## Project Structure

```
SilverHOCH-HMS/
├── client/                 # React frontend
│   ├── src/pages/          # Pages: Dashboard, Rooms, Bookings, Reports, etc.
│   ├── src/context/        # Auth & Theme
│   └── vite.config.ts
├── server/                 # Express API
│   ├── prisma/schema.prisma
│   ├── src/routes/         # auth, bookings, rooms, reports, etc.
│   ├── src/middleware/     # auth, roles
│   └── uploads/inventory/
└── README.md
```

## API Documentation

**Auth Header:** `Authorization: Bearer <token>`

### Auth
- `POST /auth/login` `{username, password}` → `{token, user}`

### Rooms
- `GET /api/rooms`
- `PATCH /api/rooms/:id/status` `{status}`

### Bookings
- `POST /api/bookings` `{roomId, stayType, paymentMethod}`
- `PATCH /api/bookings/:id/checkout`

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `POST /api/reports/lock-day` `{date}`

(Full endpoints in code comments)

## Database Schema

**Key Models:**
- **User:** id, name, username, hashed password, role
- **Room:** id, number, type(FAN/AC), status, floor
- **Booking:** roomId, stayType, price, shortStayEnd
- **Payment:** bookingId, method, status
- **InventoryItem/Sale:** category(DRINK/CONDOM), quantity
- **BusinessDay:** date, isLocked

## User Roles

| Role | Key Permissions |
|------|-----------------|
| Super Admin | Full access, settings |
| Admin | Reports, day lock |
| Front Desk | Bookings, rooms, sales |
| Drinks Seller | Drinks sales only |

## Development

**Scripts:**
- Server: `npm run dev` (tsx watch src/server.ts), `npm start`
- Client: `npm run dev`, `npm run build`
- Prisma: `npx prisma studio`, `migrate dev`, `generate`

## Deployment

**Backend:** Railway/Render + Postgres, `migrate deploy`, `npm start`
**Frontend:** Vercel/Netlify, set `VITE_API_URL`

**.env Prod:**
```
DATABASE_URL=postgres://...
JWT_SECRET=secure-key
NODE_ENV=production
```

## Screenshots

**Dashboard Overview**  
![Logo](client/public/silverhoch-logo.png)  
*(Add room grid, reports charts, etc.)*

## Troubleshooting

- **DB:** Verify DATABASE_URL, `CREATE DATABASE silverhoch_hms`
- **Seed:** `npx tsx prisma/seed.ts`
- **Windows:** Close Prisma Studio before migrations
- **CORS:** Set VITE_API_URL=backend-url

## Current Status

✅ **Production Complete:**
- Full-stack features implemented
- UI polished
- Reports & locking ready

📋 **Planned:**
- Online payments
- Mobile app

## Contributing
Fork → Feature branch → PR

**License:** Proprietary (Silver HOCH Hotel)

---

**v2.1 Updated** | **Production Ready** | **Author:** DynamiteYt6

