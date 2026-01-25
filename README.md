# Silver HOCH Hotel Management System (HMS)

A comprehensive backend API for a hotel management system designed for small hotels to manage daily operations including room bookings, short stays, inventory sales, payments, and end-of-day reconciliation.

## Overview

Silver HOCH HMS is an internal hotel management system built for a 20-room hotel. The system streamlines operations for front desk staff, drinks sellers, and administrators with role-based access control and real-time room management. This repository contains the backend API implementation.

## Features

### Room Management
- Manage 20 rooms across two floors
- Real-time room status tracking (Available, Occupied, Cleaning, Reserved)
- Visual layout matching physical hotel structure
- Support for Fan and AC room types

### Booking System
- **Overnight Bookings**: Standard hotel stays with automatic pricing
- **Short Stay Bookings**: 90-minute timer-based stays with overstay detection
- Automated alerts for expiring short stays
- Prevent unauthorized booking deletions

### Pricing
- **Fan Rooms**: ₦10,000 (overnight), ₦4,000 (short stay)
- **AC Rooms**: ₦20,000 (overnight), ₦10,000 (short stay)
- Support for long-stay discounts

### Payment Processing
- Multiple payment methods: Cash, POS, Transfer
- Payment status tracking: Paid, Pending
- No online payment gateway (MVP)

### Inventory Management
- Track drinks and condom inventory
- Role-based sales permissions
- Automatic quantity reduction on sale

### Reporting & Reconciliation
- End-of-day summary reports
- Room revenue and payment breakdowns
- Excel export functionality
- Admin-only day locking for read-only historical data

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma ORM** - Database ORM and migration tool
- **PostgreSQL** - Primary database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcrypt** - Password hashing
- **tsx** - TypeScript execution for development
- **dotenv** - Environment variable management

### Development Tools
- **nodemon** - Development server with hot reload
- **Prisma Studio** - Database GUI
- **ts-node** - TypeScript execution

## User Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | System configuration, database management, emergency overrides |
| **Admin** | View reports, confirm end-of-day reconciliation, manage settings |
| **Front Desk** | Room bookings, check-ins, checkouts, condom sales, payments |
| **Drinks Seller** | Drinks sales only (no room or admin access) |

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm (comes with Node.js)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/DynamiteYt6/SilverHOCH-HMS.git
cd SilverHOCH-HMS/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the server directory:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/silverhoch_hms"
JWT_SECRET=super-secret-change-later
PORT=3000
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with initial data
npx tsx prisma/seed.ts
```

The seed script creates:
- An admin user (username: `admin`, password: `admin123`)
- 3 sample rooms (101 - Fan, 102 - AC, 201 - AC)

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Project Structure

```
SilverHOCH-HMS/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema with all models
│   │   ├── seed.ts             # Database seeding script
│   │   └── migrations/         # Database migration history
│   ├── src/
│   │   ├── lib/
│   │   │   ├── hash.ts         # Password hashing utilities (bcrypt)
│   │   │   ├── jwt.ts          # JWT token generation & verification
│   │   │   └── prisma.ts       # Prisma client instance
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT authentication middleware
│   │   ├── routes/
│   │   │   └── auth.ts         # Authentication routes (login)
│   │   ├── app.ts              # Express app configuration
│   │   └── server.ts           # Server entry point
│   ├── .env                    # Environment variables (not in repo)
│   ├── package.json            # Dependencies and scripts
│   ├── tsconfig.json           # TypeScript configuration
│   └── .gitignore
└── README.md
```

## API Documentation

### Health Check Endpoints
- `GET /` - Server status check
  - Response: `"Server is running 🚀"`
- `GET /health` - Health check endpoint
  - Response: `{ "status": "ok" }`
- `GET /test-db` - Database connection test
  - Response: `{ "success": true, "result": [...] }`

### Authentication
- `POST /auth/login` - User login
  - **Body**: 
    ```json
    {
      "username": "admin",
      "password": "admin123"
    }
    ```
  - **Response**: 
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid",
        "name": "Super Admin",
        "role": "SUPER_ADMIN"
      }
    }
    ```

### Protected Routes
All routes below require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

- `GET /protected` - Test authentication
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: 
    ```json
    {
      "message": "You are authenticated!",
      "user": {
        "id": "uuid",
        "role": "SUPER_ADMIN"
      }
    }
    ```

### Rooms (Coming Soon)
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room details
- `PATCH /api/rooms/:id/status` - Update room status

