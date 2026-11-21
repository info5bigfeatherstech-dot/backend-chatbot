require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const PORT = process.env.PORT || 8082;
const MONGO_DB_URI = process.env.MONGO_DB_URI;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'chatbot-backend',
    port: PORT,
    dbReadyState: mongoose.connection.readyState,
  });
});

// Chatbot API Routes
app.use('/api/chatbot', chatbotRoutes);

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    if (!MONGO_DB_URI) {
      throw new Error('MONGO_DB_URI is missing in .env');
    }

    console.log('[Chatbot Server] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_DB_URI);
    console.log('[Chatbot Server] ✓ Connected to MongoDB Atlas successfully.');

    app.listen(PORT, () => {
      console.log(`[Chatbot Server] 🚀 Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Chatbot Server] ✗ Startup error:', err.message);
    process.exit(1);
  }
}

startServer();
