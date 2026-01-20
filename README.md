# Silver HOCH Hotel Management System (HMS)

A comprehensive web-based hotel management system designed for small hotels to manage daily operations including room bookings, short stays, inventory sales, payments, and end-of-day reconciliation.

## Overview

Silver HOCH HMS is an internal hotel management system built for a 20-room hotel. The system streamlines operations for front desk staff, drinks sellers, and administrators with role-based access control and real-time room management.

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
- **PostgreSQL** - Primary database

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
git clone https://github.com/yourusername/silver-hoch-hms.git
cd silver-hoch-hms
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Create a `.env` file in the backend directory:
```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/silver_hoch_hms
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

5. **Set up the database**
```bash
cd backend
npm run db:migrate
npm run db:seed
```

6. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
silver-hoch-hms/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── migrations/         # Database migrations
│   ├── seeds/              # Database seed data
│   └── server.js           # Entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   ├── context/        # React context
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Helper functions
│   └── package.json
└── README.md
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room details
- `PATCH /api/rooms/:id/status` - Update room status

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/checkout` - Checkout booking
- `PATCH /api/bookings/:id/payment` - Update payment status

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory/sale` - Record sale
- `PATCH /api/inventory/:id` - Update inventory quantity

### Reports
- `GET /api/reports/daily` - Get daily summary
- `POST /api/reports/eod` - Confirm end-of-day
- `GET /api/reports/export` - Export to Excel

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- Audit logging for critical actions

## Database Schema

Key tables:
- `users` - System users with roles
- `rooms` - Room inventory and status
- `bookings` - Customer bookings and stays
- `payments` - Payment records
- `inventory_items` - Drinks and condoms
- `sales` - Inventory sales transactions
- `daily_summaries` - End-of-day reconciliation data
- `audit_logs` - System activity logs

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations
```bash
# Create new migration
npm run migration:create migration_name

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:rollback
```

## Deployment

1. Set production environment variables
2. Build frontend: `cd frontend && npm run build`
3. Configure PostgreSQL production database
4. Run database migrations on production
5. Deploy backend to hosting service (e.g., Heroku, AWS, DigitalOcean)
6. Serve frontend build from backend or CDN

## Future Enhancements

The following features are planned for future releases:
- Online booking support for customers
- Online payment gateway integration
- Multi-hotel management support
- Advanced analytics and forecasting
- Mobile application

## Support

For issues, questions, or contributions, please contact the development team or create an issue in the repository.

## License

This project is proprietary software developed for Silver HOCH Hotel.

---

**Version**: 1.0  
**Last Updated**: January 2026
