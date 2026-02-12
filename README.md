# Silver HOCH Hotel Management System (HMS)

A comprehensive full-stack hotel management system designed for small hotels to manage daily operations including room bookings, short stays, inventory sales, payments, and end-of-day reconciliation.

## Overview

Silver HOCH HMS is an internal hotel management system built for a 20-room hotel. The system streamlines operations for front desk staff, drinks sellers, and administrators with role-based access control and real-time room management. This repository contains both the backend API and the React-based frontend application.

## Features

### Room Management
- Manage 20 rooms across two floors
- Real-time room status tracking (Available, Occupied, Cleaning, Reserved)
- Visual layout matching physical hotel structure
- Support for Fan and AC room types
- Color-coded status indicators in the UI

### Booking System
- **Overnight Bookings**: Standard hotel stays with automatic pricing
- **Short Stay Bookings**: 90-minute timer-based stays with overstay detection
- Automated alerts for expiring short stays
- Prevent unauthorized booking deletions
- Visual countdown timers for short stays

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
- Real-time stock tracking

### Reporting & Reconciliation
- End-of-day summary reports
- Room revenue and payment breakdowns
- Excel export functionality
- Admin-only day locking for read-only historical data
- Interactive dashboard with charts and statistics

### Frontend Features
- Modern React-based user interface
- Dark/Light theme support with context-based state management
- Responsive design for desktop and tablet use
- Real-time data updates
- Role-based UI elements and permissions
- Protected routes with authentication
- Visual dashboards with key metrics at a glance

## Implemented Features

🔐 **Authentication & Authorization**
- ✅ JWT-based login system
- ✅ Role-based access control (4 roles)
- ✅ Password hashing with bcrypt
- ✅ Protected routes with middleware
- ✅ Secure session management

🏨 **Room Management**
- ✅ View all rooms (sorted by floor/number)
- ✅ View single room details
- ✅ Update room status
- ✅ Automatic status transitions (AVAILABLE → OCCUPIED → CLEANING)
- ✅ Visual room status cards with color coding

📅 **Booking System**
- ✅ Create bookings (overnight & short stay)
- ✅ Automatic pricing based on room type
- ✅ Checkout functionality
- ✅ Business rules validation
- ✅ Database transactions for data integrity
- ✅ Short stay timer with visual countdown

💰 **Payment Management**
- ✅ Payment records linked to bookings
- ✅ Payment status tracking (PENDING → PAID)
- ✅ Multiple payment methods (CASH/POS/TRANSFER)
- ✅ View all payments with booking details

📦 **Inventory & Sales**
- ✅ Create inventory items (drinks, condoms)
- ✅ Record sales with payment methods
- ✅ Automatic stock reduction
- ✅ Role-based selling permissions (drinks seller can only sell drinks)
- ✅ Sales history tracking

👥 **User Management**
- ✅ Create new staff members
- ✅ Update user info
- ✅ Deactivate users
- ✅ Change passwords
- ✅ View all users

📊 **Reports & Analytics**
- ✅ Daily revenue summary
- ✅ Payment breakdown by method (CASH/POS/TRANSFER)
- ✅ Sales by category (DRINKS/CONDOMS)
- ✅ Booking and sales counts
- ✅ Business day locking mechanism

🔒 **Business Day Control**
- ✅ Automatic business day creation
- ✅ Lock days for end-of-day reconciliation
- ✅ Prevent modifications to locked days
- ✅ Track who confirmed each day

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

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **Context API** - Global state management (Auth, Theme)
- **ESLint** - Code linting

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

### Backend Setup (Server)

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

### Frontend Setup (Client)

