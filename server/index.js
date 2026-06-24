require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const jobRoutes = require('./routes/jobRoutes');
const quizRoutes = require('./routes/quizRoutes');
const aiRoutes = require('./routes/aiRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const streakRoutes = require('./routes/streakRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contestRoutes = require('./routes/contestRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const http = require('http');
const { Server } = require('socket.io');

// Security & Performance Packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { createClient } = require('redis');

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io Real-time connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('send_message', (data) => {
    io.to(data.room).emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to our router
app.set('io', io);

const PORT = process.env.PORT || 5001;

// --- SECURITY & PERFORMANCE MIDDLEWARE ---
// 1. Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// 2. Limit requests from same API (DDoS Protection)
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// 3. Data sanitization against NoSQL query injection
// app.use(mongoSanitize()); // Incompatible with Express 5

// 4. Data sanitization against XSS
// app.use(xss()); // Deprecated and incompatible with Express 5

// Redis Cache Setup (Optional/Graceful Degradation)
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy(retries) {
        if (retries > 3) {
          return new Error('Redis connection failed permanently');
        }
        return 5000;
      }
    }
  });
  redisClient.on('error', (err) => console.log('Redis Cache Error (Gracefully handled):', err.message));
  redisClient.connect().then(() => console.log('Redis Connected (Optional)')).catch(() => {});
} else {
  console.log('Redis cache disabled in local development');
}
app.set('redis', redisClient);

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
  : true; // Allow all in development

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const User = require('./models/User');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green_skills')
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/streak', streakRoutes);

// Advanced Module Routes
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/videos', require('./routes/video'));
app.use('/api/mentor-sessions', require('./routes/mentorSessionRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));

app.get('/', (req, res) => {
  res.send('Green Skills API is running...');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
