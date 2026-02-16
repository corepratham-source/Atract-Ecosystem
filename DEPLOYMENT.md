# ATRact Dashboard - Deployment Guide

## Project Structure
- `client/` - React frontend (Vite)
- `server/` - Express.js backend API

## Local Development

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

The frontend runs on `http://localhost:5173` and backend on `http://localhost:5000`

## Production Build

```bash
# Build frontend
npm run build

# This creates a `dist/` folder in the client directory
```

## Deployment to Render

### Step 1: Configure Environment Variables

In Render dashboard, set these environment variables:
- `MONGO_URI` - MongoDB connection string
- `PORT` - 5000 (default)
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - gemini-2.0-flash
- `OPENAI_API_KEY` - OpenAI API key

### Step 2: Repository Setup

The deployment is configured to:
1. Build the React frontend (`client/dist/`)
2. Serve it from Express server
3. Proxy `/api/*` requests to backend routes

### Step 3: Deploy

**Option A - Using render.yaml (RECOMMENDED):**
1. Ensure `render.yaml` is in the root of your repository
2. In Render dashboard, connect your GitHub repo
3. Render will automatically read `render.yaml` and use the correct build/start commands
4. Build Command: `npm install && cd client && npm install && npm run build && cd ../server && npm install`
5. Start Command: `cd server && npm start`

**Option B - Manual Setup in Render UI:**
1. Create new Web Service in Render
2. Connect your GitHub repo
3. In the "Build Command" field, enter:
   ```
   npm install && cd client && npm install && npm run build && cd ../server && npm install
   ```
4. In the "Start Command" field, enter:
   ```
   cd server && npm start
   ```
5. Add all environment variables
6. Deploy

**Option C - If using auto-detection:**
1. Render will read the root `package.json`
2. It will run the `build` script which handles everything
3. Then runs `npm start` which starts the server

### After Deployment

The deployment will:
1. ✅ Install root dependencies
2. ✅ Install and build React frontend
3. ✅ Install server dependencies  
4. ✅ Start Express server on port 5000
5. ✅ Serve frontend from `client/dist/`
6. ✅ Expose all API endpoints under `/api/*`

## How It Works

1. **Frontend Build**: React app is built into `client/dist/`
2. **Server Serves Frontend**: Express serves `client/dist` as static files
3. **API Routing**: 
   - `/api/*` routes go to backend API handlers
   - All other routes fallback to `index.html` (React Router support)
4. **Database**: 
   - Uses MongoDB if connection available
   - Falls back to in-memory store if DB unavailable

## Troubleshooting

### "Cannot GET /"
- Make sure frontend is built: `npm run build` in client folder
- Check `client/dist/` exists
- Verify server.js is serving static files correctly

### Backend API not responding
- Check `/api/health` endpoint
- Verify environment variables in Render dashboard
- Check server logs for MongoDB connection issues

### MongoDB Connection Failed
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas IP whitelist includes Render's IP
- App will work in demo mode with in-memory storage

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/apps` - Get all apps
- `POST /api/apps` - Create app
- `PUT /api/apps/:id` - Update app
- `DELETE /api/apps/:id` - Delete app
- `/api/analysis/*` - Analysis endpoints
- `/api/payment/*` - Payment endpoints
- And more...

## File Structure After Build

```
/
  client/
    dist/              # Built React app (static files)
    src/               # React source
    package.json
  server/
    server.js          # Main backend file
    models/            # Database models
    routes/            # API routes
    .env               # Environment variables
    package.json
  package.json         # Root package.json
  render.yaml          # Render deployment config
```
