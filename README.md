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

### Frontend
- **React** - UI framework
- **Modern JavaScript (ES6+)**

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM and migration tool
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Reporting
- **Excel** - Export-only reporting (not used as live data source)


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
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/DynamiteYt6/SilverHOCH-HMS.git
cd SilverHOCH-HMS
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Configure environment variables**

Create a `.env` file in the server directory:
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/silver_hoch_hms
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database (if seed script is implemented)
npx prisma db seed
```

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
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Database seeding script
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── lib/
│   │   │   ├── hash.ts      # Password hashing utilities
│   │   │   ├── jwt.ts       # JWT token utilities
│   │   │   └── prisma.ts    # Prisma client instance
│   │   ├── middleware/
│   │   │   └── middleware.ts # Authentication middleware
│   │   ├── routes/
│   │   │   └── auth.ts      # Authentication routes
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
│   ├── .env                 # Environment variables
│   ├── package.json         # Dependencies and scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── .gitignore
└── README.md
```

## API Documentation

### Health Check
- `GET /` - Server status
- `GET /health` - Health check endpoint
- `GET /test-db` - Database connection test

### Authentication
- `POST /api/auth/login` - User login
  - Body: `{ "username": "string", "password": "string" }`
  - Returns: JWT token and user info

### Rooms (Planned)
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room details
- `PATCH /api/rooms/:id/status` - Update room status

### Bookings (Planned)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/checkout` - Checkout booking
- `PATCH /api/bookings/:id/payment` - Update payment status

### Inventory (Planned)
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory/sale` - Record sale
- `PATCH /api/inventory/:id` - Update inventory quantity

### Reports (Planned)
- `GET /api/reports/daily` - Get daily summary
- `POST /api/reports/eod` - Confirm end-of-day
- `GET /api/reports/export` - Export to Excel

## Database Schema

Key tables:
- `users` - System users with roles
- `rooms` - Room inventory and status
- `bookings` - Customer bookings and stays
- `payments` - Payment records
- `inventory_items` - Drinks and condoms
- `sales` - Inventory sales transactions
- `business_days` - End-of-day reconciliation data

## Development

### Available Scripts
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev

# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention with Prisma ORM
- Environment variable configuration

## Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Configure PostgreSQL production database
4. Run database migrations on production
5. Deploy to hosting service (e.g., Heroku, AWS, DigitalOcean, Railway)

## Future Enhancements

The following features are planned for future releases:
- Complete API implementation for all endpoints
- Frontend application (React-based)
- Online booking support for customers
- Online payment gateway integration
- Multi-hotel management support
- Advanced analytics and forecasting
- Mobile application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software developed for Silver HOCH Hotel.

---

**Version**: 1.0  
**Last Updated**: January 24, 2026