1. **Navigate to the client directory**
```bash
cd ../client
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port)

4. **Build for production**
```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
SilverHOCH-HMS/
├── client/                      # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   └── Layout.tsx       # Main layout component
│   │   ├── context/             # React Context for state management
│   │   │   ├── AuthContext.tsx # Authentication state
│   │   │   └── ThemeContext.tsx # Theme (dark/light) state
│   │   ├── pages/               # Page components
│   │   │   ├── BookingsPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── RoomsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── UsersPage.tsx
│   │   ├── services/            # API service layer
│   │   │   └── api.ts           # Axios API client
│   │   ├── types/               # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                       # Express backend API
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema with all models
│   │   ├── seed.ts              # Database seeding script
│   │   └── migrations/          # Database migration history
│   ├── src/
│   │   ├── lib/
│   │   │   ├── hash.ts          # Password hashing utilities (bcrypt)
│   │   │   ├── jwt.ts           # JWT token generation & verification
│   │   │   └── prisma.ts        # Prisma client instance
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication middleware
│   │   │   ├── middleware.ts    # Additional middleware utilities
│   │   │   └── roles.ts         # Role-based access control middleware
│   │   ├── routes/
│   │   │   ├── auth.ts          # Authentication routes (login)
│   │   │   ├── bookings.ts      # Booking management endpoints
│   │   │   ├── inventory.ts     # Inventory and sales management
│   │   │   ├── payment.ts       # Payment processing endpoints
│   │   │   ├── reports.ts       # Reporting and analytics
│   │   │   ├── rooms.ts         # Room management endpoints
│   │   │   ├── settings.ts      # Settings management endpoints
│   │   │   └── users.ts         # User management endpoints
│   │   ├── app.ts               # Express app configuration
│   │   └── server.ts            # Server entry point
│   ├── data/
│   │   └── app-settings.json    # Application settings
│   ├── uploads/                 # Uploaded files directory
│   │   └── inventory/          # Inventory item images
│   ├── .env                     # Environment variables (not in repo)
│   ├── package.json             # Dependencies and scripts
│   ├── tsconfig.json            # TypeScript configuration
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

### Rooms
- `GET /api/rooms` - Get all rooms (sorted by floor/number)
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Response**: Array of room objects
- `GET /api/rooms/:id` - Get single room details
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Response**: Room object
- `PATCH /api/rooms/:id/status` - Update room status
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Body**: `{ "status": "AVAILABLE|OCCUPIED|CLEANING|RESERVED" }`
  - **Response**: Updated room object

### Bookings
- `POST /api/bookings` - Create a new booking
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Body**: `{ "roomId": "uuid", "stayType": "OVERNIGHT|SHORT_STAY", "paymentMethod": "CASH|POS|TRANSFER" }`
  - **Response**: Complete booking object with payment
- `GET /api/bookings` - Get all bookings
  - **Auth**: Required
  - **Response**: Array of booking objects with room and payment details
- `GET /api/bookings/:id` - Get single booking details
  - **Auth**: Required
  - **Response**: Complete booking object
- `PATCH /api/bookings/:id/checkout` - Checkout booking
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Response**: Updated booking object

### Payments
- `PATCH /api/payments/:id/status` - Update payment status
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Body**: `{ "status": "PAID|PENDING" }`
  - **Response**: Updated payment object
- `GET /api/payments` - Get all payments
  - **Auth**: Required (SUPER_ADMIN, ADMIN, FRONT_DESK)
  - **Response**: Array of payment objects with booking details

### Inventory
- `GET /api/inventory` - Get all inventory items
  - **Auth**: Required
  - **Response**: Array of inventory items
- `POST /api/inventory` - Create inventory item
  - **Auth**: Required (SUPER_ADMIN, ADMIN)
  - **Body**: `{ "name": "string", "category": "DRINK|CONDOM", "quantity": number, "price": number }`
  - **Response**: Created inventory item
- `POST /api/inventory/sale` - Record a sale
  - **Auth**: Required
  - **Body**: `{ "itemId": "uuid", "quantity": number, "paymentMethod": "CASH|POS|TRANSFER" }`
  - **Response**: Sale record
- `GET /api/inventory/sales` - Get all sales
  - **Auth**: Required
  - **Response**: Array of sale records

### Users
- `GET /api/users` - Get all users
  - **Auth**: Required (SUPER_ADMIN, ADMIN)
  - **Response**: Array of user objects
- `POST /api/users` - Create new user
  - **Auth**: Required (SUPER_ADMIN, ADMIN)
  - **Body**: `{ "name": "string", "username": "string", "password": "string", "role": "SUPER_ADMIN|ADMIN|FRONT_DESK|DRINKS_SELLER" }`
  - **Response**: Created user object

