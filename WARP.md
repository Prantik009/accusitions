# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

"Accusitions" is a Node.js REST API backend built with Express.js that provides user authentication services. It's designed as a foundational authentication system with a clean, modular architecture following modern JavaScript practices with ES modules.

## Commands

### Development

```bash
npm run dev              # Start development server with file watching
npm run lint             # Run ESLint for code quality
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Database Operations

```bash
npm run db:generate      # Generate database migrations from schema changes
npm run db:migrate       # Apply pending migrations to database
npm run db:studio        # Open Drizzle Studio for database management
```

### Testing & Quality

```bash
npm run lint             # Check code style and potential issues
npm run format:check     # Verify code formatting compliance
```

## Architecture

### Core Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js 5.x with modern middleware stack
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Authentication**: JWT tokens with secure HTTP-only cookies
- **Validation**: Zod schemas for request validation
- **Security**: Helmet, CORS, bcrypt password hashing
- **Logging**: Winston with file and console transports

### Directory Structure

```
src/
├── config/          # Database and logging configuration
├── controller/      # HTTP request handlers
├── middleware/      # Express middleware (currently empty)
├── models/          # Drizzle ORM schema definitions
├── routes/          # Express route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions (JWT, cookies, formatting)
└── validations/     # Zod validation schemas
```

### Request Flow

1. **Request Entry**: Express app with security middleware (helmet, CORS)
2. **Route Matching**: Routes defined in `/routes` directory
3. **Validation**: Zod schemas validate request body/parameters
4. **Controller**: Handles HTTP request/response cycle
5. **Service Layer**: Business logic and database operations
6. **Database**: Drizzle ORM queries to PostgreSQL via Neon
7. **Response**: JSON responses with appropriate status codes

### Key Components

#### Authentication System

- **Signup Flow**: Validation → Email uniqueness check → Password hashing → User creation → JWT token generation → Cookie setting
- **JWT Implementation**: 1-day expiration, signed tokens with user ID, email, and role
- **Cookie Security**: HTTP-only, secure in production, SameSite strict, 15-minute expiration
- **Password Security**: bcrypt with salt rounds of 10

#### Database Layer

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Single `users` table with id, name, email, password, role, timestamps
- **Migrations**: Version-controlled via Drizzle Kit
- **Connection**: Neon serverless PostgreSQL connection

#### Validation & Error Handling

- **Input Validation**: Zod schemas with custom error formatting
- **Error Types**: Validation errors (400), duplicate email (409), server errors (500)
- **Logging**: Winston logger with separate error and combined logs

### Development Patterns

#### Module Resolution

Uses Node.js subpath imports for clean module references:

- `#config/*` → `./src/config/*`
- `#controller/*` → `./src/controller/*`
- `#services/*` → `./src/services/*`
- etc.

#### Error Handling Strategy

- Controllers catch and format validation errors
- Services throw semantic errors (e.g., "User already exists")
- Winston logging for error tracking and debugging
- Consistent JSON error responses

#### Security Considerations

- Passwords never stored in plaintext (bcrypt hashing)
- JWT secrets from environment variables
- HTTP-only cookies prevent XSS attacks
- CORS and Helmet middleware for web security
- Input validation on all endpoints

### Database Schema

#### Users Table

```sql
CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password" varchar(255) NOT NULL,
  "role" varchar(50) DEFAULT 'user' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
```

### API Endpoints

#### Current Implementation

- `GET /` - Health check endpoint
- `GET /health` - System status with uptime
- `GET /api` - API status confirmation
- `POST /api/auth/sign-up` - User registration (fully implemented)
- `POST /api/auth/sign-in` - User login (placeholder)
- `POST /api/auth/sign-out` - User logout (placeholder)

### Environment Configuration

Required environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `LOG_LEVEL` - Winston logging level

### Development Workflow

1. **Code Changes**: Use file watching with `npm run dev`
2. **Schema Changes**: Run `npm run db:generate` then `npm run db:migrate`
3. **Code Quality**: Run `npm run lint:fix` and `npm run format`
4. **Database Inspection**: Use `npm run db:studio` for visual database management

### Future Extension Points

The architecture supports easy extension for:

- Additional authentication methods
- Role-based access control middleware
- API versioning
- Additional user-related endpoints
- Email verification systems
- Password reset functionality
