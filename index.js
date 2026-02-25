const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./models/db');

connectDB(); // must be called before app.listen


require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const studentRoutes = require('./routes/studentRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const app = express();
const PORT = process.env.PORT || 5001;

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5500', // Live Server
    'https://smartassesgrader-wz54.onrender.com', // Render Deployment
    'null'
  ],
  credentials: true
}));
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);
app.listen(PORT, () => {
  console.log(`✅ Auth server running on http://localhost:${PORT}`);
});
