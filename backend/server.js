const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');
const cors = require('cors'); // Import cors
const { initSocket } = require('./socket'); // Import socket initializer
const { seedChatbotUsers } = require('./services/chatbotService');
const passport = require('./config/passport'); // Import passport config

dotenv.config();

connectDB().then(() => {
  seedChatbotUsers();
});

const app = express();
app.use(cors()); // Enable CORS for all routes

const http = require('http');
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

app.use(express.json()); // Body parser

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/exchange-rate', require('./routes/exchangeRateRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const port = process.env.PORT || 5000;

// Error handling middleware
app.use(errorHandler);

server.listen(port, () => {
  console.log(`SwapX Backend listening on port ${port}`);
});

module.exports = { io };