### Reports
- `GET /api/reports/daily` - Get daily summary report
  - **Auth**: Required (SUPER_ADMIN, ADMIN)
  - **Query**: `?date=YYYY-MM-DD` (optional, defaults to today)
  - **Response**: Daily revenue summary with breakdowns
- `POST /api/reports/lock-day` - Lock business day
  - **Auth**: Required (SUPER_ADMIN, ADMIN)
  - **Body**: `{ "date": "YYYY-MM-DD" }`
  - **Response**: Confirmation of locked day

### Settings
- `GET /api/settings` - Get application settings
  - **Auth**: Required (SUPER_ADMIN, ADMIN)
  - **Response**: Settings object
- `PATCH /api/settings` - Update application settings
  - **Auth**: Required (SUPER_ADMIN)
  - **Body**: `{ "key": "value", ... }`
  - **Response**: Updated settings object

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
- id, name, category (DRINK/CONDOM), quantity, price, imageUrl

**Sale**
- id, itemId, quantity, totalPrice, soldById
- Linked to: InventoryItem, User, BusinessDay

**BusinessDay**
- id, date, isLocked, confirmedById
- Used for end-of-day reconciliation

## Development

### Available Scripts

**Server (Backend)**
```bash
# Development server with hot reload (using tsx)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

**Client (Frontend)**
```bash
# Development server with hot reload (using Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
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
- ✅ Frontend route protection based on user roles

## Deployment

### Prerequisites
- PostgreSQL database instance
- Node.js hosting service (Railway, Render, Heroku, AWS, etc.)

### Backend Deployment
1. Set production environment variables on your hosting platform
2. Build the application: `npm run build`
3. Configure PostgreSQL production database connection
4. Run database migrations: `npx prisma migrate deploy`
5. Start the server: `npm start`

### Frontend Deployment
1. Build the client: `npm run build`
2. Deploy the `dist` folder to a static hosting service (Vercel, Netlify, etc.)
3. Configure the API base URL in the frontend environment

### Environment Variables for Production

**Server (.env)**
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_secure_random_secret
PORT=3000
NODE_ENV=production
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:3000
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
- [x] Room management endpoints
- [x] Booking system endpoints
- [x] Inventory management endpoints
- [x] Sales recording endpoints
- [x] Payment processing endpoints
- [x] Report generation endpoints
- [x] User management endpoints
- [x] Settings management endpoints
- [x] React frontend application
- [x] Theme switching (dark/light mode)
- [x] Responsive dashboard design
- [x] Room management UI
- [x] Booking management UI
- [x] Inventory management UI
- [x] User management UI
- [x] Reports and analytics UI

### 📋 Planned
- [ ] Online booking support
- [ ] Online payment gateway integration
- [ ] Multi-hotel management
- [ ] Advanced analytics and forecasting
- [ ] Mobile application
- [ ] Real-time notifications (WebSocket)
- [ ] Automated backup system
- [ ] SMS/Email notifications
- [ ] Room maintenance scheduling
- [ ] Guest profile management

## Frontend Pages Overview

| Page | Route | Description | Required Role |
|------|-------|-------------|--------------|
| Login | `/login` | User authentication page | All |
| Dashboard | `/dashboard` | Overview with key metrics and statistics | All authenticated |
| Rooms | `/rooms` | Room management with status visualization | FRONT_DESK+ |
| Bookings | `/bookings` | Booking management and creation | FRONT_DESK+ |
| Inventory | `/inventory` | Inventory items and sales | All (role-based) |
| Users | `/users` | User management | ADMIN+ |
| Reports | `/reports` | Daily reports and analytics | ADMIN+ |
| Settings | `/settings` | Application settings | ADMIN+ |

## Troubleshooting

### Common Issues

**Module not found errors (Backend)**
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

**Frontend build errors**
- Ensure Node.js version is 16 or higher
- Delete `node_modules` and run `npm install` again
- Check TypeScript compilation errors

**CORS errors**
- Ensure frontend is configured to point to correct API URL
- Check CORS configuration in backend `app.ts`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for Silver HOCH Hotel.

---

**Version**: 2.0
**Status**: Full-Stack Application Complete
**Last Updated**: February 2025
**Author**: DynamiteYt6

