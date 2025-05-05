// app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const socketHandler = require('./socket');  
const db = require('./models');
const { Server } = require('socket.io');
const { handleSeatSocket, startCleanupInterval } = require('./socketSeat');
const URL_CLIENT_BASE = process.env.URL_CLIENT_BASE;
const PORT = process.env.PORT_SERVER || 3000;


// Đảm bảo thư mục uploads tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const app = express();
const server = http.createServer(app);

// Socket chính cho chat
const io = new Server(server, {
  cors: {
    origin: URL_CLIENT_BASE,
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Socket riêng cho booking
const bookingIo = new Server(server, {
  path: '/booking',
  cors: {
    origin: URL_CLIENT_BASE,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const corsOptions = {
  origin: URL_CLIENT_BASE, 
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(path.join(__dirname, 'public')));

const apiRoute = require('./routes/apiIndex');
const chatbotRoutes = require('./routes/chatbot.routes');
const chatHistoryRoutes = require('./routes/chatHistory.routes');
const voiceConverterRoutes = require('./routes/voiceConverterRoutes');

app.use('/v1/api', apiRoute);
app.use('/v1/api/chatbot/chat', chatbotRoutes);
app.use('/v1/api/chatbot/history', chatHistoryRoutes);
app.use('/api/voice-converter', voiceConverterRoutes);

// Socket chính cho chat
io.on('connection', (socket) => {
  // ... code xử lý chat của bạn ...
});

// Socket riêng cho booking
bookingIo.on('connection', (socket) => {
  handleSeatSocket(bookingIo, socket);
});

// Khởi tạo cleanup interval khi server khởi động
const cleanupInterval = startCleanupInterval(bookingIo);

// Cleanup khi server tắt
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  io.close();
  bookingIo.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  io.close();
  bookingIo.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