### Bookings (Coming Soon)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/checkout` - Checkout booking
- `PATCH /api/bookings/:id/payment` - Update payment status

### Inventory (Coming Soon)
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory/sale` - Record sale
- `PATCH /api/inventory/:id` - Update inventory quantity

### Reports (Coming Soon)
- `GET /api/reports/daily` - Get daily summary
- `POST /api/reports/eod` - Confirm end-of-day
- `GET /api/reports/export` - Export to Excel

## Database Schema

### Core Models

**User**
- id, name, username, password (hashed), role, isActive
- Roles: SUPER_ADMIN, ADMIN, FRONT_DESK, DRINKS_SELLER

**Room**
- id, number, type (FAN/AC), status, floor
- Statuses: AVAILABLE, OCCUPIED, CLEANING, RESERVED

**Booking**
- id, roomId, stayType (OVERNIGHT/SHORT_STAY), bookingType, source
- checkIn, checkOut, shortStayEnd, price, isOverstay
- Linked to: Room, User (creator), Payment, BusinessDay

**Payment**
- id, bookingId, amount, method (CASH/POS/TRANSFER), status
- Status: PAID, PENDING

**InventoryItem**
- id, name, category (DRINK/CONDOM), quantity, price

**Sale**
- id, itemId, quantity, totalPrice, soldById
- Linked to: InventoryItem, User, BusinessDay

**BusinessDay**
- id, date, isLocked, confirmedById
- Used for end-of-day reconciliation

## Development

### Available Scripts
```bash
# Development server with hot reload (using tsx)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database with initial data
npx tsx prisma/seed.ts
```

### Testing with Postman

1. **Login to get token**
   - POST `http://localhost:3000/auth/login`
   - Body: `{ "username": "admin", "password": "admin123" }`

2. **Test protected route**
   - GET `http://localhost:3000/protected`
   - Header: `Authorization: Bearer <your_token>`

## Security Features

- ✅ JWT-based authentication with token expiration (1 day)
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ SQL injection prevention with Prisma ORM
- ✅ Environment variable configuration
- ✅ Secure token verification middleware
- ✅ Protected routes requiring authentication

## Deployment

### Prerequisites
- PostgreSQL database instance
- Node.js hosting service (Railway, Render, Heroku, AWS, etc.)

### Steps
1. Set production environment variables on your hosting platform
2. Build the application: `npm run build`
3. Configure PostgreSQL production database connection
4. Run database migrations: `npx prisma migrate deploy`
5. Start the server: `npm start`

### Environment Variables for Production
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_secure_random_secret
PORT=3000
NODE_ENV=production
```

## Current Status

### ✅ Completed
- [x] Database schema design
- [x] PostgreSQL setup
- [x] Prisma ORM integration
- [x] User authentication (login)
- [x] JWT token generation and verification
- [x] Password hashing with bcrypt
- [x] Authentication middleware
- [x] Database seeding
- [x] TypeScript configuration
- [x] ES Modules setup

### 🚧 In Progress
- [ ] Room management endpoints
- [ ] Booking system endpoints
- [ ] Inventory management endpoints
- [ ] Sales recording endpoints
- [ ] Payment processing endpoints
- [ ] Report generation endpoints
- [ ] Frontend application

### 📋 Planned
- [ ] Online booking support
- [ ] Online payment gateway integration
- [ ] Multi-hotel management
- [ ] Advanced analytics and forecasting
- [ ] Mobile application
- [ ] Real-time notifications
- [ ] Automated backup system

## Troubleshooting

### Common Issues

**Module not found errors**
- Make sure to use `.js` extensions in imports (TypeScript with ES modules requirement)
- Run `npx prisma generate` after schema changes

**Database connection errors**
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database exists: `CREATE DATABASE silverhoch_hms;`

**Seed script errors**
- Use `npx tsx prisma/seed.ts` instead of `ts-node`
- Ensure Prisma client is generated first

**EPERM errors on Windows**
- Stop the development server before running Prisma commands
- Close Prisma Studio if open

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for Silver HOCH Hotel.

---

**Version**: 1.0  
**Status**: Active Development  
**Last Updated**: January 25, 2026  
<<<<<<< HEAD
**Author**: DynamiteYt6
=======
**Author**: DynamiteYt6
>>>>>>> 632f679a0347bd41e8570149254a9fdf2f83c932
