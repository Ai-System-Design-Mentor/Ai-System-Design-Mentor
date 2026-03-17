# AI System Design Mentor

A full-stack MERN application for practicing system design interviews with AI-powered evaluation.

## Project Structure

```
project/
├── frontend/          # React app (Vite)
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Full page components
│       ├── context/       # React context (Theme, Auth)
│       ├── hooks/         # Custom hooks
│       ├── utils/         # Helper functions & API calls
│       └── styles/        # Global CSS & variables
├── backend/           # Node.js + Express API
│   ├── routes/        # API route definitions
│   ├── controllers/   # Business logic
│   ├── models/        # Mongoose schemas
│   └── middleware/    # Auth, error handlers
└── README.md
```

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (MongoDB URI, JWT secret, Anthropic key)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 3. Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai-design-mentor
JWT_SECRET=your_super_secret_key_here
ANTHROPIC_API_KEY=sk-ant-...
CLIENT_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
```

## Deployment

### Backend → Render
1. Push to GitHub
2. Create new Web Service on render.com
3. Set environment variables
4. Build command: `npm install`
5. Start command: `node server.js`

### Frontend → Vercel
1. Push to GitHub
2. Import repo on vercel.com
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy

## Tech Stack
- **Frontend**: React 18, Vite, React Router v6
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (JSON Web Tokens) + bcrypt
- **AI**: Anthropic Claude API
- **Styling**: Custom CSS with CSS variables (dark/light mode)
