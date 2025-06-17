# TradeTaper Backend

This is the backend service for the TradeTaper application, built with Express.js and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tradetaper
NODE_ENV=development
```

3. Build the project:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Trades

- `GET /api/trades` - Get all trades
- `GET /api/trades/:id` - Get a specific trade
- `POST /api/trades` - Create a new trade
- `PUT /api/trades/:id` - Update a trade
- `DELETE /api/trades/:id` - Delete a trade

## Development

The backend uses TypeScript and shares DTOs with the frontend through the `@tradetaper/shared-dto` package. Make sure to rebuild the shared DTOs if you make changes to them. 