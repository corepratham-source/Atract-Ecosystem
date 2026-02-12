# ATRact Ecosystem Dashboard

A minimal, decision-focused dashboard for managing your app ecosystem. Built for founders who need to make quick decisions, not explore data.

## Tech Stack

- **Frontend**: React (Vite), JavaScript, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or connection string)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```
MONGO_URI=mongodb://localhost:27017/atract-dashboard
PORT=5000
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the next available port)

## Features

- **Ecosystem Snapshot**: 6 key metrics at a glance
- **App Portfolio Table**: All apps in one view with inline editing
- **Status Management**: Build, Live, Pause, Kill, Scale
- **Decision Tags**: Every app must have a decision (Scale, Watch, Kill)
- **Color Coding**: Visual indicators for health status
- **Alert Icons**: Quick visual flags for important issues

## API Endpoints

- `GET /apps` - Get all apps
- `POST /apps` - Create a new app
- `PUT /apps/:id` - Update an app
- `DELETE /apps/:id` - Delete an app

## Database Schema

Collection: `apps_metrics`

```javascript
{
  appName: String (required),
  users7d: Number,
  users30d: Number,
  revenue30d: Number,
  retention: Number (0-100),
  cost: Number,
  status: String (Build, Live, Pause, Kill, Scale),
  decision: String (Scale, Watch, Kill) (required),
  owner: String,
  lastUpdated: Date
}
```


