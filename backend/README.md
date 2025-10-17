# Backend

TypeScript + Express backend server

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

## Available Scripts

- **`npm run dev`** - Start development server with hot reload (using nodemon + ts-node)
- **`npm run build`** - Compile TypeScript to JavaScript in the `dist` folder
- **`npm start`** - Run the compiled JavaScript from `dist` folder
- **`npm test`** - Run tests with Jest
- **`npm run test:coverage`** - Run tests with code coverage report
- **`npm run clean`** - Remove the `dist` folder

## Development Workflow

1. Start the development server:
```bash
npm run dev
```

2. The server will automatically reload when you make changes to files in the `src` directory

3. Run tests:
```bash
npm test
```

4. Check code coverage:
```bash
npm run test:coverage
```

## Testing & Code Coverage

### Running Tests

```bash
npm test                  # Run all tests
npm run test:coverage    # Run tests with coverage report
```

### Code Coverage Status

✅ **Current Coverage: 87.55%** (Exceeds 80% requirement)

| Metric | Coverage |
|--------|----------|
| Statements | 87.55% |
| Branches | 84.57% |
| Functions | 94.44% |
| Lines | 86.87% |

### Test Suite

- **70 total tests** (all passing)
- **30+ unit tests** for validation functions
- **40+ integration tests** for API endpoints
- Comprehensive edge case testing
- Format validation (state codes, zip codes)
- Field length boundary testing

## Validation Rules

The backend implements strict validation for all profile data:

| Field | Rules |
|-------|-------|
| fullName | Required, 1-50 characters |
| address1 | Required, 1-100 characters |
| address2 | Optional, 1-100 characters |
| city | Required, 1-50 characters |
| state | Required, 2-letter uppercase code (e.g., TX, CA) |
| zipCode | Required, 5-digit or ZIP+4 format |
| skills | Required array, 1-20 items, each 1-50 chars |
| preferences | Optional, max 500 characters |
| availability | Required array, 1-7 items, each 1-50 chars |

### Data Normalization

The API automatically:
- Trims whitespace from all string inputs
- Converts state codes to uppercase
- Validates formats before saving data

## Project Structure

```
backend/
├── src/
│   ├── __tests__/         # Test files
│   │   └── index.test.ts
│   └── index.ts           # Main application file
├── dist/                  # Compiled JavaScript (generated)
├── node_modules/          # Dependencies
├── .env.example           # Environment variables template
├── jest.config.js         # Jest testing configuration
├── nodemon.json           # Nodemon configuration
├── package.json           # Project dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## API Endpoints

### General
- **GET /** - Welcome message
- **GET /api/health** - Health check endpoint

### Profile Management
- **GET /api/profile** - Get all profiles
- **GET /api/profile/:userId** - Get profile by user ID
- **POST /api/profile/:userId** - Create a new profile
- **PUT /api/profile/:userId** - Update an existing profile
- **DELETE /api/profile/:userId** - Delete a profile

📖 For detailed Profile API documentation, see [PROFILE_API.md](./PROFILE_API.md)

## Building for Production

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```
